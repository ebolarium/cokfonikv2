// routes/subscriptionRoutes.js

const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription'); // Subscription modeli

// POST /api/subscribe - Abonelik Ekleme
router.post('/subscribe', async (req, res) => {
  const subscription = req.body;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ message: 'Geçersiz abonelik.' });
  }

  try {
    // Aboneliği veritabanına ekleyin veya mevcutsa güncelleyin
    const existingSubscription = await Subscription.findOne({ endpoint: subscription.endpoint });
    if (existingSubscription) {
      // Mevcut aboneliği güncelle
      existingSubscription.keys = subscription.keys;
      await existingSubscription.save();
    } else {
      // Yeni abonelik oluştur
      const newSubscription = new Subscription(subscription);
      await newSubscription.save();
    }
    res.status(201).json({ message: 'Abonelik başarıyla eklendi veya güncellendi.' });
  } catch (error) {
    console.error('Abonelik eklenirken/güncellenirken hata:', error);
    res.status(500).json({ message: 'Abonelik eklenemedi veya güncellenemedi.' });
  }
});

// DELETE /api/unsubscribe - Abonelik Silme (Opsiyonel)
router.delete('/unsubscribe', async (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ message: 'Endpoint gereklidir.' });
  }

  try {
    await Subscription.findOneAndDelete({ endpoint });
    res.status(200).json({ message: 'Abonelik başarıyla silindi.' });
  } catch (error) {
    console.error('Abonelik silinirken hata:', error);
    res.status(500).json({ message: 'Abonelik silinemedi.' });
  }
});

module.exports = router;
