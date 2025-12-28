const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const { generateServerStatusPayload, updateServerStatus } = require('../utils/serverStatus');
const ServerConfig = require('../models/ServerConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-status')
        .setDescription('Gère l\'affichage des statistiques du serveur')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Crée l\'embed de statistiques et active la mise à jour automatique')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Le salon où afficher les statistiques (optionnel)')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('Force la mise à jour des statistiques'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            try {
                console.log('Setup command started');
                const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
                console.log(`Target channel: ${targetChannel.id}`);

                console.log('Generating payload...');
                const payload = await generateServerStatusPayload(interaction.client, interaction.guild);
                console.log('Payload generated successfully');
                
                const message = await targetChannel.send(payload);
                console.log(`Message sent: ${message.id}`);

                // Save to DB with guild_id
                await ServerConfig.findOneAndUpdate(
                    { guild_id: interaction.guild.id, key: 'status_channel_id' },
                    { value: targetChannel.id },
                    { upsert: true, new: true }
                );
                await ServerConfig.findOneAndUpdate(
                    { guild_id: interaction.guild.id, key: 'status_message_id' },
                    { value: message.id },
                    { upsert: true, new: true }
                );
                console.log('Config saved to DB');

                await interaction.editReply({ content: `✅ Embed de statistiques créé dans ${targetChannel} ! Il se mettra à jour automatiquement toutes les 10 minutes.` });
            } catch (error) {
                console.error('Error in setup command:', error);
                await interaction.editReply({ content: 'Une erreur est survenue lors de la configuration.' });
            }
        } else if (subcommand === 'update') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
