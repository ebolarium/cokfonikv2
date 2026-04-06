// src/components/UserDashboard.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Modal,
  Button,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import HearingIcon from '@mui/icons-material/Hearing';
import Confetti from 'react-confetti';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PaymentsIcon from '@mui/icons-material/Payments';
import CampaignIcon from '@mui/icons-material/Campaign';
import apiClient from '../utils/apiClient';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [attendancePercentage, setAttendancePercentage] = useState(null);
  const [currentMotivation, setCurrentMotivation] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const userName = user?.name || '';

  // Duyuru State
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [open, setOpen] = useState(false);
  const [unpaidFeesModalOpen, setUnpaidFeesModalOpen] = useState(false);

  // Konfeti & Animasyon State
  const [showConfetti, setShowConfetti] = useState(false);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'fadingIn' | 'steady' | 'fadingOut'


  // Devam yüzdesini hesapla
  const fetchAttendancePercentage = async () => {
    try {
      const [attendances, events] = await Promise.all([
        apiClient.get(`/attendance/${user._id}`),
        apiClient.get('/events')
      ]);

      // Prova türündeki ve beklemede olmayan katılımları filtrele
      const provaAttendances = attendances.filter(a => 
        events.some(e => 
          e._id === a.event?._id && 
          e.type === 'Prova'
        ) && 
        a.status !== 'BEKLEMEDE'
      );

      // Gelinen prova sayısı
      const cameCount = provaAttendances.filter(a => a.status === 'GELDI').length;
      
      // Yüzde hesapla
      const percentage = provaAttendances.length > 0
        ? Math.round((cameCount / provaAttendances.length) * 100)
        : 0;

      setAttendancePercentage(percentage);
    } catch (error) {
      console.error('Devam yüzdesi hesaplanırken hata:', error);
    }
  };

  // Motivasyon verilerini çek
  const fetchCurrentMotivation = async () => {
    try {
      const response = await apiClient.get('/motivation/current');
      if (response.hasData && response.motivation) {
        setCurrentMotivation(response.motivation.overallHappiness);
      }
    } catch (error) {
      console.log('No motivation data found');
      // Keep null if no data
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchAttendancePercentage();
      fetchCurrentMotivation();
    }
  }, []);

  // Yüzde rengini belirle
  const getPercentageColor = (percentage) => {
    if (percentage >= 70) return '#4caf50'; // yeşil
    if (percentage >= 60) return '#ff9800'; // turuncu
    return '#f44336'; // kırmızı
  };

  // Motivasyon rengini belirle
  const getMotivationColor = (level) => {
    if (level <= 3) return '#f44336'; // kırmızı
    if (level <= 6) return '#ff9800'; // turuncu
    return '#4caf50'; // yeşil
  };

  // Motivasyon emoji'sini belirle
  const getMotivationEmoji = (level) => {
    if (level <= 3) return '😢';
    if (level <= 6) return '😐';
    return '😊';
  };

  useEffect(() => {
    const checkUnpaidFees = async () => {
      try {
        // Tarih kontrolü
        const today = new Date();
        const dayOfMonth = today.getDate();
        
        // Sadece ayın 20'si ile 25'i arasında göster
        if (dayOfMonth < 20 || dayOfMonth > 25) {
          return;
        }

        const data = await apiClient.get(`/fees/check-unpaid/${user._id}`);
        if (data.hasUnpaidFees && !modalDismissed) {
          setUnpaidCount(data.unpaidCount);
          setUnpaidFeesModalOpen(true);
        }
      } catch (error) {
        console.error('Aidat borcu kontrol edilirken hata oluştu:', error);
      }
    };

    if (user) checkUnpaidFees();
  }, [user, modalDismissed]); // modalDismissed state'ini dependency array'e ekledik

  // Modal kapatma fonksiyonu
  const handleCloseModal = () => {
    setUnpaidFeesModalOpen(false);
    setModalDismissed(true); // Modalın tekrar açılmasını engelle
  };

  // Duyuruları çek
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await apiClient.get('/announcements');

        const userId = user?._id;
        if (!userId) throw new Error('User ID not found in localStorage');

        // Gizlenmiş duyuruları filtrele
        const visibleAnnouncements = data.filter(
          (announcement) => !announcement.hiddenBy?.includes(userId)
        );
        setAnnouncements(visibleAnnouncements);
      } catch (error) {
        console.error('Duyurular yüklenemedi:', error);
      }
    };

    fetchAnnouncements();
  }, [user?._id]);

  // Okunmamış duyuru sayısı
  const unreadCount = announcements.filter((announcement) => {
    // readBy'daki her ID'yi string'e çevir
    const readByStringArray = announcement.readBy.map((id) => String(id));
    return !readByStringArray.includes(String(user?._id));
  }).length;

  // Duyuru okundu
  const markAsRead = async (id) => {
    const userId = user?._id;
    try {
      await apiClient.patch(`/announcements/${id}/read`, { userId });
      setAnnouncements((prev) =>
        prev.map((ann) =>
          ann._id === id
            ? { ...ann, readBy: [...ann.readBy, userId] }
            : ann
        )
      );
    } catch (error) {
      console.error('Duyuru okundu olarak işaretlenirken hata:', error);
    }
  };

  // Duyuru gizle
  const hideAnnouncement = async (id) => {
    const userId = user?._id;
    try {
      await apiClient.patch(`/announcements/${id}/hide`, { userId });
      // Başarıyla gizlenmiş duyuruyu local state'ten çıkar
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    } catch (error) {
      console.error('Duyuru gizlenirken hata:', error);
    }
  };

  // Duyuru modal aç/kapat
  const handleOpen = (announcement) => {
    // Okundu mu kontrolü için yine string dönüşümü
    const readByStringArray = announcement.readBy.map((id) => String(id));
    if (!readByStringArray.includes(String(user?._id))) {
      markAsRead(announcement._id);
    }
    setSelectedAnnouncement(announcement);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAnnouncement(null);
  };

  // Konfeti Gösterme Mantığı
  useEffect(() => {
    if (user?.birthDate) {
      const today = new Date();
      const birthDate = new Date(user.birthDate);
      
      const isBirthday =
        today.getDate() === birthDate.getDate() &&
        today.getMonth() === birthDate.getMonth();

      if (isBirthday) {
        const userId = user._id;
        // Bugünü YYYY-MM-DD formatında string yap
        const todayString = today.toISOString().split('T')[0]; 
        const birthdayKey = `birthdayConfettiShown_${userId}_${todayString}`;

        // 1) localStorage kontrolü
        const alreadyShown = localStorage.getItem(birthdayKey);

        if (!alreadyShown) {
          // Confetti göster
          setShowConfetti(true);
          setPhase('fadingIn');

          // 2) Gördüğünü kaydet
          localStorage.setItem(birthdayKey, 'true');
          
          // Fade in/out veya tıklanarak kapanma mantığını devam ettir
          setTimeout(() => {
            setPhase('steady');
          }, 1000);
        }
      }
    }
  }, [user?.birthDate]);

  // Konfeti Kapanış Tıklaması
  const handleClickClose = () => {
    // fade out
    setPhase('fadingOut');
    setTimeout(() => {
      setShowConfetti(false);
      setPhase('idle');
    }, 1000); // 1sn sonra DOM'dan kaldır
  };

  // Aidat sayısı güncelleme event listener'ı
  useEffect(() => {
    const handleUnpaidCountUpdate = (event) => {
      setUnpaidCount(event.detail.count);
    };

    window.addEventListener('updateUnpaidCount', handleUnpaidCountUpdate);
    return () => {
      window.removeEventListener('updateUnpaidCount', handleUnpaidCountUpdate);
    };
  }, []);

  // Dashboard Kartları
  const dashboardItems = [
    // {
    //   title: 'Motivasyonum',
    //   path: '/motivasyonum',
    //   icon: <HelpOutlineIcon style={{ fontSize: 50 }} />,
    //   bgColor: '#fff0f5',
    //   content: currentMotivation !== null && (
    //     <Box sx={{ 
    //       display: 'flex', 
    //       alignItems: 'center',
    //       gap: 1
    //     }}>
    //       <Typography 
    //         variant="body2" 
    //         sx={{ 
    //           color: getMotivationColor(currentMotivation),
    //           fontWeight: 600,
    //           fontSize: '0.9rem',
    //         }}
    //       >
    //         {getMotivationEmoji(currentMotivation)} {currentMotivation}/10
    //       </Typography>
    //     </Box>
    //   )
    // },
    {
      title: 'Yoklama',
      path: '/my-attendance',
      icon: <AssignmentTurnedInIcon style={{ fontSize: 50 }} />,
      bgColor: '#f0f8ff',
      content: attendancePercentage !== null && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          mt: 1
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#2c3e50',
              fontWeight: 500,
              fontSize: '0.9rem',
            }}
          >
            Devam:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: getPercentageColor(attendancePercentage),
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            %{attendancePercentage}
          </Typography>
        </Box>
      )
    },
    {
      title: 'Aidat',
      path: '/my-fees',
      icon: <AccountBalanceIcon style={{ fontSize: 50 }} />,
      bgColor: '#e6ffe6',
      content: (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#2c3e50',
              fontWeight: 500,
              fontSize: '0.9rem',
            }}
          >
            Eksik:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: unpaidCount === 0 ? '#2c3e50' : '#e74c3c',
              fontWeight: 500,
              fontSize: '0.9rem',
            }}
          >
            {unpaidCount}{' '}
            {unpaidCount === 0 ? '🎉' : 
             unpaidCount === 1 ? '😱' : 
             '🚨'}
          </Typography>
        </Box>
      )
    },
    {
      title: 'Takvim',
      path: '/calendar-view',
      icon: <EventNoteIcon style={{ fontSize: 50 }} />,
      bgColor: '#ffe6e6',
    },
    {
      title: 'Duyurular',
      path: '/announcements',
      icon: <NotificationsIcon style={{ fontSize: 50 }} />,
      bgColor: '#fff8dc',
      content: unreadCount > 0 ? (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#e74c3c',
              fontWeight: 500,
              fontSize: '0.9rem',
            }}
          >
            {unreadCount} Yeni
          </Typography>
        </Box>
      ) : null
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
    {
      title: 'Müzik Çalar (Beta)',
      path: '/midi-player',
      icon: <PlayCircleIcon style={{ fontSize: 50 }} />,
      bgColor: '#d9f7be',
    },
  ];

  // Hide Nota/Midi button for Rookie users
  const filteredDashboardItems = user.role === 'Rookie' 
    ? dashboardItems.filter(item => item.title !== 'Nota/Midi')
    : dashboardItems;

  // Roller baz alınarak ek kartlar ekle
  if (user.role === 'Yoklama') {
    filteredDashboardItems.push({
      title: 'Yoklama Yönetimi',
      path: '/attendance-management',
      icon: <AssignmentTurnedInIcon style={{ fontSize: 50 }} />,
      bgColor: '#f0f8ff',
    });
  }

  if (user.role === 'Aidat') {
    filteredDashboardItems.push({
      title: 'Aidat Yönetimi',
      path: '/fee-management',
      icon: <PaymentsIcon style={{ fontSize: 50 }} />,
      bgColor: '#e6ffe6',
    });
  }

  if (user.role === 'Rookie') {
    // Add a special welcome card for rookie users at the beginning
    filteredDashboardItems.unshift({
      title: 'Hoş Geldin! 🎵',
      path: '/announcements', // Redirect to announcements for important info
      icon: <span style={{ fontSize: 50 }}>🎼</span>,
      bgColor: '#fff3e0',
      content: (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          mt: 1
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#ff6f00',
              fontWeight: 500,
              fontSize: '0.8rem',
              textAlign: 'center'
            }}
          >
            Yeni Üye
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#e65100',
              fontWeight: 400,
              fontSize: '0.7rem',
              textAlign: 'center'
            }}
          >
            Duyuruları kontrol et!
          </Typography>
        </Box>
      )
    });
  }

  return (
    <Box minHeight="100vh" position="relative">
      {/* Konfeti & Mesaj */}
      {showConfetti && (
        <Box
          onClick={handleClickClose}
          sx={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'auto', // Tıklamayı yakalayabilelim
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'opacity 1s ease-in-out',
            opacity: phase === 'fadingIn' || phase === 'steady' ? 1 : 0,
            cursor: 'pointer',  // Kapanış için tıklandığını belirtmek adına
            zIndex: 9999,
          }}
        >
          <Confetti gravity={0.02} numberOfPieces={250} />

          {/* Mesaj Kutusu */}
          <Box
            sx={{
              position: 'absolute',
              maxWidth: '300px',
              textAlign: 'center',
              color: '#000',
              fontSize: { xs: '18px', md: '24px' },
              textShadow: '1px 1px 4px rgba(0,0,0,0.6)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              p: 2,
              borderRadius: 2,
              whiteSpace: 'pre-line', // Satır atlamaları için
              transform: 'translateY(-5%)' // Biraz yukarı kaydırmak istersen
            }}
          >
            {`Sevgili ${userName},\n
Doğum gününü en içten duygularla tüm kalbimizle kutlarız 💝🎈🎊🎂🥂\n
Aramızda olduğun ve Çokfonik'e değer kattığın için çok mutluyuz😊\n
Sesinle ve gülüşünle Çokfonik'e adeta bir can suyu oldun💧\n
Neşeyle sağlıkla ve müzikle dolu bir yaş dileriz 🎶🎵🎼🥁🥂\n
İyi ki doğdun, iyi ki varsın 🌻💐🌹
`}
          </Box>
        </Box>
      )}

      {/* Aidat Borcu Modal */}
      <Modal
        open={unpaidFeesModalOpen}
        onClose={handleCloseModal}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 2,
            borderRadius: 2,
            textAlign: 'center',
            fontSize: '16px', // Genel font büyüklüğü
            width: { xs: '90%', sm: '400px', md: '500px' }, // Responsive genişlik
            maxWidth: '90vw', // Ekran genişliğine göre sınırlama
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontSize: '24px', fontWeight: 'bold' }}>
            ⚠️ Aidat Bildirimi
          </Typography>
          <Typography gutterBottom sx={{ fontSize: '18px' }}>
            Ödenmemiş {unpaidCount} aylık aidatınız var. 😱
          </Typography>
          <Button variant="contained" color="primary" onClick={handleCloseModal}>
            Tamam
          </Button>
        </Box>
      </Modal>

      <Box 
        sx={{ 
          height: { xs: 'auto', sm: '80vh' },
          overflowY: 'auto',
          p: 3 
        }}
      >
        <Grid container spacing={2}>
          {filteredDashboardItems.map((item, index) => (
            <Grid item xs={12} key={index}>
              <Card
                onClick={() => item.path ? navigate(item.path) : window.open(item.link, '_blank')}
                sx={{
                  backgroundColor: item.bgColor,
                  cursor: 'pointer',
                  height: '60px',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    height: '100%',
                    p: '12px !important',
                  }}
                >
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    '& > *': { 
                      fontSize: { xs: 24, sm: 28 }
                    },
                    color: 'rgba(0, 0, 0, 0.7)',
                    mr: 2
                  }}>
                    {item.icon}
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      fontWeight: 500,
                      color: '#2c3e50',
                      flexGrow: 1
                    }}
                  >
                    {item.title}
                  </Typography>
                  {item.content && (
                    <Box sx={{ ml: 'auto', mr: 1 }}>
                      {item.content}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}


        </Grid>

        {/* Duyuru Modal */}
        <Modal
          open={open}
          onClose={handleClose}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{ timeout: 500 }}
        >
          <Fade in={open}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
                maxWidth: 400,
                width: '90%',
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {selectedAnnouncement?.title}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {selectedAnnouncement?.content}
              </Typography>
              <Box mt={2} display="flex" justifyContent="space-between">
                <Button variant="contained" color="primary" onClick={handleClose}>
                  Kapat
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => hideAnnouncement(selectedAnnouncement._id)}
                >
                  Gizle
                </Button>
              </Box>
            </Box>
          </Fade>
        </Modal>
      </Box>
    </Box>
  );
};

export default UserDashboard;
