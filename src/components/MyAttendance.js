// MyAttendance.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  useMediaQuery,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
} from '@mui/material';
import { green, red, yellow, blue } from '@mui/material/colors';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import PieChartIcon from '@mui/icons-material/PieChart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import apiClient from '../utils/apiClient';

const MyAttendance = () => {
  const [attendances, setAttendances] = useState([]);
  const user = JSON.parse(localStorage.getItem('user')); // Kullanıcı bilgisi
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [excuseText, setExcuseText] = useState('');
  const [openExcuseDialog, setOpenExcuseDialog] = useState(false);
  const [selectedExcuse, setSelectedExcuse] = useState(null);
  const [openFutureDialog, setOpenFutureDialog] = useState(false);
  const [futureEvents, setFutureEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [futureExcuseText, setFutureExcuseText] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (!user || !user._id) {
      alert('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
      window.location.href = '/';
      return;
    }

    const fetchMyAttendance = async () => {
      try {
        const data = await apiClient.get(`/attendance/${user._id}`);

        if (Array.isArray(data)) {
          setAttendances(data);
        } else {
          console.error('API beklenmeyen bir yanıt döndü:', data);
        }
      } catch (error) {
        console.error('Devamsızlık verileri yüklenemedi:', error);
      }
    };

    fetchMyAttendance();
  }, [user]);

  // Geçmiş ve bugünkü tarihler için filtreleme ve sıralama
  const pastAndTodayAttendances = attendances
    .filter((attendance) => {
      const attendanceDate = new Date(attendance.date);
      const today = new Date();
      return (
        attendanceDate <= today &&
        attendance.event?.type === 'Prova' // "Prova" türünü kontrol eder
      );
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // En yakın tarihten en eskiye sıralama

  // Infografik Verilerini Hesaplama
  const today = new Date();

  const totalWorkdays = attendances.filter((a) => {
    return (
      a.event?.type === 'Prova' && 
      new Date(a.date) <= today
    );
  }).length;

  
  const daysAttended = attendances.filter((a) => a.status === 'GELDI' && a.event?.type === 'Prova').length;
  const daysMissed = attendances.filter((a) => a.status === 'GELMEDI' && a.event?.type === 'Prova').length;
  const daysExcused = attendances.filter((a) => a.status === 'MAZERETLI' && a.event?.type === 'Prova').length;
  const absencePercentage = totalWorkdays > 0
  ? (((daysMissed + daysExcused) / totalWorkdays) * 100).toFixed(2)
  : '0';
  // Grafik Verisi
  const pieData = [
    { name: 'Geldi', value: daysAttended },
    { name: 'Gelmedi', value: daysMissed },
    { name: 'Mazeretli', value: daysExcused },
  ];

  const COLORS = [green[500], red[500], yellow[700]];

  const handleExcuseSubmit = async () => {
    if (!selectedAttendance || !excuseText.trim()) return;

    try {
      await apiClient.post(`/attendance/excuse/${selectedAttendance._id}`, {
        excuse: excuseText,
        userId: user._id,
      });

      // Listeyi güncelle
      const updatedAttendances = attendances.map(att =>
        att._id === selectedAttendance._id ? { ...att, status: 'MAZERETLI' } : att
      );
      setAttendances(updatedAttendances);
      setOpenDialog(false);
      setExcuseText('');
      setSelectedAttendance(null);
    } catch (error) {
      console.error('Mazeret gönderme hatası:', error);
      alert('Mazeret bildirimi yapılırken bir hata oluştu.');
    }
  };

  // Mazeret detayını göstermek için yeni fonksiyon
  const handleExcuseClick = (attendance) => {
    if (attendance.status === 'MAZERETLI') {
      setSelectedExcuse({
        date: attendance.date,
        excuse: attendance.excuse || 'Mazeret detayı bulunmuyor'
      });
      setOpenExcuseDialog(true);
    }
  };

  // Gelecek provaları getir
  const fetchFutureEvents = async () => {
    try {
      const data = await apiClient.get(`/attendance/${user._id}`);
      
      // Bugün ve sonraki provaları filtrele
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Bugünün başlangıcını al (saat 00:00)
      
      const futureData = data
        .filter(att => 
          att.event?.type === 'Prova' && 
          new Date(att.date) >= today && // Büyük eşit yaptık
          att.status !== 'MAZERETLI'
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setFutureEvents(futureData);
    } catch (error) {
      console.error('Gelecek provalar yüklenirken hata:', error);
    }
  };

  // Gelecek mazeret bildirimi
  const handleFutureExcuseSubmit = async () => {
    if (!selectedEvent || !futureExcuseText.trim()) return;

    try {
      await apiClient.post(`/attendance/excuse/${selectedEvent._id}`, {
        excuse: futureExcuseText,
        userId: user._id,
      });

      setOpenFutureDialog(false);
      setSelectedEvent(null);
      setFutureExcuseText('');
      fetchFutureEvents();
      setSnackbar({
        open: true,
        message: 'Mazeret bildirimi başarıyla gönderildi!',
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

  return (
    <Box p={2} sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh', marginBottom: '50px' }}>
      <Typography variant={isSmallScreen ? "h5" : "h4"} gutterBottom align="center" color="primary">
        📅 Katılım Geçmişim
      </Typography>

      {/* Kartlar Bölümü */}
      <Grid container spacing={2} justifyContent="center" sx={{ mb: 2 }}>
        {/* Katıldın Kartı */}
        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              backgroundColor: blue[50],
              textAlign: 'center',
              padding: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
          >
            <CardContent>
              <Avatar sx={{ bgcolor: blue[500], margin: '0 auto', mb: 1, width: 40, height: 40 }}>
                <CheckCircleIcon fontSize="small" />
              </Avatar>
              <Typography variant="subtitle2">Katıldın</Typography>
              <Typography variant="h6" color="textPrimary">
                {daysAttended} / {totalWorkdays}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Eksik Günler Kartı */}
        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              backgroundColor: red[50],
              textAlign: 'center',
              padding: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
          >
            <CardContent>
              <Avatar sx={{ bgcolor: red[500], margin: '0 auto', mb: 1, width: 40, height: 40 }}>
                <CancelIcon fontSize="small" />
              </Avatar>
              <Typography variant="subtitle2">Eksik Günler</Typography>
              <Typography variant="h6" color="textPrimary">
                {daysMissed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Mazeretli Günler Kartı */}
        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              backgroundColor: yellow[50],
              textAlign: 'center',
              padding: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
          >
            <CardContent>
              <Avatar sx={{ bgcolor: yellow[700], margin: '0 auto', mb: 1, width: 40, height: 40 }}>
                <EmojiObjectsIcon fontSize="small" />
              </Avatar>
              <Typography variant="subtitle2">Mazeretli</Typography>
              <Typography variant="h6" color="textPrimary">
                {daysExcused}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Devamsızlık Yüzdesi Kartı */}
        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              backgroundColor: '#e0f7fa',
              textAlign: 'center',
              padding: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
          >
            <CardContent>
              <Avatar sx={{ bgcolor: '#00bcd4', margin: '0 auto', mb: 1, width: 40, height: 40 }}>
                <PieChartIcon fontSize="small" />
              </Avatar>
              <Typography variant="subtitle2">Devamsızlık %</Typography>
              <Typography variant="h6" color="textPrimary">
                {absencePercentage}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafik Bölümü */}
      <Box mt={4} sx={{ height: 250 }}>
        <Typography variant="h6" gutterBottom align="center">
          📊 Devam Durumunuz
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={isSmallScreen ? 60 : 80}
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Devamsızlık Tablosu */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom align="center">
          📋 Detaylı Devamsızlık Kayıtları
        </Typography>
        <Box sx={{ maxHeight: '40vh', overflowY: 'auto', mt: 2 }}>
          <Grid container spacing={1} justifyContent="center">
            {pastAndTodayAttendances.length > 0 ? (
              pastAndTodayAttendances.map((attendance) => (
                <Grid item xs={12} sm={6} md={4} key={attendance._id}>
                  <Card
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 1,
                      backgroundColor:
                        attendance.status === 'GELDI'
                          ? green[50]
                          : attendance.status === 'GELMEDI'
                          ? red[50]
                          : attendance.status === 'MAZERETLI'
                          ? yellow[50]
                          : 'grey.100',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      },
                      cursor: attendance.status === 'MAZERETLI' ? 'pointer' : 'default',
                    }}
                    onClick={() => handleExcuseClick(attendance)}
                  >
                    <Avatar
                      sx={{
                        bgcolor:
                          attendance.status === 'GELDI'
                            ? green[500]
                            : attendance.status === 'GELMEDI'
                            ? red[500]
                            : attendance.status === 'MAZERETLI'
                            ? yellow[700]
                            : 'grey',
                        marginRight: 1,
                        width: 30,
                        height: 30,
                      }}
                    >
                      {attendance.status === 'GELDI' ? (
                        <CheckCircleIcon fontSize="small" />
                      ) : attendance.status === 'GELMEDI' ? (
                        <CancelIcon fontSize="small" />
                      ) : attendance.status === 'MAZERETLI' ? (
                        <EmojiObjectsIcon fontSize="small" />
                      ) : (
                        <PieChartIcon fontSize="small" />
                      )}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        {new Date(attendance.date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {attendance.status}
                      </Typography>
                    </Box>
                    {attendance.status === 'GELMEDI' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ ml: 'auto' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAttendance(attendance);
                          setOpenDialog(true);
                        }}
                      >
                        Mazeret Bildir
                      </Button>
                    )}
                  </Card>
                </Grid>
              ))
            ) : (
              <Typography variant="body2" align="center" color="textSecondary">
                Hiç devamsızlık kaydı bulunamadı.
              </Typography>
            )}
          </Grid>
        </Box>
      </Box>

      {/* Mazeret Bildirimi Dialog'u */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mazeret Bildirimi</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {selectedAttendance && new Date(selectedAttendance.date).toLocaleDateString()} tarihli devamsızlık için mazeret bildirimi
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Mazeret Açıklaması"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={excuseText}
            onChange={(e) => setExcuseText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            İptal
          </Button>
          <Button onClick={handleExcuseSubmit} color="primary" variant="contained">
            Gönder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mazeret Dialog'u ekleyelim */}
      <Dialog
        open={openExcuseDialog}
        onClose={() => setOpenExcuseDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Mazeret Detayı - {selectedExcuse && new Date(selectedExcuse.date).toLocaleDateString()}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {selectedExcuse?.excuse}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExcuseDialog(false)} color="primary">
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Gelemiyorum Butonu */}
      <Box sx={{ position: 'fixed', bottom: 80, right: 20 }}>
        <Button
          variant="contained"
          color="warning"
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
                      primary={new Date(event.date).toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    />
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  Gelecek prova bulunmuyor.
                </Typography>
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

      {/* Snackbar bileşenini en alta ekleyelim */}
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

export default MyAttendance;
