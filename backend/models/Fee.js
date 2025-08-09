const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
}, { 
  timestamps: true, // createdAt ve updatedAt alanlarını otomatik ekler
  collection: 'fees' // Koleksiyon adını açıkça belirtir
});

module.exports = mongoose.model('Fee', FeeSchema);
