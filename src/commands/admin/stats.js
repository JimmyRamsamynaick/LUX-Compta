const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Afficher les statistiques détaillées du serveur')
		.addStringOption(option =>
			option.setName('periode')
				.setDescription('Période des statistiques')
				.setRequired(false)
				.addChoices(
					{ name: 'Aujourd\'hui', value: 'daily' },
					{ name: 'Cette semaine', value: 'weekly' },
					{ name: 'Ce mois', value: 'monthly' },
					{ name: 'Tout le temps', value: 'all' },
				),
		)
		.addStringOption(option =>
			option.setName('type')
				.setDescription('Type de statistiques')
				.setRequired(false)
				.addChoices(
					{ name: 'Général', value: 'general' },
					{ name: 'Messages', value: 'messages' },
					{ name: 'Membres', value: 'members' },
					{ name: 'Canaux', value: 'channels' },
				),
		),

	async execute(interaction) {
		// Le bot peut toujours exécuter ses propres commandes admin
		// Pas de vérification de permissions utilisateur nécessaire

		const periode = interaction.options.getString('periode') || 'daily';
		const type = interaction.options.getString('type') || 'general';
		const statsManager = interaction.client.statsManager;

		await interaction.deferReply();

		try {
			const stats = await statsManager.getStats(periode);
			const embed = await this.createStatsEmbed(stats, periode, type, interaction.guild);

			// Créer les boutons d'action
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId(`refresh_stats_${periode}_${type}`)
						.setLabel('Actualiser')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🔄'),
					new ButtonBuilder()
						.setCustomId(`export_stats_${periode}`)
						.setLabel('Exporter CSV')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📊'),
					new ButtonBuilder()
						.setCustomId(`detailed_stats_${periode}`)
						.setLabel('Détails')
						.setStyle(ButtonStyle.Success)
						.setEmoji('📈'),
				);

			await interaction.editReply({
				embeds: [embed],
				components: [buttons],
			});

		}
		catch (error) {
			console.error('Erreur lors de la récupération des statistiques:', error);
			await interaction.editReply({
				content: '❌ Erreur lors de la récupération des statistiques.',
				ephemeral: true,
			});
		}
	},

	async createStatsEmbed(stats, periode, type, guild) {
		const embed = new EmbedBuilder()
			.setTitle(`📊 Statistiques - ${guild.name}`)
			.setDescription(`Période: ${this.getPeriodLabel(periode)}`)
			.setColor('#0099ff')
			.setTimestamp()
			.setThumbnail(guild.iconURL())
			.setFooter({ text: 'LUX Compta' });

		switch (type) {
		case 'general':
			embed.addFields(
				{ name: '📈 Messages totaux', value: stats.messages.toString(), inline: true },
				{ name: '👥 Membres actifs', value: stats.activeMembers.toString(), inline: true },
				{ name: '📊 Canaux actifs', value: stats.activeChannels.toString(), inline: true },
				{ name: '📅 Nouveaux membres', value: stats.newMembers.toString(), inline: true },
				{ name: '👋 Membres partis', value: stats.leftMembers.toString(), inline: true },
				{ name: '📈 Évolution', value: this.getEvolutionText(stats.evolution), inline: true },
			);
			break;

		case 'messages':
			embed.addFields(
				{ name: '💬 Messages totaux', value: stats.messages.toString(), inline: true },
				{ name: '📊 Moyenne/jour', value: Math.round(stats.messagesPerDay || 0).toString(), inline: true },
				{ name: '⏰ Pic d\'activité', value: stats.peakHour || 'N/A', inline: true },
			);

			if (stats.topChannels && stats.topChannels.length > 0) {
				const topChannels = stats.topChannels
					.slice(0, 5)
					.map((ch, i) => `${i + 1}. <#${ch.id}> (${ch.messages} messages)`)
					.join('\n');
				embed.addFields({ name: '🏆 Top Canaux', value: topChannels, inline: false });
			}
			break;

		case 'members':
			embed.addFields(
				{ name: '👥 Membres totaux', value: guild.memberCount.toString(), inline: true },
				{ name: '🆕 Nouveaux membres', value: stats.newMembers.toString(), inline: true },
				{ name: '👋 Membres partis', value: stats.leftMembers.toString(), inline: true },
				{ name: '💬 Membres actifs', value: stats.activeMembers.toString(), inline: true },
				{ name: '📊 Taux d\'activité', value: `${Math.round((stats.activeMembers / guild.memberCount) * 100)}%`, inline: true },
				{ name: '📈 Croissance', value: `${stats.newMembers - stats.leftMembers > 0 ? '+' : ''}${stats.newMembers - stats.leftMembers}`, inline: true },
			);

			if (stats.topMembers && stats.topMembers.length > 0) {
				const topMembers = stats.topMembers
					.slice(0, 5)
					.map((member, i) => `${i + 1}. <@${member.id}> (${member.messages} messages)`)
					.join('\n');
				embed.addFields({ name: '🏆 Top Membres', value: topMembers, inline: false });
			}
			break;

		case 'channels':
			if (stats.channelStats && stats.channelStats.length > 0) {
				const channelList = stats.channelStats
					.slice(0, 10)
					.map((ch, i) => `${i + 1}. <#${ch.id}> - ${ch.messages} messages`)
					.join('\n');
				embed.addFields({ name: '📊 Activité par canal', value: channelList, inline: false });
			}

			embed.addFields(
				{ name: '📊 Canaux actifs', value: stats.activeChannels.toString(), inline: true },
				{ name: '📈 Canal le plus actif', value: stats.topChannel ? `<#${stats.topChannel.id}>` : 'N/A', inline: true },
				{ name: '💬 Messages moyens/canal', value: Math.round(stats.messages / stats.activeChannels || 0).toString(), inline: true },
			);
			break;
		}

		// Ajouter des informations sur les alertes si nécessaire
		if (stats.alerts && stats.alerts.length > 0) {
			const alertText = stats.alerts.map(alert => `⚠️ ${alert}`).join('\n');
			embed.addFields({ name: '🚨 Alertes', value: alertText, inline: false });
		}

		return embed;
	},

	getPeriodLabel(period) {
		const labels = {
			'daily': 'Aujourd\'hui',
			'weekly': 'Cette semaine',
			'monthly': 'Ce mois',
			'all': 'Tout le temps',
		};
		return labels[period] || period;
	},

	getEvolutionText(evolution) {
		if (!evolution) return 'N/A';

		const percentage = Math.round(evolution.percentage || 0);
		const emoji = percentage > 0 ? '📈' : percentage < 0 ? '📉' : '➡️';
		const sign = percentage > 0 ? '+' : '';

		return `${emoji} ${sign}${percentage}%`;
	},
};