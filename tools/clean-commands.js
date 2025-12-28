const { REST, Routes } = require('discord.js');
require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
    console.error('❌ DISCORD_TOKEN ou CLIENT_ID manquant dans le fichier .env');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('🗑️  Début du nettoyage complet des commandes...');

        // 1. Supprimer les commandes globales
        console.log('🌍 Récupération des commandes globales...');
        const globalCommands = await rest.get(Routes.applicationCommands(clientId));
        
        if (globalCommands.length > 0) {
            console.log(`⚠️  ${globalCommands.length} commandes globales trouvées. Suppression...`);
            for (const cmd of globalCommands) {
                await rest.delete(Routes.applicationCommand(clientId, cmd.id));
                console.log(`   - Supprimé: ${cmd.name} (ID: ${cmd.id})`);
            }
        } else {
            console.log('✅ Aucune commande globale trouvée.');
        }

        // 2. Supprimer les commandes de guilde (si GUILD_ID est défini)
        if (guildId) {
            console.log(`🏠 Récupération des commandes pour la guilde ${guildId}...`);
            const guildCommands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));

            if (guildCommands.length > 0) {
                console.log(`⚠️  ${guildCommands.length} commandes de guilde trouvées. Suppression...`);
                for (const cmd of guildCommands) {
                    await rest.delete(Routes.applicationGuildCommand(clientId, guildId, cmd.id));
                    console.log(`   - Supprimé: ${cmd.name} (ID: ${cmd.id})`);
                }
            } else {
                console.log(`✅ Aucune commande locale trouvée pour la guilde ${guildId}.`);
            }
        }

        console.log('🎉 Nettoyage terminé ! Vous pouvez maintenant redéployer les commandes.');

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
    }
})();
