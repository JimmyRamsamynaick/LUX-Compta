const { Events } = require('discord.js');
const VoiceSession = require('../models/VoiceSession');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const member = newState.member || oldState.member;
        if (!member || member.user.bot) return;

        const userId = member.id;
        const guildId = member.guild.id;
        const now = new Date();

        // Handle Voice Sessions (Join/Leave/Switch)
        if (oldState.channelId !== newState.channelId) {
            // Left a channel (or switched)
            if (oldState.channelId) {
                try {
                    // Close the open session
                    const session = await VoiceSession.findOne({
                        user_id: userId,
                        guild_id: guildId,
                        channel_id: oldState.channelId,
                        end_time: null
                    });

                    if (session) {
                        session.end_time = now;
                        session.duration = now - session.start_time;
                        await session.save();
                    }
                } catch (error) {
                    console.error('Error closing voice session:', error);
                }
            }

            // Joined a channel (or switched)
            if (newState.channelId) {
                try {
                    await VoiceSession.create({
                        user_id: userId,
                        channel_id: newState.channelId,
                        guild_id: guildId,
                        start_time: now
                    });
                } catch (error) {
                    console.error('Error creating voice session:', error);
                }
            }
        }
    },
};
