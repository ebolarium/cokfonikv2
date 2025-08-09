import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Box, Avatar, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import apiClient from '../utils/apiClient';

const CustomAppBar = ({ userName, viewMode }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // user değişkenini en başta tanımlayalım
  const user = JSON.parse(localStorage.getItem('user'));
  const userRole = user?.role || '';

  const fetchUnreadAnnouncements = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/announcements`);
      const data = await response.json();

      const unreadAnnouncements = data.filter(
        (announcement) => !announcement.readBy.includes(user._id)
      );
      setUnreadCount(unreadAnnouncements.length);
    } catch (error) {
      console.error('Okunmamış duyurular alınamadı:', error);
    }
  };

  useEffect(() => {
    fetchUnreadAnnouncements();
  }, []);

  useEffect(() => {
    window.addEventListener('updateUnreadCount', fetchUnreadAnnouncements);
    return () => {
      window.removeEventListener('updateUnreadCount', fetchUnreadAnnouncements);
    };
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    apiClient.logout();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Toolbar sx={{ minHeight: '64px' }}>
        {user && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
          }}>
            <Avatar 
              src={user.profilePhoto || ''}
              alt={user.name}
              sx={{ 
                width: 38, 
                height: 38,
                backgroundColor: userRole === 'Şef' ? '#9c27b0' : 
                               viewMode === 'korist' ? '#ff5722' : '#283593',
                fontSize: '1rem',
              }}
            >
               {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: '#2c3e50',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '0.95rem',
                letterSpacing: '0.01em'
              }}
            >
             Hoşgeldin, {user.name}
            </Typography>
          </Box>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <IconButton 
          edge="end" 
          onClick={handleMenuOpen}
          sx={{ 
            color: '#2c3e50',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <MenuIcon />
        </IconButton>

        <Menu 
          anchorEl={anchorEl} 
          open={Boolean(anchorEl)} 
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 1,
            sx: {
              mt: 1.5,
              minWidth: 180,
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1.2,
                gap: 1.5,
                fontSize: '0.9rem',
                color: '#2c3e50',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }
            }
          }}
        >
          <MenuItem onClick={() => (window.location.href = '/profile')}>
            <AccountCircleIcon sx={{ fontSize: '1.2rem' }} />
            Profil
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <SettingsIcon sx={{ fontSize: '1.2rem' }} />
            Ayarlar
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={handleLogout} sx={{ color: '#e74c3c !important' }}>
            <LogoutIcon sx={{ fontSize: '1.2rem' }} />
            Çıkış Yap
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default CustomAppBar;
