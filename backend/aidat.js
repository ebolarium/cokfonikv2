require('dotenv').config();
const mongoose = require('mongoose');
const Fee = require('./models/Fee');
const User = require('./models/User');

const generatePastSixMonthsFees = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    //console.log('MongoDB bağlantısı başarılı!');

    const users = await User.find();
    if (!users.length) {
      //console.log('Kullanıcı bulunamadı.');
      return;
    }

    //console.log(`Toplam kullanıcı: ${users.length}`);

    const now = new Date();
    const pastSixMonths = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      return {
        month: date.toLocaleString('tr-TR', { month: 'long' }).toLowerCase(), // Normalize month to lowercase
        year: date.getFullYear(),
      };
    });

    for (const user of users) {
      for (const { month, year } of pastSixMonths) {
        const existingFee = await Fee.findOne({ userId: user._id, month, year });
        //console.log('Checking Fee:', { user: user.name, month, year, existingFee }); // Debug
        if (!existingFee) {
          const newFee = new Fee({ userId: user._id, month, year, isPaid: false });
          await newFee.save();
          //console.log(`Aidat kaydı oluşturuldu: ${user.name} - ${month} ${year}`);
        } else {
          //console.log(`Aidat kaydı zaten mevcut: ${user.name} - ${month} ${year}`);
        }
      }
    }

    //console.log('Geçmiş 6 ayın aidat kayıtları başarıyla tamamlandı.');
  } catch (error) {
    console.error('Aidat kayıtları oluşturulurken hata:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

generatePastSixMonthsFees();
