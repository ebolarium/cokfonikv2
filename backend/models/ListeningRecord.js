const mongoose = require('mongoose');

const ListeningRecordSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  pieceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Piece', 
    required: true 
  },
  part: { 
    type: String, 
    enum: ['general', 'soprano', 'alto', 'tenor', 'bass'], 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  // Koleksiyon adını açıkça belirt
  collection: 'listening_records'
});

// Sadece createdAt üzerinde indeks oluştur
ListeningRecordSchema.index({ createdAt: -1 });

// Model oluşturulmadan önce tüm indeksleri kaldır
if (mongoose.connection.models['ListeningRecord']) {
  delete mongoose.connection.models['ListeningRecord'];
}

const ListeningRecord = mongoose.model('ListeningRecord', ListeningRecordSchema);

// Başlangıçta tüm indeksleri düşür ve yeniden oluştur
ListeningRecord.collection.dropIndexes().catch(console.error);

module.exports = ListeningRecord; 