const { Events } = require('discord.js');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    try {
      if (!member || !member.guild) return;
      await member.client.statsManager.recordMemberLeave(member);
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du départ:', error);
    }
  },
};