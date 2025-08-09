import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';

import LoadingScreen from './components/LoadingScreen';
import Login from './components/Login';
import MasterAdminDashboard from './components/MasterAdminDashboard';
import ManagementDashboard from './components/ManagementDashboard';
import UserDashboard from './components/UserDashboard';
import UserNewDashboard from './components/UserNewDashboard';
import MyAttendance from './components/MyAttendance';
import MyFees from './components/MyFees';
import CalendarView from './components/CalendarView';
import CustomAppBar from './components/AppBar';
import BottomNav from './components/BottomNav';
import UserManagement from './components/UserManagement';
import AttendanceManagement from './components/AttendanceManagement';
import CalendarManagement from './components/CalendarManagement';
import FeeManagement from './components/FeeManagement';
import Profile from './components/Profile';
import AnnouncementManagement from './components/AnnouncementManagement';
import AnnouncementsPage from './components/AnnouncementsPage';
import Game from './components/Game';
import Game2 from './components/Game2';
import ConductorDashboard from './components/ConductorDashboard';
import ConductorAttendance from './components/ConductorAttendance';
import apiClient from './utils/apiClient';
import MidiPlayer from './components/MidiPlayer';
import MusicManagement from './components/MusicManagement';
import ResetPassword from './components/ResetPassword';
import Motivasyonum from './components/Motivasyonum';
import MotivationAnalytics from './components/MotivationAnalytics';


const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [viewMode, setViewMode] = useState('korist');
  const [showLoadingOnStart, setShowLoadingOnStart] = useState(true);

  // Okunmamış duyurular
  const fetchUnreadAnnouncements = async () => {
    try {
      const user = apiClient.getCurrentUser();
      if (!user || !user._id) {
        console.error('Kullanıcı bilgisi eksik. Oturum açılmamış olabilir.');
        return 0;
      }
      const data = await apiClient.get(`/announcements/unread/${user._id}`);
      return data.length;
    } catch (error) {
      console.error('Orunmamış duyurular alınamadı:', error);
      return 0;
    }
  };

  // Oturum kontrolü & Loading
  useEffect(() => {
    const isAuthenticated = apiClient.isAuthenticated();
    const user = apiClient.getCurrentUser();

    if (!isAuthenticated || !user) {
      setIsLoggedIn(false);
      if (location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else {
      setIsLoggedIn(true);
      setUserRole(user.role);
    }

    if (showLoadingOnStart) {
      const timer = setTimeout(() => {
        setLoading(false);
        setShowLoadingOnStart(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [location, navigate, showLoadingOnStart]);

  // Görünüm değiştirme
  const handleSwitchView = () => {
    // Şef hiçbir zaman korist mode'a geçmesin:
    if (userRole === 'Şef') {
      return;
    }

    if (viewMode === 'korist') {
      setViewMode('admin');
      if (userRole === 'Master Admin') {
        navigate('/master-admin-dashboard');
      } else if (userRole === 'Yönetim Kurulu') {
        navigate('/management-dashboard');
      }
      // Şef'i buradan çıkardık
    } else {
      setViewMode('korist');
      // Her türlü role (Master Admin veya YK) => korist görünümde user-dashboard
      navigate('/user-dashboard');
    }
  };

  // Bazı yollar için AppBar/BottomNav gizle
  const excludedPaths = ['/login', '/loading'];
  const showAppBar = !excludedPaths.includes(location.pathname);
  const showBottomNav = !excludedPaths.includes(location.pathname);

  // Rotaları çiz
  const renderRoutes = () => {
    // 1) Eğer userRole = Şef ise, daima Şef rotaları
    if (userRole === 'Şef') {
      return (
        <>
          <Route path="/conductor-dashboard" element={<ConductorDashboard />} />
          <Route path="/conductor-attendance" element={<ConductorAttendance />} />
          <Route path="/calendar-view" element={<CalendarView />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/game" element={<Game />} />
          <Route path="/game2" element={<Game2 />} />
          <Route path="/midi-player" element={<MidiPlayer />} />
          <Route path="/motivasyonum" element={<Motivasyonum />} />
        </>
      );
    }

    // 2) Eğer Şef değilse ve viewMode = korist => korist rotaları
    if (viewMode === 'korist' || viewMode === 'Aidat' || viewMode === 'Yoklama') {
      return (
        <>
          <Route
            path="/user-dashboard"
            element={<UserDashboard fetchUnreadAnnouncements={fetchUnreadAnnouncements} />}
          />
          <Route
            path="/user-new-dashboard"
            element={<UserNewDashboard fetchUnreadAnnouncements={fetchUnreadAnnouncements} />}
          />
          <Route path="/my-attendance" element={<MyAttendance />} />
          <Route path="/my-fees" element={<MyFees />} />
          <Route path="/calendar-view" element={<CalendarView />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/game" element={<Game />} />
          <Route path="/game2" element={<Game2 />} />
          <Route path="/fee-management" element={<FeeManagement />} />
          <Route path="/attendance-management" element={<AttendanceManagement />} />
          <Route path="/midi-player" element={<MidiPlayer />} />
          <Route path="/motivasyonum" element={<Motivasyonum />} />
        </>
      );
    }

    // 3) Admin view => rol bazlı
    if (userRole === 'Master Admin') {
      return (
        <>
          <Route path="/master-admin-dashboard" element={<MasterAdminDashboard />} />
          <Route path="/attendance-management" element={<AttendanceManagement />} />
          <Route path="/calendar-management" element={<CalendarManagement />} />
          <Route path="/fee-management" element={<FeeManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/announcement-management" element={<AnnouncementManagement />} />
          <Route path="/music-management" element={<MusicManagement />} />
          <Route path="/motivation-analytics" element={<MotivationAnalytics />} />
          <Route path="/midi-player" element={<MidiPlayer />} />
        </>
      );
    } else if (userRole === 'Yönetim Kurulu') {
      return (
        <>
          <Route path="/management-dashboard" element={<ManagementDashboard />} />
          <Route path="/attendance-management" element={<AttendanceManagement />} />
          <Route path="/calendar-management" element={<CalendarManagement />} />
          <Route path="/fee-management" element={<FeeManagement />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/announcement-management" element={<AnnouncementManagement />} />
          <Route path="/motivation-analytics" element={<MotivationAnalytics />} />
        </>
      );
    }

    // Fallback => hiçbir koşulu karşılamadıysa null dönebilir.
    return null;
  };

  return (
    <div>
      {loading ? (
        <LoadingScreen />
      ) : isLoggedIn ? (
        <>
          {showAppBar && (
            <CustomAppBar
              userName={JSON.parse(localStorage.getItem('user'))?.name}
              onSwitchView={handleSwitchView}
              viewMode={viewMode}
              fetchUnreadAnnouncements={fetchUnreadAnnouncements}
            />
          )}
          <Routes>
            {renderRoutes()}
            <Route
              path="*"
              element={
                <Navigate
                  to={
                    // viewMode = korist => user-dashboard
                    // Aksi halde role bazlı
                    userRole === 'Şef'
                      ? '/conductor-dashboard'
                      : viewMode === 'korist'
                      ? '/user-dashboard'
                      : userRole === 'Master Admin'
                      ? '/master-admin-dashboard'
                      : userRole === 'Yönetim Kurulu'
                      ? '/management-dashboard'
                      : '/user-dashboard'
                  }
                />
              }
            />
          </Routes>
          {showBottomNav && (
            <BottomNav
              role={userRole}
              viewMode={viewMode}
              onSwitchView={handleSwitchView}
            />
          )}
        </>
      ) : (
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
};

// Router ile sarılmış ana bileşen
const AppWithRouter = () => (
  <Router>
    <Routes>
      {/* Public routes - authentication gerektirmeyen */}
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected routes - authentication gerektiren */}
      <Route path="/*" element={<App />} />
    </Routes>
  </Router>
);

export default AppWithRouter;
