export type RoadmapDuration = '30_days' | '60_days' | '90_days' | '6_months';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface Resource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'course' | 'project';
}

export interface RoadmapTask {
  id: number;
  week_number: number;
  day_number?: number;
  title: string;
  description: string;
  resources: Resource[];
  status: TaskStatus;
  estimated_hours: number;
  is_milestone: boolean;
}

export interface Roadmap {
  id: number;
  title: string;
  duration: RoadmapDuration;
  description: string;
  completion_percentage: number;
  is_active: boolean;
  tasks: RoadmapTask[];
  created_at: string;
}

export interface IncomePrediction {
  id: number;
  career_path: string;
  freelance_monthly_min: number;
  freelance_monthly_max: number;
  job_salary_annual_min: number;
  job_salary_annual_max: number;
  time_to_first_client_days: number;
  time_to_first_income_days: number;
  growth_projection: { month: number; income: number }[];
  fiverr_niches: string[];
  upwork_categories: string[];
  gig_titles: string[];
  ai_analysis: string;
}

export interface ProgressLog {
  date: string;
  hours: number;
  tasks: number;
  achievements: string[];
}

export interface WeeklyStats {
  total_learning_hours: number;
  total_tasks_completed: number;
  current_streak: number;
  days_logged: number;
  daily_logs: ProgressLog[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}
