const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const StatsHelper = require('../utils/statsHelper');
const { generateVoiceStatsImage } = require('../utils/chartGenerator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voice')
        .setDescription('Affiche les statistiques vocales d\'un utilisateur')
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

            // Generate Image
            const buffer = await generateVoiceStatsImage(targetUser, stats, history);
            const attachment = new AttachmentBuilder(buffer, { name: 'voice-stats.png' });

            await interaction.editReply({ files: [attachment] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Une erreur est survenue lors de la génération des statistiques.' });
        }
    },
};
