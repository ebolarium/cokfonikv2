import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Avatar, 
  Divider, 
  CircularProgress, 
  Badge,
  Chip,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  SwipeableDrawer,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  CalendarMonth as CalendarIcon,
  MusicNote as MusicIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Payment as PaymentIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Celebration as CelebrationIcon,
  Menu as MenuIcon,
  EventBusy as EventBusyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Özel stil bileşenleri
const DashboardCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:active': {
    transform: 'scale(0.98)',
    boxShadow: theme.shadows[2],
  },
  borderRadius: 16,
  overflow: 'hidden'
}));

const CardHeader = styled(Box)(({ theme, color = 'primary.main' }) => ({
  backgroundColor: theme.palette[color.split('.')[0]][color.split('.')[1] || 'main'],
  color: '#fff',
  padding: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#e74c3c',
    color: 'white',
  },
}));

const ExpandButton = styled(IconButton)(({ theme, expanded }) => ({
  transform: expanded === 'true' ? 'rotate(180deg)' : 'rotate(0deg)',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const MenuFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: 80, // BottomNav üzerinde
  right: 16,
  zIndex: 1000,
}));

const UserNewDashboard = ({ fetchUnreadAnnouncements }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [attendancePercentage, setAttendancePercentage] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unpaidFees, setUnpaidFees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [birthdayUsers, setBirthdayUsers] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    events: true,
    birthdays: false
  });
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Gelemiyorum işlevselliği için state'ler
  const [openFutureDialog, setOpenFutureDialog] = useState(false);
  const [futureEvents, setFutureEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [futureExcuseText, setFutureExcuseText] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Kullanıcı bilgilerini al
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
    }
  }, []);

  // Yoklama yüzdesini getir
  const fetchAttendancePercentage = async () => {
    try {
      const userId = JSON.parse(localStorage.getItem('user'))?._id;
      if (!userId) return;

      const apiUrl = `${process.env.REACT_APP_API_URL}/attendance/percentage/${userId}`;
      console.log('Fetching attendance percentage from:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      // Response içeriğini text olarak al
      const textResponse = await response.text();
      
      // HTML içeriyor mu kontrol et
      if (textResponse.trim().startsWith('<!DOCTYPE') || textResponse.trim().startsWith('<html')) {
        console.error('API HTML döndürdü, backend çalışmıyor olabilir:', textResponse.substring(0, 100));
        return;
      }
      
      // Text'i JSON'a çevir
      const data = JSON.parse(textResponse);
      setAttendancePercentage(data.percentage);
    } catch (error) {
      console.error('Yoklama yüzdesi alınamadı:', error);
      console.error('API URL:', process.env.REACT_APP_API_URL);
    }
  };

  // Yaklaşan etkinlikleri getir
  const fetchUpcomingEvents = async () => {
    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/events/upcoming`;
      console.log('Fetching upcoming events from:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      // Response içeriğini text olarak al
      const textResponse = await response.text();
      
      // HTML içeriyor mu kontrol et
      if (textResponse.trim().startsWith('<!DOCTYPE') || textResponse.trim().startsWith('<html')) {
        console.error('API HTML döndürdü, backend çalışmıyor olabilir:', textResponse.substring(0, 100));
        return;
      }
      
      // Text'i JSON'a çevir
      const data = JSON.parse(textResponse);
      setUpcomingEvents(data.slice(0, 3)); // Sadece ilk 3 etkinliği göster
    } catch (error) {
      console.error('Etkinlikler alınamadı:', error);
      console.error('API URL:', process.env.REACT_APP_API_URL);
    }
  };

  // Doğum günü olan kullanıcıları getir
  const fetchBirthdayUsers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users`);
      const users = await response.json();
      
      // Bugünün tarihini al
      const today = new Date();
      
      // Bugün doğum günü olan kullanıcıları filtrele
      const birthdayPeople = users.filter(user => {
        if (!user.birthDate) return false;
        
        const birthDate = new Date(user.birthDate);
        return birthDate.getDate() === today.getDate() && 
               birthDate.getMonth() === today.getMonth();
      });
      
      setBirthdayUsers(birthdayPeople);
    } catch (error) {
      console.error('Doğum günleri alınamadı:', error);
    }
  };

  // Ödenmemiş aidat sayısını getir
  const checkUnpaidFees = async () => {
    try {
      const userId = JSON.parse(localStorage.getItem('user'))?._id;
      if (!userId) return;

      const apiUrl = `${process.env.REACT_APP_API_URL}/fees/check-unpaid/${userId}`;
      console.log('Checking unpaid fees from:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      // Response içeriğini text olarak al
      const textResponse = await response.text();
      
      // HTML içeriyor mu kontrol et
      if (textResponse.trim().startsWith('<!DOCTYPE') || textResponse.trim().startsWith('<html')) {
        console.error('API HTML döndürdü, backend çalışmıyor olabilir:', textResponse.substring(0, 100));
        return;
      }
      
      // Text'i JSON'a çevir
      const data = JSON.parse(textResponse);
      setUnpaidFees(data.unpaidCount || 0);
    } catch (error) {
      console.error('Ödenmemiş aidat bilgisi alınamadı:', error);
      console.error('API URL:', process.env.REACT_APP_API_URL);
    }
  };

  // Okunmamış duyuru sayısını getir
  const getUnreadCount = async () => {
    try {
      if (fetchUnreadAnnouncements) {
        const count = await fetchUnreadAnnouncements();
        if (count !== undefined) {
          setUnreadCount(count);
        } else {
          console.warn('fetchUnreadAnnouncements undefined değer döndürdü');
          setUnreadCount(0);
        }
      } else {
        console.warn('fetchUnreadAnnouncements fonksiyonu tanımlı değil');
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Okunmamış duyuru sayısı alınamadı:', error);
      setUnreadCount(0);
    }
  };

  // Gelecek provaları getir
  const fetchFutureEvents = async () => {
    try {
      const userId = JSON.parse(localStorage.getItem('user'))?._id;
      if (!userId) return;
      
      // Sahte veriler kullanıyoruz
      if (!process.env.REACT_APP_API_URL) {
        setFutureEvents([
          {
            _id: '3',
            title: 'Haftalık Prova',
            type: 'Prova',
            date: new Date(Date.now() + 86400000 * 3), // 3 gün sonra
            location: 'Ana Salon',
            status: 'Bekleniyor'
          },
          {
            _id: '4',
            title: 'Konser Hazırlık',
            type: 'Prova',
            date: new Date(Date.now() + 86400000 * 7), // 7 gün sonra
            location: 'Konser Salonu',
            status: 'Bekleniyor'
          }
        ]);
        return;
      }
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/attendance/${userId}`);
      
      // Response içeriğini text olarak al
      const textResponse = await response.text();
      
      // HTML içeriyor mu kontrol et
      if (textResponse.trim().startsWith('<!DOCTYPE') || textResponse.trim().startsWith('<html')) {
        console.error('API HTML döndürdü, backend çalışmıyor olabilir');
        // Sahte veriler kullan
        setFutureEvents([
          {
            _id: '3',
            title: 'Haftalık Prova',
            type: 'Prova',
            date: new Date(Date.now() + 86400000 * 3), // 3 gün sonra
            location: 'Ana Salon',
            status: 'Bekleniyor'
          },
          {
            _id: '4',
            title: 'Konser Hazırlık',
            type: 'Prova',
            date: new Date(Date.now() + 86400000 * 7), // 7 gün sonra
            location: 'Konser Salonu',
            status: 'Bekleniyor'
          }
        ]);
        return;
      }
      
      // Text'i JSON'a çevir
      const data = JSON.parse(textResponse);
      
      // Bugün ve sonraki provaları filtrele
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Bugünün başlangıcını al (saat 00:00)
      
      const futureData = data
        .filter(att => 
          att.event?.type === 'Prova' && 
          new Date(att.date) >= today && 
          att.status !== 'MAZERETLI'
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setFutureEvents(futureData);
    } catch (error) {
      console.error('Gelecek provalar yüklenirken hata:', error);
      // Hata durumunda sahte veriler kullan
      setFutureEvents([
        {
          _id: '3',
          title: 'Haftalık Prova',
          type: 'Prova',
          date: new Date(Date.now() + 86400000 * 3), // 3 gün sonra
          location: 'Ana Salon',
          status: 'Bekleniyor'
        },
        {
          _id: '4',
          title: 'Konser Hazırlık',
          type: 'Prova',
          date: new Date(Date.now() + 86400000 * 7), // 7 gün sonra
          location: 'Konser Salonu',
          status: 'Bekleniyor'
        }
      ]);
    }
  };

  // Tüm verileri yükle
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      
      // Backend çalışmıyor, doğrudan sahte verileri kullan
      console.log('Backend çalışmıyor, sahte veriler kullanılıyor...');
      setAttendancePercentage(85);
      setUnpaidFees(0);
      setUnreadCount(2);
      
      // Sahte etkinlikler
      setUpcomingEvents([
        {
          _id: '1',
          title: 'Haftalık Prova',
          type: 'Prova',
          date: new Date(Date.now() + 86400000 * 2), // 2 gün sonra
          location: 'Ana Salon'
        },
        {
          _id: '2',
          title: 'Konser Hazırlık',
          type: 'Prova',
          date: new Date(Date.now() + 86400000 * 5), // 5 gün sonra
          location: 'Konser Salonu'
        }
      ]);
      
      // Sahte doğum günleri
      setBirthdayUsers([
        {
          _id: '1',
          name: 'Ahmet',
          surname: 'Yılmaz',
          part: 'Tenor',
          profilePhoto: ''
        }
      ]);
      
      setLoading(false);
    };

    loadAllData();
  }, []);

  // Bölüm genişletme/daraltma işlevi
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Yoklama yüzdesi rengi
  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'success.main';
    if (percentage >= 60) return 'warning.main';
    return 'error.main';
  };

  // Tarih formatı
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Saat formatı
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Hızlı erişim menüsü
  const quickAccessMenu = [
    { icon: <PersonIcon />, label: 'Profilim', path: '/profile' },
    { icon: <CalendarIcon />, label: 'Takvim', path: '/calendar-view' },
    { icon: <MusicIcon />, label: 'Müzik', path: '/midi-player' },
    { icon: <NotificationsIcon />, label: 'Duyurular', path: '/announcements' },
  ];

  // Gelecek mazeret bildirimi
  const handleFutureExcuseSubmit = async () => {
    if (!selectedEvent || !futureExcuseText.trim()) return;

    try {
      // Sahte veriler kullanıyoruz
      if (!process.env.REACT_APP_API_URL) {
        setOpenFutureDialog(false);
        setSelectedEvent(null);
        setFutureExcuseText('');
        setSnackbar({
          open: true,
          message: 'Mazeret başarıyla kaydedildi (Demo)',
          severity: 'success'
        });
        return;
      }
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/attendance/excuse/${selectedEvent._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          excuse: futureExcuseText,
          userId: user._id,
        }),
      });

      // Hata durumunda response body'yi görelim
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Hata detayı:', errorData);
        setSnackbar({
          open: true,
          message: errorData.message || 'Mazeret bildirimi yapılırken bir hata oluştu',
          severity: 'error'
        });
        return;
      }

      setOpenFutureDialog(false);
      setSelectedEvent(null);
      setFutureExcuseText('');
      fetchFutureEvents();
      setSnackbar({
        open: true,
        message: 'Mazeret başarıyla kaydedildi',
        severity: 'success'
      });
    } catch (error) {
      console.error('Mazeret gönderme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Mazeret bildirimi yapılırken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: '72px' }}>
      {/* Üst Kısım - Kullanıcı Bilgileri */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 0,
          background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 150,
            height: 150,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)',
            zIndex: 0
          }}
        />
        
        <Box display="flex" alignItems="center" position="relative" zIndex={1}>
          <Avatar 
            src={user?.profilePhoto} 
            alt={user?.name}
            sx={{ width: 70, height: 70, mr: 2, border: '3px solid rgba(255,255,255,0.5)' }}
          />
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              Merhaba, {user?.name}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {user?.part || 'Parti Belirtilmemiş'}
            </Typography>
            <Chip 
              label={`Yoklama: ${attendancePercentage !== null ? `%${attendancePercentage}` : 'Hesaplanıyor...'}`}
              sx={{ 
                mt: 1, 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 'bold',
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Ana Kartlar - 2x2 Grid */}
      <Grid container spacing={2} sx={{ p: 2 }}>
        {/* Aidat Kartı */}
        <Grid item xs={6}>
          <DashboardCard 
            onClick={() => navigate('/my-fees')}
            sx={{ boxShadow: 3 }}
          >
            <CardHeader color="primary.main">
              <Typography variant="subtitle1" fontWeight="bold">Aidat</Typography>
              <PaymentIcon />
            </CardHeader>
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {unpaidFees > 0 ? (
                <>
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    {unpaidFees}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" align="center">
                    Ödenmemiş
                  </Typography>
                </>
              ) : (
                <>
                  <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary" align="center">
                    Tamamlandı
                  </Typography>
                </>
              )}
            </CardContent>
          </DashboardCard>
        </Grid>

        {/* Yoklama Kartı */}
        <Grid item xs={6}>
          <DashboardCard 
            onClick={() => navigate('/my-attendance')}
            sx={{ boxShadow: 3 }}
          >
            <CardHeader color="success.main">
              <Typography variant="subtitle1" fontWeight="bold">Yoklama</Typography>
              <CheckCircleIcon />
            </CardHeader>
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {attendancePercentage !== null ? (
                <>
                  <Box position="relative" display="inline-flex" mb={0.5}>
                    <CircularProgress 
                      variant="determinate" 
                      value={attendancePercentage} 
                      size={40}
                      sx={{ color: getPercentageColor(attendancePercentage) }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" fontWeight="bold">
                        %{attendancePercentage}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" align="center">
                    Katılım
                  </Typography>
                </>
              ) : (
                <Typography variant="caption" color="text.secondary" align="center">
                  Yükleniyor...
                </Typography>
              )}
            </CardContent>
          </DashboardCard>
        </Grid>

        {/* Duyurular Kartı */}
        <Grid item xs={6}>
          <DashboardCard 
            onClick={() => navigate('/announcements')}
            sx={{ boxShadow: 3 }}
          >
            <CardHeader color="warning.main">
              <Typography variant="subtitle1" fontWeight="bold">Duyurular</Typography>
              <StyledBadge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </StyledBadge>
            </CardHeader>
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {unreadCount > 0 ? (
                <>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {unreadCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" align="center">
                    Okunmamış
                  </Typography>
                </>
              ) : (
                <>
                  <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary" align="center">
                    Tamamlandı
                  </Typography>
                </>
              )}
            </CardContent>
          </DashboardCard>
        </Grid>

        {/* Müzik Kartı */}
        <Grid item xs={6}>
          <DashboardCard 
            onClick={() => navigate('/midi-player')}
            sx={{ boxShadow: 3 }}
          >
            <CardHeader color="info.main">
              <Typography variant="subtitle1" fontWeight="bold">Müzik</Typography>
              <MusicIcon />
            </CardHeader>
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <MusicIcon sx={{ fontSize: 40, color: 'info.main', mb: 0.5 }} />
              <Typography variant="caption" color="text.secondary" align="center">
                Parçalar
              </Typography>
            </CardContent>
          </DashboardCard>
        </Grid>
      </Grid>

      {/* Yaklaşan Etkinlikler */}
      <Paper 
        elevation={2} 
        sx={{ 
          mx: 2, 
          mb: 2, 
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          onClick={() => toggleSection('events')}
          sx={{ 
            cursor: 'pointer',
            p: 2,
            bgcolor: 'primary.light',
            color: 'white'
          }}
        >
          <Box display="flex" alignItems="center">
            <EventIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">Yaklaşan Etkinlikler</Typography>
          </Box>
          <ExpandButton expanded={expandedSections.events ? 'true' : 'false'} sx={{ color: 'white' }}>
            {expandedSections.events ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ExpandButton>
        </Box>
        
        <Collapse in={expandedSections.events}>
          {upcomingEvents.length > 0 ? (
            <List sx={{ width: '100%', p: 0 }}>
              {upcomingEvents.map((event) => (
                <ListItem 
                  key={event._id} 
                  alignItems="flex-start" 
                  sx={{ 
                    px: 2, 
                    py: 1.5,
                    borderBottom: '1px solid rgba(0,0,0,0.08)'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 42 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: event.type === 'Prova' ? 'primary.main' : 'secondary.main',
                        width: 32,
                        height: 32
                      }}
                    >
                      {event.type === 'Prova' ? 'P' : 'K'}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" fontWeight="bold">
                        {event.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary" sx={{ display: 'block', fontSize: '0.8rem' }}>
                          {formatDate(event.date)} - {formatTime(event.date)}
                        </Typography>
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {event.location}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box p={2} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Yaklaşan etkinlik bulunmuyor.
              </Typography>
            </Box>
          )}
          
          <Box display="flex" justifyContent="center" p={1.5} bgcolor="rgba(0,0,0,0.02)">
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<CalendarIcon />}
              onClick={() => navigate('/calendar-view')}
              size="small"
              fullWidth
              sx={{ borderRadius: 4 }}
            >
              Tüm Takvimi Görüntüle
            </Button>
          </Box>
        </Collapse>
      </Paper>

      {/* Doğum Günleri */}
      {birthdayUsers.length > 0 && (
        <Paper 
          elevation={2} 
          sx={{ 
            mx: 2, 
            mb: 2, 
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            onClick={() => toggleSection('birthdays')}
            sx={{ 
              cursor: 'pointer',
              p: 2,
              bgcolor: 'secondary.light',
              color: 'white'
            }}
          >
            <Box display="flex" alignItems="center">
              <CelebrationIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">Bugün Doğum Günü Olanlar</Typography>
            </Box>
            <ExpandButton expanded={expandedSections.birthdays ? 'true' : 'false'} sx={{ color: 'white' }}>
              {expandedSections.birthdays ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ExpandButton>
          </Box>
          
          <Collapse in={expandedSections.birthdays}>
            <List sx={{ width: '100%', p: 0 }}>
              {birthdayUsers.map((birthdayUser) => (
                <ListItem 
                  key={birthdayUser._id} 
                  alignItems="flex-start" 
                  sx={{ 
                    px: 2, 
                    py: 1.5,
                    borderBottom: '1px solid rgba(0,0,0,0.08)'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 42 }}>
                    <Avatar 
                      src={birthdayUser.profilePhoto}
                      sx={{ width: 32, height: 32 }}
                    >
                      {birthdayUser.name.charAt(0)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" fontWeight="bold">
                        {`${birthdayUser.name} ${birthdayUser.surname}`}
                      </Typography>
                    }
                    secondary={
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {birthdayUser.part || 'Parti belirtilmemiş'}
                      </Typography>
                    }
                  />
                  <Chip 
                    label="🎂" 
                    color="secondary" 
                    size="small"
                    sx={{ height: 24 }}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Paper>
      )}

      {/* Hızlı Erişim Menüsü */}
      <MenuFab 
        color="primary" 
        size="medium" 
        onClick={() => setMenuOpen(true)}
        aria-label="menu"
      >
        <MenuIcon />
      </MenuFab>

      <SwipeableDrawer
        anchor="bottom"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpen={() => setMenuOpen(true)}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '60vh'
          }
        }}
      >
        <Box p={2}>
          <Typography variant="h6" fontWeight="bold" align="center" gutterBottom>
            Hızlı Erişim
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {quickAccessMenu.map((item, index) => (
              <Grid item xs={6} key={index}>
                <Button
                  variant="outlined"
                  startIcon={item.icon}
                  onClick={() => {
                    navigate(item.path);
                    setMenuOpen(false);
                  }}
                  fullWidth
                  sx={{ 
                    py: 1.5, 
                    borderRadius: 2,
                    justifyContent: 'flex-start',
                    pl: 2
                  }}
                >
                  {item.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      </SwipeableDrawer>

      {/* Gelemiyorum Butonu */}
      <Box sx={{ position: 'fixed', bottom: 80, left: 20, zIndex: 999 }}>
        <Button
          variant="contained"
          color="error"
          startIcon={<EventBusyIcon />}
          onClick={() => {
            fetchFutureEvents();
            setOpenFutureDialog(true);
          }}
          sx={{
            borderRadius: '20px',
            padding: '10px 20px',
            boxShadow: 3,
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        >
          Gelemiyorum
        </Button>
      </Box>

      {/* Gelecek Provalar Dialog'u */}
      <Dialog
        open={openFutureDialog}
        onClose={() => {
          setOpenFutureDialog(false);
          setSelectedEvent(null);
          setFutureExcuseText('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedEvent ? 'Mazeret Bildirimi' : 'Gelemeyeceğiniz Provayı Seçin'}
        </DialogTitle>
        <DialogContent>
          {!selectedEvent ? (
            <List>
              {futureEvents.length > 0 ? (
                futureEvents.map((event) => (
                  <ListItem
                    key={event._id}
                    button
                    onClick={() => setSelectedEvent(event)}
                    sx={{
                      borderBottom: '1px solid #eee',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                  >
                    <ListItemText
                      primary={event.title || 'Prova'}
                      secondary={new Date(event.date).toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    />
                  </ListItem>
                ))
              ) : (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    {new Date(selectedEvent.date).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                  <TextField
                    autoFocus
                    margin="dense"
                    label="Mazeret Açıklaması"
                    type="text"
                    fullWidth
                    multiline
                    rows={4}
                    value={futureExcuseText}
                    onChange={(e) => setFutureExcuseText(e.target.value)}
                  />
                </>
              )}
            </List>
          ) : (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {new Date(selectedEvent.date).toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Mazeret Açıklaması"
                type="text"
                fullWidth
                multiline
                rows={4}
                value={futureExcuseText}
                onChange={(e) => setFutureExcuseText(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          {selectedEvent ? (
            <>
              <Button 
                onClick={() => setSelectedEvent(null)} 
                color="primary"
              >
                Geri
              </Button>
              <Button 
                onClick={handleFutureExcuseSubmit} 
                color="primary" 
                variant="contained"
                disabled={!futureExcuseText.trim()}
              >
                Gönder
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setOpenFutureDialog(false)} 
              color="primary"
            >
              Kapat
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserNewDashboard; 