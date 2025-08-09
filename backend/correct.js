// correct.js

const mongoose = require('mongoose');
require('dotenv').config();
// Proje yollarınıza göre import edin:
const Event = require('./models/Event');
const Attendance = require('./models/Attendance');

(async function fixMissingEventReferences() {
  try {
    // 1) Veritabanına bağlan
    await mongoose.connect(process.env.MONGO_URI, {
      //useNewUrlParser: true,
      //useUnifiedTopology: true,
    });
    //console.log('MongoDB bağlantısı başarılı.');

    // 2) Tüm Event dokümanlarını çek
    const allEvents = await Event.find();
    //console.log(`Toplam ${allEvents.length} Event bulundu.`);

    let totalUpdated = 0;

    // 3) Her bir Event dokümanı için, aynı tarihteki ve event alanı olmayan Attendance dokümanlarını bul/güncelle
    for (const eventDoc of allEvents) {
      // Filtre: 
      // - date alanı, eventDoc.date ile eşleşen
      // - event alanı hiç tanımlanmamış ($exists: false)
      const filter = {
        date: eventDoc.date,
        event: { $exists: false },
      };

      // Güncellenecek değer:
      const update = {
        // event alanını bu Event’in _id’siyle doldur
        $set: { event: eventDoc._id },
      };

      // updateMany ile toplu güncelle
      const result = await Attendance.updateMany(filter, update);
      if (result.modifiedCount > 0) {
        //console.log(
        //  `Event [${eventDoc._id}] "${eventDoc.title}" (${eventDoc.date.toISOString()}): ` +
        //  `${result.modifiedCount} Attendance kaydı güncellendi.`
        //);
      }

      totalUpdated += result.modifiedCount;
    }

    //console.log(`Toplam güncellenen Attendance kaydı: ${totalUpdated}`);
    
    // 4) Script’i sonlandır
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
})();
