const { Events } = require('discord.js');
const ServerConfig = require('../models/ServerConfig');

module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        try {
            console.log(`Left guild: ${guild.name} (${guild.id}). Cleaning up config...`);
            
            // Delete all config related to this guild
            const result = await ServerConfig.deleteMany({ guild_id: guild.id });
            
            console.log(`Deleted ${result.deletedCount} config entries for guild ${guild.id}`);
        } catch (error) {
            console.error(`Error cleaning up guild ${guild.id}:`, error);
        }
    },
};
