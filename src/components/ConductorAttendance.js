import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Modal,
  Backdrop,
  Fade,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TableSortLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ConductorAttendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedUserAttendances, setSelectedUserAttendances] = useState([]);

  // Sıralama
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');

  // Her part için farklı satır rengi (pudra tonları)
  const rowColors = {
    Soprano: '#ebd9c7', // Pembe-pudra
    Alto:    '#e9c9db', // Açık lila
    Tenor:   '#c3dcef', // Açık mor
    Bas:     '#cbe7e5', // Açık leylak
  };

  // Devamsızlık verileri
  const fetchAttendances = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/attendance`);
      const data = await response.json();
      setAttendances(data);
    } catch (error) {
      console.error('Devamsızlık verileri alınırken hata:', error);
    }
  };

  // Kullanıcılar (sadece aktifler)
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users`);
      const data = await response.json();

      // isActive === true olanları filtreliyoruz
      const activeUsers = data.filter((user) => user.isActive && user.role !== 'Şef');
      setUsers(activeUsers);
    } catch (error) {
      console.error('Kullanıcı verileri alınırken hata:', error);
    }
  };

  // Etkinlikler (Prova)
  const fetchEvents = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/events`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Etkinlik verileri alınırken hata:', error);
    }
  };

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    fetchAttendances();
    fetchUsers();
    fetchEvents();
  }, []);

  // Sıralama kontrolü
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sıralanmış kullanıcı listesi
  const sortedUsers = [...users].sort((a, b) => {
    if (orderBy === 'name') {
      return order === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (orderBy === 'part') {
      const partA = a.part || '';
      const partB = b.part || '';
      return order === 'asc'
        ? partA.localeCompare(partB)
        : partB.localeCompare(partA);
    }
    return 0;
  });

  // Modal aç: Seçilen kullanıcının tüm devamsızlık kayıtlarını göster
  const handleOpenModal = (userId) => {
    const userAttendances = attendances.filter((a) => a.userId?._id === userId);
    setSelectedUserAttendances(userAttendances);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedUserAttendances([]);
  };

  // Prova etkinlikleri
  const getEventType = (date) => {
    const event = events.find(
      (e) =>
        new Date(e.date).toISOString() === new Date(date).toISOString() &&
        e.type === 'Prova'
    );
    return event ? event.type : 'Bilinmiyor';
  };

  return (
    <Box
      sx={{
        p: 2,
        height: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        marginTop: '16px',  // AppBar yüksekliğine göre
        marginBottom: '64px', // BottomNav yüksekliğine göre
      }}
    >
      <Typography variant="h5" sx={{ mb: 2, textAlign: 'center' }}>
        Şef - Devamsızlıklar
      </Typography>

      <Table sx={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', width: '50%' }}>
              <TableSortLabel
                active={orderBy === 'name'}
                direction={orderBy === 'name' ? order : 'asc'}
                onClick={() => handleRequestSort('name')}
              >
                Korist
              </TableSortLabel>
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 'bold',
                fontSize: '0.9rem',
                textAlign: 'right',
                width: '25%',
              }}
            >
              <TableSortLabel
                active={orderBy === 'part'}
                direction={orderBy === 'part' ? order : 'asc'}
                onClick={() => handleRequestSort('part')}
              >
                Part.
              </TableSortLabel>
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 'bold',
                fontSize: '0.9rem',
                textAlign: 'right',
                width: '25%',
              }}
            >
              Durum
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedUsers.map((user) => {
            // Kullanıcıya ait tüm devamsızlık kayıtları
            const userAttendances = attendances.filter(
              (a) => a.userId?._id === user._id
            );
            // Kaç tanesi GELDI
            const cameCount = userAttendances.filter((a) => a.status === 'GELDI')
              .length;

            return (
              <TableRow
                key={user._id}
                sx={{
                  borderBottom: 'none',
                  height: '40px',
                  cursor: 'pointer',
                  backgroundColor: rowColors[user.part] || '#fff', // Part'a göre renk
                }}
                onClick={() => handleOpenModal(user._id)}
              >
                <TableCell
                  sx={{
                    fontSize: '0.85rem',
                    verticalAlign: 'middle',
                    padding: '4px 8px',
                  }}
                >
                  {`${user.name} ${user.surname}`}
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: '0.85rem',
                    textAlign: 'right',
                    padding: '4px 8px',
                  }}
                >
                  {user.part || '-'}
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: '0.85rem',
                    textAlign: 'right',
                    padding: '4px 8px',
                  }}
                >
                  {`${cameCount}/${userAttendances.length}`}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Modal (detaylı liste) */}
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
              width: '80%',
              maxHeight: '80%',
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
              overflowY: 'auto',
            }}
          >
            <IconButton
              aria-label="close"
              onClick={handleCloseModal}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" gutterBottom>
              Kullanıcı Etkinlik Detayları
            </Typography>
            <List>
              {selectedUserAttendances
                .filter((attendance) => getEventType(attendance.date) === 'Prova')
                .map((attendance) => (
                  <ListItem key={attendance._id}>
                    <ListItemText
                      primary={`${new Date(attendance.date).toLocaleDateString()} - ${
                        attendance.status
                      }`}
                      secondary="Prova"
                    />
                  </ListItem>
                ))}
            </List>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default ConductorAttendance;
