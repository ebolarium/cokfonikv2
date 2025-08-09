const mongoose = require('mongoose');

const pieceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  composer: { type: String },
  audioUrls: {
    general: String,
    soprano: String,
    alto: String,
    tenor: String,
    bass: String
  },
  pdfUrls: {
    general: String,
    soprano: String,
    alto: String,
    tenor: String,
    bass: String
  },
  createdAt: { type: Date, default: Date.now }
}, {
  // Mongoose ayarları
  timestamps: true, // createdAt ve updatedAt alanlarını otomatik ekle
  toJSON: { virtuals: true }, // JSON dönüşümünde virtual'ları dahil et
  toObject: { virtuals: true } // Object dönüşümünde virtual'ları dahil et
});

// Silme işlemi için static metod
pieceSchema.statics.deletePieceById = async function(id) {
  return this.deleteOne({ _id: id });
};

// Model zaten tanımlıysa onu kullan, değilse yeni model oluştur
module.exports = mongoose.models.Piece || mongoose.model('Piece', pieceSchema); 