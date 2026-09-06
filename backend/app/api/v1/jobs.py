from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.services.job_service import JobService
from app.schemas.job import (
    JobResponse,
    JobWithMatchResponse,
    JobListRequest,
    SaveJobRequest,
    SavedJobResponse,
    JobApplicationRequest,
    JobApplicationResponse,
    JobSyncResponse,
)

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/sync", response_model=JobSyncResponse)
async def sync_jobs_from_remoteok(
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch latest jobs from Remotive.io API and sync to database
    Remotive.io is FREE with direct company apply links (no paywall!)
    (Admin only or can be run via cron job)
    """
    # Fetch from Remotive.io
    jobs_data = await JobService.fetch_remoteok_jobs(limit=limit)
    
    if not jobs_data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to fetch jobs from Remotive.io API",
        )
    
    # Sync to database
    added_count = await JobService.sync_jobs_to_db(db, jobs_data)
    
    return JobSyncResponse(
        message=f"Successfully synced {added_count} new jobs from Remotive.io",
        jobs_added=added_count,
        total_jobs=len(jobs_data),
    )


@router.post("/browse", response_model=List[JobResponse])
async def browse_jobs(
    request: JobListRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Browse all jobs with optional filters (no auth required)
    """
    jobs = await JobService.get_jobs(
        db=db,
        skip=request.skip,
        limit=request.limit,
        search=request.search,
        tags=request.tags,
        location=request.location,
    )
    return jobs


@router.get("/recommended", response_model=List[JobWithMatchResponse])
async def get_recommended_jobs(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get AI-recommended jobs based on user skills
    Returns jobs with match scores
    """
    recommended = await JobService.get_recommended_jobs(db, current_user.id, limit)
    
    # Format response
    return [
        JobWithMatchResponse(
            **item["job"].__dict__,
            match_score=item["match_score"],
            match_reasons=item["match_reasons"],
        )
        for item in recommended
    ]


@router.get("/{job_id}", response_model=JobResponse)
async def get_job_details(
    job_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get single job details (no auth required)"""
    from sqlalchemy import select
    from app.models.job import Job
    
    stmt = select(Job).where(Job.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    
    return job


@router.post("/save", response_model=SavedJobResponse)
async def save_job(
    request: SaveJobRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save/bookmark a job"""
    try:
        saved_job = await JobService.save_job(
            db=db,
            user_id=current_user.id,
            job_id=request.job_id,
            notes=request.notes,
        )
        return saved_job
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to save job: {str(e)}",
        )


@router.get("/saved/me", response_model=List[SavedJobResponse])
async def get_my_saved_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's saved jobs"""
    saved_jobs = await JobService.get_saved_jobs(db, current_user.id)
    return saved_jobs


@router.post("/apply", response_model=JobApplicationResponse)
async def mark_job_applied(
    request: JobApplicationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a job as applied (user clicked 'Apply Now' and went to company site)
    This helps track applications
    """
    try:
        application = await JobService.mark_job_applied(
            db=db,
            user_id=current_user.id,
            job_id=request.job_id,
        )
        return application
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to mark job as applied: {str(e)}",
        )


@router.get("/applications/me", response_model=List[JobApplicationResponse])
async def get_my_applications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's job applications"""
    applications = await JobService.get_user_applications(db, current_user.id)
    return applications


@router.delete("/saved/{saved_job_id}")
async def unsave_job(
    saved_job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a saved job"""
    from sqlalchemy import select, delete
    from app.models.job import SavedJob
    
    # Verify ownership
    stmt = select(SavedJob).where(
        SavedJob.id == saved_job_id,
        SavedJob.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    saved_job = result.scalar_one_or_none()
    
    if not saved_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved job not found",
        )
    
    await db.delete(saved_job)
    await db.commit()
    
    return {"message": "Job removed from saved list"}
