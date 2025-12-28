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

        // Option 2: Nettoyage des commandes de guilde (pour éviter les doublons)
        // Comme nous déployons globalement, nous supprimons les commandes spécifiques à la guilde
        // qui pourraient causer des doublons dans l'interface Discord.
        if (process.env.GUILD_ID) {
            console.log(`🧹 Nettoyage des commandes locales pour la guilde ${process.env.GUILD_ID} (pour éviter les doublons)...`);
            try {
                // Envoyer un tableau vide supprime toutes les commandes de guilde
                await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                    { body: [] },
                );
                console.log(`✅ Commandes locales supprimées pour la guilde ${process.env.GUILD_ID}.`);
            } catch (guildError) {
                console.warn(`⚠️ Impossible de nettoyer la guilde ${process.env.GUILD_ID}:`, guildError.message);
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