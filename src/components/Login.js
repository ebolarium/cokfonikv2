import React, { useState } from 'react';
import { TextField, Button, Box, Tabs, Tab, MenuItem, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import logo from '../assets/Cokfonik_Logo_Siyah.png';
import apiClient from '../utils/apiClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    birthDate: '',
    part: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const handleModalClose = () => {
    setModalOpen(false);
    if (activeTab === 1) {
      setActiveTab(0);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await apiClient.login(email, password);

      if (!data.user?.approved) {
        setModalMessage('Hesabınız henüz onaylanmamış. Lütfen yönetici onayını bekleyin.');
        setModalOpen(true);
      } else {
        const roleRedirects = {
          'Master Admin': '/master-admin-dashboard',
          'Yönetim Kurulu': '/management-dashboard',
          'Şef': '/conductor-dashboard',
          'Korist': '/user-dashboard',
        };
        const redirectPath = roleRedirects[data.user.role] || '/user-dashboard';
        window.location.href = redirectPath;
      }
    } catch (error) {
      console.error('Login Error:', error);
      if (error.message.includes('NOT_APPROVED')) {
        setModalMessage('Hesabınız henüz onaylanmamış. Lütfen yönetici onayını bekleyin.');
      } else if (error.message.includes('ACCOUNT_FROZEN')) {
        setModalMessage('Hesabınız dondurulmuş. Lütfen yönetici ile iletişime geçin.');
      } else {
        setModalMessage(error.message || 'Giriş başarısız! Lütfen email ve şifrenizi kontrol edin.');
      }
      setModalOpen(true);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setModalMessage('Şifreler eşleşmiyor.');
      setModalOpen(true);
      return;
    }

    if (formData.password.length < 6) {
      setModalMessage('Şifre en az 6 karakter olmalıdır.');
      setModalOpen(true);
      return;
    }

    try {
      const data = await apiClient.register(formData);
      setModalMessage('Kayıt başarılı! Yönetici onayını bekleyin.');
      setModalOpen(true);
      
      // Clear form
      setFormData({
        name: '',
        surname: '',
        birthDate: '',
        part: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Register Error:', error);
      setModalMessage(error.message || 'Kayıt başarısız! Lütfen bilgilerinizi kontrol edin.');
      setModalOpen(true);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setModalMessage('Lütfen email adresinizi girin.');
      setModalOpen(true);
      return;
    }

    setForgotPasswordLoading(true);
    try {
      await apiClient.post('/users/forgot-password', { email: forgotPasswordEmail });
      setForgotPasswordOpen(false);
      setForgotPasswordEmail('');
      setModalMessage('Eğer bu email adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı email adresinize gönderilmiştir.');
      setModalOpen(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      setModalMessage(error.message || 'Şifre sıfırlama talebinde bir hata oluştu.');
      setModalOpen(true);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
    if (match) {
      return [match[1], match[2], match[3], match[4]].filter(Boolean).join(' ');
    }
    return cleaned;
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" height="100vh" px={2} pt={4}>
      <Box flex="1" display="flex" alignItems="center" justifyContent="center" maxHeight="30vh">
        <img src={logo} alt="Cokfonik Logo" style={{ width: '250px', height: 'auto', maxWidth: '80vw' }} />
      </Box>
      <Box width="100%" maxWidth="400px" p={3} borderRadius={2} boxShadow={3} bgcolor="white" mb={4}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Giriş" />
          <Tab label="Kayıt" />
        </Tabs>
        {activeTab === 0 && (
          <Box mt={3}>
            <form onSubmit={handleLogin}>
              <Box mb={2}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Box>
              <Box mb={2}>
                <TextField
                  label="Şifre"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Box>
              <Button variant="contained" color="primary" type="submit" fullWidth>
                Giriş Yap
              </Button>
              
              <Box mt={2} textAlign="center">
                <Button 
                  color="primary" 
                  size="small" 
                  onClick={() => setForgotPasswordOpen(true)}
                  sx={{ textTransform: 'none' }}
                >
                  Şifremi Unuttum
                </Button>
              </Box>
            </form>
          </Box>
        )}
        {activeTab === 1 && (
          <Box mt={3}>
            <form onSubmit={handleRegister}>
              <Box mb={1}>
                <TextField
                  label="İsim"
                  name="name"
                  fullWidth
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Box>
              <Box mb={1}>
                <TextField
                  label="Soyisim"
                  name="surname"
                  fullWidth
                  value={formData.surname}
                  onChange={handleInputChange}
                  required
                />
              </Box>
              <Box mb={1}>
                <TextField
                  label="Doğum Tarihi"
                  name="birthDate"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  required
                />
              </Box>
              <Box mb={1}>
                <TextField
                  select
                  label="Partisyon"
                  name="part"
                  fullWidth
                  value={formData.part}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="Alto">Alto</MenuItem>
                  <MenuItem value="Bas">Bas</MenuItem>
                  <MenuItem value="Soprano">Soprano</MenuItem>
                  <MenuItem value="Tenor">Tenor</MenuItem>
                </TextField>
              </Box>
              <Box mb={1}>
                <TextField
                  label="Telefon"
                  name="phone"
                  fullWidth
                  value={formatPhoneNumber(formData.phone)}
                  onChange={(e) => {
                    const { value } = e.target;
                    const cleaned = value.replace(/\D/g, '');
                    if (cleaned.length <= 10) {
                      setFormData({ ...formData, phone: cleaned });
                    }
                  }}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">0</InputAdornment>
                  }}
                />
              </Box>
              <Box mb={1}>
                <TextField
                  label="E-Posta"
                  name="email"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </Box>
              <Box mb={1}>
                <TextField
                  label="Şifre"
                  name="password"
                  type="password"
                  fullWidth
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </Box>
              <Box mb={1}>
                <TextField
                  label="Şifre Tekrarı"
                  name="confirmPassword"
                  type="password"
                  fullWidth
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </Box>
              <Button variant="contained" color="primary" type="submit" fullWidth>
                Kayıt Ol
              </Button>
            </form>
          </Box>
        )}
      </Box>

      <Dialog open={modalOpen} onClose={handleModalClose}>
        <DialogTitle>Bilgilendirme</DialogTitle>
        <DialogContent>
          <p>{modalMessage}</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose} color="primary">
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)}>
        <DialogTitle>Şifre Sıfırlama</DialogTitle>
        <DialogContent>
          <p>Email adresinizi girin, şifre sıfırlama bağlantısını size göndereceğiz.</p>
          <TextField
            autoFocus
            margin="dense"
            label="Email Adresi"
            type="email"
            fullWidth
            value={forgotPasswordEmail}
            onChange={(e) => setForgotPasswordEmail(e.target.value)}
            disabled={forgotPasswordLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setForgotPasswordOpen(false)} 
            disabled={forgotPasswordLoading}
          >
            İptal
          </Button>
          <Button 
            onClick={handleForgotPassword} 
            color="primary" 
            disabled={forgotPasswordLoading}
          >
            {forgotPasswordLoading ? 'Gönderiliyor...' : 'Gönder'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login;
