const { Events } = require('discord.js');

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    try {
      const client = newState.client || oldState.client;
      const stats = client.statsManager;
      if (!stats) return;

      const userId = (newState.member || oldState.member)?.id;
      const guild = newState.guild || oldState.guild;
      if (!userId || !guild) return;

      const oldChannel = oldState.channelId;
      const newChannel = newState.channelId;

      // Joined a voice channel
      if (!oldChannel && newChannel) {
        await stats.recordVoiceStart(userId, guild.id, newChannel);
        return;
      }

      // Left voice channel
      if (oldChannel && !newChannel) {
        await stats.recordVoiceEnd(userId, guild.id, oldChannel);
        return;
      }

      // Switched channels
      if (oldChannel && newChannel && oldChannel !== newChannel) {
        await stats.recordVoiceEnd(userId, guild.id, oldChannel);
        await stats.recordVoiceStart(userId, guild.id, newChannel);
      }
    } catch (error) {
      console.error('❌ Erreur voiceStateUpdate:', error);
    }
  },
};