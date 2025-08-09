import React, { useState, useEffect } from 'react';
import { Box, Typography, Modal, Backdrop, Fade, TextField, Button, Select, MenuItem } from '@mui/material';

const CalendarManagement = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    type: 'Prova',
    location: '',
    details: '',
  });

  const [currentDate, setCurrentDate] = useState(new Date()); // Eklendi

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/events`);
      const data = await response.json();
      setEvents(data.map(event => ({
        id: event._id,
        title: event.title,
        date: new Date(event.date),
        type: event.type,
        location: event.location,
        details: event.details,
      })));
    } catch (error) {
      console.error('Etkinlikler yüklenemedi:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSaveEvent = async () => {
    const method = selectedEvent ? 'PUT' : 'POST';
    const endpoint = selectedEvent
      ? `${process.env.REACT_APP_API_URL}/events/${selectedEvent.id}`
      : `${process.env.REACT_APP_API_URL}/events`;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sunucu Hatası:', errorText);
        throw new Error(`Sunucu yanıtı: ${response.status} - ${errorText}`);
      }

      await fetchEvents();
      handleCloseModal();
    } catch (error) {
      console.error('Hata:', error.message);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/events/${id}`, { method: 'DELETE' });
      fetchEvents();
      handleCloseModal();
    } catch (error) {
      console.error('Etkinlik silinemedi:', error);
    }
  };

  const formatDateToInput = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleOpenModal = (event = null, date = null) => {
    setSelectedEvent(event);

    const initialDate = event
      ? formatDateToInput(event.date)
      : date
      ? formatDateToInput(date)
      : '';

    setFormData({
      title: event?.title || '',
      date: initialDate,
      type: event?.type || 'Prova',
      location: event?.location || '',
      details: event?.details || '',
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setOpenModal(false);
  };

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const days = [];
  
    // Hafta başına offset
    const firstDayOfMonth = new Date(year, month, 1).getDay(); 
    // 0 => Pazar, 1 => Pazartesi, vb.
  
    // 1) Boş hücreler
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({
        date: null,
        hasEvent: false,
        event: null,
        isPlaceholder: true, 
      });
    }
  
    // 2) Asıl günler
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const currentDateObj = new Date(year, month, dayNum);
      const event = events.find(
        (e) => e.date.toDateString() === currentDateObj.toDateString()
      );
  
      days.push({
        date: currentDateObj,
        hasEvent: !!event,
        event,
        isPlaceholder: false,
      });
    }
  
    return { days, month, year };
  };
  

  const { days, month, year } = generateCalendarDays();

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];

  const handlePrevMonth = () => {
    const prevMonthDate = new Date(year, month - 1, 1);
    setCurrentDate(prevMonthDate);
  };

  const handleNextMonth = () => {
    const nextMonthDate = new Date(year, month + 1, 1);
    setCurrentDate(nextMonthDate);
  };

  return (
    <Box minHeight="100vh" bgcolor="#f9f9f9" p={3}>
      <Typography variant="h4" gutterBottom>Takvim Yönetimi</Typography>
      <Box display="flex" justifyContent="center" alignItems="center" marginBottom="20px">
        <Button onClick={handlePrevMonth}>{'←'}</Button>
        <Typography
          variant="h5"
          sx={{ textAlign: 'center', margin: '0 20px', color: '#333', fontWeight: 'bold' }}
        >
          {monthNames[month]} {year}
        </Typography>
        <Button onClick={handleNextMonth}>{'→'}</Button>
      </Box>

      <Box
        sx={{
          border: '2px solid #ddd',
          borderRadius: '8px',
          padding: '10px',
          maxWidth: '350px',
          margin: '0 auto',
        }}
      >
        <Box
          display="grid"
          sx={{
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 1,
            marginTop: '15px',
            overflowX: 'auto',
          }}
        >
          {['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((day, index) => (
            <Typography
              key={index}
              variant="body2"
              style={{
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '0.85rem',
              }}
            >
              {day}
            </Typography>
          ))}
 {days.map((day, index) => {
  if (day.isPlaceholder) {
    // Boş hücre
    return (
      <Box
        key={index}
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          color: '#ccc',
          textAlign: 'center',
          padding: '8px',
        }}
      >
        {/* Boş hücre */}
      </Box>
    );
  } else {
    return (
      <Box
        key={index}
        onClick={() => handleOpenModal(day.event, day.date)}
        style={{
          backgroundColor: day.event
            ? day.event.type === 'Konser'
              ? '#ffe6e6'
              : day.event.type === 'Özel'
              ? '#e6e6ff'
              : '#e6ffe6'
            : '#f9f9f9',
          color: day.hasEvent ? '#000' : '#ccc',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '8px',
          textAlign: 'center',
          fontSize: '0.9rem',
          cursor: 'pointer',
        }}
      >
        {day.date.getDate()}
      </Box>
    );
  }
})}
</Box></Box>

      <Modal
        open={openModal}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '80%', md: '60%' },
              maxWidth: '600px',
              bgcolor: 'background.paper',
              borderRadius: '8px',
              boxShadow: 24,
              p: 4,
              overflowY: 'auto',
              maxHeight: '80vh',
            }}
          >
            <Typography variant="h6" gutterBottom>
              {selectedEvent ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}
            </Typography>
            <TextField
              label="Başlık"
              fullWidth
              margin="dense"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="Tarih"
              type="date"
              fullWidth
              margin="dense"
              InputLabelProps={{ shrink: true }}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
            <Select
              fullWidth
              margin="dense"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <MenuItem value="Prova">Prova</MenuItem>
              <MenuItem value="Konser">Konser</MenuItem>
              <MenuItem value="Özel">Özel</MenuItem> {/* Yeni eklenen tür */}
            </Select>
            <TextField
              label="Yer"
              fullWidth
              margin="dense"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <TextField
              label="Detaylar"
              fullWidth
              margin="dense"
              multiline
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            />
            <Box mt={2} display="flex" justifyContent="space-between">
              {selectedEvent && (
                <Button
                  color="secondary"
                  variant="contained"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                >
                  Sil
                </Button>
              )}
              <Button color="primary" variant="contained" onClick={handleSaveEvent}>
                Kaydet
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default CalendarManagement;
