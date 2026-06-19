import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarLayout } from './components/Layout/SidebarLayout';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { DisposalPage } from './pages/Disposal/DisposalPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

export default function App() {
  return (
    <Router>
      <SidebarLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/disposal" element={<DisposalPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </SidebarLayout>
    </Router>
  );
}
