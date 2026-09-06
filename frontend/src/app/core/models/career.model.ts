export interface CareerPath {
  id: number;
  title: string;
  description: string;
  market_demand_score: number;
  difficulty_level: string;
  avg_salary_min: number;
  avg_salary_max: number;
  remote_opportunities: boolean;
  future_growth_percentage: number;
  career_suitability_score: number;
  required_skills: string[];
  missing_skills: string[];
  is_recommended: boolean;
  created_at: string;
}

export interface Skill {
  id?: number;
  skill_name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  years_experience: number;
  is_primary: number;
}

export interface UserProfile {
  interests: string[];
  career_goals: string[];
  learning_hours_per_day: number;
  current_occupation?: string;
  education_level?: string;
  location?: string;
  github_url?: string;
  portfolio_url?: string;
  linkedin_url?: string;
}

export interface AssessmentData {
  skills: Skill[];
  profile: UserProfile;
}
