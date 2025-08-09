const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['Prova', 'Konser', 'Özel'], required: true },
  location: { type: String },
  details: { type: String },
});

module.exports = mongoose.model('Event', EventSchema);
