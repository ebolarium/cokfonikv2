import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

// Yeni eklediğimiz ikonlar
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const BottomNav = ({ role, viewMode, onSwitchView }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Korist Nav Öğeleri
  const userNavItems = [
    { label: null, icon: <HomeIcon />, path: '/user-dashboard' },
    { label: null, icon: <AssignmentTurnedInIcon />, path: '/my-attendance' },
    { label: null, icon: <AccountBalanceIcon />, path: '/my-fees' },
    { label: null, icon: <EventNoteIcon />, path: '/calendar-view' },
  ];

  // Yönetim Görünümü Nav Öğeleri
  const managementNavItems = [
    { label: null, icon: <HomeIcon />, path: '/management-dashboard' },
    { label: null, icon: <AssignmentTurnedInIcon />, path: '/attendance-management' },
    { label: null, icon: <AccountBalanceIcon />, path: '/fee-management' },
    { label: null, icon: <EventNoteIcon />, path: '/calendar-management' },
  ];

  // Master Admin Görünümü Nav Öğeleri
  const adminNavItems = [
    { label: null, icon: <HomeIcon />, path: '/master-admin-dashboard' },
    { label: null, icon: <AssignmentTurnedInIcon />, path: '/attendance-management' },
    { label: null, icon: <AccountBalanceIcon />, path: '/fee-management' },
    { label: null, icon: <EventNoteIcon />, path: '/calendar-management' },
  ];

  const chiefNavItems = [
    // Ana Sayfa (şef dashboard)
    { icon: <HomeIcon />, path: '/conductor-dashboard' },
    // Devamsızlıklar
    { icon: <AssignmentTurnedInIcon />, path: '/conductor-attendance' },
    // Takvim
    { icon: <EventNoteIcon />, path: '/calendar-view' },
    // Nota/Midi (Harici Link)
    {
      icon: <MusicNoteIcon />,
      link: 'https://drive.google.com/drive/folders/1paeqvHKubfoUEwh9v-4zjL64E0eBHf5r?usp=sharing'
    },
    // Duyurular
    { icon: <NotificationsActiveIcon />, path: '/announcements' },
  ];

  

  // Hangi navItems kullanılacak?
  let navItems;

  if (role === 'Şef') {
    // Şef menüsü
    navItems = chiefNavItems;
  } else if (role === 'Master Admin') {
    navItems = viewMode === 'korist'
      ? [
          ...userNavItems.slice(0, 2),
          {
            label: null,
            icon: (
              <AdminPanelSettingsIcon
                sx={{ color: '#ffffff' }}
              />
            ),
            action: onSwitchView,
          },
          ...userNavItems.slice(2),
        ]
      : [
          ...adminNavItems.slice(0, 2),
          {
            label: null,
            icon: (
              <AdminPanelSettingsIcon
                sx={{ color: '#000000' }}
              />
            ),
            action: onSwitchView,
          },
          ...adminNavItems.slice(2),
        ];
  } else if (role === 'Yönetim Kurulu') {
    navItems = viewMode === 'korist'
      ? [
          ...userNavItems.slice(0, 2),
          {
            label: null,
            icon: (
              <AdminPanelSettingsIcon
                sx={{ color: '#ffffff' }}
              />
            ),
            action: onSwitchView,
          },
          ...userNavItems.slice(2),
        ]
      : [
          ...managementNavItems.slice(0, 2),
          {
            label: null,
            icon: (
              <AdminPanelSettingsIcon
                sx={{ color: '#000000' }}
              />
            ),
            action: onSwitchView,
          },
          ...managementNavItems.slice(2),
        ];
  } else {
    // Sadece korist
    navItems = userNavItems;
  }

  // Geçerli rota indeksini bul
  const currentValue = navItems.findIndex((item) => item.path === location.pathname);

  return (
    <BottomNavigation
      value={currentValue >= 0 ? currentValue : -1}
      onChange={(event, newValue) => {
        const selectedItem = navItems[newValue];
      
        if (selectedItem?.action) {
          // Görünüm değiştirme vb.
          selectedItem.action();
        } else if (selectedItem?.link) {
          // Harici link aç
          window.open(selectedItem.link, '_blank');
        } else if (selectedItem?.path) {
          // Normal rota
          navigate(selectedItem.path);
        }
      }}
      sx={{
        position: 'fixed',
        bottom: 0,
        width: '100vw',
        zIndex: 1000,
        // Renk ve çerçeve
        backgroundColor:
          role === 'Şef'
            ? '#9c27b0' // Mor
            : viewMode === 'korist'
            ? '#ff5722' // Turuncu
            : '#283593', // Lacivert
        borderTop:
          role === 'Şef'
            ? '4px solid #4a148c'
            : viewMode === 'korist'
            ? '4px solid #bf360c'
            : '4px solid #1a237e',
        color: '#ffffff',
        height: { xs: '56px', sm: '64px' },
        transition: 'all 0.3s ease',
        boxShadow: '0 -2px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      {navItems.map((item, index) => (
        <BottomNavigationAction
          key={index}
          icon={item.icon}
          value={index}
          sx={{
            color:
              location.pathname === item.path
                ? role === 'Şef'
                  ? '#ffffff'
                  : viewMode === 'korist'
                  ? '#ffffff'
                  : '#000000'
                : '#cccccc',
            marginX: '0px',
            flex: 1,
            minWidth: 0,
            padding: 0,
          }}
        />
      ))}
    </BottomNavigation>
  );
};

export default BottomNav;
