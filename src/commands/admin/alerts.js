const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('alerts')
		.setDescription('Gérer les alertes automatiques du serveur')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand =>
			subcommand
				.setName('config')
				.setDescription('Configurer les alertes')
				.addChannelOption(option =>
					option
						.setName('canal')
						.setDescription('Canal où envoyer les alertes')
						.setRequired(false),
				)
				.addBooleanOption(option =>
					option
						.setName('activé')
						.setDescription('Activer ou désactiver les alertes')
						.setRequired(false),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('seuils')
				.setDescription('Configurer les seuils d\'alerte')
				.addStringOption(option =>
					option
						.setName('type')
						.setDescription('Type d\'alerte à configurer')
						.setRequired(true)
						.addChoices(
							{ name: 'Baisse d\'activité', value: 'activity_drop' },
							{ name: 'Perte de membres', value: 'member_loss' },
							{ name: 'Absence prolongée', value: 'absence' },
						),
				)
				.addIntegerOption(option =>
					option
						.setName('seuil')
						.setDescription('Seuil pour déclencher l\'alerte (en %)')
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(100),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('test')
				.setDescription('Tester les alertes')
				.addStringOption(option =>
					option
						.setName('type')
						.setDescription('Type d\'alerte à tester')
						.setRequired(true)
						.addChoices(
							{ name: 'Baisse d\'activité', value: 'activity_drop' },
							{ name: 'Perte de membres', value: 'member_loss' },
							{ name: 'Absence prolongée', value: 'absence' },
						),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('historique')
				.setDescription('Voir l\'historique des alertes')
				.addIntegerOption(option =>
					option
						.setName('limite')
						.setDescription('Nombre d\'alertes à afficher')
						.setRequired(false)
						.setMinValue(1)
						.setMaxValue(50),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('status')
				.setDescription('Voir le statut des alertes'),
		),

	async execute(interaction) {
		try {
			// Le bot peut toujours exécuter ses propres commandes admin
			// Pas de vérification de permissions utilisateur nécessaire

			const subcommand = interaction.options.getSubcommand();
			const alertManager = interaction.client.alertManager;

			if (!alertManager) {
				return await interaction.reply({
					content: '❌ Le gestionnaire d\'alertes n\'est pas disponible.',
				});
			}

			switch (subcommand) {
			case 'config':
				await this.handleConfig(interaction, alertManager);
				break;
			case 'seuils':
				await this.handleThresholds(interaction, alertManager);
				break;
			case 'test':
				await this.handleTest(interaction, alertManager);
				break;
			case 'historique':
				await this.handleHistory(interaction, alertManager);
				break;
			case 'status':
				await this.handleStatus(interaction, alertManager);
				break;
			}

		}
		catch (error) {
			console.error('❌ Erreur dans la commande alerts:', error);

			const errorMessage = '❌ Une erreur est survenue lors de l\'exécution de la commande.';

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: errorMessage });
			}
			else {
				await interaction.reply({ content: errorMessage });
			}
		}
	},

	async handleConfig(interaction, alertManager) {
		try {
			// Si c'est une interaction de bouton, afficher la configuration actuelle
			if (interaction.isButton()) {
				await this.showCurrentConfig(interaction, alertManager);
				return;
			}

			// Si c'est une commande slash, traiter les options
			const canal = interaction.options?.getChannel('canal');
			const activé = interaction.options?.getBoolean('activé');

			let updated = false;
			const changes = [];

			if (canal) {
				await alertManager.setAlertChannel(canal.id);
				changes.push(`Canal d'alertes: ${canal}`);
				updated = true;
			}

			if (activé !== null) {
				await alertManager.setAlertsEnabled(activé);
				changes.push(`Alertes: ${activé ? 'Activées' : 'Désactivées'}`);
				updated = true;
			}

			if (updated) {

				let content = '⚙️ **CONFIGURATION MISE À JOUR** ⚙️\n\n';
				content += '✅ **Les paramètres d\'alertes ont été modifiés avec succès !**\n\n';
				content += '📋 **Modifications effectuées:**\n';
				changes.forEach(change => {
					content += `• ${change}\n`;
				});
				content += `\n⏰ **Mis à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Boutons d'action (Type 10)
				const buttons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('alerts_config_view')
							.setLabel('Voir config')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('👁️'),
						new ButtonBuilder()
							.setCustomId('alerts_config_test')
							.setLabel('Tester')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('🧪'),
						new ButtonBuilder()
							.setCustomId('alerts_config_advanced')
							.setLabel('Avancé')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('⚙️'),
					);

				await interaction.reply({
					content: content,
					components: [buttons],
				});
			}
			else {
				// Afficher la configuration actuelle
				await this.showCurrentConfig(interaction, alertManager);
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la configuration:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la configuration des alertes.',
			});
		}
	},

	async handleThresholds(interaction, alertManager) {
		await interaction.deferReply();

		const threshold = interaction.options.getString('threshold');
		const value = interaction.options.getInteger('value');

		try {
			if (threshold && value !== null) {
				// Modifier un seuil spécifique
				const updated = await alertManager.updateThreshold(threshold, value);

				if (updated) {
					let content = '⚙️ **SEUIL MIS À JOUR** ⚙️\n\n';
					content += `✅ **Le seuil "${threshold}" a été mis à jour avec succès !**\n\n`;
					content += `📊 **Nouvelle valeur:** ${value}\n`;
					content += `⏰ **Mis à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

					// Menu de sélection pour autres seuils (Type 17)
					const thresholdSelect = new ActionRowBuilder()
						.addComponents(
							new StringSelectMenuBuilder()
								.setCustomId('alerts_threshold_select')
								.setPlaceholder('🎯 Modifier un autre seuil')
								.addOptions([
									{
										label: 'Membres actifs',
										value: 'active_members',
										emoji: '👥',
									},
									{
										label: 'Messages par heure',
										value: 'messages_per_hour',
										emoji: '💬',
									},
									{
										label: 'Nouveaux membres',
										value: 'new_members',
										emoji: '🆕',
									},
									{
										label: 'Erreurs système',
										value: 'system_errors',
										emoji: '⚠️',
									},
								]),
						);

					// Boutons d'action (Type 10)
					const buttons = new ActionRowBuilder()
						.addComponents(
							new ButtonBuilder()
								.setCustomId('alerts_threshold_test')
								.setLabel('Tester ce seuil')
								.setStyle(ButtonStyle.Primary)
								.setEmoji('🧪'),
							new ButtonBuilder()
								.setCustomId('alerts_threshold_view_all')
								.setLabel('Voir tous les seuils')
								.setStyle(ButtonStyle.Secondary)
								.setEmoji('📊'),
							new ButtonBuilder()
								.setCustomId('alerts_threshold_reset')
								.setLabel('Réinitialiser')
								.setStyle(ButtonStyle.Danger)
								.setEmoji('🔄'),
						);

					await interaction.editReply({
						content: content,
						components: [thresholdSelect, buttons],
					});
				}
				else {
					let content = '❌ **ERREUR** ❌\n\n';
					content += `⚠️ **Impossible de mettre à jour le seuil "${threshold}".**\n\n`;
					content += '🔍 **Vérifiez que le nom du seuil est correct.**\n';
					content += `⏰ **Tentative:** <t:${Math.floor(Date.now() / 1000)}:F>`;

					await interaction.editReply({ content: content });
				}
			}
			else {
				// Afficher tous les seuils actuels
				const thresholds = await alertManager.getThresholds();

				let content = '🎯 **SEUILS D\'ALERTES** 🎯\n\n';
				content += '📊 **Configuration actuelle des seuils:**\n\n';

				Object.entries(thresholds).forEach(([key, thresholdValue]) => {
					const label = this.getThresholdLabel(key);
					content += `• **${label}:** ${thresholdValue}\n`;
				});

				content += `\n⏰ **Dernière mise à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				await interaction.editReply({ content: content });
			}
		}
		catch (error) {
			console.error('❌ Erreur lors de la gestion des seuils:', error);

			let content = '❌ **ERREUR** ❌\n\n';
			content += '⚠️ **Une erreur est survenue lors de la gestion des seuils.**\n\n';
			content += `🔍 **Détails:** ${error.message || 'Erreur inconnue'}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.editReply({ content: content });
		}
	},

	async handleTest(interaction, alertManager, type = null) {
		// Vérifier si l'interaction a déjà été répondue
		if (!interaction.deferred && !interaction.replied) {
			await interaction.deferReply();
		}

		// Si type n'est pas fourni, essayer de le récupérer depuis les options (commande slash)
		if (!type && interaction.options) {
			type = interaction.options.getString('type');
		}
		
		// Si toujours pas de type, utiliser un type par défaut
		if (!type) {
			type = 'absence'; // Type par défaut pour les tests
		}

		try {
			const testResult = await alertManager.testAlert(type);

			let content = '🧪 **TEST D\'ALERTE** 🧪\n\n';
			content += `✅ **Test de l'alerte "${type}" effectué avec succès !**\n\n`;
			content += '📋 **Résultats du test:**\n';
			content += `• **Type:** ${type}\n`;
			content += `• **Statut:** ${testResult.success ? '✅ Réussi' : '❌ Échec'}\n`;
			content += `• **Message:** ${testResult.message || 'Aucun message'}\n\n`;
			content += `⏰ **Test effectué:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Menu de sélection pour autres tests (Type 17)
			const testSelect = new ActionRowBuilder()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('alerts_test_select')
						.setPlaceholder('🧪 Tester un autre type')
						.addOptions([
							{
								label: 'Alerte de membres',
								value: 'members',
								emoji: '👥',
							},
							{
								label: 'Alerte de messages',
								value: 'messages',
								emoji: '💬',
							},
							{
								label: 'Alerte système',
								value: 'system',
								emoji: '⚙️',
							},
							{
								label: 'Alerte de modération',
								value: 'moderation',
								emoji: '🛡️',
							},
						]),
				);

			// Boutons d'action (Type 10)
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('alerts_test_again')
						.setLabel('Tester à nouveau')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🔄'),
					new ButtonBuilder()
						.setCustomId('alerts_test_all')
						.setLabel('Tester tout')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('🧪'),
					new ButtonBuilder()
						.setCustomId('alerts_test_logs')
						.setLabel('Voir logs')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📋'),
				);

			// Utiliser editReply ou followUp selon l'état de l'interaction
			if (interaction.deferred) {
				await interaction.editReply({
					content: content,
					components: [testSelect, buttons],
				});
			} else {
				await interaction.followUp({
					content: content,
					components: [testSelect, buttons],
				});
			}
		}
		catch (error) {
			console.error('❌ Erreur lors du test d\'alerte:', error);

			let content = '❌ **ERREUR DE TEST** ❌\n\n';
			content += '⚠️ **Impossible d\'effectuer le test d\'alerte.**\n\n';
			content += `🔍 **Détails:** ${error.message || 'Erreur inconnue'}\n`;
			content += `📝 **Type demandé:** ${type || 'Non spécifié'}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Utiliser editReply ou followUp selon l'état de l'interaction
			if (interaction.deferred) {
				await interaction.editReply({ content: content });
			} else {
				await interaction.followUp({ 
					content: content,
					ephemeral: true 
				});
			}
		}
	},

	async handleHistory(interaction, alertManager) {
		await interaction.deferReply();

		const limit = interaction.options.getInteger('limit') || 10;

		try {
			const history = await alertManager.getAlertHistory(limit);

			if (history.length === 0) {
				let content = '📜 **HISTORIQUE DES ALERTES** 📜\n\n';
				content += '⚠️ **Aucune alerte trouvée dans l\'historique.**\n\n';
				content += '💡 **Les alertes apparaîtront ici une fois déclenchées.**\n';
				content += `⏰ **Recherche effectuée:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				await interaction.editReply({ content: content });
				return;
			}

			let content = '📜 **HISTORIQUE DES ALERTES** 📜\n\n';
			content += `📊 **${history.length} alerte(s) récente(s):**\n\n`;

			history.forEach((alert, index) => {
				const timestamp = Math.floor(new Date(alert.timestamp).getTime() / 1000);
				content += `**${index + 1}.** ${alert.type} - ${alert.message}\n`;
				content += `   ⏰ <t:${timestamp}:R>\n\n`;
			});

			content += `⏰ **Historique mis à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Menu de sélection pour filtrer (Type 17)
			const filterSelect = new ActionRowBuilder()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('alerts_history_filter')
						.setPlaceholder('🔍 Filtrer par type')
						.addOptions([
							{
								label: 'Toutes les alertes',
								value: 'all',
								emoji: '📊',
							},
							{
								label: 'Alertes membres',
								value: 'members',
								emoji: '👥',
							},
							{
								label: 'Alertes messages',
								value: 'messages',
								emoji: '💬',
							},
							{
								label: 'Alertes système',
								value: 'system',
								emoji: '⚙️',
							},
						]),
				);

			// Boutons d'action (Type 10)
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('alerts_history_refresh')
						.setLabel('Actualiser')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🔄'),
					new ButtonBuilder()
						.setCustomId('alerts_history_export')
						.setLabel('Exporter')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📤'),
					new ButtonBuilder()
						.setCustomId('alerts_history_clear')
						.setLabel('Vider historique')
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🗑️'),
				);

			await interaction.editReply({
				content: content,
				components: [filterSelect, buttons],
			});
		}
		catch (error) {
			console.error('❌ Erreur lors de la récupération de l\'historique:', error);

			let content = '❌ **ERREUR** ❌\n\n';
			content += '⚠️ **Impossible de récupérer l\'historique des alertes.**\n\n';
			content += `🔍 **Détails:** ${error.message || 'Erreur inconnue'}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.editReply({ content: content });
		}
	},

	async handleStatus(interaction, alertManager) {
		await interaction.deferReply();

		try {
			const status = await alertManager.getStatus();
			const config = await alertManager.getConfig();

			let content = '📊 **STATUT DES ALERTES** 📊\n\n';
			content += '🔧 **Configuration actuelle:**\n';
			content += `• **Alertes activées:** ${config.enabled ? '✅ Oui' : '❌ Non'}\n`;
			content += `• **Canal d'alertes:** ${config.channel ? `<#${config.channel}>` : '❌ Non configuré'}\n`;
			content += `• **Intervalle de vérification:** ${config.checkInterval || 300} secondes\n\n`;

			content += '📈 **Statistiques:**\n';
			content += `• **Alertes envoyées aujourd'hui:** ${status.todayCount || 0}\n`;
			content += `• **Dernière alerte:** ${status.lastAlert ? `<t:${Math.floor(new Date(status.lastAlert).getTime() / 1000)}:R>` : 'Aucune'}\n`;
			content += `• **Système actif depuis:** <t:${Math.floor(status.uptime / 1000)}:R>\n\n`;

			content += '🎯 **Prochaines actions:**\n';
			content += `• Prochaine vérification dans ${Math.ceil((status.nextCheck - Date.now()) / 1000)} secondes\n`;
			content += `• Maintenance programmée: <t:${Math.floor((Date.now() + 86400000) / 1000)}:F>\n\n`;

			content += `⏰ **Statut mis à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Menu de sélection pour actions rapides (Type 17)
			const quickActions = new ActionRowBuilder()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('alerts_quick_action')
						.setPlaceholder('⚡ Actions rapides')
						.addOptions([
							{
								label: 'Activer les alertes',
								value: 'enable',
								emoji: '✅',
							},
							{
								label: 'Désactiver les alertes',
								value: 'disable',
								emoji: '❌',
							},
							{
								label: 'Configurer canal',
								value: 'set_channel',
								emoji: '📢',
							},
							{
								label: 'Réinitialiser config',
								value: 'reset_config',
								emoji: '🔄',
							},
						]),
				);

			// Boutons d'action (Type 10)
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('alerts_status_refresh')
						.setLabel('Actualiser')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🔄'),
					new ButtonBuilder()
						.setCustomId('alerts_status_report')
						.setLabel('Rapport détaillé')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📊'),
					new ButtonBuilder()
						.setCustomId('alerts_status_help')
						.setLabel('Aide')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('❓'),
				);

			await interaction.editReply({
				content: content,
				components: [quickActions, buttons],
			});
		}
		catch (error) {
			console.error('❌ Erreur lors de la récupération du statut:', error);

			let content = '❌ **ERREUR** ❌\n\n';
			content += '⚠️ **Impossible de récupérer le statut des alertes.**\n\n';
			content += `🔍 **Détails:** ${error.message || 'Erreur inconnue'}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.editReply({ content: content });
		}
	},

	async showCurrentConfig(interaction, alertManager) {
		try {
			// Différer la réponse si ce n'est pas déjà fait
			if (!interaction.replied && !interaction.deferred) {
				await interaction.deferReply();
			}

			const config = await alertManager.getConfig();

			let content = '⚙️ **CONFIGURATION ACTUELLE** ⚙️\n\n';
			content += '📋 **Paramètres des alertes:**\n\n';

			// Configuration principale
			content += '🔧 **Paramètres principaux:**\n';
			content += `• **Statut:** ${config.enabled ? '✅ Activé' : '❌ Désactivé'}\n`;
			content += `• **Canal:** ${config.channel ? `<#${config.channel}>` : '❌ Non configuré'}\n`;
			content += `• **Intervalle:** ${config.checkInterval || 300} secondes\n`;
			content += `• **Niveau de log:** ${config.logLevel || 'INFO'}\n\n`;

			// Seuils configurés
			if (config.thresholds) {
				content += '🎯 **Seuils configurés:**\n';
				Object.entries(config.thresholds).forEach(([key, value]) => {
					const label = this.getThresholdLabel(key);
					content += `• **${label}:** ${value}\n`;
				});
				content += '\n';
			}

			// Types d'alertes
			if (config.alertTypes) {
				content += '📢 **Types d\'alertes actifs:**\n';
				config.alertTypes.forEach(type => {
					content += `• ${this.getAlertTypeEmoji(type)} ${this.getAlertTypeLabel(type)}\n`;
				});
				content += '\n';
			}

			content += `⏰ **Configuration mise à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Menu de sélection pour modifier la configuration (Type 17)
			const configSelect = new ActionRowBuilder()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('alerts_config_modify')
						.setPlaceholder('🔧 Modifier la configuration')
						.addOptions([
							{
								label: 'Activer/Désactiver alertes',
								value: 'toggle_enabled',
								emoji: '🔄',
							},
							{
								label: 'Changer le canal',
								value: 'change_channel',
								emoji: '📢',
							},
							{
								label: 'Modifier les seuils',
								value: 'modify_thresholds',
								emoji: '🎯',
							},
							{
								label: 'Types d\'alertes',
								value: 'alert_types',
								emoji: '📋',
							},
						]),
				);

			// Boutons d'action (Type 10)
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('alerts_config_test')
						.setLabel('Tester config')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🧪'),
					new ButtonBuilder()
						.setCustomId('alerts_config_reset')
						.setLabel('Réinitialiser')
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🔄'),
					new ButtonBuilder()
						.setCustomId('alerts_config_export')
						.setLabel('Exporter config')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📤'),
				);

			// Utiliser editReply si déjà répondu, sinon reply
			const replyMethod = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
			await interaction[replyMethod]({
				content: content,
				components: [configSelect, buttons],
			});
		}
		catch (error) {
			console.error('❌ Erreur lors de l\'affichage de la configuration:', error);

			let content = '❌ **ERREUR** ❌\n\n';
			content += '⚠️ **Impossible d\'afficher la configuration actuelle.**\n\n';
			content += `🔍 **Détails:** ${error.message || 'Erreur inconnue'}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Utiliser editReply si déjà répondu, sinon reply
			const replyMethod = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
			await interaction[replyMethod]({ content: content });
		}
	},

	async handleTestAll(interaction) {
		const alertManager = interaction.client.alertManager;
		
		await interaction.deferReply();

		try {
			let content = '🧪 **TEST DE TOUTES LES ALERTES** 🧪\n\n';
			content += '⏳ **Lancement des tests en cours...**\n\n';

			await interaction.editReply({ content: content });

			// Tester tous les types d'alertes
			const testTypes = ['absence', 'retard', 'performance', 'activite'];
			const results = [];

			for (const type of testTypes) {
				try {
					const result = await alertManager.testAlert(type, interaction.guild);
					results.push({
						type: type,
						success: true,
						message: result.message || 'Test réussi'
					});
				} catch (error) {
					results.push({
						type: type,
						success: false,
						message: error.message || 'Erreur inconnue'
					});
				}
			}

			// Afficher les résultats
			content = '🧪 **RÉSULTATS DES TESTS** 🧪\n\n';
			
			for (const result of results) {
				const emoji = result.success ? '✅' : '❌';
				const status = result.success ? 'Réussi' : 'Échec';
				const typeLabel = this.getTypeLabel(result.type);
				
				content += `${emoji} **${typeLabel}:** ${status}\n`;
				content += `   └ ${result.message}\n\n`;
			}

			const successCount = results.filter(r => r.success).length;
			const totalCount = results.length;

			content += `📊 **Résumé:** ${successCount}/${totalCount} tests réussis\n`;
			content += `⏰ **Tests effectués:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.editReply({ content: content });

		} catch (error) {
			console.error('❌ Erreur lors du test de toutes les alertes:', error);
			
			let content = '❌ **ERREUR LORS DU TEST** ❌\n\n';
			content += '⚠️ **Impossible de tester toutes les alertes.**\n\n';
			content += `🔍 **Détails:** ${error.message || 'Erreur inconnue'}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.editReply({ content: content });
		}
	},

	async handleTestAgain(interaction) {
		// Relancer le dernier test effectué avec un type par défaut
		await this.handleTest(interaction, interaction.client.alertManager, 'absence');
	},

	async handleTestLogs(interaction) {
		const alertManager = interaction.client.alertManager;
		
		await interaction.deferReply();

		try {
			const logs = await alertManager.getTestLogs();
			
			let content = '📋 **LOGS DES TESTS D\'ALERTES** 📋\n\n';
			
			if (!logs || logs.length === 0) {
				content += '📝 **Aucun log de test disponible.**\n\n';
				content += '💡 **Conseil:** Effectuez d\'abord un test pour générer des logs.';
			} else {
				content += `📊 **${logs.length} entrées trouvées**\n\n`;
				
				// Afficher les 10 derniers logs
				const recentLogs = logs.slice(-10);
				
				for (const log of recentLogs) {
					const timestamp = new Date(log.timestamp).toLocaleString('fr-FR');
					const emoji = log.success ? '✅' : '❌';
					
					content += `${emoji} **${timestamp}** - ${log.type}\n`;
					content += `   └ ${log.message}\n\n`;
				}
				
				if (logs.length > 10) {
					content += `📝 **Note:** Seuls les 10 derniers logs sont affichés (${logs.length} au total)`;
				}
			}

			await interaction.editReply({ content: content });

		} catch (error) {
			console.error('❌ Erreur lors de la récupération des logs:', error);
			
			let content = '❌ **ERREUR LORS DE LA RÉCUPÉRATION** ❌\n\n';
			content += '⚠️ **Impossible de récupérer les logs de test.**\n\n';
			content += `🔍 **Détails:** ${error.message || 'Erreur inconnue'}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.editReply({ content: content });
		}
	},

	getTypeLabel(type) {
		const labels = {
			'absence': 'Test d\'absence',
			'retard': 'Test de retard',
			'performance': 'Test de performance',
			'activite': 'Test d\'activité'
		};
		return labels[type] || type;
	},

	getThresholdLabel(key) {
		const labels = {
			'activity_drop': 'Baisse d\'activité',
			'member_loss': 'Perte de membres',
			'absence': 'Absence prolongée',
			'performance': 'Performance',
			'retard': 'Retard'
		};
		return labels[key] || key;
	},

	getAlertTypeEmoji(type) {
		const emojis = {
			'activity_drop': '📉',
			'member_loss': '👥',
			'absence': '⏰',
			'performance': '⚡',
			'retard': '🕐'
		};
		return emojis[type] || '🔔';
	},

	getAlertTypeLabel(type) {
		const labels = {
			'activity_drop': 'Baisse d\'activité',
			'member_loss': 'Perte de membres',
			'absence': 'Absence prolongée',
			'performance': 'Performance',
			'retard': 'Retard'
		};
		return labels[type] || type;
	},

	async handleConfigModify(interaction, alertManager) {
		try {
			const selectedValues = interaction.values;
			if (!selectedValues || selectedValues.length === 0) {
				if (!interaction.deferred && !interaction.replied) {
					await interaction.reply({
						content: '❌ Aucune option sélectionnée.',
						ephemeral: true
					});
				} else {
					await interaction.editReply({
						content: '❌ Aucune option sélectionnée.',
						ephemeral: true
					});
				}
				return;
			}

			const selectedOption = selectedValues[0];
			
			// Rediriger vers la méthode appropriée selon l'option sélectionnée
			switch (selectedOption) {
				case 'thresholds':
					// Ne pas déférer ici, laisser handleThresholds le faire
					await this.handleThresholds(interaction, alertManager);
					break;
				case 'channels':
					if (!interaction.deferred && !interaction.replied) {
						await interaction.deferReply({ ephemeral: true });
					}
					await this.handleChannelConfig(interaction, alertManager);
					break;
				case 'types':
					if (!interaction.deferred && !interaction.replied) {
						await interaction.deferReply({ ephemeral: true });
					}
					await this.handleTypeConfig(interaction, alertManager);
					break;
				case 'schedule':
					if (!interaction.deferred && !interaction.replied) {
						await interaction.deferReply({ ephemeral: true });
					}
					await this.handleScheduleConfig(interaction, alertManager);
					break;
				default:
					if (!interaction.deferred && !interaction.replied) {
						await interaction.reply({
							content: '❌ Option non reconnue.',
							ephemeral: true
						});
					} else {
						await interaction.editReply({
							content: '❌ Option non reconnue.',
							ephemeral: true
						});
					}
			}
		} catch (error) {
			console.error('Erreur dans handleConfigModify:', error);
			try {
				if (!interaction.deferred && !interaction.replied) {
					await interaction.reply({
						content: '❌ Une erreur est survenue lors de la modification de la configuration.',
						ephemeral: true
					});
				} else {
					await interaction.editReply({
						content: '❌ Une erreur est survenue lors de la modification de la configuration.',
						ephemeral: true
					});
				}
			} catch (replyError) {
				console.error('Erreur lors de la réponse d\'erreur:', replyError);
			}
		}
	},

	async handleChannelConfig(interaction, alertManager) {
		// Placeholder pour la configuration des canaux
		const replyMethod = interaction.replied ? 'editReply' : 'reply';
		await interaction[replyMethod]({
			content: '🚧 Configuration des canaux en cours de développement.',
			ephemeral: true
		});
	},

	async handleTypeConfig(interaction, alertManager) {
		// Placeholder pour la configuration des types
		const replyMethod = interaction.replied ? 'editReply' : 'reply';
		await interaction[replyMethod]({
			content: '🚧 Configuration des types d\'alertes en cours de développement.',
			ephemeral: true
		});
	},

	async handleScheduleConfig(interaction, alertManager) {
		// Placeholder pour la configuration de la planification
		const replyMethod = interaction.replied ? 'editReply' : 'reply';
		await interaction[replyMethod]({
			content: '🚧 Configuration de la planification en cours de développement.',
			ephemeral: true
		});
	},

	async handleConfigReset(interaction, alertManager) {
		try {
			if (!interaction.deferred && !interaction.replied) {
				await interaction.deferReply({ ephemeral: true });
			}

			// Créer un embed de confirmation
			const confirmEmbed = new EmbedBuilder()
				.setColor('#ff6b6b')
				.setTitle('⚠️ Réinitialisation de la Configuration')
				.setDescription('**Êtes-vous sûr de vouloir réinitialiser toute la configuration des alertes ?**\n\n' +
					'Cette action va :\n' +
					'• 🔄 Remettre tous les seuils aux valeurs par défaut\n' +
					'• 📢 Réinitialiser les canaux de notification\n' +
					'• 🎯 Désactiver tous les types d\'alertes personnalisés\n' +
					'• ⏰ Remettre la planification par défaut\n\n' +
					'**⚠️ Cette action est irréversible !**')
				.setTimestamp()
				.setFooter({ text: 'Système d\'alertes LUX Compta' });

			// Boutons de confirmation
			const confirmRow = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('alerts_reset_confirm')
						.setLabel('✅ Confirmer la réinitialisation')
						.setStyle(ButtonStyle.Danger),
					new ButtonBuilder()
						.setCustomId('alerts_reset_cancel')
						.setLabel('❌ Annuler')
						.setStyle(ButtonStyle.Secondary)
				);

			await interaction.editReply({
				embeds: [confirmEmbed],
				components: [confirmRow],
				ephemeral: true
			});

		} catch (error) {
			console.error('Erreur dans handleConfigReset:', error);
			const replyMethod = interaction.replied ? 'editReply' : 'reply';
			await interaction[replyMethod]({
				content: '❌ Une erreur est survenue lors de la préparation de la réinitialisation.',
				ephemeral: true
			});
		}
	},

	async handleConfigExport(interaction, alertManager) {
		try {
			// Récupérer la configuration actuelle
			const config = await alertManager.getConfig();
			
			// Créer le contenu JSON formaté
			const configJson = JSON.stringify(config, null, 2);
			
			// Créer un fichier temporaire
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const filename = `alerts-config-${timestamp}.json`;
			
			// Créer l'attachment
			const attachment = new AttachmentBuilder(Buffer.from(configJson, 'utf8'), {
				name: filename
			});

			// Créer un embed informatif
			const exportEmbed = new EmbedBuilder()
				.setColor('#4CAF50')
				.setTitle('📤 Export de Configuration')
				.setDescription('**Configuration des alertes exportée avec succès !**\n\n' +
					'📁 **Fichier :** `' + filename + '`\n' +
					'📊 **Contenu :** Configuration complète des alertes\n' +
					'⏰ **Exporté le :** <t:' + Math.floor(Date.now() / 1000) + ':F>\n\n' +
					'💡 **Utilisation :** Vous pouvez utiliser ce fichier pour sauvegarder ou restaurer votre configuration.')
				.setTimestamp()
				.setFooter({ text: 'Système d\'alertes LUX Compta' });

			if (!interaction.deferred && !interaction.replied) {
				await interaction.reply({
					embeds: [exportEmbed],
					files: [attachment],
					ephemeral: true
				});
			} else {
				await interaction.editReply({
					embeds: [exportEmbed],
					files: [attachment],
					ephemeral: true
				});
			}

		} catch (error) {
			console.error('Erreur dans handleConfigExport:', error);
			try {
				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content: '❌ Une erreur est survenue lors de l\'export de la configuration.',
						ephemeral: true
					});
				} else {
					await interaction.editReply({
						content: '❌ Une erreur est survenue lors de l\'export de la configuration.',
						ephemeral: true
					});
				}
			} catch (replyError) {
				console.error('Erreur lors de la réponse d\'erreur:', replyError);
			}
		}
	},

	async handleResetConfirm(interaction, alertManager) {
		try {
			// Réinitialiser la configuration
			await alertManager.setAlertsEnabled(false);
			await alertManager.setAlertChannel(null);
			await alertManager.setThreshold('activity_drop', 50);
			await alertManager.setThreshold('member_loss', 10);
			await alertManager.setThreshold('absence', 24);

			// Créer un embed de succès
			const successEmbed = new EmbedBuilder()
				.setColor('#4CAF50')
				.setTitle('✅ Configuration Réinitialisée')
				.setDescription('**La configuration des alertes a été réinitialisée avec succès !**\n\n' +
					'**Valeurs par défaut restaurées :**\n' +
					'• 📢 **Alertes :** Désactivées\n' +
					'• 📍 **Canal :** Aucun\n' +
					'• 📉 **Seuil d\'activité :** 50%\n' +
					'• 👥 **Seuil de membres :** 10 membres\n' +
					'• ⏰ **Seuil d\'absence :** 24 heures\n\n' +
					'Vous pouvez maintenant reconfigurer les alertes selon vos besoins.')
				.setTimestamp()
				.setFooter({ text: 'Système d\'alertes LUX Compta' });

			await interaction.update({
				embeds: [successEmbed],
				components: [],
				ephemeral: true
			});

		} catch (error) {
			console.error('Erreur dans handleResetConfirm:', error);
			await interaction.update({
				content: '❌ Une erreur est survenue lors de la réinitialisation de la configuration.',
				embeds: [],
				components: [],
				ephemeral: true
			});
		}
	},

	async handleResetCancel(interaction, alertManager) {
		try {
			// Créer un embed d'annulation
			const cancelEmbed = new EmbedBuilder()
				.setColor('#6c757d')
				.setTitle('❌ Réinitialisation Annulée')
				.setDescription('**La réinitialisation de la configuration a été annulée.**\n\n' +
					'Votre configuration actuelle des alertes reste inchangée.')
				.setTimestamp()
				.setFooter({ text: 'Système d\'alertes LUX Compta' });

			await interaction.update({
				embeds: [cancelEmbed],
				components: [],
				ephemeral: true
			});

		} catch (error) {
			console.error('Erreur dans handleResetCancel:', error);
			await interaction.update({
				content: '❌ Une erreur est survenue lors de l\'annulation.',
				embeds: [],
				components: [],
				ephemeral: true
			});
		}
	}
};