// Çalıştırınca tüm etkinlikler için tüm kullanıcılara kayıt açıyor.
// Sonrasında tek tek geldi gelmedi diye işaretlemek gerekiyor.





const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const Event = require('./models/Event');
const User = require('./models/User');
require('dotenv').config(); // dotenv'i ekleyin

const createAttendanceRecords = async () => {
  try {
    // Veritabanına bağlan
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI .env dosyasında tanımlı değil.');
    }

    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });

    //console.log('Veritabanına bağlanıldı.');

    // Tüm kullanıcıları ve etkinlikleri alın
    const users = await User.find();
    const events = await Event.find();

    if (!users.length || !events.length) {
      //console.log('Kullanıcı veya etkinlik bulunamadı.');
      return;
    }

    // Her kullanıcı için her etkinlikte devamsızlık kaydı oluştur
    const attendanceRecords = [];
    events.forEach((event) => {
      users.forEach((user) => {
        attendanceRecords.push({
          userId: user._id,
          event: event._id,
          date: event.date,
          status: 'Gelmedi', // Varsayılan durum
        });
      });
    });

    // Kayıtları veritabanına ekleyin
    await Attendance.insertMany(attendanceRecords);
    //console.log('Tüm devamsızlık kayıtları başarıyla oluşturuldu.');
  } catch (error) {
    console.error('Hata oluştu:', error.message);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    //console.log('Veritabanı bağlantısı kapatıldı.');
  }
};

createAttendanceRecords();
