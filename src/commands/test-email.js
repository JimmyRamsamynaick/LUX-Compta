const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ServerConfig = require('../models/ServerConfig');
const { generateMonthlyReport } = require('../utils/reportGenerator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-email')
        .setDescription('Teste l\'envoi du rapport par email avec la configuration actuelle')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const guildId = interaction.guild.id;
            
            // 1. Check if email is configured
            const config = await ServerConfig.findOne({ guild_id: guildId, key: 'report_email' });
            
            if (!config || !config.value) {
                return await interaction.editReply({ 
                    content: '❌ Aucune adresse email n\'est configurée pour ce serveur.\nUtilisez `/setup-email` d\'abord.' 
                });
            }

            const email = config.value;

            // 2. Trigger Report Generation
            // Use current month range for test? Or last month? 
            // Usually for a test, user wants to see data NOW. 
            // Let's use current month from 1st to now.
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfPeriod = now; // up to now

            await interaction.editReply({ 
                content: `📧 Envoi d'un rapport de test à **${email}** en cours...\nCela inclut les données du ${startOfMonth.toLocaleDateString()} à aujourd'hui.` 
            });

            // Call generator targeting this guild only
            await generateMonthlyReport(
                interaction.client, 
                startOfMonth, 
                endOfPeriod, 
                email, // force this recipient (redundant but safe)
                guildId // target this guild
            );

            await interaction.followUp({ 
                content: '✅ Processus terminé. Vérifiez votre boîte de réception (et les spams).' 
            });

        } catch (error) {
            console.error('Error in test-email command:', error);
            await interaction.editReply({ 
                content: '❌ Une erreur est survenue lors du test : ' + error.message 
            });
        }
    },
};
