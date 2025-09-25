const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const ComponentBuilder = require('../../utils/componentBuilder');
const CustomEmbedBuilder = require('../../utils/embedBuilder');

const config = require('../../../config.json');

// Fonction pour créer le nouveau format de réponse avec embed
function createResponse(title, content, components = [], files = [], type = 'info') {
	let embed;
	
	switch (type) {
		case 'success':
			embed = CustomEmbedBuilder.createSuccess(title, content);
			break;
		case 'error':
			embed = CustomEmbedBuilder.createError(title, content);
			break;
		case 'warning':
			embed = CustomEmbedBuilder.createWarning(title, content);
			break;
		case 'config':
			embed = CustomEmbedBuilder.createConfig(title, typeof content === 'object' ? content : {});
			if (typeof content === 'string') embed.setDescription(content);
			break;
		default:
			embed = CustomEmbedBuilder.createInfo(title, content);
	}
	
	return CustomEmbedBuilder.createResponse(embed, components, files);
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

		try {
			// Defer immédiatement pour éviter l'expiration
			if (!interaction.replied && !interaction.deferred) {
				await interaction.deferReply();
			}

			const stats = await statsManager.getStats(periode);
			const { content, components } = await this.createStatsResponse(stats, periode, type, interaction.guild);

			await interaction.editReply(createResponse(
				'Statistiques du Serveur',
				content,
				components
			));

		}
		catch (error) {
			console.error('Erreur lors de la récupération des statistiques:', error);
			
			try {
				// Vérifier l'état de l'interaction avant de tenter une réponse
				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content: '❌ Une erreur est survenue lors de la récupération des statistiques.',
						flags: 64 // MessageFlags.Ephemeral
					});
				} else if (interaction.deferred && !interaction.replied) {
					await interaction.editReply({
						content: '❌ Une erreur est survenue lors de la récupération des statistiques.'
					});
				}
				// Si l'interaction a déjà été répondue, ne rien faire
			} catch (errorHandlingError) {
				console.error('Erreur lors de l\'envoi de la réponse d\'erreur:', errorHandlingError);
			}
		}
	},

	async createStatsResponse(stats, periode, type, guild) {
		// Vérifier que stats existe et initialiser les valeurs par défaut si nécessaire
		if (!stats) {
			stats = {
				messages: 0,
				membersJoined: 0,
				membersLeft: 0,
				totalMembers: 0,
				voiceMinutes: 0,
				reactions: 0
			};
		}

		let content = `📊 **STATISTIQUES - ${guild.name.toUpperCase()}** 📊\n\n`;
		content += `📅 **Période:** ${this.getPeriodLabel(periode)}\n`;
		content += `📋 **Type:** ${this.getTypeLabel(type)}\n\n`;

		switch (type) {
		case 'general':
			content += `📈 **Messages totaux:** ${stats.messages || 0}\n`;
			content += `👥 **Membres actifs:** ${stats.activeMembers || 0}\n`;
			content += `📊 **Canaux actifs:** ${stats.activeChannels || 0}\n`;
			content += `📅 **Nouveaux membres:** ${stats.newMembers || stats.membersJoined || 0}\n`;
			content += `👋 **Membres partis:** ${stats.leftMembers || stats.membersLeft || 0}\n`;
			content += `📈 **Évolution:** ${this.getEvolutionText(stats.evolution)}\n\n`;
			break;

		case 'messages':
			content += `💬 **Messages totaux:** ${stats.messages || 0}\n`;
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
			content += `🆕 **Nouveaux membres:** ${stats.newMembers || stats.membersJoined || 0}\n`;
			content += `👋 **Membres partis:** ${stats.leftMembers || stats.membersLeft || 0}\n`;
			content += `💬 **Membres actifs:** ${stats.activeMembers || 0}\n`;
			content += `📊 **Taux d'activité:** ${Math.round(((stats.activeMembers || 0) / guild.memberCount) * 100)}%\n`;
			content += `📈 **Croissance:** ${(stats.newMembers || stats.membersJoined || 0) - (stats.leftMembers || stats.membersLeft || 0) > 0 ? '+' : ''}${(stats.newMembers || stats.membersJoined || 0) - (stats.leftMembers || stats.membersLeft || 0)}\n\n`;

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
			content += `📊 **Canaux actifs:** ${stats.activeChannels || 0}\n`;
			content += `📈 **Canal le plus actif:** ${stats.topChannel ? `<#${stats.topChannel.id}>` : 'N/A'}\n`;
			content += `💬 **Messages moyens/canal:** ${Math.round((stats.messages || 0) / (stats.activeChannels || 1))}\n\n`;

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

		// Menu de sélection pour changer de type (Type 17) - Utilisation de ComponentBuilder
		const typeSelect = ComponentBuilder.createSelectMenu(
			'stats_type_select',
			'Changer le type de statistiques...',
			[
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
			]
		);

		// Boutons d'action (Type 10) - Utilisation de ComponentBuilder
		const buttons = ComponentBuilder.createActionButtons([
			{
				customId: `refresh_stats_${periode}_${type}`,
				label: 'Actualiser',
				style: 'PRIMARY',
				emoji: '🔄'
			},
			{
				customId: `export_stats_${periode}`,
				label: 'Exporter CSV',
				style: 'SECONDARY',
				emoji: '📊'
			},
			{
				customId: `detailed_stats_${periode}`,
				label: 'Détails',
				style: 'SUCCESS',
				emoji: '📈'
			}
		]);

		return {
			content: content,
			components: [typeSelect, buttons],
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
			await this.client.statsManager.loadStats();

			// Réafficher les statistiques avec les nouvelles données
			const period = 'daily'; // Par défaut
			const type = 'general'; // Par défaut
			await this.showStats(interaction, period, type, true);

		} catch (error) {
			console.error('❌ Erreur lors de l\'actualisation:', error);
			await interaction.editReply(createResponse(
				'Erreur',
				'❌ Erreur lors de l\'actualisation des statistiques.'
			));
		}
	},

	async handleComponents(interaction) {
		const InteractionHandler = require('../../utils/interactionHandler');
		
		// Vérifier si l'interaction est encore valide
		if (!InteractionHandler.isInteractionValid(interaction)) {
			try {
				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content: '❌ Cette interaction a expiré. Veuillez relancer la commande `/stats`.',
						flags: 64 // MessageFlags.Ephemeral
					});
				}
			} catch (error) {
				console.error('Erreur lors de la réponse d\'interaction expirée:', error);
			}
			return;
		}

		try {
			// Gérer les différents types d'interactions
			if (interaction.isButton()) {
				await this.handleStatsButton(interaction);
			} else if (interaction.isStringSelectMenu()) {
				await this.handleStatsSelectMenu(interaction);
			} else {
				// Type d'interaction non supporté
				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
					content: '❌ Type d\'interaction non supporté.',
					flags: 64 // MessageFlags.Ephemeral
				});
				}
			}
		} catch (error) {
			console.error('Erreur dans handleComponents:', error);
			await InteractionHandler.handleError(interaction, error);
		}
	},

	async handleStatsSelectMenu(interaction) {
		const InteractionHandler = require('../../utils/interactionHandler');
		
		try {
			// Vérifier si l'interaction est valide
			if (!InteractionHandler.isInteractionValid(interaction)) {
				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
					content: '⚠️ Cette interaction a expiré. Veuillez utiliser la commande `/stats` à nouveau.',
					flags: 64 // MessageFlags.Ephemeral
				});
				}
				return;
			}

			// Différer l'interaction pour les menus déroulants
			if (!interaction.deferred && !interaction.replied) {
				await interaction.deferUpdate();
			}

			const selectedValue = interaction.values[0];
			
			// Traiter la sélection selon le customId
			if (interaction.customId.includes('period')) {
				// Changement de période
				const type = 'general'; // Par défaut
				const stats = await interaction.client.statsManager.getStats(selectedValue);
				const { content, components } = await this.createStatsResponse(stats, selectedValue, type, interaction.guild);
				
				await interaction.editReply(createResponse(
					'Statistiques du Serveur',
					content,
					components
				));
			} else if (interaction.customId.includes('type')) {
				// Changement de type
				const period = 'daily'; // Par défaut
				const stats = await interaction.client.statsManager.getStats(period);
				const { content, components } = await this.createStatsResponse(stats, period, selectedValue, interaction.guild);
				
				await interaction.editReply(createResponse(
					'Statistiques du Serveur',
					content,
					components
				));
			}
		} catch (error) {
			console.error('Erreur dans handleStatsSelectMenu:', error);
			await InteractionHandler.handleError(interaction, error);
		}
	},

	async handleStatsButton(interaction) {
		try {
			// Vérifier si l'interaction n'a pas déjà été traitée
			if (interaction.replied || interaction.deferred) {
				console.warn('Interaction déjà traitée dans handleStatsButton');
				return;
			}

			// Différer l'interaction immédiatement pour éviter l'expiration
			await interaction.deferUpdate();

			const customId = interaction.customId;

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
			// Gestion d'erreur simplifiée pour éviter les doubles acknowledgements
			try {
				if (!interaction.replied && interaction.deferred) {
					await interaction.editReply({
						content: '❌ Une erreur est survenue lors du traitement de votre demande.'
					});
				}
			} catch (errorHandlingError) {
				console.error('Erreur lors de la gestion d\'erreur:', errorHandlingError);
			}
		}
	},

	async handleRefreshStats(interaction) {
		const InteractionHandler = require('../../utils/interactionHandler');
		
		try {
			// Vérifier si l'interaction est encore valide
			if (!InteractionHandler.isInteractionValid(interaction)) {
				return;
			}

			// Vérifier si l'interaction n'a pas déjà été traitée
			if (interaction.replied || interaction.deferred) {
				console.warn('Interaction déjà traitée dans handleRefreshStats');
				return;
			}

			// Différer la réponse pour éviter les timeouts
			await interaction.deferUpdate();

			// Actualiser les statistiques
			await interaction.client.statsManager.loadStats();

			// Réafficher les statistiques avec les nouvelles données
			const period = 'daily'; // Par défaut
			const type = 'general'; // Par défaut
			const stats = await interaction.client.statsManager.getStats(period);
			const { content, components } = await this.createStatsResponse(stats, period, type, interaction.guild);

			await interaction.editReply(createResponse(
				'Statistiques du Serveur',
				content,
				components
			));

		} catch (error) {
			console.error('❌ Erreur lors de l\'actualisation:', error);
			await InteractionHandler.handleError(interaction, error, true);
		}
	},

	async handleExportStats(interaction) {
		const InteractionHandler = require('../../utils/interactionHandler');
		
		try {
			// Vérifier si l'interaction est valide et n'a pas déjà été traitée
			if (!InteractionHandler.isInteractionValid(interaction)) {
				console.warn('Interaction expirée dans handleExportStats');
				return;
			}

			if (interaction.replied || interaction.deferred) {
				console.warn('Interaction déjà traitée dans handleExportStats');
				return;
			}

			await interaction.deferUpdate();

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

			await interaction.editReply(createResponse(
				'Export des Statistiques',
				content,
				[],
				[attachment]
			));

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
			
			// Vérifier si on peut encore répondre à l'interaction
			if (!interaction.replied && interaction.deferred) {
				try {
					await interaction.editReply(createResponse(
						'Erreur',
						'❌ Erreur lors de l\'export des statistiques.'
					));
				} catch (replyError) {
					console.error('Erreur lors de la réponse d\'erreur:', replyError);
				}
			}
		}
	},

	async handleDetailedStats(interaction) {
		const InteractionHandler = require('../../utils/interactionHandler');
		
		try {
			// Vérifier si l'interaction est valide et n'a pas déjà été traitée
			if (!InteractionHandler.isInteractionValid(interaction)) {
				console.warn('Interaction expirée dans handleDetailedStats');
				return;
			}

			if (interaction.replied || interaction.deferred) {
				console.warn('Interaction déjà traitée dans handleDetailedStats');
				return;
			}

			await interaction.deferUpdate();

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

			await interaction.editReply(createResponse(
				'Statistiques Détaillées',
				content
			));

		} catch (error) {
			console.error('❌ Erreur lors de la récupération des stats détaillées:', error);
			await interaction.editReply(createResponse(
				'Erreur',
				'❌ Erreur lors de la récupération des statistiques détaillées.'
			));
		}
	},

	async showStatsHelp(interaction) {
		const InteractionHandler = require('../../utils/interactionHandler');
		
		try {
			// Vérifier si l'interaction est valide et n'a pas déjà été traitée
			if (!InteractionHandler.isInteractionValid(interaction)) {
				console.warn('Interaction expirée dans showStatsHelp');
				return;
			}

			if (interaction.replied || interaction.deferred) {
				console.warn('Interaction déjà traitée dans showStatsHelp');
				return;
			}

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

			await interaction.update(createResponse(
				'Aide Statistiques',
				content
			));
		} catch (error) {
			console.error('❌ Erreur dans showStatsHelp:', error);
		}
	},

	async showStatsConfig(interaction) {
		const InteractionHandler = require('../../utils/interactionHandler');
		
		try {
			// Vérifier si l'interaction est valide et n'a pas déjà été traitée
			if (!InteractionHandler.isInteractionValid(interaction)) {
				console.warn('Interaction expirée dans showStatsConfig');
				return;
			}

			if (interaction.replied || interaction.deferred) {
				console.warn('Interaction déjà traitée dans showStatsConfig');
				return;
			}

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

			await interaction.update(createResponse(
				'Configuration Statistiques',
				content
			));
		} catch (error) {
			console.error('❌ Erreur dans showStatsConfig:', error);
		}
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