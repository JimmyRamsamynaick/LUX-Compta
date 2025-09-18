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
			const { content, components } = await this.createStatsResponse(stats, periode, type, interaction.guild);

			await interaction.editReply({
				content: content,
				components: components,
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

	async createStatsResponse(stats, periode, type, guild) {
		const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle } = require('discord.js');

		let content = `📊 **STATISTIQUES - ${guild.name.toUpperCase()}** 📊\n\n`;
		content += `📅 **Période:** ${this.getPeriodLabel(periode)}\n`;
		content += `📋 **Type:** ${this.getTypeLabel(type)}\n\n`;

		switch (type) {
		case 'general':
			content += `📈 **Messages totaux:** ${stats.messages}\n`;
			content += `👥 **Membres actifs:** ${stats.activeMembers}\n`;
			content += `📊 **Canaux actifs:** ${stats.activeChannels}\n`;
			content += `📅 **Nouveaux membres:** ${stats.newMembers}\n`;
			content += `👋 **Membres partis:** ${stats.leftMembers}\n`;
			content += `📈 **Évolution:** ${this.getEvolutionText(stats.evolution)}\n\n`;
			break;

		case 'messages':
			content += `💬 **Messages totaux:** ${stats.messages}\n`;
			content += `📊 **Moyenne/jour:** ${Math.round(stats.messagesPerDay || 0)}\n`;
			content += `⏰ **Pic d'activité:** ${stats.peakHour || 'N/A'}\n\n`;

			if (stats.topChannels && stats.topChannels.length > 0) {
				content += `🏆 **Top Canaux:**\n`;
				const topChannels = stats.topChannels
					.slice(0, 5)
					.map((ch, i) => `${i + 1}. <#${ch.id}> (${ch.messages} messages)`)
					.join('\n');
				content += topChannels + '\n\n';
			}
			break;

		case 'members':
			content += `👥 **Membres totaux:** ${guild.memberCount}\n`;
			content += `🆕 **Nouveaux membres:** ${stats.newMembers}\n`;
			content += `👋 **Membres partis:** ${stats.leftMembers}\n`;
			content += `💬 **Membres actifs:** ${stats.activeMembers}\n`;
			content += `📊 **Taux d'activité:** ${Math.round((stats.activeMembers / guild.memberCount) * 100)}%\n`;
			content += `📈 **Croissance:** ${stats.newMembers - stats.leftMembers > 0 ? '+' : ''}${stats.newMembers - stats.leftMembers}\n\n`;

			if (stats.topMembers && stats.topMembers.length > 0) {
				content += `🏆 **Top Membres:**\n`;
				const topMembers = stats.topMembers
					.slice(0, 5)
					.map((member, i) => `${i + 1}. <@${member.id}> (${member.messages} messages)`)
					.join('\n');
				content += topMembers + '\n\n';
			}
			break;

		case 'channels':
			content += `📊 **Canaux actifs:** ${stats.activeChannels}\n`;
			content += `📈 **Canal le plus actif:** ${stats.topChannel ? `<#${stats.topChannel.id}>` : 'N/A'}\n`;
			content += `💬 **Messages moyens/canal:** ${Math.round(stats.messages / stats.activeChannels || 0)}\n\n`;

			if (stats.channelStats && stats.channelStats.length > 0) {
				content += `📊 **Activité par canal:**\n`;
				const channelList = stats.channelStats
					.slice(0, 10)
					.map((ch, i) => `${i + 1}. <#${ch.id}> - ${ch.messages} messages`)
					.join('\n');
				content += channelList + '\n\n';
			}
			break;
		}

		// Ajouter des informations sur les alertes si nécessaire
		if (stats.alerts && stats.alerts.length > 0) {
			content += `🚨 **Alertes:**\n`;
			const alertText = stats.alerts.map(alert => `⚠️ ${alert}`).join('\n');
			content += alertText + '\n\n';
		}

		content += `⏰ **Dernière mise à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

		// Menu de sélection pour changer de type (Type 17)
		const typeSelect = new StringSelectMenuBuilder()
			.setCustomId('stats_type_select')
			.setPlaceholder('Changer le type de statistiques...')
			.addOptions([
				{
					label: 'Général',
					description: 'Vue d\'ensemble des statistiques',
					value: 'general',
					emoji: '📊'
				},
				{
					label: 'Messages',
					description: 'Statistiques des messages',
					value: 'messages',
					emoji: '💬'
				},
				{
					label: 'Membres',
					description: 'Statistiques des membres',
					value: 'members',
					emoji: '👥'
				},
				{
					label: 'Canaux',
					description: 'Statistiques des canaux',
					value: 'channels',
					emoji: '📊'
				}
			]);

		const selectRow = new ActionRowBuilder().addComponents(typeSelect);

		// Boutons d'action (Type 10)
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
					.setEmoji('📈')
			);

		return {
			content: content,
			components: [selectRow, buttons]
		};
	},

	getTypeLabel(type) {
		const labels = {
			'general': 'Général',
			'messages': 'Messages',
			'members': 'Membres',
			'channels': 'Canaux',
		};
		return labels[type] || type;
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