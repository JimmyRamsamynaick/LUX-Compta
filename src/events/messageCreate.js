const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignorer les messages des bots
        if (message.author.bot) return;
        
        // Ignorer les messages en DM
        if (!message.guild) return;
        
        try {
            // Enregistrer les statistiques du message
            await message.client.statsManager.recordMessage(message);
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'enregistrement du message:', error);
        }
    },
};