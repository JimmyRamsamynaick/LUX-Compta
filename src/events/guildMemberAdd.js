const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            // Enregistrer l'arrivée du nouveau membre
            await member.client.statsManager.recordMemberJoin(member);
            
            console.log(`👋 Nouveau membre: ${member.user.tag} (${member.id})`);
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'enregistrement du nouveau membre:', error);
        }
    },
};