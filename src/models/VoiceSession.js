const mongoose = require('mongoose');

const VoiceSessionSchema = new mongoose.Schema({
    user_id: { type: String, required: true, index: true },
    channel_id: { type: String, required: true },
    guild_id: { type: String, required: true, index: true },
    start_time: { type: Date, required: true, index: true },
    end_time: { type: Date },
    duration: { type: Number } // Stored in milliseconds
});

// Index for getting user voice sessions in a guild
VoiceSessionSchema.index({ user_id: 1, guild_id: 1, start_time: 1 });
// Index for finding open sessions
VoiceSessionSchema.index({ user_id: 1, guild_id: 1, end_time: 1 });

module.exports = mongoose.model('VoiceSession', VoiceSessionSchema);
