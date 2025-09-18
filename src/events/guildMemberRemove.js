const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        try {
            // Enregistrer le départ du membre
            await member.client.statsManager.recordMemberLeave(member);
            
            console.log(`👋 Membre parti: ${member.user.tag} (${member.id})`);
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'enregistrement du départ du membre:', error);
        }
    },
};