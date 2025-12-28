const { Events } = require('discord.js');
const Member = require('../models/Member');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            await Member.findOneAndUpdate(
                { user_id: member.id, guild_id: member.guild.id },
                { 
                    username: member.user.username,
                    joined_at: new Date(),
                    status: 'active',
                    left_at: null
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('Error logging member join:', error);
        }
    },
};
