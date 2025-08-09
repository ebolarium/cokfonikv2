// src/components/AnnouncementManagement.js

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  IconButton, 
  Modal, 
  Fade,
  Backdrop, 
  List, 
  ListItem, 
  ListItemText, 
  CircularProgress 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import apiClient from '../utils/apiClient';

const PUBLIC_VAPID_KEY = process.env.REACT_APP_PUBLIC_VAPID_KEY;

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [readByUsers, setReadByUsers] = useState([]);
  const [thumbUpUsers, setThumbUpUsers] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [loading, setLoading] = useState(false); // Yükleniyor durumu

  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?._id;

  const fetchAnnouncements = async () => {
    try {
      const data = await apiClient.get('/announcements');
      setAnnouncements(data);
    } catch (error) {
      console.error('Duyurular yüklenemedi:', error);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!user) {
      console.error('Kullanıcı bilgisi bulunamadı.');
      alert('Kullanıcı bilgisi bulunamadı.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert('Başlık ve içerik boş bırakılamaz.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, userId }),
      });

      if (response.ok) {
        const data = await response.json();
        //console.log("Duyuru oluşturuldu:", data);
        setTitle('');
        setContent('');
        fetchAnnouncements();
        alert('Duyuru başarıyla oluşturuldu!');
      } else {
        const errorData = await response.json();
        console.error("Duyuru oluşturulamadı:", errorData);
        alert(`Duyuru oluşturulamadı: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Duyuru oluşturulurken hata:", error);
      alert('Duyuru oluşturulurken bir hata oluştu.');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/announcements/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAnnouncements();
      } else {
        console.error('Duyuru silinemedi.');
        alert('Duyuru silinemedi.');
      }
    } catch (error) {
      console.error('Duyuru silinirken hata:', error);
      alert('Duyuru silinirken bir hata oluştu.');
    }
  };

  const thumbUpAnnouncement = async (id) => {
    if (!user) {
      alert('Kullanıcı bilgisi bulunamadı.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/announcements/${id}/thumbup`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setAnnouncements((prev) =>
          prev.map((announcement) =>
            announcement._id === id
              ? { 
                  ...announcement, 
                  thumbUpBy: announcement.thumbUpBy.includes(userId) 
                    ? announcement.thumbUpBy 
                    : [...(announcement.thumbUpBy || []), userId] 
                }
              : announcement
          )
        );
      } else {
        console.error('Thumb up işlemi gerçekleştirilemedi.');
        alert('Thumb up işlemi gerçekleştirilemedi.');
      }
    } catch (error) {
      console.error('Thumb up yapılırken hata:', error);
      alert('Thumb up yapılırken bir hata oluştu.');
    }
  };

  const handleAnnouncementClick = async (announcement) => {
    setLoading(true);
    try {
      // Detayları al
      const response = await fetch(`${process.env.REACT_APP_API_URL}/announcements/${announcement._id}/details`);
      if (response.ok) {
        const data = await response.json();
        setReadByUsers(data.readBy);
        setThumbUpUsers(data.thumbUpBy);
        setSelectedAnnouncement(announcement);
        setModalOpen(true);
      } else {
        console.error('Duyuru detayları getirilemedi.');
        alert('Duyuru detayları getirilemedi.');
      }
    } catch (error) {
      console.error('Duyuru detayları getirilirken hata:', error);
      alert('Duyuru detayları getirilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setReadByUsers([]);
    setThumbUpUsers([]);
    setSelectedAnnouncement(null);
  };

  useEffect(() => {
    fetchAnnouncements();

    // Push aboneliği
    const subscribeUser = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;

          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.error('Push bildirimi izni reddedildi.');
            return;
          }

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
          });

          // Aboneliği backend'e gönder
          const response = await fetch(`${process.env.REACT_APP_API_URL}/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription),
          });

          if (!response.ok) {
            console.error('Abonelik backend\'e gönderilemedi.');
          }
        } catch (error) {
          console.error('Push aboneliği başarısız:', error);
        }
      }
    };

    subscribeUser();
  }, [PUBLIC_VAPID_KEY, userId]);

  return (
    <Box p={3} bgcolor="#f9f9f9" minHeight="100vh">
      <Typography variant="h4" gutterBottom>Duyuru Yönetimi</Typography>
      <Box display="flex" flexDirection="column" gap={2} mb={3}>
        <TextField
          label="Başlık"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
        />
        <TextField
          label="İçerik"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          fullWidth
          multiline
          rows={4}
        />
        <Button variant="contained" color="primary" onClick={handleCreateAnnouncement}>
          Duyuru Oluştur
        </Button>
      </Box>
      <Typography variant="h6" gutterBottom>Mevcut Duyurular</Typography>
      {announcements.length === 0 ? (
        <Typography variant="body1">Henüz herhangi bir duyuru yok.</Typography>
      ) : (
        announcements.map((announcement) => (
          <Card 
            key={announcement._id} 
            sx={{ mb: 2, cursor: 'pointer', position: 'relative' }}
            onClick={() => handleAnnouncementClick(announcement)}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold">{announcement.title}</Typography>
              <Typography variant="body2">{announcement.content}</Typography>
              <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                <IconButton
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAnnouncement(announcement._id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
                <IconButton
                  color={announcement.thumbUpBy?.includes(userId) ? 'primary' : 'default'}
                  onClick={(e) => {
                    e.stopPropagation();
                    thumbUpAnnouncement(announcement._id);
                  }}
                >
                  <ThumbUpIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={modalOpen}>
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
              width: { xs: '90%', sm: 500 }, // Responsive genişlik
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            ) : selectedAnnouncement ? (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Okuyanlar:
                </Typography>
                {readByUsers.length > 0 ? (
                  <List>
                    {readByUsers.map((user) => (
                      <ListItem key={user._id} dense>
                        <ListItemText
                          primary={`${user.name} ${user.surname}`} // İsim ve Soyisim
                          primaryTypographyProps={{ fontWeight: 'bold' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2">Henüz kimse bu duyuruyu okumamış.</Typography>
                )}
                <Typography variant="subtitle1" gutterBottom mt={2}>
                  Beğenenler:
                </Typography>
                {thumbUpUsers.length > 0 ? (
                  <List>
                    {thumbUpUsers.map((user) => (
                      <ListItem key={user._id} dense>
                        <ListItemText
                          primary={`${user.name} ${user.surname}`} // İsim ve Soyisim
                          primaryTypographyProps={{ fontWeight: 'bold' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2">Henüz kimse bu duyuruyu thumb up yapmamış.</Typography>
                )}
                <Box textAlign="right" mt={2}>
                  <Button variant="contained" color="primary" onClick={handleCloseModal}>
                    Kapat
                  </Button>
                </Box>
              </>
            ) : (
              <Typography variant="h6" gutterBottom>Duyuru Kaydedildi!</Typography>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default AnnouncementManagement;
