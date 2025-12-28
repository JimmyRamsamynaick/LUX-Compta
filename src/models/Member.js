const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
    user_id: { type: String, required: true, index: true },
    guild_id: { type: String, required: true, index: true },
    username: { type: String },
    joined_at: { type: Date, required: true },
    left_at: { type: Date },
    status: { type: String, enum: ['active', 'left'], default: 'active' }
});

MemberSchema.index({ user_id: 1, guild_id: 1 }, { unique: true });
MemberSchema.index({ guild_id: 1, status: 1 });

module.exports = mongoose.model('Member', MemberSchema);
