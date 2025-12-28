const { Events } = require('discord.js');
const Message = require('../models/Message');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        try {
            await Message.create({
                user_id: message.author.id,
                channel_id: message.channel.id,
                guild_id: message.guild.id,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error logging message:', error);
        }
    },
};
