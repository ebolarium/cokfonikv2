const express = require('express');
const router = express.Router();
const Piece = require('../models/Piece');
const ListeningRecord = require('../models/ListeningRecord');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Multer yapılandırması - geçici dosyalar için
const upload = multer({ dest: 'temp/' });

// Cloudinary klasör yapısı
const FOLDERS = {
  AUDIO: 'audio',
  PARTS: {
    SOPRANO: 'soprano',
    ALTO: 'alto',
    TENOR: 'tenor',
    BASS: 'bass',
    GENERAL: 'general'
  }
};

// Cache mekanizması
let cloudinaryCache = {
  lastSync: null,
  pieces: null,
  syncInProgress: false
};

// Cache'in geçerli olup olmadığını kontrol et (5 dakika)
const isCacheValid = () => {
  if (!cloudinaryCache.lastSync) return false;
  const fiveMinutes = 5 * 60 * 1000;
  return (Date.now() - cloudinaryCache.lastSync) < fiveMinutes;
};

// Cloudinary'den parçaları getir ve senkronize et
const syncWithCloudinary = async (forceSyncWithCloudinary = false) => {
  try {
    // Cache kontrolü
    if (!forceSyncWithCloudinary && isCacheValid()) {
      //console.log('Cache geçerli, senkronizasyon atlanıyor...');
      return cloudinaryCache.pieces;
    }

    // Senkronizasyon zaten devam ediyorsa bekle
    if (cloudinaryCache.syncInProgress) {
      //console.log('Senkronizasyon zaten devam ediyor, bekleniyor...');
      while (cloudinaryCache.syncInProgress) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return cloudinaryCache.pieces;
    }

    cloudinaryCache.syncInProgress = true;
    //console.log('Cloudinary senkronizasyonu başlıyor...');
    
    // Tüm ses klasörlerinden dosyaları al
    const allAudioFiles = await Promise.all(
      Object.values(FOLDERS.PARTS).map(async part => {
        try {
          //console.log(`${part} klasörü için dosyalar alınıyor...`);
          const result = await cloudinary.api.resources({
            resource_type: 'video',
            type: 'upload',
            prefix: `${FOLDERS.AUDIO}/${part}`,
            max_results: 500
          });
          //console.log(`${part} klasöründe ${result.resources.length} dosya bulundu`);
          return result;
        } catch (error) {
          console.error(`${part} klasörü için hata:`, error);
          return { resources: [] };
        }
      })
    );

    // Parçaları organize et
    const pieces = {};

    // Her klasördeki ses dosyalarını işle
    allAudioFiles.forEach((result, index) => {
      const currentPart = Object.values(FOLDERS.PARTS)[index];
      result.resources.forEach(resource => {
        const fullPath = resource.public_id;
        const pathParts = fullPath.split('/');
        const title = pathParts[pathParts.length - 1];
        
        if (!pieces[title]) {
          pieces[title] = { 
            title,
            audioUrls: {}
          };
        }
        pieces[title].audioUrls[currentPart] = resource.secure_url;
      });
    });

    // Veritabanını güncelle
    const existingPieces = await Piece.find({});
    
    // Silinen parçaları tespit et ve kaldır
    const cloudinaryTitles = new Set(Object.keys(pieces));
    for (const piece of existingPieces) {
      if (!cloudinaryTitles.has(piece.title)) {
        await Piece.findByIdAndDelete(piece._id);
      }
    }

    // Parçaları güncelle veya ekle
    for (const [title, data] of Object.entries(pieces)) {
      try {
        await Piece.findOneAndUpdate(
          { title },
          data,
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error(`${title} parçası güncellenirken hata:`, error);
      }
    }

    // Cache'i güncelle
    cloudinaryCache.pieces = pieces;
    cloudinaryCache.lastSync = Date.now();
    cloudinaryCache.syncInProgress = false;

    return pieces;
  } catch (error) {
    cloudinaryCache.syncInProgress = false;
    console.error('Cloudinary senkronizasyon hatası:', error);
    throw error;
  }
};

// Tüm parçaları getir
router.get('/', async (req, res) => {
  try {
    const pieces = await Piece.find().sort('-createdAt');
    
    // Force sync parametresi varsa zorla senkronize et
    if (req.query.forceSync === 'true') {
      //console.log('Zorla senkronizasyon istendi...');
      await syncWithCloudinary(true);
    } else {
      // Normal durumda cache kullan
      await syncWithCloudinary(false);
    }
    
    res.json(pieces);
  } catch (error) {
    console.error('Parçalar getirilirken hata:', error);
    res.status(500).json({ 
      message: 'Parçalar getirilirken bir hata oluştu',
      error: error.message 
    });
  }
});

// Kullanıcının partına göre parçaları getir
router.get('/my-pieces', async (req, res) => {
  try {
    const { userPart } = req.query;
    if (!userPart || !Object.values(FOLDERS.PARTS).includes(userPart.toLowerCase())) {
      return res.status(400).json({ message: 'Geçersiz parti' });
    }

    await syncWithCloudinary();
    
    // Tüm parçaları al
    const pieces = await Piece.find().sort('-createdAt');
    
    // Her parça için kullanıcının partına uygun URL'i seç
    const filteredPieces = pieces.map(piece => {
      const pieceObj = piece.toObject();
      
      // Önce kullanıcının kendi partisindeki ses dosyasını kontrol et
      // Yoksa genel ses dosyasını kullan
      const userPartUrl = piece.audioUrls[userPart.toLowerCase()];
      const generalUrl = piece.audioUrls.general;
      
      // Sadece kullanıcının partına ait veya genel ses dosyası varsa parçayı göster
      if (userPartUrl || generalUrl) {
        // Kullanıcının erişebileceği ses dosyasını belirle
        pieceObj.activeAudioUrl = userPartUrl || generalUrl;
        return pieceObj;
      }
      return null;
    }).filter(piece => piece !== null); // null olan parçaları filtrele

    res.json(filteredPieces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Parça yükle
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, part } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Dosya yüklenmedi' });
    }

    if (!Object.values(FOLDERS.PARTS).includes(part)) {
      return res.status(400).json({ message: 'Geçersiz part seçimi' });
    }

    // Cloudinary'ye yükle
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      resource_type: 'video',
      folder: `${FOLDERS.AUDIO}/${part}`,
      public_id: title,
      overwrite: true
    });

    // Geçici dosyayı sil
    fs.unlinkSync(file.path);

    // Cache'i geçersiz kıl ve zorla senkronize et
    cloudinaryCache.lastSync = null;
    await syncWithCloudinary(true);

    res.status(201).json({ 
      message: 'Dosya başarıyla yüklendi',
      url: uploadResult.secure_url 
    });
  } catch (error) {
    console.error('Yükleme hatası:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
});

// Parça sil
router.delete('/:id', async (req, res) => {
  try {
    //console.log(`Parça silme isteği: ${req.params.id}`);
    
    // Önce parçayı bul
    const piece = await Piece.findById(req.params.id);
    if (!piece) {
      //console.log('Parça bulunamadı');
      return res.status(404).json({ message: 'Parça bulunamadı' });
    }

    //console.log('Parça bulundu:', piece.title);

    try {
      // Cloudinary'den tüm part dosyalarını sil
      const deletePromises = Object.entries(piece.audioUrls)
        .filter(([_, url]) => url) // Sadece URL'i olan partları sil
        .map(([part, url]) => {
          const publicId = `${FOLDERS.AUDIO}/${part}/${piece.title}`;
          //console.log(`Cloudinary'den siliniyor: ${publicId}`);
          return cloudinary.uploader.destroy(publicId, { resource_type: 'video' })
            .then(result => {
              //console.log(`${publicId} silindi:`, result);
              return result;
            })
            .catch(error => {
              console.error(`${publicId} silinirken hata:`, error);
              return null;
            });
        });

      // Cloudinary silme işlemlerini bekle
      const cloudinaryResults = await Promise.all(deletePromises);
      //console.log('Cloudinary silme sonuçları:', cloudinaryResults);

    } catch (cloudinaryError) {
      console.error('Cloudinary silme hatası:', cloudinaryError);
      // Cloudinary hatası olsa bile MongoDB'den silmeye devam et
    }

    try {
      // MongoDB'den sil - static metodu kullan
      //console.log('MongoDB\'den siliniyor...');
      const deleteResult = await Piece.deletePieceById(req.params.id);
      //console.log('MongoDB silme sonucu:', deleteResult);

      if (deleteResult.deletedCount === 0) {
        throw new Error('MongoDB\'den silme başarısız oldu');
      }
    } catch (mongoError) {
      console.error('MongoDB silme hatası:', mongoError);
      throw mongoError;
    }

    //console.log('Silme işlemi başarılı');
    res.json({ 
      message: 'Parça başarıyla silindi',
      title: piece.title
    });

  } catch (error) {
    console.error('Genel silme hatası:', error);
    res.status(500).json({ 
      message: 'Parça silinirken bir hata oluştu',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Dinleme kaydı ekle
router.post('/:id/listen', async (req, res) => {
  try {
    const { userId, part } = req.body;
    const pieceId = req.params.id;

    //console.log('Dinleme kaydı ekleniyor:', { userId, pieceId, part });

    // Parçanın varlığını kontrol et
    const piece = await Piece.findById(pieceId);
    if (!piece) {
      console.error('Parça bulunamadı:', pieceId);
      return res.status(404).json({ message: 'Parça bulunamadı' });
    }

    // Part kontrolü
    if (!['general', 'soprano', 'alto', 'tenor', 'bass'].includes(part)) {
      console.error('Geçersiz part:', part);
      return res.status(400).json({ message: 'Geçersiz part değeri' });
    }

    // Her dinleme için yeni bir kayıt oluştur
    const record = new ListeningRecord({
      userId,
      pieceId,
      part,
      createdAt: new Date()
    });

    //console.log('Oluşturulan kayıt:', record);

    await record.save();
    //console.log('Kayıt başarıyla kaydedildi');
    
    res.status(201).json(record);
  } catch (error) {
    console.error('Dinleme kaydı eklenirken detaylı hata:', error);
    res.status(500).json({ 
      message: 'Dinleme kaydı eklenirken bir hata oluştu',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Dinleme istatistiklerini getir
router.get('/statistics', async (req, res) => {
  try {
    const stats = await ListeningRecord.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'pieces',
          localField: 'pieceId',
          foreignField: '_id',
          as: 'piece'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $unwind: '$piece'
      },
      {
        $group: {
          _id: {
            userId: '$userId',
            pieceId: '$pieceId'
          },
          userName: { $first: '$user.name' },
          userPart: { $first: '$user.part' },
          pieceTitle: { $first: '$piece.title' },
          listenCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          pieceTitle: 1,
          userName: 1,
          userPart: 1,
          listenCount: 1
        }
      },
      {
        $sort: {
          pieceTitle: 1,
          userName: 1
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('İstatistikler alınırken hata:', error);
    res.status(500).json({ message: 'İstatistikler alınırken bir hata oluştu' });
  }
});

// Manuel senkronizasyon endpoint'i
router.post('/sync', async (req, res) => {
  try {
    const updatedCount = await syncWithCloudinary();
    res.json({ 
      message: 'Senkronizasyon başarılı',
      updatedCount 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dinleme kayıtlarını sıfırla ve indeksleri yeniden oluştur
router.post('/reset-listening-records', async (req, res) => {
  try {
    // Önce koleksiyonu temizle
    try {
      await ListeningRecord.collection.drop();
    } catch (dropError) {
      //console.log('Koleksiyon zaten yok veya silinemedi:', dropError);
    }

    // Tüm indeksleri düşür
    try {
      await ListeningRecord.collection.dropIndexes();
    } catch (indexError) {
      //console.log('İndeksler düşürülemedi:', indexError);
    }

    // Koleksiyonu yeniden oluştur
    await ListeningRecord.createCollection();

    // Sadece createdAt indeksini oluştur
    await ListeningRecord.collection.createIndex({ createdAt: -1 });

    res.json({ 
      message: 'Dinleme kayıtları ve indeksler başarıyla sıfırlandı',
      success: true
    });
  } catch (error) {
    console.error('Sıfırlama sırasında hata:', error);
    res.status(500).json({ 
      message: 'Sıfırlama sırasında bir hata oluştu', 
      error: error.message,
      success: false
    });
  }
});

module.exports = router; 