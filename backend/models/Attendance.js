const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  status: { type: String, enum: ['GELDI', 'GELMEDI', 'MAZERETLI', 'BEKLEMEDE'
  ], default: 'BEKLEMEDE' },
  excuse: { type: String, default: null },
  excuseDate: { type: Date },
  isExcuseApproved: { type: Boolean, default: false }
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
