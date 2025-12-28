const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const StatsHelper = require('../utils/statsHelper');
const { generateServerStatsImage } = require('../utils/serverChartGenerator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-stats')
        .setDescription('Affiche les statistiques détaillées du serveur avec graphiques et tendances'),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const guild = interaction.guild;
            const stats = await StatsHelper.getServerStats(guild.id);
            
            // Fetch members for live count
            const members = await guild.members.fetch();
            const onlineMembers = members.filter(m => m.presence?.status && m.presence.status !== 'offline').size;

            // Generate Image
            const imageBuffer = await generateServerStatsImage(guild, stats, onlineMembers);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'server-stats.png' });

            // Smart Analysis Logic
            const msgDiff = stats.comparison.messages.diff;
            const voiceDiff = stats.comparison.voice.diff;
            
            let analysisText = "**🔎 Analyse Intelligente :**\n";
            
            if (msgDiff > 0 && voiceDiff > 0) {
                analysisText += "🚀 **Le serveur est en pleine croissance !** L'activité textuelle et vocale est en hausse par rapport à la semaine dernière.";
            } else if (msgDiff < 0 && voiceDiff < 0) {
                analysisText += "📉 **Légère baisse de régime.** L'activité est plus calme cette semaine. C'est peut-être le moment de lancer un événement ?";
            } else if (msgDiff > 0) {
                analysisText += "💬 **Ça discute beaucoup !** Les messages sont en hausse, mais l'activité vocale est en baisse ou stable.";
            } else if (voiceDiff > 0) {
                analysisText += "🎙️ **Les vocaux chauffent !** L'activité vocale est en hausse, c'est le moment de rejoindre un salon.";
            } else {
                analysisText += "⚖️ **Activité stable.** Le serveur maintient son rythme habituel.";
            }

            await interaction.editReply({ 
                content: analysisText, 
                files: [attachment] 
            });

        } catch (error) {
            console.error('Error executing server-stats:', error);
            await interaction.editReply({ content: 'Une erreur est survenue lors de la récupération des statistiques.' });
        }
    },
};
