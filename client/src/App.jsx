import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import ComingSoonPage from './pages/ComingSoonPage';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import DashboardHome from './pages/dashboard/DashboardHome';
import ProfilePage from './pages/dashboard/ProfilePage';
import SkillsPage from './pages/dashboard/SkillsPage';
import ProjectsPage from './pages/dashboard/ProjectsPage';
import EducationPage from './pages/dashboard/EducationPage';
import ExperiencePage from './pages/dashboard/ExperiencePage';
import CertificationsPage from './pages/dashboard/CertificationsPage';
import AssessmentsPage from './pages/dashboard/AssessmentsPage';
import CompanyProfilePage from './pages/dashboard/CompanyProfilePage';
import JobPostingsPage from './pages/dashboard/JobPostingsPage';
import EmployerVerificationPage from './pages/dashboard/EmployerVerificationPage';
import MyApplicationsPage from './pages/dashboard/MyApplicationsPage';
import ApplicantsPage from './pages/dashboard/ApplicantsPage';
import InterviewsPage from './pages/dashboard/InterviewsPage';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/how-it-works" element={<ComingSoonPage title="How it works" />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route
          path="/internships"
          element={(
            <JobsPage
              fixedType="internship"
              title="Find internships"
              description="Internships posted by employers on PathAura — a first step into professional work."
            />
          )}
        />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/:slug" element={<CompanyDetailPage />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated */}
      <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardHome />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="education" element={<EducationPage />} />
        <Route path="experience" element={<ExperiencePage />} />
        <Route path="certifications" element={<CertificationsPage />} />
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route path="jobs" element={<JobsPage embedded />} />
        <Route path="applications" element={<MyApplicationsPage />} />
        <Route path="roadmap" element={<ComingSoonPage title="Career roadmap" message="Personal roadmap arrives in Phase 8." />} />
        <Route path="learning" element={<ComingSoonPage title="Learning" message="Learning opportunities arrive in Phase 9." />} />
        <Route path="notifications" element={<ComingSoonPage title="Notifications" message="In-app notifications arrive in Phase 10." />} />
        <Route path="company" element={<CompanyProfilePage />} />
        <Route path="jobs-manage" element={<JobPostingsPage />} />
        <Route path="applicants" element={<ApplicantsPage />} />
        <Route path="interviews" element={<InterviewsPage />} />
        <Route path="admin/users" element={<ComingSoonPage title="Users" message="Admin user management arrives in Phase 12." />} />
        <Route path="admin/employers" element={<EmployerVerificationPage />} />
        <Route path="admin/verifications" element={<ComingSoonPage title="Verifications" message="Certification verification arrives in Phase 6." />} />
        <Route path="admin/analytics" element={<ComingSoonPage title="Analytics" message="Analytics arrives in Phase 11." />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
      <Route path="/index.html" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
