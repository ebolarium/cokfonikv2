// src/components/MotivationAnalytics.js

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Divider,
  LinearProgress,
  IconButton,
  Collapse,
  CardHeader
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import apiClient from '../utils/apiClient';

const MotivationAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Toggle states for cards
  const [expandedCards, setExpandedCards] = useState({
    funMusicAnalysis: true,
    trendAnalysis: true,
    detailedBreakdown: true
  });

  // Toggle card expansion
  const toggleCard = (cardName) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

  // Load motivation analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/motivation/analytics');
        setAnalytics(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching motivation analytics:', error);
        setError('Motivasyon verileri yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Get happiness level description
  const getHappinessDescription = (level) => {
    if (level <= 2) return { text: 'Çok Düşük', color: '#f44336', icon: <SentimentVeryDissatisfiedIcon /> };
    if (level <= 4) return { text: 'Düşük', color: '#ff9800', icon: <SentimentDissatisfiedIcon /> };
    if (level <= 6) return { text: 'Orta', color: '#ffc107', icon: <SentimentNeutralIcon /> };
    if (level <= 8) return { text: 'Yüksek', color: '#8bc34a', icon: <SentimentSatisfiedIcon /> };
    return { text: 'Çok Yüksek', color: '#4caf50', icon: <SentimentVerySatisfiedIcon /> };
  };

  // Prepare chart data
  const getFunMusicChartData = () => {
    if (!analytics) return [];
    return [
      { name: 'Eğlence', value: analytics.funMusicRatio.fun, color: '#2196f3' },
      { name: 'Müzik', value: analytics.funMusicRatio.music, color: '#9c27b0' }
    ];
  };

  // Custom pie chart label
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="14"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Prepare trend chart data
  const getTrendChartData = () => {
    if (!analytics || !analytics.trends) return [];
    
    return analytics.trends.map(day => ({
      date: formatDateForChart(day.date),
      fullDate: day.date,
      'Mutluluk': day.averageHappiness,
      'Eğlence': day.averageFun,
      'Müzik': day.averageMusic,
      'Katılımcı': day.participantCount
    }));
  };

  // Format date for chart display (Turkish format)
  const formatDateForChart = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month}`;
  };

  // Custom tooltip for trend chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.95)' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Tarih: {formatDateForChart(data.fullDate)}
          </Typography>
          <Typography variant="body2" sx={{ color: '#4caf50' }}>
            • Mutluluk: {data.Mutluluk}/10
          </Typography>
          <Typography variant="body2" sx={{ color: '#2196f3' }}>
            • Eğlence: {data.Eğlence}/10
          </Typography>
          <Typography variant="body2" sx={{ color: '#9c27b0' }}>
            • Müzik: {data.Müzik}/10
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
            Katılımcı: {data.Katılımcı} kişi
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2
      }}>
        <CircularProgress size={50} />
        <Typography variant="h6" color="textSecondary">
          Motivasyon verileri yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!analytics || analytics.participantCount === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
        <SentimentNeutralIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
        <Typography variant="h5" color="textSecondary" gutterBottom>
          Henüz Motivasyon Verisi Yok
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Koro üyeleri motivasyon seviyelerini ayarladıkça veriler burada görünecek.
        </Typography>
      </Paper>
    );
  }

  const happinessInfo = getHappinessDescription(analytics.averages.overallHappiness);
  const chartData = getFunMusicChartData();
  const trendData = getTrendChartData();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        🎭 Koro Motivasyon Analizi
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Tarih: {analytics.date} • Son güncelleme: Az önce
      </Typography>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Participation */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <PeopleIcon sx={{ fontSize: 50, color: '#2196f3', mb: 2 }} />
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#2196f3' }}>
                {analytics.participantCount}
              </Typography>
              <Typography variant="h6" color="textSecondary">
                Katılımcı
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Bugün motivasyon seviyesi paylaşan üye sayısı
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Overall Happiness */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ mb: 2 }}>
                {React.cloneElement(happinessInfo.icon, { 
                  sx: { fontSize: 50, color: happinessInfo.color } 
                })}
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: happinessInfo.color }}>
                {analytics.averages.overallHappiness.toFixed(1)}
              </Typography>
              <Typography variant="h6" color="textSecondary">
                Ortalama Mutluluk
              </Typography>
              <Chip 
                label={happinessInfo.text}
                sx={{ 
                  mt: 1,
                  backgroundColor: happinessInfo.color + '20',
                  color: happinessInfo.color,
                  fontWeight: 600
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Trend Indicator */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <TrendingUpIcon sx={{ fontSize: 50, color: '#4caf50', mb: 2 }} />
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#4caf50' }}>
                +{((analytics.averages.overallHappiness / 10) * 100).toFixed(0)}%
              </Typography>
              <Typography variant="h6" color="textSecondary">
                Motivasyon Skoru
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                10 üzerinden değerlendirme yüzdesi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fun vs Music Analysis */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="🎯 Motivasyon Kaynağı Dağılımı"
              action={
                <IconButton
                  onClick={() => toggleCard('funMusicAnalysis')}
                  aria-label="toggle"
                >
                  {expandedCards.funMusicAnalysis ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              }
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
            />
            <Collapse in={expandedCards.funMusicAnalysis} timeout="auto" unmountOnExit>
              <CardContent sx={{ pt: 0 }}>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Collapse>
          </Card>
        </Grid>

        {/* Detailed Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="📊 Detaylı Analiz"
              action={
                <IconButton
                  onClick={() => toggleCard('detailedBreakdown')}
                  aria-label="toggle"
                >
                  {expandedCards.detailedBreakdown ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              }
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
            />
            <Collapse in={expandedCards.detailedBreakdown} timeout="auto" unmountOnExit>
              <CardContent sx={{ pt: 0 }}>
                {/* Fun Analysis */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SportsEsportsIcon sx={{ color: '#2196f3', mr: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Eğlence Motivasyonu
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={analytics.funMusicRatio.fun * 10} 
                      sx={{ 
                        flexGrow: 1, 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: '#e3f2fd',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#2196f3'
                        }
                      }} 
                    />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#2196f3' }}>
                      {analytics.averages.motivationFun.toFixed(1)}/10
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Music Analysis */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MusicNoteIcon sx={{ color: '#9c27b0', mr: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Müzik Motivasyonu
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={analytics.funMusicRatio.music * 10} 
                      sx={{ 
                        flexGrow: 1, 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: '#f3e5f5',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#9c27b0'
                        }
                      }} 
                    />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#9c27b0' }}>
                      {analytics.averages.motivationMusic.toFixed(1)}/10
                    </Typography>
                  </Box>
                </Box>

                {/* Summary */}
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Özetle:</strong> Koro üyeleri {analytics.funMusicRatio.fun}% eğlence, 
                    {analytics.funMusicRatio.music}% müzik odaklı motivasyona sahip. 
                    {analytics.funMusicRatio.fun > analytics.funMusicRatio.music 
                      ? ' Sosyal eğlence ön planda.' 
                      : analytics.funMusicRatio.music > analytics.funMusicRatio.fun 
                      ? ' Müzikal tutku ön planda.' 
                      : ' Dengeli bir motivasyon dağılımı var.'
                    }
                  </Typography>
                </Paper>
              </CardContent>
            </Collapse>
          </Card>
        </Grid>
      </Grid>

      {/* Trend Analysis */}
      {trendData.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="📈 30 Günlük Motivasyon Trendi"
                action={
                  <IconButton
                    onClick={() => toggleCard('trendAnalysis')}
                    aria-label="toggle"
                  >
                    {expandedCards.trendAnalysis ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                }
                titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              />
              <Collapse in={expandedCards.trendAnalysis} timeout="auto" unmountOnExit>
                <CardContent sx={{ pt: 0 }}>
                  <Box sx={{ height: 400, width: '100%' }}>
                    <ResponsiveContainer>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickLine={{ stroke: '#ccc' }}
                        />
                        <YAxis 
                          domain={[0, 10]}
                          tick={{ fontSize: 12 }}
                          tickLine={{ stroke: '#ccc' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="Mutluluk" 
                          stroke="#4caf50" 
                          strokeWidth={3}
                          dot={{ fill: '#4caf50', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#4caf50', strokeWidth: 2, fill: '#fff' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Eğlence" 
                          stroke="#2196f3" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#2196f3', strokeWidth: 2, r: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Müzik" 
                          stroke="#9c27b0" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#9c27b0', strokeWidth: 2, r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                  
                  <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>💡 Trend Analizi:</strong> Son {trendData.length} gün içerisinde motivasyon değişimleri gösteriliyor. 
                      Çizgi grafik genel mutluluk seviyesini, kesikli çizgiler ise eğlence ve müzik motivasyonlarını temsil ediyor.
                    </Typography>
                  </Box>
                </CardContent>
              </Collapse>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Additional Info */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          💡 <strong>Not:</strong> Bu veriler anonim olarak toplanmıştır. 
          Bireysel kullanıcı bilgileri gösterilmez, sadece genel koro motivasyonu analiz edilir.
        </Typography>
      </Alert>
    </Box>
  );
};

export default MotivationAnalytics;
