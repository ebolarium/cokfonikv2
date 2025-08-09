import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent
} from '@mui/material';

import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import EventNoteIcon from '@mui/icons-material/EventNote';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import HearingIcon from '@mui/icons-material/Hearing';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';

const ConductorDashboard = () => {
  const navigate = useNavigate();

  // Şef için kartlar
  const dashboardItems = [
    {
      title: 'Devamsızlıklar',
      path: '/conductor-attendance',
      icon: <AssignmentTurnedInIcon style={{ fontSize: 50 }} />,
      bgColor: '#ffe6e6',
    },
    {
      title: 'Takvim',
      path: '/calendar-view',
      icon: <EventNoteIcon style={{ fontSize: 50 }} />,
      bgColor: '#f0f8ff',
    },
    {
      title: 'Duyurular',
      path: '/announcements',
      icon: <NotificationsIcon style={{ fontSize: 50 }} />,
      bgColor: '#fff8dc',
    },
    {
      title: 'Oyun',
      path: '/game',
      icon: <MusicNoteIcon style={{ fontSize: 50 }} />,
      bgColor: '#e6f7ff',
    },
    {
      title: 'Oyun 2',
      path: '/game2',
      icon: <HearingIcon style={{ fontSize: 50 }} />,
      bgColor: '#a6a6ff',
    },
    {
      title: 'Nota/Midi',
      link: 'https://drive.google.com/drive/folders/1paeqvHKubfoUEwh9v-4zjL64E0eBHf5r?usp=sharing',
      icon: <LibraryMusicIcon style={{ fontSize: 50 }} />,
      bgColor: '#e6e6ff',
    },
  ];

  return (
    <Box minHeight="100vh" bgcolor="#f9f9f9">
      <Box p={3}>
        <Typography variant="h5" align="center" gutterBottom>
          Şef Dashboard
        </Typography>

        <Grid container spacing={3}>
          {dashboardItems.map((item, index) => (
            <Grid
              item
              xs={6}
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <Card
                style={{
                  width: '85%',
                  aspectRatio: '1/1',
                  backgroundColor: item.bgColor,
                  color: '#333',
                  textAlign: 'center',
                  borderRadius: 8,
                  cursor: 'pointer',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onClick={() => {
                  // Eğer "link" varsa yeni sekmede aç
                  if (item.link) {
                    window.open(item.link, '_blank');
                  } else {
                    // Yoksa route'a yönlendir
                    navigate(item.path);
                  }
                }}
              >
                <CardContent
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Box>{item.icon}</Box>
                  <Typography variant="h6" style={{ fontSize: '14px', marginTop: '8px' }}>
                    {item.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default ConductorDashboard;
