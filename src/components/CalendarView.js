import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Modal,
  Backdrop,
  Fade,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Button
} from '@mui/material';

const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [open, setOpen] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/events`);
        const data = await response.json();
        setEvents(
          data.map((event) => ({
            title: event.title,
            description: event.details,
            date: new Date(event.date),
            type: event.type
          }))
        );
      } catch (error) {
        console.error('Etkinlikler yüklenemedi:', error);
      }
    };

    fetchEvents();
  }, []);

  const daysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Takvim günlerini oluşturma
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const days = [];

    // Ayın ilk gününün haftanın hangi gününe geldiğini bul (0 = Pazar, 1 = Pazartesi vs.)
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    // 1) Boş hücreleri ekle (ayın 1'i doğru sütuna yerleşsin diye)
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({
        date: null,
        hasEvent: false,
        event: null,
        isPlaceholder: true
      });
    }

    // 2) Gerçek günleri ekle
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const currentDateObj = new Date(year, month, dayNum);
      const foundEvent = events.find(
        (ev) => ev.date.toDateString() === currentDateObj.toDateString()
      );

      days.push({
        date: currentDateObj,
        hasEvent: !!foundEvent,
        event: foundEvent,
        isPlaceholder: false
      });
    }

    return { days, month, year };
  };

  const { days, month, year } = generateCalendarDays();

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const handlePrevMonth = () => {
    const prevMonthDate = new Date(year, month - 1, 1);
    setCurrentDate(prevMonthDate);
  };

  const handleNextMonth = () => {
    const nextMonthDate = new Date(year, month + 1, 1);
    setCurrentDate(nextMonthDate);
  };

  const handleDayClick = (day) => {
    if (day.hasEvent) {
      setSelectedEvent(day.event);
      setOpen(true);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedEvent(null);
  };

  // Yaklaşan etkinlikler
  const upcomingEvents = events
    .filter((event) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Bugünün başlangıcını al
      return event.date >= today; // Bugün ve sonrası
    })
    .slice(0, 4);

  return (
    <Box minHeight="100vh" bgcolor="#f9f9f9" p={2}>
      <Card
        sx={{
          padding: 2,
          margin: '0 auto',
          maxWidth: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        <Box display="flex" justifyContent="center" alignItems="center">
          <Button onClick={handlePrevMonth}>{'←'}</Button>
          <Typography variant="h6" gutterBottom sx={{ marginX: 2 }}>
            {monthNames[month]} {year}
          </Typography>
          <Button onClick={handleNextMonth}>{'→'}</Button>
        </Box>

        {/* Takvim Grid */}
        <Box
          display="grid"
          sx={{
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 1,
            marginTop: 2,
            overflowX: 'auto',
            paddingX: 1
          }}
        >
          {/* Gün isimleri (Pzr, Pzt vs.) */}
          {['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((day, index) => (
            <Typography
              key={index}
              variant="body2"
              sx={{
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.85rem' }
              }}
            >
              {day}
            </Typography>
          ))}

          {/* Gün hücreleri */}
          {days.map((day, index) => {
            if (day.isPlaceholder) {
              // Boş hücre
              return (
                <Box
                  key={index}
                  sx={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9',
                    color: '#ccc',
                    textAlign: 'center',
                    padding: { xs: '4px', sm: '8px' }
                  }}
                />
              );
            } else {
              // Normal gün
              return (
                <Box
                  key={index}
                  onClick={() => handleDayClick(day)}
                  sx={{
                    backgroundColor: day.hasEvent
                      ? day.event.type === 'Konser'
                        ? '#ffe6e6'
                        : day.event.type === 'Özel'
                        ? '#e6e6ff'
                        : '#e6ffe6'
                      : '#f9f9f9',
                    color: day.hasEvent ? '#000' : '#ccc',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: { xs: '4px', sm: '8px' },
                    textAlign: 'center',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    cursor: day.hasEvent ? 'pointer' : 'default'
                  }}
                >
                  {day.date.getDate()}
                </Box>
              );
            }
          })}
        </Box>
      </Card>

      {/* Yaklaşan Etkinlikler */}
      <Card sx={{ padding: '15px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h6" gutterBottom>
          Sonraki Etkinlikler
        </Typography>
        <List dense>
          {upcomingEvents.map((event, index) => (
            <ListItem
              key={index}
              sx={{
                padding: '4px 8px',
                marginBottom: 0,
                lineHeight: 1.2,
                '&.MuiListItem-root': {
                  minHeight: 'unset'
                }
              }}
              className="custom-list-item"
            >
              <ListItemButton onClick={() => handleEventClick(event)}>
                <ListItemText
                  primary={event.title}
                  secondary={`Tarih: ${event.date.toLocaleDateString('tr-TR')}`}
                  primaryTypographyProps={{ style: { fontSize: '0.9rem', lineHeight: 1.2 } }}
                  secondaryTypographyProps={{ style: { fontSize: '0.8rem', color: '#666', lineHeight: 1.2 } }}
                />
              </ListItemButton>
            </ListItem>
          ))}

          {upcomingEvents.length === 0 && (
            <Typography variant="body2" color="textSecondary">
              Yaklaşan etkinlik bulunmamaktadır.
            </Typography>
          )}
        </List>
      </Card>

      {/* Modal: Etkinlik Detayı */}
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
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              padding: '20px',
              width: '300px'
            }}
          >
            {selectedEvent ? (
              <>
                <Typography variant="h6" gutterBottom>
                  {selectedEvent.title}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedEvent.description || 'Detay yok'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Tarih: {selectedEvent.date.toLocaleDateString('tr-TR')}
                </Typography>
              </>
            ) : (
              <Typography>Detay bulunamadı.</Typography>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default CalendarView;
