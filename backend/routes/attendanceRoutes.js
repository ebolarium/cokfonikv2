//attendanceRoutes.js

const express = require('express');
const Attendance = require('../models/Attendance');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Tüm Devamsızlık Kayıtlarını Getir
router.get('/', authenticateToken, authorize('Master Admin', 'Yönetim Kurulu', 'Şef', 'Aidat'), async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find().populate({
      path: 'userId',
      select: 'name email part',
      match: { _id: { $ne: null } }, // null olmayanları filtrele
    });
    res.json(attendanceRecords.filter(record => record.userId !== null)); // null olmayanları döndür
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Kullanıcıya Özel Devamsızlık Kayıtlarını Getir
router.get('/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  if (!userId || userId === 'undefined') {
    return res.status(400).json({ message: 'Geçersiz kullanıcı kimliği.' });
  }

  try {
    const attendanceRecords = await Attendance.find({ userId }).populate({
      path: 'event',
      select: 'type date title',
    });
    res.json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




// Yeni Devamsızlık Kaydı Ekle
router.post('/', async (req, res) => {
  const { userId, date, status } = req.body;

  try {
    const newAttendance = new Attendance({ userId, date, status });
    await newAttendance.save();
    res.status(201).json(newAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Devamsızlık Statüsünü Güncelle
router.put('/:id', authenticateToken, authorize('Master Admin', 'Yönetim Kurulu', 'Şef', 'Aidat'), async (req, res) => {
  try {
    const { status, excuse } = req.body;
    const updateData = { status };
    
    if (status === 'MAZERETLI' && excuse) {
      updateData.excuse = excuse;
      updateData.excuseDate = new Date();
    } else if (status !== 'MAZERETLI') {
      updateData.excuse = null;
      updateData.excuseDate = null;
      updateData.isExcuseApproved = false;
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    res.json(updatedAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/generate-attendance-for-event', async (req, res) => {
  const { eventId } = req.body;
  try {
    const users = await User.find();
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }

    const attendanceRecords = users.map((user) => ({
      userId: user._id,
      date: event.date,
      status: 'Gelmedi',
    }));

    await Attendance.insertMany(attendanceRecords);
    res.status(201).json({ message: 'Devamsızlık kayıtları oluşturuldu' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mazeret Bildirimi Endpoint'i
router.post('/excuse/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { excuse, userId } = req.body;

    // Devamsızlık kaydının ve kullanıcının kontrolü
    const attendance = await Attendance.findById(id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Devamsızlık kaydı bulunamadı.' });
    }

    if (attendance.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
    }

    // Sadece 'GELMEDI' ve 'BEKLEMEDE' durumlarını kabul et
    if (attendance.status !== 'GELMEDI' && 
        attendance.status !== 'BEKLEMEDE') {
      return res.status(400).json({ 
        message: `Bu kayıt için mazeret bildirilemez. Mevcut durum: ${attendance.status}` 
      });
    }

    // Mazeret bildirimini kaydet
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      id,
      {
        status: 'MAZERETLI',
        excuse: excuse,
        excuseDate: new Date(),
        isExcuseApproved: false
      },
      { new: true }
    );

    res.json(updatedAttendance);
  } catch (error) {
    console.error('Mazeret bildirimi hatası:', error);
    res.status(500).json({ message: 'Mazeret bildirimi yapılırken bir hata oluştu.' });
  }
});

module.exports = router;
