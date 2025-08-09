import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, TextField, TableContainer, Paper, IconButton
} from '@mui/material';
import { Delete, Edit, PersonAdd } from '@mui/icons-material';
import apiClient from '../utils/apiClient';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    part: 'Soprano',
    role: 'Korist'
  });
  const [editUser, setEditUser] = useState(null);

  // Sıralama durumu
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Kullanıcıları Getir
  const fetchUsers = async () => {
    try {
      const data = await apiClient.get('/users');
      setUsers(data);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Form Verisini Güncelle
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Kullanıcı Ekle
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/users/register', formData);
      fetchUsers();
      setOpen(false);
      setFormData({
        name: '',
        surname: '',
        email: '',
        phone: '',
        birthDate: '',
        part: 'Soprano',
        role: 'Korist',
        password: '',
        approved: false,
        frozen: false
      });
    } catch (error) {
      console.error('Kullanıcı ekleme hatası:', error);
      alert(error.message || 'Kullanıcı eklenirken bir hata oluştu.');
    }
  };

  // Kullanıcı Sil
  const handleDeleteUser = async (id) => {
    try {
      await apiClient.delete(`/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Kullanıcı silinirken bir hata oluştu.');
    }
  };


  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const handleOpenDeleteModal = (id) => {
    setDeleteUserId(id);
    setDeleteModalOpen(true);
  };
  
  const handleCloseDeleteModal = () => {
    setDeleteUserId(null);
    setDeleteModalOpen(false);
  };
  
  const confirmDeleteUser = async () => {
    if (deleteUserId) {
      try {
        await apiClient.delete(`/users/${deleteUserId}`);
        fetchUsers();
        handleCloseDeleteModal();
      } catch (error) {
        console.error(error);
        alert(error.message || 'Kullanıcı silinirken bir hata oluştu.');
      }
    }
  };
  



  // Kullanıcı Düzenle
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/users/${editUser._id}`, editUser);
      setEditUser(null);
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Kullanıcı güncellenirken bir hata oluştu.');
    }
  };

  // Sıralama işlemi
  const handleSort = (key) => {
    // Aynı başlığa tıklandıysa direction'ı toggle et
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      // Farklı başlığa tıklandıysa yeni key ve 'asc' başlat
      return { key, direction: 'asc' };
    });
  };

  // Sıralanmış liste
  const sortedUsers = useMemo(() => {
    let sortableUsers = [...users];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  return (
    <Box
      p={2}
      sx={{
        marginTop: 0,
        marginBottom: '64px',
        overflow: 'auto'
      }}
    >
      <Typography 
        variant="h5" 
        gutterBottom 
        align='center'
        sx={{ mt: 1, mb: 2 }}
      >
        Kullanıcı Yönetimi
      </Typography>

      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => setOpen(true)}
        startIcon={<PersonAdd />}
        sx={{
          mt: 0,
          mb: 2,
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 'bold',
          padding: '10px 20px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        Yeni Kullanıcı Ekle
      </Button>

      <TableContainer component={Paper} sx={{ 
        mt: 2, 
        overflowX: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px'
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell
                sx={{
                  padding: '16px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#eeeeee'
                  },
                  width: '40%'
                }}
                onClick={() => handleSort('name')}
              >
                İsim {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableCell>
              <TableCell
                sx={{
                  padding: '16px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#eeeeee'
                  },
                  width: '20%'
                }}
                onClick={() => handleSort('part')}
              >
                Part {sortConfig.key === 'part' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableCell>
              <TableCell
                sx={{
                  padding: '16px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#eeeeee'
                  },
                  width: '20%'
                }}
                onClick={() => handleSort('role')}
              >
                Rol {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableCell>
              <TableCell 
                sx={{ 
                  padding: '16px', 
                  textAlign: 'center',
                  width: '20%',
                  minWidth: '100px'
                }}
              >
                İşlemler
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedUsers.map((user) => (
              <TableRow
                key={user._id}
                sx={{
                  backgroundColor: user.frozen
                    ? 'rgba(173, 216, 230, 0.5)'
                    : user.isActive
                    ? 'rgba(177, 233, 177, 0.5)'
                    : 'rgba(255, 182, 193, 0.5)',
                  '&:hover': {
                    backgroundColor: user.frozen
                      ? 'rgba(173, 216, 230, 0.7)'
                      : user.isActive
                      ? 'rgba(177, 233, 177, 0.7)'
                      : 'rgba(255, 182, 193, 0.7)',
                  },
                  transition: 'background-color 0.2s ease'
                }}
              >
                <TableCell sx={{ padding: '16px' }}>{user.name}</TableCell>
                <TableCell sx={{ padding: '16px' }}>{user.part}</TableCell>
                <TableCell sx={{ padding: '16px' }}>
                  {user.role === 'Yönetim Kurulu' ? 'Yönetim' : user.role}
                </TableCell>
                <TableCell 
                  sx={{ 
                    padding: '12px', 
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      gap: 1
                    }}
                  >
                    <IconButton
                      onClick={() => handleOpenDeleteModal(user._id)}
                      size="small"
                      sx={{
                        color: 'error.main',
                        '&:hover': {
                          backgroundColor: 'rgba(211, 47, 47, 0.1)'
                        }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => setEditUser(user)}
                      size="small"
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.1)'
                        }
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>


      <Dialog
  open={deleteModalOpen}
  onClose={handleCloseDeleteModal}
  fullWidth
  maxWidth="xs"
>
  <DialogTitle>Kullanıcıyı Sil</DialogTitle>
  <DialogContent>
    <Typography>
      Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
    </Typography>
  </DialogContent>
  <Box
    display="flex"
    justifyContent="space-between"
    px={3}
    pb={2}
    mt={1}
  >
    <Button onClick={handleCloseDeleteModal} color="primary">
      İptal
    </Button>
    <Button
      onClick={confirmDeleteUser}
      color="error"
      variant="contained"
    >
      Sil
    </Button>
  </Box>
</Dialog>



      {/* Yeni Kullanıcı Modal'ı */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Yeni Kullanıcı</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <TextField
              name="name"
              label="Ad"
              fullWidth
              margin="dense"
              onChange={handleChange}
              value={formData.name}
              required
            />

            <TextField
              name="surname"
              label="Soyisim"
              fullWidth
              margin="dense"
              onChange={handleChange}
              value={formData.surname || ''}
              required
            />

            <TextField
              name="email"
              label="Email"
              fullWidth
              margin="dense"
              onChange={handleChange}
              value={formData.email}
              required
            />

            <TextField
              name="phone"
              label="Telefon"
              fullWidth
              margin="dense"
              onChange={handleChange}
              value={formData.phone || ''}
              required
            />

            <TextField
              name="birthDate"
              label="Doğum Tarihi"
              type="date"
              fullWidth
              margin="dense"
              onChange={handleChange}
              value={formData.birthDate || ''}
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              select
              name="part"
              label="Partisyon"
              fullWidth
              margin="dense"
              onChange={handleChange}
              value={formData.part}
              SelectProps={{
                native: true,
              }}
            >
              <option value="Soprano">Soprano</option>
              <option value="Alto">Alto</option>
              <option value="Tenor">Tenor</option>
              <option value="Bas">Bas</option>
            </TextField>

            <TextField
              select
              name="role"
              label="Rol"
              fullWidth
              margin="dense"
              onChange={handleChange}
              value={formData.role}
              SelectProps={{
                native: true,
              }}
            >
              <option value="Master Admin">Master Admin</option>
              <option value="Yönetim Kurulu">Yönetim Kurulu</option>
              <option value="Korist">Korist</option>
              <option value="Şef">Şef</option>
              <option value="Yoklama">Yoklama</option>
              <option value="Aidat">Aidat</option>
            </TextField>

            <TextField
              select
              name="approved"
              label="Onay Durumu"
              fullWidth
              margin="dense"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  approved: e.target.value === 'Onaylı',
                }))
              }
              value={formData.approved ? 'Onaylı' : 'Onaysız'}
              SelectProps={{
                native: true,
              }}
            >
              <option value="Onaylı">Onaylı</option>
              <option value="Onaysız">Onaysız</option>
            </TextField>

            <TextField
              select
              name="frozen"
              label="Dondurma Durumu"
              fullWidth
              margin="dense"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  frozen: e.target.value === 'Dondurulmuş',
                }))
              }
              value={formData.frozen ? 'Dondurulmuş' : 'Aktif'}
              SelectProps={{
                native: true,
              }}
            >
              <option value="Aktif">Aktif</option>
              <option value="Dondurulmuş">Dondurulmuş</option>
            </TextField>

            <TextField
              name="password"
              label="Şifre"
              type="password"
              fullWidth
              margin="dense"
              onChange={handleChange}
              value={formData.password}
              required
            />

            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
              Kaydet
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Kullanıcı Düzenleme Modal'ı */}
      <Dialog
        open={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Kullanıcı Düzenle</DialogTitle>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <TextField
              label="Ad"
              value={editUser?.name || ''}
              onChange={(e) =>
                setEditUser((prev) => ({ ...prev, name: e.target.value }))
              }
              fullWidth
              margin="dense"
            />

            <TextField
              label="Soyisim"
              value={editUser?.surname || ''}
              onChange={(e) =>
                setEditUser((prev) => ({ ...prev, surname: e.target.value }))
              }
              fullWidth
              margin="dense"
            />

            <TextField
              label="Email"
              value={editUser?.email || ''}
              onChange={(e) =>
                setEditUser((prev) => ({ ...prev, email: e.target.value }))
              }
              fullWidth
              margin="dense"
            />

            <TextField
              label="Telefon"
              value={editUser?.phone || ''}
              onChange={(e) =>
                setEditUser((prev) => ({ ...prev, phone: e.target.value }))
              }
              fullWidth
              margin="dense"
            />

            <TextField
              label="Doğum Tarihi"
              type="date"
              value={
                editUser?.birthDate
                  ? new Date(editUser.birthDate).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setEditUser((prev) => ({ ...prev, birthDate: e.target.value }))
              }
              fullWidth
              margin="dense"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              name="part"
              label="Partisyon"
              value={editUser?.part || 'Soprano'}
              onChange={(e) =>
                setEditUser((prev) => ({ ...prev, part: e.target.value }))
              }
              fullWidth
              margin="dense"
              SelectProps={{
                native: true,
              }}
            >
              <option value="Soprano">Soprano</option>
              <option value="Alto">Alto</option>
              <option value="Tenor">Tenor</option>
              <option value="Bas">Bas</option>
            </TextField>

            <TextField
              select
              name="role"
              label="Rol"
              value={editUser?.role || 'Korist'}
              onChange={(e) =>
                setEditUser((prev) => ({ ...prev, role: e.target.value }))
              }
              fullWidth
              margin="dense"
              SelectProps={{
                native: true,
              }}
            >
              <option value="Master Admin">Master Admin</option>
              <option value="Yönetim Kurulu">Yönetim Kurulu</option>
              <option value="Korist">Korist</option>
              <option value="Şef">Şef</option>
              <option value="Yoklama">Yoklama</option>
              <option value="Aidat">Aidat</option> 

            </TextField>

            <TextField
              select
              name="isActive"
              label="Durum"
              value={editUser?.isActive ? 'Aktif' : 'Pasif'}
              onChange={(e) =>
                setEditUser((prev) => ({
                  ...prev,
                  isActive: e.target.value === 'Aktif',
                }))
              }
              fullWidth
              margin="dense"
              SelectProps={{
                native: true,
              }}
            >
              <option value="Aktif">Aktif</option>
              <option value="Pasif">Pasif</option>
            </TextField>

            <TextField
              select
              name="approved"
              label="Onay Durumu"
              value={editUser?.approved ? 'Onaylı' : 'Onaysız'}
              onChange={(e) =>
                setEditUser((prev) => ({
                  ...prev,
                  approved: e.target.value === 'Onaylı',
                }))
              }
              fullWidth
              margin="dense"
              SelectProps={{
                native: true,
              }}
            >
              <option value="Onaylı">Onaylı</option>
              <option value="Onaysız">Onaysız</option>
            </TextField>

            <TextField
              select
              name="frozen"
              label="Dondurma Durumu"
              value={editUser?.frozen ? 'Dondurulmuş' : 'Aktif'}
              onChange={(e) =>
                setEditUser((prev) => ({
                  ...prev,
                  frozen: e.target.value === 'Dondurulmuş',
                }))
              }
              fullWidth
              margin="dense"
              SelectProps={{
                native: true,
              }}
            >
              <option value="Aktif">Aktif</option>
              <option value="Dondurulmuş">Dondurulmuş</option>
            </TextField>

            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
              Güncelle
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
