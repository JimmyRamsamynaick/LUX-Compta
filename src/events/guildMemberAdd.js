const { Events } = require('discord.js');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      if (!member || !member.guild) return;
      await member.client.statsManager.recordMemberJoin(member);
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de l\'arrivée:', error);
    }
  },
};