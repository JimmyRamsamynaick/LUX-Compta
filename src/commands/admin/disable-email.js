const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ServerConfig = require('../../models/ServerConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disable-email')
        .setDescription('Désactiver temporairement l\'envoi de rapports par email pour ce serveur')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            await ServerConfig.findOneAndUpdate(
                { guild_id: interaction.guild.id, key: 'report_email_active' },
                { value: 'false' },
                { upsert: true, new: true }
            );
            
            await interaction.editReply({ 
                content: '✅ L\'envoi de rapports par email a été **désactivé** pour ce serveur.\nVos adresses sont conservées. Utilisez `/enable-email` pour réactiver.' 
            });
        } catch (error) {
            console.error('Error in disable-email:', error);
            await interaction.editReply({ content: '❌ Une erreur est survenue lors de la désactivation.' });
        }
    },
};
