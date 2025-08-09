const mongoose = require('mongoose');

const motivationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD format for easy querying
    required: true
  },
  overallHappiness: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  motivationFun: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  motivationMusic: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updateCount: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Compound index for efficient queries (one record per user per day)
motivationSchema.index({ userId: 1, date: 1 }, { unique: true });

// Validation: Fun + Music should equal 10
motivationSchema.pre('save', function(next) {
  if (this.motivationFun + this.motivationMusic !== 10) {
    const error = new Error('Motivation Fun and Music must total 10');
    return next(error);
  }
  next();
});

// Static method to get user's current motivation
motivationSchema.statics.getCurrentMotivation = async function(userId) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Try to find today's motivation first
  let motivation = await this.findOne({ userId, date: today });
  
  // If no motivation for today, find the most recent one
  if (!motivation) {
    motivation = await this.findOne({ userId })
      .sort({ date: -1, lastUpdated: -1 })
      .limit(1);
  }
  
  return motivation;
};

// Static method to upsert daily motivation
motivationSchema.statics.upsertDailyMotivation = async function(userId, motivationData) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  const filter = { userId, date: today };
  const update = {
    ...motivationData,
    lastUpdated: new Date(),
    $inc: { updateCount: 1 }
  };
  
  const options = {
    upsert: true, // Create if doesn't exist
    new: true,    // Return updated document
    setDefaultsOnInsert: true
  };
  
  return await this.findOneAndUpdate(filter, update, options);
};

module.exports = mongoose.model('Motivation', motivationSchema);
