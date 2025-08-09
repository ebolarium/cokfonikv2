const express = require('express');
const Fee = require('../models/Fee');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// ÖNEMLİ: Spesifik route'ları önce tanımlayın
router.get('/last-six-months', authenticateToken, authorize('Master Admin', 'Yönetim Kurulu', 'Aidat'), async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5); // Son 6 ay için 5 ay geriye git

    // Son 6 ayın tarihlerini oluştur
    const months = [];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    for (let i = 0; i < 6; i++) {
      // Ay hesaplaması
      const monthIndex = currentMonth - i;
      let year = currentYear;
      
      // Eğer ay indeksi negatifse, bir önceki yıla geçmemiz gerekir
      if (monthIndex < 0) {
        year = currentYear - 1;
      }
      
      // JavaScript'te ay indeksi 0-11 arasında, negatif değerleri düzeltmek için
      const adjustedMonthIndex = ((monthIndex % 12) + 12) % 12;
      
      const date = new Date(year, adjustedMonthIndex, 1);
      
      months.push({
        month: date.toLocaleString('tr-TR', { month: 'long' }),
        year: date.getFullYear()
      });
    }

    // Tüm aidatları getir
    const fees = await Fee.find({
      $or: [
        // Son 6 ay için spesifik ay ve yıl kombinasyonları
        ...months.map(m => ({
          year: m.year,
          month: m.month
        })),
        // 2024 yılının tüm ayları için
        { year: 2024 },
        // 2025 yılının tüm ayları için
        { year: 2025 }
      ]
    }).populate({
      path: 'userId',
      select: 'name email part surname frozen',
      match: { _id: { $exists: true } }
    });

    // userId null olan kayıtları filtrele
    const validFees = fees.filter(fee => fee.userId !== null);

    if (!validFees.length) {
      return res.status(404).json({ message: 'Son altı aya ait aidat bulunamadı.' });
    }

    res.json(validFees);
  } catch (error) {
    console.error('Error fetching fees for last six months:', error);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
});


// Kullanıcının aidat borcunu kontrol et
router.get('/check-unpaid/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const unpaidFees = await Fee.find({ userId, isPaid: false });
    if (unpaidFees.length > 0) {
      res.status(200).json({ hasUnpaidFees: true, unpaidCount: unpaidFees.length });
    } else {
      res.status(200).json({ hasUnpaidFees: false });
    }
  } catch (error) {
    console.error('Error checking unpaid fees:', error);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
});




// Aidat güncelleme route'u
router.put('/:id', authenticateToken, authorize('Master Admin', 'Yönetim Kurulu', 'Aidat'), async (req, res) => {
  try {
    const updatedFee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedFee) {
      return res.status(404).json({ message: 'Aidat bulunamadı.' });
    }
    res.json(updatedFee);
  } catch (error) {
    console.error('Error updating fee:', error);
    res.status(400).json({ message: error.message });
  }
});

// Kullanıcıya ait aidatları getir - en sona koyulmalı çünkü en genel route
router.get('/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const fees = await Fee.find({ userId });
    if (!fees.length) {
      return res.status(404).json({ message: 'Kullanıcıya ait aidat bulunamadı.' });
    }
    res.json(fees);
  } catch (error) {
    console.error('Error fetching user fees:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;