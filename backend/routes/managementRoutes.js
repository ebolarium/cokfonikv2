const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();

    const turkishMonths = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    // 1) İKİ AYDIR AİDAT VERMEME DURUMU
    const unpaidItems = await Fee.find({ isPaid: false });
    const overdueUsers = new Set();

    for (const item of unpaidItems) {
      const feeMonthIndex = turkishMonths.indexOf(item.month);
      const feeTotal = item.year * 12 + feeMonthIndex;
      const currentTotal = currentYear * 12 + currentMonthIndex;

      if (currentTotal - feeTotal >= 2) {
        overdueUsers.add(item.userId.toString());
      }
    }
    const overdueFeeCount = overdueUsers.size;

    // İlgili kullanıcıların detaylarını getir
    const overdueUserDetails = await User.find(
      { _id: { $in: Array.from(overdueUsers) } },
      'name surname'
    );

    // 2) SON 4 TARIHTE DEVMASIZLIK KONTROLÜ (Bugün hariç)
    const allUsers = await User.find({ isActive: true, role: { $ne: 'Şef' }, frozen: false });
    const activeUserIds = allUsers.map(user => user._id.toString());

    const last4DatesAgg = await Attendance.aggregate([
      { 
        $match: { 
          date: { $lt: todayStart }
        } 
      },
      { 
        $group: { 
          _id: '$date' 
        } 
      },
      { 
        $sort: { _id: -1 } 
      },
      { 
        $limit: 4 
      }
    ]);

    const last4Dates = last4DatesAgg.map(item => item._id);

    const absentUsers = new Set();

    for (const userId of activeUserIds) {
      const userAttendances = await Attendance.find({
        userId,
        date: { $in: last4Dates },
        status: { $in: ["GELMEDI", "gelmedi", "Gelmedi"] }
      }).sort({ date: -1 });

      if (userAttendances.length === 4) {
        absentUsers.add(userId);
      }
    }

    const repeatedAbsCount = absentUsers.size;

    // Devamsızlık yapan kullanıcıların detaylarını getir
    const absentUserDetails = await User.find(
      { _id: { $in: Array.from(absentUsers) } },
      'name surname'  // Sadece isim alanını getiriyoruz
    );

    res.json({ 
      overdueFeeCount, 
      repeatedAbsCount, 
      overdueUserDetails, 
      absentUserDetails 
    });

  } catch (error) {
    console.error('Sunucu hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
