const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    user_id: { type: String, required: true, index: true },
    channel_id: { type: String, required: true },
    guild_id: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true }
});

// Index for getting user messages in a guild within a time range
MessageSchema.index({ user_id: 1, guild_id: 1, timestamp: 1 });

module.exports = mongoose.model('Message', MessageSchema);
