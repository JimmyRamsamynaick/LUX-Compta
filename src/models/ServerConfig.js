const mongoose = require('mongoose');

const ServerConfigSchema = new mongoose.Schema({
    guild_id: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: String, required: true }
});

// Compound index to ensure unique key per guild
ServerConfigSchema.index({ guild_id: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('ServerConfig', ServerConfigSchema);
