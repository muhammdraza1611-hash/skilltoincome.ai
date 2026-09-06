import httpx
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.models.job import Job, SavedJob, JobApplication
from app.models.user import User
from app.models.skill import UserSkill


class JobService:
    """Service for fetching and managing jobs"""
    
    @staticmethod
    async def fetch_remoteok_jobs(limit: int = 100) -> List[Dict]:
        """
        Fetch jobs from Remotive.io API (FREE alternative to RemoteOK)
        Docs: https://remotive.com/api/remote-jobs
        Direct company apply links - no paywall!
        """
        try:
            url = "https://remotive.com/api/remote-jobs"
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers={"User-Agent": "SkillToIncome-JobBoard/1.0"})
                response.raise_for_status()
                
                data = response.json()
                jobs = data.get("jobs", [])[:limit]
                
                parsed_jobs = []
                for job in jobs:
                    # Parse Remotive job format
                    try:
                        # Handle date field
                        pub_date = job.get("publication_date", "")
                        if pub_date:
                            try:
                                posted_date = datetime.fromisoformat(pub_date.replace('Z', '+00:00'))
                            except:
                                posted_date = datetime.now()
                        else:
                            posted_date = datetime.now()
                    except (ValueError, TypeError):
                        posted_date = datetime.now()
                    
                    parsed_job = {
                        "external_id": f"remotive_{job.get('id', '')}",
                        "title": job.get("title", "Untitled"),
                        "company": job.get("company_name", "Unknown"),
                        "company_logo": job.get("company_logo", ""),
                        "location": job.get("candidate_required_location", "Worldwide"),
                        "job_type": job.get("job_type", "Full-time"),
                        "description": job.get("description", ""),
                        "tags": job.get("tags", []),
                        "apply_url": job.get("url", ""),  # Direct company URL - no paywall!
                        "salary_min": job.get("salary_min"),
                        "salary_max": job.get("salary_max"),
                        "source": "remotive",
                        "posted_date": posted_date,
                        "expires_at": datetime.now() + timedelta(days=60),
                    }
                    parsed_jobs.append(parsed_job)
                
                logger.info(f"Fetched {len(parsed_jobs)} jobs from Remotive.io")
                return parsed_jobs
                
        except httpx.HTTPError as e:
            logger.error(f"Remotive.io API error: {e}")
            return []
        except Exception as e:
            logger.error(f"Error fetching Remotive jobs: {e}")
            return []
    
    @staticmethod
    async def sync_jobs_to_db(db: AsyncSession, jobs_data: List[Dict]) -> int:
        """Save or update jobs in database"""
        added = 0
        for job_data in jobs_data:
            try:
                # Check if job already exists
                stmt = select(Job).where(Job.external_id == job_data["external_id"])
                result = await db.execute(stmt)
                existing_job = result.scalar_one_or_none()
                
                if existing_job:
                    # Update existing job
                    for key, value in job_data.items():
                        setattr(existing_job, key, value)
                else:
                    # Create new job
                    new_job = Job(**job_data)
                    db.add(new_job)
                    added += 1
                
                await db.commit()
            except Exception as e:
                logger.error(f"Error syncing job {job_data.get('title')}: {e}")
                await db.rollback()
        
        logger.info(f"Synced {added} new jobs to database")
        return added
    
    @staticmethod
    async def get_jobs(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        tags: Optional[List[str]] = None,
        location: Optional[str] = None,
    ) -> List[Job]:
        """Get jobs with filters"""
        stmt = select(Job).where(Job.is_active == True)
        
        # Search in title and company
        if search:
            search_pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Job.title.ilike(search_pattern),
                    Job.company.ilike(search_pattern),
                    Job.description.ilike(search_pattern),
                )
            )
        
        # Filter by tags (skills)
        if tags:
            # Check if any of the tags match
            for tag in tags:
                stmt = stmt.where(Job.tags.contains([tag]))
        
        # Filter by location
        if location and location.lower() != "all":
            stmt = stmt.where(Job.location.ilike(f"%{location}%"))
        
        # Order by posted date (newest first)
        stmt = stmt.order_by(Job.posted_date.desc()).offset(skip).limit(limit)
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def calculate_job_match_score(user_skills: List[str], job_tags: List[str]) -> Dict:
        """Calculate how well user skills match job requirements"""
        if not user_skills or not job_tags:
            return {"score": 0, "reasons": []}
        
        # Normalize to lowercase for comparison
        user_skills_lower = [s.lower() for s in user_skills]
        job_tags_lower = [t.lower() for t in job_tags]
        
        # Find matching skills
        matches = []
        for skill in user_skills_lower:
            for tag in job_tags_lower:
                if skill in tag or tag in skill:
                    matches.append(skill)
                    break
        
        # Calculate score (0-100)
        if len(job_tags_lower) == 0:
            score = 0
        else:
            score = int((len(matches) / len(job_tags_lower)) * 100)
        
        return {
            "score": min(score, 100),
            "reasons": [f"Matches {m}" for m in matches[:5]],
            "matching_skills": matches,
        }
    
    @staticmethod
    async def save_job(db: AsyncSession, user_id: int, job_id: int, notes: Optional[str] = None) -> SavedJob:
        """Save/bookmark a job for user"""
        # Get user skills for AI matching
        user_skills_stmt = select(UserSkill.skill_name).where(UserSkill.user_id == user_id)
        skills_result = await db.execute(user_skills_stmt)
        user_skills = [row[0] for row in skills_result.all()]
        
        # Get job tags
        job_stmt = select(Job).where(Job.id == job_id)
        job_result = await db.execute(job_stmt)
        job = job_result.scalar_one()
        
        # Calculate match score
        match_data = await JobService.calculate_job_match_score(user_skills, job.tags or [])
        
        # Create saved job
        saved_job = SavedJob(
            user_id=user_id,
            job_id=job_id,
            notes=notes,
            ai_match_score=match_data["score"],
            ai_match_reasons=match_data["reasons"],
        )
        db.add(saved_job)
        await db.commit()
        await db.refresh(saved_job)
        return saved_job
    
    @staticmethod
    async def mark_job_applied(db: AsyncSession, user_id: int, job_id: int) -> JobApplication:
        """Mark a job as applied"""
        application = JobApplication(
            user_id=user_id,
            job_id=job_id,
            status="applied",
        )
        db.add(application)
        await db.commit()
        await db.refresh(application)
        return application
    
    @staticmethod
    async def get_saved_jobs(db: AsyncSession, user_id: int) -> List[SavedJob]:
        """Get user's saved jobs"""
        stmt = select(SavedJob).where(SavedJob.user_id == user_id).order_by(SavedJob.created_at.desc())
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_user_applications(db: AsyncSession, user_id: int) -> List[JobApplication]:
        """Get user's job applications"""
        stmt = select(JobApplication).where(JobApplication.user_id == user_id).order_by(JobApplication.applied_at.desc())
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_recommended_jobs(db: AsyncSession, user_id: int, limit: int = 10) -> List[Dict]:
        """Get AI-recommended jobs based on user skills"""
        # Get user skills
        user_skills_stmt = select(UserSkill.skill_name).where(UserSkill.user_id == user_id)
        skills_result = await db.execute(user_skills_stmt)
        user_skills = [row[0] for row in skills_result.all()]
        
        if not user_skills:
            # No skills, return latest jobs
            return await JobService.get_jobs(db, limit=limit)
        
        # Get all active jobs
        jobs = await JobService.get_jobs(db, limit=100)
        
        # Calculate match score for each job
        jobs_with_scores = []
        for job in jobs:
            match_data = await JobService.calculate_job_match_score(user_skills, job.tags or [])
            jobs_with_scores.append({
                "job": job,
                "match_score": match_data["score"],
                "match_reasons": match_data["reasons"],
            })
        
        # Sort by match score
        jobs_with_scores.sort(key=lambda x: x["match_score"], reverse=True)
        
        return jobs_with_scores[:limit]
