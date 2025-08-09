import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Delete,
  CloudUpload
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

// TabPanel bileşeni
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

const MusicManagement = () => {
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [selectedPart, setSelectedPart] = useState('general');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    file: null
  });
  const [currentTab, setCurrentTab] = useState(0);
  const [listeningStats, setListeningStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success', 'error', 'warning', 'info'
  });

  // Snackbar'ı kapat
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Snackbar'ı göster
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  }, []);

  // Part seçenekleri
  const PARTS = {
    GENERAL: 'general',
    SOPRANO: 'soprano',
    ALTO: 'alto',
    TENOR: 'tenor',
    BASS: 'bass'
  };

  // İstatistik tablosu sütunları
  const columns = [
    { field: 'pieceTitle', headerName: 'Parça', flex: 1 },
    { field: 'userName', headerName: 'Korist', flex: 1 },
    { field: 'userPart', headerName: 'Parti', flex: 1 },
    { field: 'listenCount', headerName: 'Dinleme Sayısı', flex: 1 }
  ];

  // Parçaları getir
  const fetchPieces = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${baseUrl}/pieces`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPieces(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Parçalar yüklenirken hata:', error);
      setPieces([]);
      alert('Parçalar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Dinleme istatistiklerini getir
  const fetchListeningStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const baseUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${baseUrl}/pieces/statistics`);
      
      if (!response.ok) {
        throw new Error('İstatistikler alınamadı');
      }

      const data = await response.json();
      setListeningStats(data);
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
      showSnackbar('İstatistikler yüklenirken bir hata oluştu', 'error');
    } finally {
      setStatsLoading(false);
    }
  }, [showSnackbar]);

  // Tab değiştiğinde
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    if (newValue === 1) {
      fetchListeningStats();
    }
  };

  useEffect(() => {
    fetchPieces();
  }, []);

  // İstatistikleri yükle
  useEffect(() => {
    if (currentTab === 1) {
      fetchListeningStats();
    }
  }, [currentTab, fetchListeningStats]);

  // Dosya yükleme işlemi
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.title.trim()) {
      showSnackbar('Lütfen parça adı giriniz', 'error');
      return;
    }

    if (!uploadData.file) {
      showSnackbar('Lütfen bir dosya seçiniz', 'error');
      return;
    }

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('title', uploadData.title.trim());
    formData.append('file', uploadData.file);
    formData.append('part', selectedPart);

    try {
      const baseUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${baseUrl}/pieces/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Yükleme başarısız oldu');
      }

      await fetchPieces();
      setOpenUploadDialog(false);
      setUploadData({ title: '', file: null });
      showSnackbar('Dosya başarıyla yüklendi');
    } catch (error) {
      console.error('Dosya yüklenirken hata:', error);
      showSnackbar(`Dosya yüklenirken bir hata oluştu: ${error.message}`, 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  // Parça silme işlemi
  const handleDelete = async (pieceId) => {
    if (!pieceId) {
      console.error('Geçersiz parça ID\'si');
      return;
    }

    if (window.confirm('Bu parçayı silmek istediğinize emin misiniz?')) {
      try {
        setLoading(true);
        //console.log('Parça silme işlemi başlatılıyor:', pieceId);

        const baseUrl = process.env.REACT_APP_API_URL;
        const response = await fetch(`${baseUrl}/pieces/${pieceId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('Response parse hatası:', parseError);
          throw new Error('Sunucu yanıtı işlenemedi');
        }

        if (!response.ok) {
          console.error('Silme hatası:', data);
          throw new Error(data.message || 'Silme işlemi başarısız oldu');
        }

        //console.log('Silme işlemi başarılı:', data);
        
        // Başarılı silme işleminden sonra parçaları yeniden yükle
        await fetchPieces();
        showSnackbar('Parça başarıyla silindi');
      } catch (error) {
        console.error('Parça silinirken hata:', error);
        showSnackbar('Parça silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box sx={{ p: 2, pb: { xs: '72px', sm: '80px' } }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Müzik Yönetimi
      </Typography>

      <Tabs 
        value={currentTab} 
        onChange={handleTabChange}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Parçalar" />
        <Tab label="Dinleme İstatistikleri" />
      </Tabs>

      {currentTab === 0 ? (
        <>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setOpenUploadDialog(true)}
            size="small"
            sx={{ mb: 2 }}
          >
            Yeni Parça Yükle
          </Button>

          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Parça Adı</TableCell>
                  <TableCell align="right" sx={{ width: '100px' }}>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 1 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : pieces.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Henüz hiç parça yüklenmemiş
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pieces.map((piece) => (
                    <TableRow key={piece._id} hover>
                      <TableCell sx={{ py: 1 }}>{piece.title}</TableCell>
                      <TableCell align="right" sx={{ py: 1 }}>
                        <IconButton 
                          onClick={() => handleDelete(piece._id)}
                          size="small"
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ 
            height: 400, 
            width: '100%',
            mb: { xs: '72px', sm: '80px' }  // Bottom navbar için margin ekle
          }}>
            {statsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid
                rows={listeningStats.map((stat, index) => ({ ...stat, id: index }))}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                disableSelectionOnClick
                autoHeight
              />
            )}
          </Box>
        </TabPanel>
      )}

      {/* Yükleme Dialog'u */}
      <Dialog 
        open={openUploadDialog} 
        onClose={() => !uploadLoading && setOpenUploadDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Yeni Parça Yükle</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Box component="form" onSubmit={handleFileUpload}>
            <TextField
              fullWidth
              label="Parça Adı"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              margin="dense"
              required
              disabled={uploadLoading}
              size="small"
              helperText="Parça adını boşluk yerine alt çizgi (_) kullanarak yazınız"
            />
            <FormControl fullWidth margin="dense" required size="small">
              <InputLabel>Part</InputLabel>
              <Select
                value={selectedPart}
                onChange={(e) => setSelectedPart(e.target.value)}
                label="Part"
                disabled={uploadLoading}
              >
                {Object.entries(PARTS).map(([key, value]) => (
                  <MenuItem key={value} value={value}>
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mt: 1 }}
              disabled={uploadLoading}
              size="small"
            >
              Ses Dosyası Seç
              <input
                type="file"
                accept="audio/*"
                hidden
                onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
              />
            </Button>
            {uploadData.file && (
              <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                Seçilen dosya: {uploadData.file.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenUploadDialog(false)}
            disabled={uploadLoading}
            size="small"
          >
            İptal
          </Button>
          <Button
            onClick={handleFileUpload}
            variant="contained"
            disabled={!uploadData.title || !uploadData.file || uploadLoading}
            size="small"
          >
            {uploadLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Yükle'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
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

export default MusicManagement; 