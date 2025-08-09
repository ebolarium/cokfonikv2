import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Divider,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';
import apiClient from '../utils/apiClient';

const Profile = () => {
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [user, setUser] = useState({
    name: '',
    surname: '',
    part: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [editField, setEditField] = useState(null);
  const [editedValue, setEditedValue] = useState('');
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData._id) {
          setError('Kullanıcı bilgisi bulunamadı!');
          setLoading(false);
          return;
        }
  
        const result = await apiClient.get(`/users/${userData._id}/profile`);

        // Profil fotoğrafı URL'sini güncelle
        if (result.profilePhoto) {
          // Cache'i önlemek için timestamp ekle
          const timestamp = new Date().getTime();
          result.profilePhoto = `${result.profilePhoto}?t=${timestamp}`;
        }
  
        setUser(result);
        setProfilePhoto(result.profilePhoto);
        localStorage.setItem('user', JSON.stringify(result));
      } catch (error) {
        console.error('Kullanıcı verisi alınırken hata:', error);
        setError('Kullanıcı bilgileri alınırken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      setSnackbar({
        open: true,
        message: 'Lütfen geçerli bir resim dosyası seçin.',
        severity: 'error'
      });
      return;
    }

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: 'Dosya boyutu 5MB\'dan küçük olmalıdır.',
        severity: 'error'
      });
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('profilePhoto', file);

      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData._id) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }

      const result = await apiClient.uploadFile(`/users/${userData._id}/upload-photo`, formData);
      
      // Kullanıcı bilgilerini güncelle
      const updatedUser = { ...userData, profilePhoto: result.photoUrl };
      setUser(updatedUser);
      setProfilePhoto(result.photoUrl);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSnackbar({
        open: true,
        message: 'Profil fotoğrafı başarıyla güncellendi!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Fotoğraf yüklenirken hata:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Fotoğraf yüklenirken bir hata oluştu.',
        severity: 'error'
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleOpenEdit = (field) => {
    setEditField(field);
    setEditedValue(user[field]);
    setOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editedValue.trim() === '') {
      setSnackbar({
        open: true,
        message: 'Alan boş bırakılamaz.',
        severity: 'error'
      });
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const result = await apiClient.put(`/users/${userData._id}`, { [editField]: editedValue });

      const updatedUser = { ...user, [editField]: editedValue };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSnackbar({
        open: true,
        message: `${editField === 'email' ? 'Email' : 'Telefon'} başarıyla güncellendi!`,
        severity: 'success'
      });
      setOpen(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Bilgi güncellenirken bir hata oluştu.',
        severity: 'error'
      });
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Şifreler eşleşmiyor!',
        severity: 'error'
      });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setSnackbar({
        open: true,
        message: 'Şifre en az 6 karakter olmalıdır!',
        severity: 'error'
      });
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/${userData._id}/change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newPassword: passwordData.newPassword,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }

      setPasswordData({ newPassword: '', confirmPassword: '' });
      setSnackbar({
        open: true,
        message: 'Şifre başarıyla güncellendi!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Şifre güncellenirken bir hata oluştu.',
        severity: 'error'
      });
    }
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <CircularProgress />
    </Box>
  );

  if (error) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Alert severity="error">{error}</Alert>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: '800px', margin: '20px auto', p: 2 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 2, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
        {/* Profil Başlığı - Daha kompakt */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 3,
          mb: 2
        }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profilePhoto || '/placeholder-profile.png'}
              alt={`${user.name} ${user.surname}`}
              onError={(e) => {
                console.error('Profil fotoğrafı yüklenemedi, varsayılan fotoğraf kullanılıyor');
                e.target.src = '/placeholder-profile.png';
              }}
              sx={{
                width: 80,
                height: 80,
                border: '3px solid #fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            />
            {uploadLoading ? (
              <CircularProgress size={24} sx={{ position: 'absolute', bottom: 0, right: 0 }} />
            ) : (
              <IconButton
                component="label"
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  bgcolor: '#1976d2',
                  color: '#fff',
                  '&:hover': { bgcolor: '#1565c0' },
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = handleProfilePhotoChange;
                  input.click();
                }}
              >
                <CameraAltIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {user.name} {user.surname}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {user.part || 'Partisyon belirtilmemiş'}
            </Typography>
          </Box>
        </Box>

        {/* İletişim Bilgileri ve Şifre Değiştirme - Yan Yana */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
          gap: 3,
          mt: 3
        }}>
          {/* İletişim Bilgileri */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem' }}>
              İletişim Bilgileri
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: 1.5,
                bgcolor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography variant="body2">{user.email}</Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={() => handleOpenEdit('email')}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: 1.5,
                bgcolor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Telefon</Typography>
                    <Typography variant="body2">{user.phone || 'Belirtilmemiş'}</Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={() => handleOpenEdit('phone')}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Şifre Değiştirme */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem' }}>
              <LockIcon fontSize="small" /> Şifre Değiştir
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                size="small"
                label="Yeni Şifre"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                fullWidth
              />
              <TextField
                size="small"
                label="Şifreyi Onayla"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                fullWidth
              />
              <Button
                size="small"
                variant="contained"
                onClick={handlePasswordUpdate}
                sx={{ mt: 0.5 }}
              >
                Güncelle
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Düzenleme Dialog'u */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          {editField === 'email' ? 'Email Güncelle' : 'Telefon Güncelle'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={editField === 'email' ? 'Yeni Email' : 'Yeni Telefon'}
            type={editField === 'email' ? 'email' : 'tel'}
            fullWidth
            variant="outlined"
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>İptal</Button>
          <Button onClick={handleSaveEdit} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
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

export default Profile;
