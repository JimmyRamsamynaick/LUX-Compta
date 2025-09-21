const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');

const config = require('../../../config.json');

// Fonction utilitaire pour créer le nouveau format de réponse
function createResponse(title, content) {
	return {
		flags: 32768,
		components: [{
			type: 1,
			components: [{
				type: 17,
				title: title,
				content: content
			}]
		}]
	};
}

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
				
			});
		}
	},

	async createStatsResponse(stats, periode, type, guild) {

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
				content += '🏆 **Top Canaux:**\n';
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
				content += '🏆 **Top Membres:**\n';
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
				content += '📊 **Activité par canal:**\n';
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
			content += '🚨 **Alertes:**\n';
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
					emoji: '📊',
				},
				{
					label: 'Messages',
					description: 'Statistiques des messages',
					value: 'messages',
					emoji: '💬',
				},
				{
					label: 'Membres',
					description: 'Statistiques des membres',
					value: 'members',
					emoji: '👥',
				},
				{
					label: 'Canaux',
					description: 'Statistiques des canaux',
					value: 'channels',
					emoji: '📊',
				},
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
					.setEmoji('📈'),
			);

		return {
			content: content,
			components: [selectRow, buttons],
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

	async handleRefresh(interaction) {
		await interaction.deferUpdate();

		try {
			// Actualiser les statistiques
			await this.client.statsManager.updateStats();

			// Réafficher les statistiques avec les nouvelles données
			const period = 'daily'; // Par défaut
			const type = 'general'; // Par défaut
			await this.showStats(interaction, period, type, true);

		} catch (error) {
			console.error('❌ Erreur lors de l\'actualisation:', error);
			await interaction.editReply({
				content: '❌ Erreur lors de l\'actualisation des statistiques.',
				components: []
			});
		}
	},

	async handleStatsButton(interaction) {
		const customId = interaction.customId;

		try {
			if (customId.startsWith('refresh_stats_')) {
				await this.handleRefreshStats(interaction);
			} else if (customId.startsWith('export_stats_')) {
				await this.handleExportStats(interaction);
			} else if (customId.startsWith('detailed_stats_')) {
				await this.handleDetailedStats(interaction);
			} else if (customId === 'stats_help') {
				await this.showStatsHelp(interaction);
			} else if (customId === 'stats_config') {
				await this.showStatsConfig(interaction);
			}
		} catch (error) {
			console.error('Erreur dans handleStatsButton:', error);
			await interaction.reply({
				content: '❌ Une erreur est survenue lors du traitement de votre demande.',
				ephemeral: true
			});
		}
	},

	async handleRefreshStats(interaction) {
		await interaction.deferUpdate();

		try {
			// Actualiser les statistiques
			await this.client.statsManager.updateStats();

			let content = '🔄 **STATISTIQUES ACTUALISÉES** 🔄\n\n';
			content += '✅ Les données ont été mises à jour avec succès !\n';
			content += `⏰ Dernière mise à jour: <t:${Math.floor(Date.now() / 1000)}:F>\n\n`;
			content += '📊 Vous pouvez maintenant consulter les statistiques les plus récentes.';

			await interaction.editReply({
				content: content,
				components: []
			});

		} catch (error) {
			console.error('❌ Erreur lors de l\'actualisation:', error);
			await interaction.editReply({
				content: '❌ Erreur lors de l\'actualisation des statistiques.',
				components: []
			});
		}
	},

	async handleExportStats(interaction) {
		await interaction.deferUpdate();

		try {
			const stats = await this.client.statsManager.getStats();
			const csvData = this.generateCSV(stats);
			
			// Créer un fichier temporaire
			const fs = require('fs-extra');
			const path = require('path');
			const { AttachmentBuilder } = require('discord.js');
			
			const filename = `stats_export_${Date.now()}.csv`;
			const filepath = path.join(process.cwd(), 'temp', filename);
			
			// Créer le dossier temp s'il n'existe pas
			await fs.ensureDir(path.dirname(filepath));
			await fs.writeFile(filepath, csvData);

			const attachment = new AttachmentBuilder(filepath, { name: filename });

			let content = '📊 **EXPORT DES STATISTIQUES** 📊\n\n';
			content += '✅ Export généré avec succès !\n';
			content += `📁 Fichier: ${filename}\n`;
			content += `⏰ Généré le: <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.editReply({
				content: content,
				files: [attachment],
				components: []
			});

			// Nettoyer le fichier temporaire après envoi
			setTimeout(async () => {
				try {
					await fs.remove(filepath);
				} catch (err) {
					console.error('Erreur lors de la suppression du fichier temporaire:', err);
				}
			}, 5000);

		} catch (error) {
			console.error('❌ Erreur lors de l\'export:', error);
			await interaction.editReply({
				content: '❌ Erreur lors de l\'export des statistiques.',
				components: []
			});
		}
	},

	async handleDetailedStats(interaction) {
		await interaction.deferUpdate();

		try {
			const stats = await this.client.statsManager.getDetailedStats();

			let content = '📈 **STATISTIQUES DÉTAILLÉES** 📈\n\n';
			
			// Statistiques des messages
			if (stats.messages) {
				content += '💬 **Messages:**\n';
				content += `• Total: ${stats.messages.total || 0}\n`;
				content += `• Aujourd'hui: ${stats.messages.today || 0}\n`;
				content += `• Cette semaine: ${stats.messages.week || 0}\n`;
				content += `• Ce mois: ${stats.messages.month || 0}\n\n`;
			}

			// Statistiques des membres
			if (stats.members) {
				content += '👥 **Membres:**\n';
				content += `• Total: ${stats.members.total || 0}\n`;
				content += `• En ligne: ${stats.members.online || 0}\n`;
				content += `• Nouveaux (7j): ${stats.members.new_week || 0}\n`;
				content += `• Nouveaux (30j): ${stats.members.new_month || 0}\n\n`;
			}

			// Statistiques des canaux
			if (stats.channels) {
				content += '📺 **Canaux:**\n';
				content += `• Total: ${stats.channels.total || 0}\n`;
				content += `• Actifs: ${stats.channels.active || 0}\n`;
				content += `• Plus actif: ${stats.channels.most_active || 'N/A'}\n\n`;
			}

			content += `⏰ Données du: <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.editReply({
				content: content,
				components: []
			});

		} catch (error) {
			console.error('❌ Erreur lors de la récupération des stats détaillées:', error);
			await interaction.editReply({
				content: '❌ Erreur lors de la récupération des statistiques détaillées.',
				components: []
			});
		}
	},

	async showStatsHelp(interaction) {
		let content = '❓ **AIDE - STATISTIQUES** ❓\n\n';
		content += '📊 **Fonctionnalités disponibles:**\n';
		content += '• **Actualiser** - Met à jour les données en temps réel\n';
		content += '• **Exporter** - Télécharge un fichier CSV\n';
		content += '• **Détaillées** - Affiche plus d\'informations\n\n';
		content += '🔧 **Utilisation:**\n';
		content += '• Utilisez les boutons pour interagir\n';
		content += '• Les données sont mises à jour automatiquement\n';
		content += '• L\'export inclut toutes les données disponibles\n\n';
		content += '💡 **Conseil:** Actualisez régulièrement pour avoir les données les plus récentes.';

		await interaction.update({
			content: content,
			components: []
		});
	},

	async showStatsConfig(interaction) {
		let content = '⚙️ **CONFIGURATION - STATISTIQUES** ⚙️\n\n';
		content += '🔧 **Paramètres actuels:**\n';
		content += '• Mise à jour automatique: Activée\n';
		content += '• Fréquence: Toutes les 5 minutes\n';
		content += '• Rétention: 30 jours\n';
		content += '• Format export: CSV\n\n';
		content += '📊 **Types de données collectées:**\n';
		content += '• Messages par canal\n';
		content += '• Activité des membres\n';
		content += '• Statistiques temporelles\n';
		content += '• Données d\'engagement\n\n';
		content += '💾 **Stockage:** Les données sont sauvegardées localement et dans le cloud.';

		await interaction.update({
			content: content,
			components: []
		});
	},

	generateCSV(stats) {
		let csv = 'Type,Période,Valeur,Date\n';
		
		// Ajouter les données des messages
		if (stats.messages) {
			Object.entries(stats.messages).forEach(([period, value]) => {
				csv += `Messages,${period},${value},${new Date().toISOString()}\n`;
			});
		}

		// Ajouter les données des membres
		if (stats.members) {
			Object.entries(stats.members).forEach(([period, value]) => {
				csv += `Membres,${period},${value},${new Date().toISOString()}\n`;
			});
		}

		// Ajouter les données des canaux
		if (stats.channels) {
			Object.entries(stats.channels).forEach(([period, value]) => {
				csv += `Canaux,${period},${value},${new Date().toISOString()}\n`;
			});
		}

		return csv;
	},

};