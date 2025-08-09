import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Select, 
  MenuItem, 
  FormControl,
  InputLabel,
  Slider,
  Container,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  PictureAsPdf,
  MusicNote,
  Loop
} from '@mui/icons-material';

const MusicPlayer = () => {
  const [pieces, setPieces] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const audioRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const [hasRecordedListen, setHasRecordedListen] = useState(false);
  
  // Part name normalization
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

  // Parçaları getir
  const fetchPieces = async () => {
    setLoading(true);
    try {
      //console.log('Parçalar yükleniyor...');
      
      // Önce senkronizasyon yap
      const syncResponse = await fetch(`${process.env.REACT_APP_API_URL}/pieces/sync`, {
        method: 'POST'
      });
      
      if (!syncResponse.ok) {
        throw new Error('Senkronizasyon sırasında hata oluştu');
      }
      
      //console.log('Senkronizasyon tamamlandı, parçalar getiriliyor...');

      // Sonra parçaları getir
      const response = await fetch(`${process.env.REACT_APP_API_URL}/pieces`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Parçalar yüklenirken hata oluştu');
      }
      
      const data = await response.json();
      //console.log(`${data.length} parça alındı, filtreleniyor...`);
      
      // Kullanıcının partına göre filtrele
      const filteredPieces = data.filter(piece => {
        // Kullanıcının kendi partı veya genel parça varsa göster
        const hasUserPart = piece.audioUrls[userPart];
        const hasGeneralPart = piece.audioUrls.general;
        return hasUserPart || hasGeneralPart;
      });

      //console.log(`${filteredPieces.length} parça kullanıcı için filtrelendi`);
      setPieces(filteredPieces);
    } catch (error) {
      console.error('Parçalar yüklenirken detaylı hata:', error);
      alert('Parçalar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      setPieces([]); // Hata durumunda parça listesini temizle
    } finally {
      setLoading(false);
    }
  };

  // Component mount olduğunda ve userPart değiştiğinde parçaları getir
  useEffect(() => {
    fetchPieces();
  }, [userPart]);

  // Parça seçildiğinde
  const handlePieceSelect = (event) => {
    const piece = pieces.find(p => p._id === event.target.value);
    setSelectedPiece(piece);
    if (audioRef.current && piece) {
      try {
        // Önce kullanıcının kendi partisindeki ses dosyasını kontrol et
        const audioUrl = piece.audioUrls[userPart] || piece.audioUrls.general;
        
        if (!audioUrl) {
          throw new Error('Bu parça için ses dosyası bulunamadı');
        }

        audioRef.current.src = audioUrl;
        audioRef.current.load();
        setIsPlaying(false);
        setCurrentTime(0);
      } catch (error) {
        console.error('Ses dosyası yüklenirken hata:', error);
        alert(error.message);
      }
    }
  };

  // Zaman güncellemesi
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setHasRecordedListen(false);
    }
  };

  const handlePlay = async () => {
    if (!audioRef.current || !selectedPiece) return;

    // Check if we have a valid source
    if (!audioRef.current.src) {
      console.error('No audio source available');
      return;
    }

    try {
      // Her play'e basıldığında dinleme kaydı ekle
      await addListeningRecord();
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error('Çalma hatası:', error);
            setIsPlaying(false);
          });
      }
    } catch (error) {
      console.error('Dinleme kaydı eklenirken hata:', error);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSliderChange = (event, newValue) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newValue;
      setCurrentTime(newValue);
    }
  };

  // Loop düğmesi işleyicisi
  const handleLoopToggle = () => {
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
      setIsLooping(!isLooping);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const openPDF = () => {
    if (selectedPiece?.pdfUrls?.general) {
      window.open(selectedPiece.pdfUrls.general);
    }
  };

  // Dinleme kaydı ekle
  const addListeningRecord = async () => {
    if (!selectedPiece || !user) {
      console.error('Parça veya kullanıcı bilgisi eksik');
      return;
    }

    try {
      //console.log('Dinleme kaydı gönderiliyor:', {
       // pieceId: selectedPiece._id,
       // userId: user._id,
       // part: userPart
      //});

      const response = await fetch(`${process.env.REACT_APP_API_URL}/pieces/${selectedPiece._id}/listen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          part: userPart
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Sunucu yanıt detayları:', data);
        throw new Error(data.message || 'Dinleme kaydı eklenemedi');
      }

      //console.log('Dinleme kaydı başarıyla eklendi:', data);

      // Dinleme kaydı eklendiğinde event yayınla
      const event = new CustomEvent('listeningRecordAdded');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Dinleme kaydı eklenirken hata:', error);
      throw error;
    }
  };

  const getAvailableParts = (piece) => {
    if (!piece?.audioUrls) return [];
    return Object.entries(piece.audioUrls)
      .filter(([_, url]) => url)
      .map(([part]) => {
        const partNameMap = {
          'bass': 'Bas',
          'tenor': 'Tenor',
          'alto': 'Alto',
          'soprano': 'Soprano',
          'general': 'Genel'
        };
        return partNameMap[part] || part;
      });
  };

  // Parça değiştiğinde dinleme kaydını sıfırla
  useEffect(() => {
    setHasRecordedListen(false);
  }, [selectedPiece]);

  // Parça değiştiğinde loop durumunu güncelle
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [selectedPiece, isLooping]);

  return (
    <Container maxWidth="xs" sx={{ py: 2 }}>
      <Card 
        elevation={0} 
        sx={{ 
          backgroundColor: 'transparent',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: 3
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2,
              color: '#1a1a1a',
              fontWeight: 500,
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            <MusicNote sx={{ fontSize: 20 }} />
            Müzik Çalar
          </Typography>

          <FormControl 
            fullWidth 
            size="small" 
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                }
              }
            }}
          >
            <InputLabel id="piece-select-label">Parça Seçiniz</InputLabel>
            <Select
              labelId="piece-select-label"
              value={selectedPiece?._id || ''}
              onChange={handlePieceSelect}
              label="Parça Seçiniz"
              disabled={loading}
            >
              {pieces.map((piece) => (
                <MenuItem key={piece._id} value={piece._id}>
                  {piece.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} sx={{ color: '#1a1a1a' }} />
            </Box>
          )}

          <Box sx={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 2,
            p: 2
          }}>
            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => setDuration(audioRef.current.duration)}
              onEnded={() => {
                if (!isLooping) {
                  setIsPlaying(false);
                } else {
                  // Loop aktifse ve müzik bittiyse kullanıcı dinleme kaydını tekrar ekleyelim
                  addListeningRecord().catch(error => 
                    console.error('Loop sırasında dinleme kaydı eklenirken hata:', error)
                  );
                }
              }}
            />

            <Box sx={{ mb: 1 }}>
              <Slider
                value={currentTime}
                max={duration}
                onChange={handleSliderChange}
                aria-label="time-indicator"
                disabled={!selectedPiece}
                sx={{
                  color: '#1a1a1a',
                  height: 2,
                  padding: '13px 0',
                  '& .MuiSlider-thumb': {
                    width: 8,
                    height: 8,
                    transition: '0.2s',
                    '&:hover': {
                      boxShadow: '0 0 0 6px rgba(0, 0, 0, 0.08)',
                    },
                    '&.Mui-active': {
                      boxShadow: '0 0 0 8px rgba(0, 0, 0, 0.12)',
                    }
                  },
                  '& .MuiSlider-rail': {
                    opacity: 0.2,
                  }
                }}
              />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                px: 0.5
              }}>
                <Typography variant="caption" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                  {formatTime(currentTime)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                  {formatTime(duration)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              gap: 1,
              mb: selectedPiece?.pdfUrls?.general ? 2 : 0
            }}>
              <IconButton 
                onClick={isPlaying ? handlePause : handlePlay}
                disabled={!selectedPiece}
                sx={{ 
                  color: '#1a1a1a',
                  '&:hover': { 
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                  '&:disabled': {
                    color: 'rgba(0, 0, 0, 0.26)'
                  },
                  padding: 1
                }}
              >
                {isPlaying ? 
                  <Pause sx={{ fontSize: 28 }} /> : 
                  <PlayArrow sx={{ fontSize: 28 }} />
                }
              </IconButton>
              
              <IconButton 
                onClick={handleStop}
                disabled={!selectedPiece}
                sx={{ 
                  color: '#1a1a1a',
                  '&:hover': { 
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                  '&:disabled': {
                    color: 'rgba(0, 0, 0, 0.26)'
                  },
                  padding: 1
                }}
              >
                <Stop sx={{ fontSize: 28 }} />
              </IconButton>

              {/* Loop Düğmesi */}
              <IconButton 
                onClick={handleLoopToggle}
                disabled={!selectedPiece}
                sx={{ 
                  color: isLooping ? '#4caf50' : '#1a1a1a',  // Loop aktifse yeşil, değilse siyah
                  '&:hover': { 
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                  '&:disabled': {
                    color: 'rgba(0, 0, 0, 0.26)'
                  },
                  padding: 1
                }}
              >
                <Loop sx={{ fontSize: 28 }} />
              </IconButton>

              {selectedPiece?.pdfUrls?.general && (
                <IconButton
                  onClick={openPDF}
                  sx={{ 
                    color: '#1a1a1a',
                    '&:hover': { 
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                    padding: 1
                  }}
                >
                  <PictureAsPdf sx={{ fontSize: 28 }} />
                </IconButton>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default MusicPlayer;