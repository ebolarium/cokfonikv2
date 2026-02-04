import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Slider,
  CircularProgress
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import HearingIcon from '@mui/icons-material/Hearing';
import PaymentsIcon from '@mui/icons-material/Payments';
import { PlayArrow, Pause, Loop, Settings } from '@mui/icons-material';
import apiClient from '../utils/apiClient';

const Dashboard2026 = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [attendancePercentage, setAttendancePercentage] = useState(null);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [pieces, setPieces] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadingPieces, setLoadingPieces] = useState(false);
  const audioRef = useRef(null);

  const normalizePartName = (part) => {
    const partMap = {
      'Bas': 'bass',
      'Tenor': 'tenor',
      'Alto': 'alto',
      'Soprano': 'soprano',
      'Genel': 'general'
    };
    return partMap[part] || 'general';
  };

  const userPart = normalizePartName(user?.part);

  useEffect(() => {
    const fetchAttendancePercentage = async () => {
      if (!user?._id) return;
      try {
        const [attendances, events] = await Promise.all([
          apiClient.get(`/attendance/${user._id}`),
          apiClient.get('/events')
        ]);

        const provaAttendances = attendances.filter(a =>
          events.some(e =>
            e._id === a.event?._id &&
            e.type === 'Prova'
          ) &&
          a.status !== 'BEKLEMEDE'
        );

        const cameCount = provaAttendances.filter(a => a.status === 'GELDI').length;
        const percentage = provaAttendances.length > 0
          ? Math.round((cameCount / provaAttendances.length) * 100)
          : 0;

        setAttendancePercentage(percentage);
      } catch (error) {
        console.error('Devam yÃ¼zdesi hesaplanÄ±rken hata:', error);
      }
    };

    const fetchUnpaidCount = async () => {
      if (!user?._id) return;
      try {
        const data = await apiClient.get(`/fees/check-unpaid/${user._id}`);
        setUnpaidCount(data?.unpaidCount || 0);
      } catch (error) {
        console.error('Aidat sayÄ±sÄ± alÄ±nÄ±rken hata:', error);
      }
    };

    fetchAttendancePercentage();
    fetchUnpaidCount();
  }, [user?._id]);

  useEffect(() => {
    const fetchPieces = async () => {
      setLoadingPieces(true);
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/pieces/sync`, { method: 'POST' });
        const response = await fetch(`${process.env.REACT_APP_API_URL}/pieces`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Parçalar yüklenirken hata oluştu');
        }
        const data = await response.json();
        const filteredPieces = data.filter(piece => {
          const hasUserPart = piece.audioUrls?.[userPart];
          const hasGeneralPart = piece.audioUrls?.general;
          return hasUserPart || hasGeneralPart;
        });
        setPieces(filteredPieces);
      } catch (error) {
        console.error('Parçalar yüklenirken hata:', error);
        setPieces([]);
      } finally {
        setLoadingPieces(false);
      }
    };

    fetchPieces();
  }, [userPart]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  const dashboardItems = [
    {
      title: 'Nota/Midi',
      link: 'https://drive.google.com/drive/folders/1paeqvHKubfoUEwh9v-4zjL64E0eBHf5r?usp=sharing',
      icon: (
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src="/32px-Google_Drive_icon_(2020).png"
            alt="Google Drive"
            style={{ width: 24, height: 24 }}
          />
        </span>
      ),
      bgColor: '#e6e6ff',
    },
    {
      title: 'Duyurular',
      path: '/announcements',
      icon: <NotificationsIcon style={{ fontSize: 40 }} />,
      bgColor: '#fff8dc',
    },
    {
      title: 'Nota Bulmaca',
      path: '/game',
      icon: <MusicNoteIcon style={{ fontSize: 40 }} />,
      bgColor: '#e6f7ff',
    },
    {
      title: 'Ses Bulmaca',
      path: '/game2',
      icon: <HearingIcon style={{ fontSize: 40 }} />,
      bgColor: '#a6a6ff',
    },
  ];

  const filteredDashboardItems = user.role === 'Rookie'
    ? dashboardItems.filter(item => item.title !== 'Nota/Midi')
    : dashboardItems;

  if (user.role === 'Yoklama') {
    filteredDashboardItems.push({
      title: 'Yoklama YÃ¶netimi',
      path: '/attendance-management',
      icon: <AssignmentTurnedInIcon style={{ fontSize: 40 }} />,
      bgColor: '#f0f8ff',
    });
  }

  if (user.role === 'Aidat') {
    filteredDashboardItems.push({
      title: 'Aidat YÃ¶netimi',
      path: '/fee-management',
      icon: <PaymentsIcon style={{ fontSize: 40 }} />,
      bgColor: '#e6ffe6',
    });
  }

  if (user.role === 'Rookie') {
    filteredDashboardItems.unshift({
      title: 'HoÅŸ Geldin! ğŸµ',
      path: '/announcements',
      icon: <span style={{ fontSize: 40 }}>ğŸ¼</span>,
      bgColor: '#fff3e0',
    });
  }

  const roundCardTitles = new Set([
    'Nota/Midi',
    'Duyurular',
    'Nota Bulmaca',
    'Ses Bulmaca'
  ]);

  const roundCards = filteredDashboardItems.filter(item => roundCardTitles.has(item.title));
  const normalCards = filteredDashboardItems.filter(item => !roundCardTitles.has(item.title));

  const getAttendanceColor = (percentage) => {
    if (percentage === null) return '#94a3b8';
    if (percentage >= 70) return '#22c55e';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const handlePieceSelect = (event) => {
    const piece = pieces.find(p => p._id === event.target.value);
    setSelectedPiece(piece || null);
    if (audioRef.current && piece) {
      const audioUrl = piece.audioUrls?.[userPart] || piece.audioUrls?.general;
      if (audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        setIsPlaying(false);
        setCurrentTime(0);
      }
    }
  };

  const handlePlayPause = async () => {
    if (!audioRef.current || !selectedPiece) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await addListeningRecord();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      setIsPlaying(true);
    } catch (error) {
      console.error('Çalma hatası:', error);
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSliderChange = (event, newValue) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newValue;
      setCurrentTime(newValue);
    }
  };

  const handleLoopToggle = () => {
    setIsLooping(prev => !prev);
  };

  const addListeningRecord = async () => {
    if (!selectedPiece || !user) {
      return;
    }

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/pieces/${selectedPiece._id}/listen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          part: userPart
        })
      });
    } catch (error) {
      console.error('Dinleme kaydı eklenirken hata:', error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4 },
        pb: { xs: '96px', sm: '110px' },
        background: '#1D1B26',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Manrope, sans-serif',
        '@keyframes floatIn': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      <Box sx={{ position: 'relative', zIndex: 1, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant="h4"
            sx={{
              color: '#ffffff',
              fontWeight: 700,
              fontFamily: 'Caveat, cursive',
              letterSpacing: '-0.01em'
            }}
          >
            Merhaba, {user?.name || 'Korist'}
          </Typography>
          <IconButton
            size="small"
            sx={{ color: '#ffffff', opacity: 0.8 }}
            onClick={() => navigate('/profile')}
          >
            <Settings fontSize="small" />
          </IconButton>
        </Box>


        <Grid container spacing={2} sx={{ mt: 1.5 }}>

          <Grid item xs={12} sm={6} md={6}>
            <Card
              onClick={() => navigate('/my-attendance')}
              sx={{
                borderRadius: 3,
                border: '1px solid rgba(0,0,0,0.05)',
                background: getAttendanceColor(attendancePercentage),
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.25)',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <AssignmentTurnedInIcon sx={{ color: '#ffffff', fontSize: 28 }} />
                  <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.95rem' }}>
                    Devam Durumu
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: 'Sora, sans-serif',
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    {attendancePercentage === null ? '--' : `%${attendancePercentage}`}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffffff' }}>
                    son provalar
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <Card
              onClick={() => navigate('/my-fees')}
              sx={{
                borderRadius: 3,
                border: '1px solid rgba(0,0,0,0.05)',
                background: '#2B2B45',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.25)',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <AccountBalanceIcon sx={{ color: '#ffffff', fontSize: 28 }} />
                  <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.95rem' }}>
                    Aidat
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: 'Sora, sans-serif',
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    {unpaidCount}
                  </Typography>
                  <Chip
                    size="small"
                    label={unpaidCount > 0 ? 'kontrol et' : 'temiz'}
                    sx={{
                      backgroundColor: unpaidCount > 0 ? '#ef4444' : '#16a34a',
                      color: '#ffffff',
                      fontWeight: 600
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <Card
              sx={{
                borderRadius: 3,
                border: '1px solid rgba(0,0,0,0.05)',
                background: '#2B2B45',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.25)',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <PlayArrow sx={{ color: '#ffffff', fontSize: 40 }} />
                  <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem' }}>
                    Dinle
                  </Typography>
                </Box>

                <FormControl
                  fullWidth
                  size="small"
                  sx={{
                    mb: 1.5,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.6)' },
                      '&.Mui-focused fieldset': { borderColor: '#ffffff' },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.8)'
                    }
                  }}
                >
                  <InputLabel id="mini-piece-select-label">Parça Seç</InputLabel>
                  <Select
                    labelId="mini-piece-select-label"
                    value={selectedPiece?._id || ''}
                    onChange={handlePieceSelect}
                    label="Parça Seç"
                    disabled={loadingPieces}
                    MenuProps={{
                      PaperProps: { sx: { maxHeight: 300 } }
                    }}
                  >
                    {pieces.map((piece) => (
                      <MenuItem key={piece._id} value={piece._id}>
                        {piece.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {loadingPieces && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                    <CircularProgress size={20} sx={{ color: '#ffffff' }} />
                  </Box>
                )}

                <audio
                  ref={audioRef}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                  onEnded={() => setIsPlaying(false)}
                />

                <Slider
                  value={currentTime}
                  max={duration}
                  onChange={handleSliderChange}
                  disabled={!selectedPiece}
                  sx={{
                    color: '#ffffff',
                    height: 2,
                    mb: 1,
                    '& .MuiSlider-thumb': { width: 8, height: 8 },
                    '& .MuiSlider-rail': { opacity: 0.3 },
                  }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                  <IconButton
                    onClick={handlePlayPause}
                    disabled={!selectedPiece}
                    sx={{
                      color: '#ffffff',
                      '&:disabled': { color: 'rgba(255,255,255,0.4)' }
                    }}
                  >
                    {isPlaying ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  <IconButton
                    onClick={handleLoopToggle}
                    disabled={!selectedPiece}
                    sx={{
                      color: isLooping ? '#22c55e' : '#ffffff',
                      '&:disabled': { color: 'rgba(255,255,255,0.4)' }
                    }}
                  >
                    <Loop />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      <Grid container spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
        {roundCards.map((item, index) => (
          <Grid item xs={6} sm={4} key={item.title}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Card
                onClick={() => item.path ? navigate(item.path) : window.open(item.link, '_blank')}
                sx={{
                  width: { xs: 140, sm: 150 },
                  height: { xs: 140, sm: 150 },
                  borderRadius: '50%',
                  backgroundColor: '#2B2B45',
                  border: '1px solid rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                  },
                  animation: 'floatIn 0.4s ease forwards',
                  animationDelay: `${index * 40}ms`,
                  opacity: 0,
                }}
              >
                <CardContent
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#2B2B45',
                      color: '#ffffff',
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
                      '& svg': { color: '#ffffff' },
                      '& img': {
                        filter: 'none'
                      }
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: '#ffffff',
                      fontFamily: 'Sora, sans-serif',
                    }}
                  >
                    {item.title}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        ))}

        {normalCards.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={item.title}>
            <Card
              onClick={() => item.path ? navigate(item.path) : window.open(item.link, '_blank')}
              sx={{
                backgroundColor: '#ffffff',
                border: '1px solid rgba(0,0,0,0.05)',
                borderRadius: 4,
                cursor: 'pointer',
                height: '120px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                },
                animation: 'floatIn 0.4s ease forwards',
                animationDelay: `${(roundCards.length + index) * 40}ms`,
                opacity: 0,
              }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%',
                  p: '16px !important',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: item.bgColor,
                    color: '#0f172a',
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)'
                  }}
                >
                  {item.icon}
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#2c3e50',
                    fontFamily: 'Sora, sans-serif',
                  }}
                >
                  {item.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard2026;







