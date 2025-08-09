// backend/routes/announcementRoutes.js

const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement'); // Duyuru modeli
const Subscription = require('../models/Subscription'); // Abonelik modeli
const webPush = require('web-push');

// POST /api/announcements - Yeni Duyuru Oluşturma
router.post('/', async (req, res) => {
  const { title, content, userId } = req.body;

  if (!title || !content || !userId) {
    return res.status(400).json({ message: 'Başlık, içerik ve kullanıcı ID\'si gereklidir.' });
  }

  try {
    const newAnnouncement = new Announcement({
      title,
      content,
      createdBy: userId, // Frontend'den gelen userId
    });

    await newAnnouncement.save();

    // Tüm abonelikleri alın
    const subscriptions = await Subscription.find();

    if (subscriptions.length > 0) {
      const payload = JSON.stringify({
        title: newAnnouncement.title,
        body: newAnnouncement.content,
        url: '/', // Bildirim tıklandığında açılacak URL
      });

      // Tüm abonelere bildirim gönder
      const sendNotifications = subscriptions.map(sub => {
        return webPush.sendNotification(sub, payload).catch(error => {
          console.error('Bildirim gönderilemedi:', error);
          // Hata durumunda aboneliği silebilirsiniz (endpoint geçersiz olabilir)
          if (error.statusCode === 410 || error.statusCode === 404) {
            return Subscription.findOneAndDelete({ endpoint: sub.endpoint });
          }
        });
      });

      await Promise.all(sendNotifications);
    }

    res.status(201).json({ message: 'Duyuru başarıyla oluşturuldu.', announcement: newAnnouncement });
  } catch (error) {
    console.error('Duyuru oluşturulurken hata:', error);
    res.status(500).json({ message: 'Duyuru oluşturulamadı.' });
  }
});

// GET /api/announcements - Tüm Duyuruları Getirme
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find()
    .populate('createdBy', 'name surname username email') // Güncellendi
    .populate('readBy', 'name surname username email')     // Güncellendi
    .populate('thumbUpBy', 'name surname username email'); // Güncellendi
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Duyurular alınırken hata:', error);
    res.status(500).json({ message: 'Duyurular alınamadı.' });
  }
});

// GET /api/announcements/:id/details - Duyuru Detaylarını Getirme (readBy ve thumbUpBy)
router.get('/:id/details', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
    .populate('readBy', 'name surname username email')     // Güncellendi
    .populate('thumbUpBy', 'name surname username email'); // Güncellendi
    if (!announcement) {
      return res.status(404).json({ message: 'Duyuru bulunamadı.' });
    }
    res.json({
      readBy: announcement.readBy,
      thumbUpBy: announcement.thumbUpBy,
    });
  } catch (error) {
    console.error('Duyuru detayları getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

// PATCH /api/announcements/:id/read - Duyuruyu Okundu Olarak İşaretleme
router.patch('/:id/read', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'Kullanıcı ID\'si gereklidir.' });
  }

  try {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Duyuru bulunamadı.' });
    }

    if (!announcement.readBy.includes(userId)) {
      announcement.readBy.push(userId);
      await announcement.save();
    }

    res.status(200).json({ message: 'Duyuru okundu olarak işaretlendi.', announcement });
  } catch (error) {
    console.error('Duyuru okundu olarak işaretlenirken hata:', error);
    res.status(500).json({ message: 'Duyuru işaretlenemedi.' });
  }
});

// PATCH /api/announcements/:id/thumbup - Duyuruya Thumb Up Yapma
router.patch('/:id/thumbup', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'Kullanıcı ID\'si gereklidir.' });
  }

  try {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Duyuru bulunamadı.' });
    }

    if (!announcement.thumbUpBy.includes(userId)) {
      announcement.thumbUpBy.push(userId);
      await announcement.save();
    }

    res.status(200).json({ message: 'Duyuruya thumb up yapıldı.', announcement });
  } catch (error) {
    console.error('Duyuruya thumb up yapılırken hata:', error);
    res.status(500).json({ message: 'Thumb up işlemi gerçekleştirilemedi.' });
  }
});

// PATCH /api/announcements/:id/hide - Duyuruyu Gizleme
router.patch('/:id/hide', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'Kullanıcı ID\'si gereklidir.' });
  }

  try {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Duyuru bulunamadı.' });
    }

    // Kullanıcı zaten gizlememişse ekle
    if (!announcement.hiddenBy.includes(userId)) {
      announcement.hiddenBy.push(userId);
      await announcement.save();
    }

    res.status(200).json({ message: 'Duyuru başarıyla gizlendi.' });
  } catch (error) {
    console.error('Duyuru gizlenirken hata:', error);
    res.status(500).json({ message: 'Duyuru gizlenemedi.' });
  }
});

// DELETE /api/announcements/:id - Duyuru Silme
router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Duyuru bulunamadı.' });
    }

    res.status(200).json({ message: 'Duyuru başarıyla silindi.' });
  } catch (error) {
    console.error('Duyuru silinirken hata:', error);
    res.status(500).json({ message: 'Duyuru silinemedi.' });
  }
});


// POST /api/fees/send-notifications - Aidat Bildirimlerini Threshold'a Göre Gönder
router.post('/fees/send-notifications', async (req, res) => {
  const { threshold, notificationTitle, notificationBody } = req.body;

  if (!threshold || threshold < 1) {
    return res.status(400).json({ message: 'Geçerli bir threshold değeri girin.' });
  }

  try {
    const now = new Date();
    const targetDate = new Date();
    targetDate.setMonth(now.getMonth() - threshold);

    // Threshold'a göre ödenmemiş aidatları bul
    const unpaidFees = await Fee.find({
      isPaid: false,
      year: targetDate.getFullYear(),
      month: targetDate.toLocaleString('tr-TR', { month: 'long' }),
    }).populate('userId', 'name email');

    if (unpaidFees.length === 0) {
      return res.status(200).json({ message: 'Bildirim gönderilecek kullanıcı yok.' });
    }

    // Tüm abonelikleri alın
    const subscriptions = await Subscription.find();

    if (subscriptions.length > 0) {
      const payload = JSON.stringify({
        title: notificationTitle || 'Aidat Hatırlatması',
        body: notificationBody || 'Aidatınızı ödemediğiniz görünüyor. Lütfen ödeme yapın.',
        url: '/my-fees',
      });

      // Bildirimleri gönder
      const sendNotifications = subscriptions.map(sub =>
        webPush.sendNotification(sub, payload).catch(error => {
          if (error.statusCode === 410 || error.statusCode === 404) {
            return Subscription.findOneAndDelete({ endpoint: sub.endpoint });
          }
        })
      );

      await Promise.all(sendNotifications);
    }

    res.status(200).json({ message: `${unpaidFees.length} kullanıcıya bildirim gönderildi.` });
  } catch (error) {
    console.error('Aidat bildirimleri gönderilirken hata:', error);
    res.status(500).json({ message: 'Bildirim gönderilemedi.' });
  }
});


module.exports = router;
