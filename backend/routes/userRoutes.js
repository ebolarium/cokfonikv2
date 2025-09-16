const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Uploads ve temp dizinlerinin varlığını kontrol edin
const uploadDir = path.join(__dirname, '../uploads');
const tempDir = path.join(__dirname, '../temp');

[uploadDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Geçici dosya yükleme için multer konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Sadece resim dosyalarına izin ver
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Profil Fotoğrafı Yükleme Endpoint
router.post('/:id/upload-photo', authenticateToken, upload.single('profilePhoto'), async (req, res) => {
  let tempFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Lütfen bir fotoğraf seçin.' });
    }

    const userId = req.params.id;
    tempFilePath = req.file.path;

    // Kullanıcıyı bul
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Kullanıcı bulunamadı.');
    }

    // Cloudinary'ye yükle
    const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
      folder: 'profile-photos',
      public_id: userId, // Sadece userId kullan
      overwrite: true,
      resource_type: 'image',
      transformation: [{
        width: 400,
        height: 400,
        crop: 'fill',
        gravity: 'face'
      }],
      format: 'jpg',
      quality: 'auto'
    });

    // Eski fotoğrafı silmeye gerek yok çünkü overwrite: true kullanıyoruz

    // Kullanıcı profilini güncelle
    const photoUrl = uploadResult.secure_url;
    user.profilePhoto = photoUrl;
    await user.save();

    // Başarılı yanıt
    res.status(200).json({
      message: 'Fotoğraf başarıyla yüklendi.',
      photoUrl: photoUrl
    });

  } catch (error) {
    console.error('Fotoğraf yüklenirken hata:', error);
    res.status(error.message === 'Kullanıcı bulunamadı.' ? 404 : 400).json({ 
      message: error.message || 'Fotoğraf yüklenirken bir hata oluştu.'
    });
  } finally {
    // Geçici dosyayı temizle
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (unlinkError) {
        console.error('Geçici dosya silinirken hata:', unlinkError);
      }
    }
  }
});

// Kullanıcı Profilini Getir (token veya id üzerinden)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { email } = req.query; // Kullanıcının email adresini al
    const user = await User.findOne({ email }).select('-password'); // Şifre hariç kullanıcıyı getir

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Kullanıcı profili alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
});

// Yardımcı Fonksiyon: Güncel Ay ve Yıl Bilgisi
const getCurrentMonthAndYear = () => {
  const now = new Date();
  return { month: now.toLocaleString('tr-TR', { month: 'long' }), year: now.getFullYear() };
};

// Yardımcı Fonksiyon: Gelecekteki Tüm Provalar İçin Devamsızlık Kaydı Oluştur
const createDefaultAttendance = async (userId) => {
  try {
    const futureEvents = await Event.find({ type: 'Prova', date: { $gte: new Date() } });
    const attendanceRecords = futureEvents.map((event) => ({
      userId,
      date: event.date,
      status: 'BEKLEMEDE',
    }));
    
    // Only insert if there are records to insert
    if (attendanceRecords.length > 0) {
      await Attendance.insertMany(attendanceRecords);
    }
  } catch (error) {
    console.error('Error creating default attendance:', error);
    // Don't throw - this shouldn't prevent user registration
  }
};

// Kullanıcı kaydı
router.post('/register', async (req, res) => {
  const { name, surname, email, password, birthDate, phone, part } = req.body;
  
  try {
    // Input validation
    if (!name || !surname || !email || !password || !birthDate || !phone || !part) {
      return res.status(400).json({ 
        message: 'Tüm alanlar zorunludur.' 
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Şifre en az 6 karakter olmalıdır.' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Bu email adresi zaten kullanılmaktadır.' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      surname,
      email,
      password: hashedPassword,
      birthDate,
      phone,
      part,
      approved: false, // Varsayılan olarak onaylanmamış
      frozen: false, // Varsayılan olarak aktif
    });

    await newUser.save();

    // Aidat ve devamsızlık işlemleri
    try {
      const { month, year } = getCurrentMonthAndYear();
      const fee = new Fee({ userId: newUser._id, month, year });
      await fee.save();
    } catch (feeError) {
      console.error('Error creating fee:', feeError);
      // Continue registration even if fee creation fails
    }

    await createDefaultAttendance(newUser._id);

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({ 
      message: 'Kullanıcı başarıyla kaydedildi. Yönetici onayını bekleyin.', 
      user: userResponse 
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Bu email adresi zaten kullanılmaktadır.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Kullanıcı kaydı sırasında bir hata oluştu.' 
    });
  }
});

// Şifre Güncelleme
router.post('/:id/change-password', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  try {
    // Check if user is changing their own password or is admin
    if (req.userId.toString() !== id && !['Master Admin', 'Yönetim Kurulu'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Sadece kendi şifrenizi değiştirebilirsiniz.' 
      });
    }

    // Input validation
    if (!newPassword) {
      return res.status(400).json({ 
        message: 'Yeni şifre gereklidir.' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Yeni şifre en az 6 karakter olmalıdır.' 
      });
    }

    // Kullanıcıyı bul
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // If not admin, verify current password
    if (req.userId.toString() === id) {
      if (!currentPassword) {
        return res.status(400).json({ 
          message: 'Mevcut şifre gereklidir.' 
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ 
          message: 'Mevcut şifre yanlış.' 
        });
      }
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: 'Şifre başarıyla güncellendi.' });
  } catch (error) {
    console.error('Şifre güncellenirken hata:', error);
    res.status(500).json({ message: 'Şifre güncellenirken bir hata oluştu.' });
  }
});

// Admin onayı
router.put('/:id/approve', authenticateToken, authorize('Master Admin', 'Yönetim Kurulu'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
    res.json({ message: 'Kullanıcı onaylandı.', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Kullanıcı dondurma
router.put('/:id/freeze', authenticateToken, authorize('Master Admin', 'Yönetim Kurulu'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { frozen: true }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
    res.json({ message: 'Kullanıcı donduruldu.', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Kullanıcı dondurmayı kaldırma
router.put('/:id/unfreeze', authenticateToken, authorize('Master Admin', 'Yönetim Kurulu'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { frozen: false }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
    res.json({ message: 'Kullanıcı aktif hale getirildi.', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Tüm Kullanıcıları Getir
router.get('/', authenticateToken, authorize('Master Admin', 'Yönetim Kurulu', 'Şef', 'Aidat'), async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Şifreyi hariç tutar
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kullanıcı Silme
router.delete('/:id', authenticateToken, authorize('Master Admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    res.json({ message: 'Kullanıcı silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kullanıcıyı Güncelle
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;

    // Kullanıcıyı bul ve gönderilen verilerle güncelle
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: req.body }, // Sadece gönderilen alanları günceller
      { new: true, runValidators: true, omitUndefined: true } // Valide et, undefined değerleri yok say
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Kullanıcı güncellenirken hata:', error);
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id); // ID'ye göre kullanıcıyı bul
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profil bilgileri alınırken hata:', error);
    res.status(500).json({ message: 'Bir hata oluştu' });
  }
});

// Şifre Sıfırlama Talep Et
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Input validation
    if (!email) {
      return res.status(400).json({
        message: 'Email adresi gereklidir.'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Güvenlik için aynı mesajı döndürüyoruz
      return res.status(200).json({
        message: 'Eğer bu email adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir.'
      });
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set token and expiration (1 hour from now)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send email
    const { sendPasswordResetEmail } = require('../utils/emailService');
    const emailResult = await sendPasswordResetEmail(email, resetToken, user.name);

    if (emailResult.success) {
      res.status(200).json({
        message: 'Eğer bu email adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir.'
      });
    } else {
      console.error('Email sending failed:', emailResult.error);
      res.status(500).json({
        message: 'Email gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: 'Sunucu hatası oluştu.'
    });
  }
});

// Şifre Sıfırlama
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Input validation
    if (!token || !newPassword) {
      return res.status(400).json({
        message: 'Token ve yeni şifre gereklidir.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Yeni şifre en az 6 karakter olmalıdır.'
      });
    }

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() } // Token still valid
    });

    if (!user) {
      return res.status(400).json({
        message: 'Geçersiz veya süresi dolmuş token.'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({
      message: 'Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Sunucu hatası oluştu.'
    });
  }
});

// Email Test Endpoint (sadece development için)
router.post('/test-email', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }

  const { email } = req.body;

  try {
    const { sendTestEmail } = require('../utils/emailService');
    const result = await sendTestEmail(email);
    
    if (result.success) {
      res.status(200).json({ message: 'Test email sent successfully!' });
    } else {
      res.status(500).json({ message: 'Failed to send test email', error: result.error });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;