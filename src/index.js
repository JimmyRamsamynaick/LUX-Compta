require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const StatsManager = require('./managers/StatsManager');
const ReportManager = require('./managers/ReportManager');
const GitManager = require('./managers/GitManager');
const EmailManager = require('./managers/EmailManager');

// Créer le client Discord avec les intents nécessaires
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences
    ]
});

// Collections pour les commandes et composants
client.commands = new Collection();
client.components = new Collection();

// Initialiser les managers
client.statsManager = new StatsManager(client);
client.reportManager = new ReportManager(client);
client.gitManager = new GitManager();
client.emailManager = new EmailManager();

// Initialiser les gestionnaires bonus
const AlertManager = require('./managers/AlertManager');
const ArchiveManager = require('./managers/ArchiveManager');
const DashboardManager = require('./managers/DashboardManager');
const CustomizationManager = require('./managers/CustomizationManager');

client.alertManager = new AlertManager(client);
client.archiveManager = new ArchiveManager(client);
client.dashboardManager = new DashboardManager(client);
client.customizationManager = new CustomizationManager(client);

// Charger les commandes
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Commande chargée: ${command.data.name}`);
        } else {
            console.log(`⚠️ Commande manquante "data" ou "execute": ${filePath}`);
        }
    }
}

// Charger les événements
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`✅ Événement chargé: ${event.name}`);
    }
}

// Événement de connexion
client.once(Events.ClientReady, async (readyClient) => {
    console.log(`🤖 ${config.bot.name} est connecté en tant que ${readyClient.user.tag}!`);
    
    // Définir l'activité du bot
    client.user.setActivity(config.bot.activity.name, { type: config.bot.activity.type });
    
    // Initialiser les managers
    await client.statsManager.initialize();
    await client.reportManager.initialize();
    
    console.log('📊 Tous les systèmes sont opérationnels!');
});

// Gestion des erreurs
client.on('error', error => {
    console.error('❌ Erreur Discord.js:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Erreur non gérée:', error);
});

process.on('uncaughtException', error => {
    console.error('❌ Exception non capturée:', error);
    process.exit(1);
});

// Connexion du bot
client.login(process.env.DISCORD_TOKEN);