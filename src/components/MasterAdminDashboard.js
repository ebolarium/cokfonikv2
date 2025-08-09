import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Modal,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import apiClient from '../utils/apiClient';

// İkonları içe aktarın
import PeopleIcon from '@mui/icons-material/People';
import PaymentsIcon from '@mui/icons-material/Payments';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CampaignIcon from '@mui/icons-material/Campaign';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';

const MasterAdminDashboard = () => {
  const navigate = useNavigate();

  const [totalUsers, setTotalUsers] = useState(0);
  const [frozenUsers, setFrozenUsers] = useState(0);
  const [overdueFeeCount, setOverdueFeeCount] = useState(0);
  const [repeatedAbsCount, setRepeatedAbsCount] = useState(0);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Yeni: Kullanıcı detaylarını saklamak için state'ler
  const [overdueUserDetails, setOverdueUserDetails] = useState([]);
  const [absentUserDetails, setAbsentUserDetails] = useState([]);

  // Modal kontrol state'leri
  const [openOverdueModal, setOpenOverdueModal] = useState(false);
  const [openAbsentModal, setOpenAbsentModal] = useState(false);

  const dashboardItems = [
    {
      title: 'Kullanıcı Yönetimi',
      description: 'Kullanıcı ekle, düzenle, sil',
      path: '/users',
      icon: <PeopleIcon fontSize="large" />
    },
    {
      title: 'Müzik Yönetimi',
      description: 'Parça ve nota yönetimi',
      path: '/music-management',
      icon: <LibraryMusicIcon fontSize="large" />
    },
    {
      title: 'Aidat Durumu',
      description: 'Aidat ödemelerini görüntüle',
      path: '/fee-management',
      icon: <PaymentsIcon fontSize="large" />
    },
    {
      title: 'Devamsızlık Durumu',
      description: 'Korist devamsızlıklarını işle',
      path: '/attendance-management',
      icon: <PersonOffIcon fontSize="large" />
    },
    {
      title: 'Konser ve Prova Takvimi',
      description: 'Etkinlik tarihlerini düzenle',
      path: '/calendar-management',
      icon: <CalendarMonthIcon fontSize="large" />
    },
    {
      title: 'Duyuru Yönetimi',
      description: 'Duyuruları oluştur ve yönet',
      path: '/announcement-management',
      icon: <CampaignIcon fontSize="large" />
    },
  ];

  useEffect(() => {
    const fetchUsersCount = async () => {
      try {
        const data = await apiClient.get('/users');
        setTotalUsers(data.length);
        const frozenCount = data.filter(user => user.frozen === true).length;
        setFrozenUsers(frozenCount);
      } catch (error) {
        console.error('Kullanıcılar yüklenirken hata:', error);
      }
    };
    fetchUsersCount();
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await apiClient.get('/management/summary');
        setOverdueFeeCount(data.overdueFeeCount);
        setRepeatedAbsCount(data.repeatedAbsCount);

        // Yeni: Kullanıcı detaylarını state'e ata
        setOverdueUserDetails(data.overdueUserDetails);
        setAbsentUserDetails(data.absentUserDetails);

        setLoadingSummary(false);
      } catch (error) {
        console.error('MasterAdmin summary error:', error);
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  // Modal stil ayarları
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 300,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  return (
    <Box
      p={3}
      bgcolor="#f5f5f5"
      minHeight="100vh"
      sx={{
        marginBottom: '64px',
        overflow: 'auto',
      }}
    >
      <Typography variant="h5" gutterBottom align="center">
        Admin Panel
      </Typography>



      <Card sx={{ backgroundColor: '#fffde7', mb: 3 }}> 
  <CardContent>
    {/* Aidat Uyarısı */}
    <Typography
      variant="subtitle1"
      color="text.primary"
      display="flex"
      alignItems="center"
      mb={1}
    >
      <WarningAmberIcon sx={{ mr: 1 }} />
      Aidat Sınırında&nbsp;&nbsp;
      <span 
        style={{ textDecoration: 'underline', color: 'blue', cursor: 'pointer' }}
        onClick={() => setOpenOverdueModal(true)}
      >
        {loadingSummary ? <CircularProgress size={20} /> : `${overdueFeeCount} kişi`}
      </span>
      &nbsp;&nbsp;var!
    </Typography>

    {/* Devamsızlık Uyarısı */}
    <Typography
  variant="subtitle1"
  color="text.primary"
  display="flex"
  alignItems="center"
  mt={1}
>
  <WarningAmberIcon sx={{ mr: 1 }} />
  Devamsızlık Sınırında&nbsp;&nbsp;
  <span 
    style={{ textDecoration: 'underline', color: 'blue', cursor: 'pointer' }}
    onClick={() => setOpenAbsentModal(true)}
  >
    {loadingSummary ? <CircularProgress size={20} /> : `${repeatedAbsCount} kişi`}
  </span>
  &nbsp;&nbsp;var!
</Typography>
  </CardContent>
</Card>




      <Grid container spacing={3}>
        {dashboardItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #ccc',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
              }}
              onClick={() => navigate(item.path)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  {item.icon}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {item.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {item.description}
                </Typography>
                {item.title === 'Kullanıcı Yönetimi' && (
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    Üye: {totalUsers} | Donduran: {frozenUsers}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Aidat ödemeyen kullanıcıları gösteren modal */}
      <Modal
        open={openOverdueModal}
        onClose={() => setOpenOverdueModal(false)}
        aria-labelledby="overdue-modal-title"
        aria-describedby="overdue-modal-description"
      >
        <Box sx={modalStyle}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography id="overdue-modal-title" variant="h6">
              2 Aydır Aidat Ödemeyenler
            </Typography>
            <IconButton onClick={() => setOpenOverdueModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List>
            {overdueUserDetails.length > 0 ? (
              overdueUserDetails.map((user) => (
                <ListItem key={user._id}>
  <ListItemText primary={`${user.name} ${user.surname}`} />
  </ListItem>
              ))
            ) : (
              <Typography id="overdue-modal-description">Hiç kullanıcı yok.</Typography>
            )}
          </List>
        </Box>
      </Modal>

      {/* Devamsızlık yapan kullanıcıları gösteren modal */}
      <Modal
        open={openAbsentModal}
        onClose={() => setOpenAbsentModal(false)}
        aria-labelledby="absent-modal-title"
        aria-describedby="absent-modal-description"
      >
        <Box sx={modalStyle}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography id="absent-modal-title" variant="h6">
              4 Çalışma Üst Üste Gelmeyenler
            </Typography>
            <IconButton onClick={() => setOpenAbsentModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List>
            {absentUserDetails.length > 0 ? (
              absentUserDetails.map((user) => (
                <ListItem key={user._id}>
  <ListItemText primary={`${user.name} ${user.surname}`} />
  </ListItem>
              ))
            ) : (
              <Typography id="absent-modal-description">Hiç kullanıcı yok.</Typography>
            )}
          </List>
        </Box>
      </Modal>
    </Box>
  );
};

export default MasterAdminDashboard;
