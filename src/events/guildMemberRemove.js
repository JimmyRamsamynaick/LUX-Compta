const { Events } = require('discord.js');
const Member = require('../models/Member');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        try {
            await Member.findOneAndUpdate(
                { user_id: member.id, guild_id: member.guild.id },
                { 
                    left_at: new Date(),
                    status: 'left'
                }
            );
        } catch (error) {
            console.error('Error logging member leave:', error);
        }
    },
};
