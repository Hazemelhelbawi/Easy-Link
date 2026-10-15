import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import OverviewPage from './pages/OverviewPage.jsx';
import AchievementsPage from './pages/AchievementsPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AppShell from './components/AppShell.jsx';

function Protected({ children, roles }) {
  const { user, passwordChangeRequired, booting, role } = useApp();
  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (passwordChangeRequired) return <Navigate to="/change-password" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />;
  return children;
}

function RouterTree() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route
          path="admin"
          element={
            <Protected roles={['admin']}>
              <AdminPage />
            </Protected>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <RouterTree />
      </BrowserRouter>
    </AppProvider>
  );
}
