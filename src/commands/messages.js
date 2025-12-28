const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const StatsHelper = require('../utils/statsHelper');
const { generateMessageStatsImage } = require('../utils/chartGenerator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('messages')
        .setDescription('Affiche les statistiques de messages d\'un utilisateur')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('L\'utilisateur dont vous voulez voir les stats')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user') || interaction.user;
        const guildId = interaction.guild.id;

        try {
            // Fetch Stats
            const stats = await StatsHelper.getUserStats(targetUser.id, guildId);
            const history = await StatsHelper.getActivityHistory(targetUser.id, guildId);
            const topChannelsRaw = await StatsHelper.getTopChannels(targetUser.id, guildId);

            // Resolve Channel Names
            const topChannels = [];
            for (const c of topChannelsRaw) {
                const channel = interaction.guild.channels.cache.get(c.channel_id);
                topChannels.push({
                    name: channel ? channel.name : 'Inconnu',
                    count: c.count
                });
            }

            // Generate Image
            const buffer = await generateMessageStatsImage(targetUser, stats, history, topChannels);
            const attachment = new AttachmentBuilder(buffer, { name: 'message-stats.png' });

            await interaction.editReply({ files: [attachment] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Une erreur est survenue lors de la génération des statistiques.' });
        }
    },
};
