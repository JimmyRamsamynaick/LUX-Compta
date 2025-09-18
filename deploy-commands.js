const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];

// Fonction pour charger les commandes récursivement
function loadCommands(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Si c'est un dossier, on explore récursivement
            loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            // Si c'est un fichier .js, on charge la commande
            try {
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                    console.log(`✅ Commande chargée: ${command.data.name}`);
                } else {
                    console.log(`⚠️ Fichier ignoré (pas une commande valide): ${filePath}`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors du chargement de ${filePath}:`, error.message);
            }
        }
    }
}

// Charger toutes les commandes
const commandsPath = path.join(__dirname, 'src', 'commands');
console.log('🔍 Chargement des commandes...');
loadCommands(commandsPath);

console.log(`📊 Total des commandes trouvées: ${commands.length}`);

// Construire et préparer une instance du module REST
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Déployer les commandes
(async () => {
    try {
        console.log(`🚀 Déploiement de ${commands.length} commandes slash...`);

        // Vérifier les variables d'environnement
        if (!process.env.DISCORD_TOKEN) {
            throw new Error('DISCORD_TOKEN manquant dans le fichier .env');
        }
        if (!process.env.CLIENT_ID) {
            throw new Error('CLIENT_ID manquant dans le fichier .env');
        }

        // Option 1: Déploiement global (toutes les guildes)
        // Les commandes globales peuvent prendre jusqu'à 1 heure pour apparaître
        console.log('🌍 Déploiement global des commandes...');
        const globalData = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log(`✅ ${globalData.length} commandes slash déployées globalement.`);

        // Option 2: Déploiement pour une guilde spécifique (instantané)
        // Utile pour les tests et le développement
        if (process.env.GUILD_ID) {
            console.log(`🏠 Déploiement pour la guilde ${process.env.GUILD_ID}...`);
            try {
                const guildData = await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                    { body: commands },
                );
                console.log(`✅ ${guildData.length} commandes slash déployées pour la guilde ${process.env.GUILD_ID}.`);
            } catch (guildError) {
                console.warn(`⚠️ Impossible de déployer sur la guilde ${process.env.GUILD_ID}:`, guildError.message);
                console.warn('💡 Le bot n\'est peut-être pas encore invité sur ce serveur ou n\'a pas les bonnes permissions.');
                console.warn('🔗 Utilisez ce lien pour inviter le bot avec les bonnes permissions:');
                console.warn(`https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=2147483648&scope=bot%20applications.commands`);
            }
        }

        console.log('🎉 Déploiement terminé avec succès !');
        console.log('📝 Note: Les commandes globales peuvent prendre jusqu\'à 1 heure pour apparaître.');
        console.log('💡 Conseil: Utilisez GUILD_ID dans .env pour un déploiement instantané en développement.');

    } catch (error) {
        console.error('❌ Erreur lors du déploiement des commandes:', error);
        
        if (error.code === 50001) {
            console.error('🚫 Erreur: Le bot n\'a pas accès à cette guilde ou les permissions sont insuffisantes.');
        } else if (error.code === 50013) {
            console.error('🚫 Erreur: Permissions insuffisantes. Vérifiez que le bot a les permissions "applications.commands".');
        } else if (error.status === 401) {
            console.error('🚫 Erreur: Token Discord invalide. Vérifiez votre DISCORD_TOKEN dans .env.');
        }
        
        process.exit(1);
    }
})();