// findGhosts.js

const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    // 1) MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGO_URI, {
      //useNewUrlParser: true,
      //useUnifiedTopology: true
    });
    //console.log('MongoDB bağlantısı başarılı.');

    // 2) attendances koleksiyonundaki userId değerlerini al
    const attendanceUserIds = await mongoose.connection.db
      .collection('attendances')
      .distinct('userId');

    // 3) users koleksiyonundaki gerçek kullanıcı _id değerlerini al
    const realUserIds = await mongoose.connection.db
      .collection('users')
      .distinct('_id');

    // 4) "ghost" userId'leri bul (users içinde yok ama attendances'ta var)
    const ghostIds = attendanceUserIds.filter(attUserId => {
      // Her bir attendances userId’nin, users içindeki _id’lerle eşleşip eşleşmediğine bak
      return !realUserIds.some(realId => realId.toString() === attUserId.toString());
    });

    // 5) Sonuçları yazdır
    //console.log('Ghost userId listesi:', ghostIds);
    //console.log(`Ghost userId sayısı: ${ghostIds.length}`);

    // 6) Bu "ghost" userId’lerin attendances içinde kaç kayıtla geçtiğini görelim
    const ghostCount = await mongoose.connection.db
      .collection('attendances')
      .countDocuments({ userId: { $in: ghostIds } });

    //console.log(`attendances koleksiyonunda "ghost" userId içeren kayıt sayısı: ${ghostCount}`);


    await mongoose.connection.db
    .collection('attendances')
    .deleteMany({ userId: { $in: ghostIds } });
  
  //console.log('Ghost kayıtlar silindi.');


  } catch (error) {
    console.error('Hata:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.disconnect();
    //console.log('MongoDB bağlantısı kapatıldı.');
  }
})();
