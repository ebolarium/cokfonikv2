const express = require('express');
const Event = require('../models/Event');

const router = express.Router();
const User = require('../models/User'); // User modelini eklemeyi unutmuş olabilirsiniz
const Attendance = require('../models/Attendance');


// Tüm Etkinlikleri Getir
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni Etkinlik Ekle
router.post('/', async (req, res) => {
  const { title, date, type, location, details } = req.body;

  try {
    const newEvent = new Event({ title, date, type, location, details });
    await newEvent.save();

    if (type === 'Prova') {
      const users = await User.find();
      const attendanceRecords = users.map(user => ({
        userId: user._id,
        event: newEvent._id,
        date: newEvent.date,
        status: 'BEKLEMEDE',
      }));
      await Attendance.insertMany(attendanceRecords);
    }

    res.status(201).json(newEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Etkinlik Güncelle
router.put('/:id', async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Etkinlik Sil
router.delete('/:id', async (req, res) => {
  try {
    // İlgili Etkinliği Sil
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);

    if (!deletedEvent) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }

    // İlgili Etkinlik için Yoklama Kayıtlarını Sil
    await Attendance.deleteMany({ date: deletedEvent.date });

    res.json({ message: 'Etkinlik ve ilgili yoklama kayıtları silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
