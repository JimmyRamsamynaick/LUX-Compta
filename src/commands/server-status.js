const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { generateServerStatusEmbed, updateServerStatus } = require('../utils/serverStatus');
const ServerConfig = require('../models/ServerConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-status')
        .setDescription('Gère l\'affichage des statistiques du serveur')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Crée l\'embed de statistiques et active la mise à jour automatique'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('Force la mise à jour des statistiques'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            await interaction.deferReply();
            try {
                const embed = await generateServerStatusEmbed(interaction.client, interaction.guild);
                const message = await interaction.channel.send({ embeds: [embed] });

                // Save to DB with guild_id
                await ServerConfig.findOneAndUpdate(
                    { guild_id: interaction.guild.id, key: 'status_channel_id' },
                    { value: interaction.channel.id },
                    { upsert: true, new: true }
                );
                await ServerConfig.findOneAndUpdate(
                    { guild_id: interaction.guild.id, key: 'status_message_id' },
                    { value: message.id },
                    { upsert: true, new: true }
                );

                await interaction.editReply({ content: '✅ Embed de statistiques créé ! Il se mettra à jour automatiquement toutes les 10 minutes.' });
            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: 'Une erreur est survenue lors de la configuration.' });
            }
        } else if (subcommand === 'update') {
            await interaction.deferReply({ ephemeral: true });
            try {
                // Pass the specific guild ID to update only this guild
                await updateServerStatus(interaction.client, interaction.guild.id);
                await interaction.editReply({ content: '✅ Statistiques mises à jour.' });
            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: 'Une erreur est survenue lors de la mise à jour.' });
            }
        }
    },
};
