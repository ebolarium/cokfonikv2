const express = require('express');
const router = express.Router();
const Score = require('../models/Score');

// En yüksek puanları getir (Belirli bir oyun için)
router.get('/top/:game', async (req, res) => {
  const { game } = req.params;

  try {
    const topScores = await Score.aggregate([
      { $match: { game } }, // Belirli oyuna göre filtreleme
      {
        $group: {
          _id: '$userId',
          maxScore: { $max: '$score' }, // Toplam yerine maksimum skoru alıyoruz
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $project: {
          _id: 1,
          maxScore: 1,
          user: { $arrayElemAt: ['$user', 0] },
        },
      },
      { $sort: { maxScore: -1 } },
      // { $limit: 10 }, // Limit kaldırıldı, tüm kullanıcıları gösterecek
    ]);

    res.status(200).json(topScores);
  } catch (error) {
    console.error(`Error in /top/${game} endpoint:`, error);
    res.status(500).json({ message: 'Top scores could not be retrieved', error });
  }
});

// Kullanıcının puanlarını getir (Belirli bir oyun için)
router.get('/:userId/:game', async (req, res) => {
  const { userId, game } = req.params;

  try {
    const scores = await Score.find({ userId, game }).sort({ score: -1 }); // Skorları azalan sırada getir
    res.json(scores);
  } catch (error) {
    console.error('Error retrieving user scores:', error);
    res.status(500).json({ message: 'Puanlar alınırken hata oluştu.', error });
  }
});

// Yeni puan ekle
router.post('/', async (req, res) => {
  const { userId, game, score } = req.body;

  if (!['oyun1', 'oyun2'].includes(game)) {
    return res.status(400).json({ message: 'Geçersiz oyun tipi.' });
  }

  try {
    // Kullanıcının mevcut maksimum skorunu bul
    const existingMaxScore = await Score.findOne({ userId, game }).sort({ score: -1 });

    if (existingMaxScore && score <= existingMaxScore.score) {
      return res.status(200).json({ message: 'Yeni skor mevcut maksimum skordan düşük veya eşit, kaydedilmiyor.' });
    }

    const newScore = new Score({ userId, game, score });
    await newScore.save();
    res.status(201).json({ message: 'Puan başarıyla kaydedildi!', score: newScore });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ message: 'Puan kaydedilirken hata oluştu.', error });
  }
});

module.exports = router;
