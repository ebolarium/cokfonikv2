const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  birthDate: { type: Date, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['Master Admin', 'Yönetim Kurulu', 'Şef', 'Korist', 'Yoklama', 'Aidat', 'Rookie'], default: 'Korist' },
  isActive: { type: Boolean, default: true },
  part: { type: String, enum: ['Soprano', 'Alto', 'Tenor', 'Bas'], default: 'Soprano' },
  approved: { type: Boolean, default: false }, // Admin onayı
  frozen: { type: Boolean, default: false }, // Dondurma durumu
  profilePhoto: { type: String, default: null }, // Profil fotoğrafı için alan
  resetPasswordToken: { type: String, default: null }, // Şifre sıfırlama token'ı
  resetPasswordExpires: { type: Date, default: null }, // Token son kullanma tarihi

});

module.exports = mongoose.model('User', UserSchema);
