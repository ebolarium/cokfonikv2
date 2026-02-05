import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import apiClient from '../utils/apiClient';

const MyFees = () => {
  const [fees, setFees] = useState([]);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const user = JSON.parse(localStorage.getItem('user')); // Kullanıcı bilgisi
  const isNewTheme = (localStorage.getItem('uiTheme') || 'old') === 'new';

  // Ay isminin ilk harfini büyük, geri kalanını küçük yapan fonksiyon
  const capitalizeMonth = (month) => {
    if (!month) return '';
    return month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
  };

  // Türkçe ay isimlerini sayısal değerlere çeviren fonksiyon
  const getMonthNumber = (monthName) => {
    const months = {
      'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'haziran': 5,
      'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11
    };
    return months[monthName.toLowerCase()] || 0;
  };

  useEffect(() => {
    if (!user || !user._id) {
      alert('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
      window.location.href = '/';
      return;
    }

    const fetchMyFees = async () => {
      try {
        const data = await apiClient.get(`/fees/${user._id}`); // Kullanıcıya özel endpoint
        
        // Tarihe göre sırala (en yeni en üstte)
        const sortedFees = [...data].sort((a, b) => {
          // Önce yıla göre karşılaştır
          if (a.year !== b.year) {
            return b.year - a.year; // Azalan sıralama (en yüksek yıl önce)
          }
          // Yıllar aynıysa, aya göre karşılaştır
          return getMonthNumber(b.month) - getMonthNumber(a.month); // Azalan sıralama (en yüksek ay önce)
        });
        
        setFees(sortedFees);
        
        // Ödenmemiş aidat sayısını hesapla
        const unpaidFees = data.filter(fee => !fee.isPaid);
        setUnpaidCount(unpaidFees.length);

        // Event ile UserDashboard'a bildir
        window.dispatchEvent(new CustomEvent('updateUnpaidCount', { 
          detail: { count: unpaidFees.length } 
        }));
      } catch (error) {
        console.error('Aidat verileri yüklenemedi:', error);
      }
    };

    fetchMyFees();
  }, [user]);

  if (isNewTheme) {
    return (
      <Box p={2} sx={{ backgroundColor: '#1D1B26', minHeight: '100vh', color: '#ffffff' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>Aidat Durumum</Typography>

        <Card sx={{ backgroundColor: '#2B2B45', borderRadius: 2, mb: 2, color: '#ffffff' }}>
          <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              Ödenmemiş Aidat
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, mr: 3 }}>{unpaidCount}</Typography>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {fees.map((fee) => (
            <Card
              key={fee._id}
              sx={{
                backgroundColor: '#2B2B45',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#ffffff'
              }}
            >
              <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {`${capitalizeMonth(fee.month)} ${fee.year}`}
                </Typography>
                <Chip
                  size="small"
                  label={fee.isPaid ? 'Ödendi' : 'Ödenmedi'}
                  sx={{
                    backgroundColor: fee.isPaid ? '#16a34a' : '#ef4444',
                    color: '#ffffff',
                    fontWeight: 600
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Aidat Durumum</Typography>
      {unpaidCount > 0 && (
        <Typography 
          variant="subtitle1" 
          sx={{ 
            color: '#e74c3c',
            mb: 2,
            fontWeight: 500
          }}
        >
          Ödenmemiş {unpaidCount} aylık aidatınız bulunmaktadır.
        </Typography>
      )}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Ay/Yıl</TableCell>
            <TableCell>Durum</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fees.map((fee) => (
            <TableRow key={fee._id}>
              <TableCell>{`${capitalizeMonth(fee.month)} ${fee.year}`}</TableCell>
              <TableCell>{fee.isPaid ? 'Ödendi' : 'Ödenmedi'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default MyFees;
