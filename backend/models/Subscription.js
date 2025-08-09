// backend/models/Subscription.js

const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

module.exports = Subscription;
