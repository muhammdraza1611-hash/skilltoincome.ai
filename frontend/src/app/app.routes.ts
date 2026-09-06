import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'skills',
        loadComponent: () => import('./features/skills/skills-assessment.component').then(m => m.SkillsAssessmentComponent),
      },
      {
        path: 'careers',
        loadComponent: () => import('./features/careers/career-analysis.component').then(m => m.CareerAnalysisComponent),
      },
      {
        path: 'roadmap',
        loadComponent: () => import('./features/roadmap/roadmap.component').then(m => m.RoadmapComponent),
      },
      {
        path: 'income',
        loadComponent: () => import('./features/income/income-prediction.component').then(m => m.IncomePredictionComponent),
      },
      {
        path: 'portfolio',
        loadComponent: () => import('./features/portfolio/portfolio-analyzer.component').then(m => m.PortfolioAnalyzerComponent),
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/ai-mentor-chat.component').then(m => m.AiMentorChatComponent),
      },
      {
        path: 'progress',
        loadComponent: () => import('./features/progress/progress-tracker.component').then(m => m.ProgressTrackerComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'build',
        loadComponent: () => import('./features/build/build-editor.component').then(m => m.BuildEditorComponent),
      },
      {
        path: 'build/projects',
        loadComponent: () => import('./features/build/build-projects.component').then(m => m.BuildProjectsComponent),
      },
      {
        path: 'build/templates',
        loadComponent: () => import('./features/build/build-templates.component').then(m => m.BuildTemplatesComponent),
      },
      {
        path: 'build/ai',
        loadComponent: () => import('./features/build/build-ai-assistant.component').then(m => m.BuildAiAssistantComponent),
      },
      {
        path: 'jobs',
        loadComponent: () => import('./features/jobs/job-board.component').then(m => m.JobBoardComponent),
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
