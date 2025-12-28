const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ServerConfig = require('../../models/ServerConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enable-email')
        .setDescription('Réactiver l\'envoi de rapports par email pour ce serveur')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Check if emails exist first
            const emailConfig = await ServerConfig.findOne({ guild_id: interaction.guild.id, key: 'report_email' });
            
            if (!emailConfig || !emailConfig.value) {
                return await interaction.editReply({ 
                    content: '⚠️ Aucune adresse email n\'est configurée.\nVeuillez d\'abord ajouter une adresse avec `/setup-email add`.' 
                });
            }

            await ServerConfig.findOneAndUpdate(
                { guild_id: interaction.guild.id, key: 'report_email_active' },
                { value: 'true' },
                { upsert: true, new: true }
            );
            
            await interaction.editReply({ 
                content: `✅ L\'envoi de rapports par email a été **activé**.\nDestinataires : ${emailConfig.value.split(',').join(', ')}` 
            });
        } catch (error) {
            console.error('Error in enable-email:', error);
            await interaction.editReply({ content: '❌ Une erreur est survenue lors de l\'activation.' });
        }
    },
};
