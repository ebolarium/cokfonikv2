// src/components/Motivasyonum.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Slider,
  Paper,
  CircularProgress,
  Fade
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import apiClient from '../utils/apiClient';

const Motivasyonum = () => {
  const navigate = useNavigate();
  
  // State for motivation values
  const [overallHappiness, setOverallHappiness] = useState(5);
  const [motivationFun, setMotivationFun] = useState(5);
  const [motivationMusic, setMotivationMusic] = useState(5);
  
  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);

  // Get happiness color based on value
  const getHappinessColor = (value) => {
    if (value <= 3) return '#f44336'; // Red
    if (value <= 6) return '#ff9800'; // Orange
    return '#4caf50'; // Green
  };

  // Load current motivation on component mount
  useEffect(() => {
    const loadCurrentMotivation = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/motivation/current');
        
        if (response.hasData && response.motivation) {
          const { overallHappiness, motivationFun, motivationMusic } = response.motivation;
          setOverallHappiness(overallHappiness);
          setMotivationFun(motivationFun);
          setMotivationMusic(motivationMusic);
        }
        // If no data, keep defaults (5/5/5)
        
      } catch (error) {
        // If 404 or no data, keep defaults
        console.log('No previous motivation data found, using defaults');
      } finally {
        setIsLoading(false);
        setInitialLoad(false);
      }
    };

    loadCurrentMotivation();
  }, []);

  // Auto-save function with debouncing
  const saveMotivation = useCallback(async (happiness, fun, music) => {
    // Don't save during initial load
    if (initialLoad) {
      return;
    }
    
    // Validate values before sending
    const validHappiness = Math.round(Math.max(1, Math.min(10, happiness)));
    const validFun = Math.round(Math.max(0, Math.min(10, fun)));
    const validMusic = Math.round(Math.max(0, Math.min(10, music)));
    
    setIsSaving(true);
    
    // Ensure Fun + Music = 10 (this should already be guaranteed by our handlers)
    if (validFun + validMusic !== 10) {
      setIsSaving(false);
      return;
    }
    
    try {
      await apiClient.post('/motivation', {
        overallHappiness: validHappiness,
        motivationFun: validFun,
        motivationMusic: validMusic
      });
      
    } catch (error) {
      console.error('Motivasyon kaydedilirken hata:', error);
      // Error handling can be added here if needed
      // For now, just log the error silently
    } finally {
      setIsSaving(false);
      
      // Hide spinner after save completes
      setTimeout(() => {
        setShowSpinner(false);
      }, 100); // Small delay to ensure spinner is visible for at least 1 second
    }
  }, [initialLoad]);

  // Debounced auto-save effect
  useEffect(() => {
    // Skip saving if we're currently saving or if it's the initial load
    if (isSaving || initialLoad) return;
    
    // Show spinner immediately when user makes changes
    setShowSpinner(true);
    
    const timeoutId = setTimeout(() => {
      saveMotivation(overallHappiness, motivationFun, motivationMusic);
    }, 1000); // Set to 1 second as requested

    return () => {
      clearTimeout(timeoutId);
      // If component unmounts or effect re-runs, hide spinner
      if (!isSaving) {
        setTimeout(() => setShowSpinner(false), 100);
      }
    };
  }, [overallHappiness, motivationFun, motivationMusic, saveMotivation, initialLoad, isSaving]);

  // Handle Fun slider change (auto-adjust Music)
  const handleFunChange = (event, newValue) => {
    const validFun = Math.round(Math.max(0, Math.min(10, newValue)));
    const validMusic = 10 - validFun;
    
    setMotivationFun(validFun);
    setMotivationMusic(validMusic);
  };

  // Handle Music slider change (auto-adjust Fun)
  const handleMusicChange = (event, newValue) => {
    const validMusic = Math.round(Math.max(0, Math.min(10, newValue)));
    const validFun = 10 - validMusic;
    
    setMotivationMusic(validMusic);
    setMotivationFun(validFun);
  };

  // Handle overall happiness change
  const handleHappinessChange = (event, newValue) => {
    const validHappiness = Math.round(Math.max(1, Math.min(10, newValue)));
    setOverallHappiness(validHappiness);
  };

  // Custom slider component with gradient
  const CustomSlider = ({ value, onChange, color, gradient, ...props }) => (
    <Slider
      value={value}
      onChange={onChange}
      min={0}
      max={10}
      step={1}
      valueLabelDisplay="on"
      sx={{
        height: 12,
        '& .MuiSlider-track': {
          background: gradient || color,
          border: 'none',
          height: 12,
          borderRadius: 6,
        },
        '& .MuiSlider-rail': {
          background: '#e0e0e0',
          height: 12,
          borderRadius: 6,
        },
        '& .MuiSlider-thumb': {
          height: 28,
          width: 28,
          backgroundColor: color,
          border: '3px solid white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          '&:focus, &:hover, &.Mui-active': {
            boxShadow: `0 0 0 8px rgba(${color.replace('#', '')}, 0.16)`,
          },
        },
        '& .MuiSlider-valueLabel': {
          backgroundColor: color,
          color: 'white',
          fontWeight: 600,
          fontSize: '0.875rem',
        },
      }}
      {...props}
    />
  );

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#f5f5f5',
      pb: 2
    }}>
      {/* Header */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          bgcolor: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <IconButton 
          onClick={() => navigate('/dashboard')} 
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Motivasyonum
        </Typography>
        

      </Paper>

      {/* Saving Spinner Overlay */}
      <Fade in={showSpinner} timeout={200}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: showSpinner ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <CircularProgress size={50} sx={{ color: '#ff9800' }} />
        </Box>
      </Fade>

      {/* Content */}
      <Box sx={{ p: 3, maxWidth: 480, mx: 'auto' }}>
        
        {isLoading ? (
          // Loading State
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 2
          }}>
            <CircularProgress size={40} />
            <Typography variant="body1" color="textSecondary">
              Motivasyon verileri yükleniyor...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Motivation Content */}
        
        {/* Overall Happiness Section */}
        <Card sx={{ mb: 3, overflow: 'visible' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              gap: 2
            }}>
              <SentimentSatisfiedAltIcon 
                sx={{ 
                  fontSize: 32, 
                  color: getHappinessColor(overallHappiness) 
                }} 
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Genel Mutluluğum
              </Typography>
            </Box>
            
            <Box sx={{ px: 1, pb: 2 }}>
              <CustomSlider
                value={overallHappiness}
                onChange={handleHappinessChange}
                color={getHappinessColor(overallHappiness)}
                gradient={`linear-gradient(90deg, #f44336 0%, #ff9800 50%, #4caf50 100%)`}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Motivation Balance Section */}
        <Card sx={{ mb: 4, overflow: 'visible' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 3,
                textAlign: 'center'
              }}
            >
              🎯 Motivasyon Kaynağım
            </Typography>
            
            {/* Fun Slider */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                gap: 2
              }}>
                <SportsEsportsIcon sx={{ fontSize: 28, color: '#2196f3' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  Eğlence, Sosyalleşme, Arkadaşlık
                </Typography>
              </Box>
              
              <Box sx={{ px: 1, pb: 1 }}>
                <CustomSlider
                  value={motivationFun}
                  onChange={handleFunChange}
                  color="#2196f3"
                  gradient="linear-gradient(90deg, #e3f2fd 0%, #2196f3 100%)"
                />
              </Box>
            </Box>

            {/* Music Slider */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                gap: 2
              }}>
                <MusicNoteIcon sx={{ fontSize: 28, color: '#9c27b0' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  Müzik, Nefes, Disiplin
                </Typography>
              </Box>
              
              <Box sx={{ px: 1, pb: 1 }}>
                <CustomSlider
                  value={motivationMusic}
                  onChange={handleMusicChange}
                  color="#9c27b0"
                  gradient="linear-gradient(90deg, #f3e5f5 0%, #9c27b0 100%)"
                />
              </Box>
            </Box>


          </CardContent>
        </Card>
          </>
        )}
      </Box>




    </Box>
  );
};

export default Motivasyonum;
