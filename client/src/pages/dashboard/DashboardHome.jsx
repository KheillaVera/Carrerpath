import { useAuth } from '../../context/AuthContext';
import JobSeekerDashboard from './JobSeekerDashboard';
import EmployerDashboard from './EmployerDashboard';
import AdminDashboard from './AdminDashboard';

export default function DashboardHome() {
  const { user } = useAuth();
  if (user?.roles?.includes('admin')) return <AdminDashboard />;
  if (user?.roles?.includes('employer')) return <EmployerDashboard />;
  return <JobSeekerDashboard />;
}
