const { EmbedBuilder, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
	// Gestionnaire pour les boutons de téléchargement de rapport (Type 10)
	async handleDownloadReport(interaction, period) {
		const reportManager = interaction.client.reportManager;

		await interaction.deferReply({ ephemeral: true });

		try {
			// Générer le rapport s'il n'existe pas déjà
			const reportPath = await reportManager.generateReport(period, interaction.guild);

			// Vérifier que le fichier existe
			const fileExists = await fs.access(reportPath).then(() => true).catch(() => false);

			if (!fileExists) {
				return interaction.editReply({
					content: '❌ Erreur lors de la génération du rapport.',
					ephemeral: true,
				});
			}

			// Créer l'attachment pour le téléchargement
			const attachment = new AttachmentBuilder(reportPath, {
				name: `rapport_${period}_${new Date().toISOString().split('T')[0]}.csv`,
			});

			const embed = new EmbedBuilder()
				.setTitle('📥 Rapport téléchargé')
				.setDescription(`Rapport ${this.getPeriodLabel(period)} généré avec succès`)
				.setColor('#00ff00')
				.setTimestamp()
				.setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

			await interaction.editReply({
				embeds: [embed],
				files: [attachment],
			});

		}
		catch (error) {
			console.error('Erreur lors du téléchargement du rapport:', error);
			await interaction.editReply({
				content: '❌ Erreur lors du téléchargement du rapport.',
				ephemeral: true,
			});
		}
	},

	// Gestionnaire pour l'envoi de rapport par email
	async handleEmailReport(interaction, period) {
		// Créer un modal pour demander l'adresse email
		const modal = new ModalBuilder()
			.setCustomId(`email_modal_${period}`)
			.setTitle('Envoyer le rapport par email');

		const emailInput = new TextInputBuilder()
			.setCustomId('email_address')
			.setLabel('Adresse email')
			.setStyle(TextInputStyle.Short)
			.setPlaceholder('exemple@domaine.com')
			.setRequired(true);

		const subjectInput = new TextInputBuilder()
			.setCustomId('email_subject')
			.setLabel('Sujet (optionnel)')
			.setStyle(TextInputStyle.Short)
			.setPlaceholder(`Rapport ${this.getPeriodLabel(period)} - ${interaction.guild.name}`)
			.setRequired(false);

		const messageInput = new TextInputBuilder()
			.setCustomId('email_message')
			.setLabel('Message (optionnel)')
			.setStyle(TextInputStyle.Paragraph)
			.setPlaceholder('Message personnalisé à inclure dans l\'email...')
			.setRequired(false);

		const firstActionRow = new ActionRowBuilder().addComponents(emailInput);
		const secondActionRow = new ActionRowBuilder().addComponents(subjectInput);
		const thirdActionRow = new ActionRowBuilder().addComponents(messageInput);

		modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

		await interaction.showModal(modal);
	},

	// Gestionnaire pour la visualisation de rapport
	async handleViewReport(interaction, period) {
		const statsManager = interaction.client.statsManager;
		const reportManager = interaction.client.reportManager;

		await interaction.deferReply({ ephemeral: true });

		try {
			const stats = await statsManager.getStats(period);
			const reportData = await reportManager.getReportData(period);

			const embed = new EmbedBuilder()
				.setTitle(`👁️ Visualisation - ${this.getPeriodLabel(period)}`)
				.setDescription(`Aperçu du rapport pour **${interaction.guild.name}**`)
				.setColor('#9932cc')
				.setTimestamp()
				.setThumbnail(interaction.guild.iconURL())
				.setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

			// Statistiques générales
			embed.addFields(
				{ name: '📊 Résumé général', value: `**Messages:** ${stats.messages}\n**Membres actifs:** ${stats.activeMembers}\n**Canaux actifs:** ${stats.activeChannels}`, inline: true },
				{ name: '👥 Évolution membres', value: `**Arrivées:** ${stats.newMembers}\n**Départs:** ${stats.leftMembers}\n**Net:** ${stats.newMembers - stats.leftMembers}`, inline: true },
				{ name: '📈 Activité', value: `**Pic d'activité:** ${stats.peakHour || 'N/A'}\n**Messages/jour:** ${Math.round(stats.messagesPerDay || 0)}\n**Évolution:** ${this.getEvolutionText(stats.evolution)}`, inline: true },
			);

			// Graphique textuel simple pour l'activité
			if (stats.hourlyActivity && stats.hourlyActivity.length > 0) {
				const activityChart = this.createSimpleChart(stats.hourlyActivity);
				embed.addFields({ name: '📊 Activité par heure', value: `\`\`\`${activityChart}\`\`\``, inline: false });
			}

			// Top 5 membres et canaux
			if (stats.topMembers && stats.topMembers.length > 0) {
				const topMembers = stats.topMembers
					.slice(0, 5)
					.map((member, i) => `${i + 1}. <@${member.id}> - ${member.messages} messages`)
					.join('\n');
				embed.addFields({ name: '🏆 Top 5 Membres', value: topMembers, inline: false });
			}

			if (stats.topChannels && stats.topChannels.length > 0) {
				const topChannels = stats.topChannels
					.slice(0, 5)
					.map((channel, i) => `${i + 1}. <#${channel.id}> - ${channel.messages} messages`)
					.join('\n');
				embed.addFields({ name: '🏆 Top 5 Canaux', value: topChannels, inline: false });
			}

			// Informations sur le rapport
			if (reportData) {
				embed.addFields({
					name: '📋 Informations du rapport',
					value: `**Généré le:** ${reportData.generatedAt}\n**Taille:** ${reportData.size}\n**Lignes:** ${reportData.rows}`,
					inline: false,
				});
			}

			await interaction.editReply({ embeds: [embed] });

		}
		catch (error) {
			console.error('Erreur lors de la visualisation du rapport:', error);
			await interaction.editReply({
				content: '❌ Erreur lors de la visualisation du rapport.',
				ephemeral: true,
			});
		}
	},

	// Gestionnaire pour l'actualisation des statistiques
	async handleRefreshStats(interaction, period, type = 'general') {
		const statsManager = interaction.client.statsManager;

		await interaction.deferUpdate();

		try {
			// Forcer la mise à jour des statistiques
			await statsManager.updateStats(interaction.guild);
			const stats = await statsManager.getStats(period);

			// Recréer l'embed avec les nouvelles données
			const embed = new EmbedBuilder()
				.setTitle(`📊 Statistiques actualisées - ${this.getPeriodLabel(period)}`)
				.setDescription(`Données mises à jour pour **${interaction.guild.name}**`)
				.setColor('#00ff00')
				.setTimestamp()
				.setThumbnail(interaction.guild.iconURL())
				.setFooter({ text: 'LUX Compta • Actualisé', iconURL: interaction.client.user.displayAvatarURL() });

			// Ajouter les champs selon le type
			this.addStatsFields(embed, stats, type);

			// Garder les composants existants
			const components = interaction.message.components;

			await interaction.editReply({
				embeds: [embed],
				components: components,
			});

		}
		catch (error) {
			console.error('Erreur lors de l\'actualisation:', error);
			await interaction.followUp({
				content: '❌ Erreur lors de l\'actualisation des statistiques.',
				ephemeral: true,
			});
		}
	},

	// Gestionnaire pour les boutons de configuration
	async handleConfigButton(interaction, action) {
		switch (action) {
		case 'modify':
			await this.showConfigModifyOptions(interaction);
			break;
		case 'backup':
			await this.handleConfigBackup(interaction);
			break;
		case 'reset':
			await this.handleConfigReset(interaction);
			break;
		}
	},

	// Gestionnaire pour l'envoi d'email via modal
	async handleEmailModal(interaction, period) {
		const emailManager = interaction.client.emailManager;
		const reportManager = interaction.client.reportManager;

		await interaction.deferReply({ ephemeral: true });

		try {
			const emailAddress = interaction.fields.getTextInputValue('email_address');
			const subject = interaction.fields.getTextInputValue('email_subject') ||
                           `Rapport ${this.getPeriodLabel(period)} - ${interaction.guild.name}`;
			const message = interaction.fields.getTextInputValue('email_message') ||
                           'Veuillez trouver ci-joint le rapport demandé.';

			// Générer le rapport
			const reportPath = await reportManager.generateReport(period, interaction.guild);

			// Envoyer l'email
			await emailManager.sendReport(emailAddress, subject, message, reportPath, {
				period: period,
				guild: interaction.guild.name,
				requestedBy: interaction.user.tag,
			});

			const embed = new EmbedBuilder()
				.setTitle('📧 Email envoyé')
				.setDescription(`Rapport ${this.getPeriodLabel(period)} envoyé avec succès`)
				.addFields(
					{ name: 'Destinataire', value: emailAddress, inline: true },
					{ name: 'Sujet', value: subject, inline: false },
				)
				.setColor('#00ff00')
				.setTimestamp()
				.setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

			await interaction.editReply({ embeds: [embed] });

		}
		catch (error) {
			console.error('Erreur lors de l\'envoi de l\'email:', error);
			await interaction.editReply({
				content: '❌ Erreur lors de l\'envoi de l\'email. Vérifiez la configuration email.',
				ephemeral: true,
			});
		}
	},

	// Fonctions utilitaires
	getPeriodLabel(period) {
		const labels = {
			'daily': 'Quotidien',
			'weekly': 'Hebdomadaire',
			'monthly': 'Mensuel',
			'all': 'Complet',
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

	createSimpleChart(hourlyData) {
		if (!hourlyData || hourlyData.length === 0) return 'Aucune donnée disponible';

		const maxValue = Math.max(...hourlyData);
		const chartHeight = 8;

		let chart = '';
		for (let i = 0; i < 24; i += 2) {
			const value = hourlyData[i] || 0;
			const barHeight = Math.round((value / maxValue) * chartHeight);
			const bar = '█'.repeat(barHeight) + '░'.repeat(chartHeight - barHeight);
			chart += `${i.toString().padStart(2, '0')}h |${bar}| ${value}\n`;
		}

		return chart;
	},

	addStatsFields(embed, stats, type) {
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
			break;
		case 'members':
			embed.addFields(
				{ name: '👥 Membres totaux', value: stats.totalMembers.toString(), inline: true },
				{ name: '🆕 Nouveaux membres', value: stats.newMembers.toString(), inline: true },
				{ name: '👋 Membres partis', value: stats.leftMembers.toString(), inline: true },
			);
			break;
		}
	},
};