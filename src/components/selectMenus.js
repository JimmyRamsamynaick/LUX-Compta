const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	// Gestionnaire pour le sélecteur de période (Type 17)
	async handlePeriodSelect(interaction) {
		const selectedPeriod = interaction.values[0];
		const statsManager = interaction.client.statsManager;
		const reportManager = interaction.client.reportManager;

		await interaction.deferUpdate();

		try {
			// Récupérer les statistiques pour la période sélectionnée
			const stats = await statsManager.getStats(selectedPeriod);

			// Créer l'embed avec les nouvelles données
			const embed = new EmbedBuilder()
				.setTitle(`📊 Statistiques - ${this.getPeriodLabel(selectedPeriod)}`)
				.setDescription(`Données pour **${interaction.guild.name}**`)
				.setColor('#0099ff')
				.setTimestamp()
				.setThumbnail(interaction.guild.iconURL())
				.setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

			// Ajouter les champs de statistiques
			embed.addFields(
				{ name: '📈 Messages totaux', value: stats.messages.toString(), inline: true },
				{ name: '👥 Membres actifs', value: stats.activeMembers.toString(), inline: true },
				{ name: '📊 Canaux actifs', value: stats.activeChannels.toString(), inline: true },
				{ name: '📅 Nouveaux membres', value: stats.newMembers.toString(), inline: true },
				{ name: '👋 Membres partis', value: stats.leftMembers.toString(), inline: true },
				{ name: '📈 Évolution', value: this.getEvolutionText(stats.evolution), inline: true },
			);

			// Top membres si disponible
			if (stats.topMembers && stats.topMembers.length > 0) {
				const topMembers = stats.topMembers
					.slice(0, 5)
					.map((member, i) => `${i + 1}. <@${member.id}> (${member.messages} messages)`)
					.join('\n');
				embed.addFields({ name: '🏆 Top Membres', value: topMembers, inline: false });
			}

			// Top canaux si disponible
			if (stats.topChannels && stats.topChannels.length > 0) {
				const topChannels = stats.topChannels
					.slice(0, 5)
					.map((channel, i) => `${i + 1}. <#${channel.id}> (${channel.messages} messages)`)
					.join('\n');
				embed.addFields({ name: '🏆 Top Canaux', value: topChannels, inline: false });
			}

			// Créer les nouveaux boutons d'action pour la période sélectionnée
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId(`download_report_${selectedPeriod}`)
						.setLabel('Télécharger')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('📥'),
					new ButtonBuilder()
						.setCustomId(`email_report_${selectedPeriod}`)
						.setLabel('Envoyer par mail')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📧'),
					new ButtonBuilder()
						.setCustomId(`view_report_${selectedPeriod}`)
						.setLabel('Visualiser')
						.setStyle(ButtonStyle.Success)
						.setEmoji('👁️'),
					new ButtonBuilder()
						.setCustomId(`refresh_stats_${selectedPeriod}`)
						.setLabel('Actualiser')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('🔄'),
				);

			// Garder le menu de sélection original
			const originalComponents = interaction.message.components;
			const selectMenuRow = originalComponents[0]; // Le menu de sélection est généralement en premier

			await interaction.editReply({
				embeds: [embed],
				components: [selectMenuRow, buttons],
			});

		}
		catch (error) {
			console.error('Erreur lors de la sélection de période:', error);
			await interaction.followUp({
				content: '❌ Erreur lors de la récupération des données pour cette période.',
				ephemeral: true,
			});
		}
	},

	// Gestionnaire pour le sélecteur de catégorie d'aide
	async handleHelpCategorySelect(interaction) {
		const selectedCategory = interaction.values[0];
		const helpCommand = interaction.client.commands.get('help');

		if (helpCommand && helpCommand.handleCategorySelect) {
			await helpCommand.handleCategorySelect(interaction, selectedCategory);
		}
		else {
			await interaction.update({
				content: '❌ Erreur lors du chargement de l\'aide pour cette catégorie.',
				components: [],
			});
		}
	},

	// Gestionnaire pour le sélecteur de type de rapport
	async handleReportTypeSelect(interaction) {
		const selectedType = interaction.values[0];
		const reportManager = interaction.client.reportManager;

		await interaction.deferUpdate();

		try {
			const reports = await reportManager.listReports(selectedType);

			const embed = new EmbedBuilder()
				.setTitle(`📋 Rapports - ${this.getTypeLabel(selectedType)}`)
				.setDescription(`Liste des rapports de type ${selectedType}`)
				.setColor('#0099ff')
				.setTimestamp()
				.setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

			if (reports.length === 0) {
				embed.addFields({ name: 'Aucun rapport', value: 'Aucun rapport de ce type n\'est disponible.', inline: false });
			}
			else {
				const reportList = reports
					.slice(0, 10)
					.map((report, i) => `${i + 1}. ${report.name} (${report.size}) - ${report.date}`)
					.join('\n');
				embed.addFields({ name: 'Rapports disponibles', value: reportList, inline: false });
			}

			// Boutons pour actions sur les rapports
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId(`download_latest_${selectedType}`)
						.setLabel('Télécharger le plus récent')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('📥'),
					new ButtonBuilder()
						.setCustomId(`archive_type_${selectedType}`)
						.setLabel('Archiver ce type')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📦'),
					new ButtonBuilder()
						.setCustomId('refresh_report_list')
						.setLabel('Actualiser')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('🔄'),
				);

			const originalComponents = interaction.message.components;
			const selectMenuRow = originalComponents[0];

			await interaction.editReply({
				embeds: [embed],
				components: [selectMenuRow, buttons],
			});

		}
		catch (error) {
			console.error('Erreur lors de la sélection de type de rapport:', error);
			await interaction.followUp({
				content: '❌ Erreur lors de la récupération des rapports.',
				ephemeral: true,
			});
		}
	},

	// Fonctions utilitaires
	getPeriodLabel(period) {
		const labels = {
			'daily': 'Aujourd\'hui',
			'weekly': 'Cette semaine',
			'monthly': 'Ce mois',
			'all': 'Tout le temps',
		};
		return labels[period] || period;
	},

	getTypeLabel(type) {
		const labels = {
			'daily': 'Rapports quotidiens',
			'weekly': 'Rapports hebdomadaires',
			'monthly': 'Rapports mensuels',
			'general': 'Rapports généraux',
			'stats': 'Statistiques',
			'members': 'Membres',
			'channels': 'Canaux',
		};
		return labels[type] || type;
	},

	getEvolutionText(evolution) {
		if (!evolution) return 'N/A';

		const percentage = Math.round(evolution.percentage || 0);
		const emoji = percentage > 0 ? '📈' : percentage < 0 ? '📉' : '➡️';
		const sign = percentage > 0 ? '+' : '';

		return `${emoji} ${sign}${percentage}%`;
	},
};