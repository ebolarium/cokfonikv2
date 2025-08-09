// src/components/AnnouncementsPage.js

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Modal,
  Backdrop,
  Fade,
  Button,
  Badge,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [loading, setLoading] = useState(false); // Yükleniyor durumu

  // API URL'si (environment variable ile tanımlanmış olmalı)
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(`${API_URL}/announcements`);
        const data = await response.json();
        const userId = JSON.parse(localStorage.getItem('user'))?._id;
        const visibleAnnouncements = data.filter(
          (announcement) => !announcement.hiddenBy?.includes(userId)
        );
        setAnnouncements(visibleAnnouncements);
      } catch (error) {
        console.error('Duyurular yüklenemedi:', error);
      }
    };

    fetchAnnouncements();
  }, [API_URL]);

  // Duyuruyu okundu olarak işaretler
  const markAsRead = async (id) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('Kullanıcı bilgisi bulunamadı.');
      return;
    }
    const userId = user._id;

    try {
      const response = await fetch(`${API_URL}/announcements/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Optional: Update readBy locally
        setAnnouncements((prev) =>
          prev.map((announcement) =>
            announcement._id === id
              ? { ...announcement, readBy: [...announcement.readBy, userId] }
              : announcement
          )
        );
      } else {
        console.error('Duyuru okundu olarak işaretlenemedi.');
      }
    } catch (error) {
      console.error('Duyuru okundu olarak işaretlenirken hata:', error);
    }
  };

  // Duyuruyu thumb up yapar
  const thumbUpAnnouncement = async (id) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('Kullanıcı bilgisi bulunamadı.');
      return;
    }
    const userId = user._id;

    try {
      const response = await fetch(`${API_URL}/announcements/${id}/thumbup`, {
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

  // Duyuruyu gizler
  const hideAnnouncement = async (id) => {
    const userId = JSON.parse(localStorage.getItem('user'))?._id;
    if (!userId) {
      alert('Kullanıcı bilgisi bulunamadı.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/announcements/${id}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setAnnouncements((prev) => prev.filter((announcement) => announcement._id !== id));
      } else {
        console.error('Duyuru gizlenemedi.');
        alert('Duyuru gizlenemedi.');
      }
    } catch (error) {
      console.error('Duyuru gizlenirken hata:', error);
      alert('Duyuru gizlenirken bir hata oluştu.');
    }
  };

  // Duyuru kartına tıklandığında modalı açar ve duyuruyu okundu olarak işaretler
  const handleOpen = async (announcement) => {
    setSelectedAnnouncement(announcement);
    setOpen(true);
    markAsRead(announcement._id);
  };

  // Modalı kapatır
  const handleClose = () => {
    setOpen(false);
    setSelectedAnnouncement(null);
  };

  const userId = JSON.parse(localStorage.getItem('user'))?._id;

  return (
    <Box p={3} bgcolor="#f9f9f9" minHeight="100vh">
      <Typography variant="h4" gutterBottom>Duyurular</Typography>
      {announcements.length === 0 ? (
        <Typography variant="body1">Henüz herhangi bir duyuru yok.</Typography>
      ) : (
        announcements.map((announcement) => (
          <Card
            key={announcement._id}
            sx={{
              mb: 2,
              boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
              backgroundColor: announcement.readBy.includes(userId)
                ? '#f0f0f0'
                : '#ffffff',
              cursor: 'pointer',
              position: 'relative',
            }}
            onClick={() => handleOpen(announcement)}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold">
                {announcement.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {announcement.content}
              </Typography>
              <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                <IconButton
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    hideAnnouncement(announcement._id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
                <IconButton
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    thumbUpAnnouncement(announcement._id);
                  }}
                  sx={{
                    color: announcement.thumbUpBy?.includes(userId) ? 'primary.main' : 'action.disabled'
                  }}
                >
                  <ThumbUpIcon />
                  {announcement.thumbUpBy?.length > 0 && (
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {announcement.thumbUpBy.length}
                    </Typography>
                  )}
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      {/* Modal */}
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={open}>
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
              width: '90%', // Mobil uyumlu genişlik
              maxWidth: 400, // Maksimum genişlik
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {selectedAnnouncement ? (
              <>
                <Typography variant="h6" gutterBottom>
                  {selectedAnnouncement.title}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {selectedAnnouncement.content}
                </Typography>
                <Box display="flex" justifyContent="space-between" mt={3}>
                  <Button variant="contained" color="primary" onClick={handleClose}>
                    Kapat
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => thumbUpAnnouncement(selectedAnnouncement._id)}
                    sx={{
                      bgcolor: selectedAnnouncement.thumbUpBy?.includes(userId) ? 'primary.main' : 'grey.400',
                      '&:hover': {
                        bgcolor: selectedAnnouncement.thumbUpBy?.includes(userId) ? 'primary.dark' : 'grey.500'
                      }
                    }}
                  >
                    👍 {selectedAnnouncement.thumbUpBy?.length || 0}
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

export default AnnouncementsPage;
