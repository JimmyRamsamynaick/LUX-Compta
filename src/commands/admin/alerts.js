const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

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
		const canal = interaction.options.getChannel('canal');
		const activé = interaction.options.getBoolean('activé');

		try {
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
				const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

				let content = `⚙️ **CONFIGURATION MISE À JOUR** ⚙️\n\n`;
				content += `✅ **Les paramètres d'alertes ont été modifiés avec succès !**\n\n`;
				content += `📋 **Modifications effectuées:**\n`;
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
							.setEmoji('⚙️')
					);

				await interaction.reply({
					content: content,
					components: [buttons]
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
		const type = interaction.options.getString('type');
		const seuil = interaction.options.getInteger('seuil');

		try {
			const success = await alertManager.setThreshold(type, seuil);

			if (success) {
				const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

				const typeNames = {
					'activity_drop': 'Baisse d\'activité',
					'member_loss': 'Perte de membres',
					'absence': 'Absence prolongée',
				};

				let content = `🎯 **SEUIL D'ALERTE MIS À JOUR** 🎯\n\n`;
				content += `✅ **Le seuil pour "${typeNames[type]}" a été configuré avec succès !**\n\n`;
				content += `📋 **Configuration:**\n`;
				content += `• **Type:** ${typeNames[type]}\n`;
				content += `• **Nouveau seuil:** ${seuil}%\n\n`;
				content += `⏰ **Configuré:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Menu de sélection pour configurer d'autres seuils (Type 17)
				const thresholdSelect = new ActionRowBuilder()
					.addComponents(
						new StringSelectMenuBuilder()
							.setCustomId('alerts_threshold_config')
							.setPlaceholder('Configurer un autre seuil...')
							.addOptions([
								{
									label: 'Baisse d\'activité',
									value: 'activity_drop',
									emoji: '📉'
								},
								{
									label: 'Perte de membres',
									value: 'member_loss',
									emoji: '👥'
								},
								{
									label: 'Absence prolongée',
									value: 'absence',
									emoji: '💤'
								}
							])
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
							.setEmoji('🔄')
					);

				await interaction.reply({
					content: content,
					components: [thresholdSelect, buttons]
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la configuration du seuil.',
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la configuration du seuil:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la configuration du seuil d\'alerte.',
			});
		}
	},

	async handleTest(interaction, alertManager) {
		const type = interaction.options.getString('type');

		try {
			await interaction.deferReply();

			const testResult = await alertManager.testAlert(type);

			if (testResult.success) {
				const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

				const typeNames = {
					'activity_drop': 'Baisse d\'activité',
					'member_loss': 'Perte de membres',
					'absence': 'Absence prolongée',
				};

				let content = `🧪 **TEST D'ALERTE RÉUSSI** 🧪\n\n`;
				content += `✅ **Test de l'alerte "${typeNames[type]}" effectué avec succès !**\n\n`;
				content += `📋 **Résultat du test:**\n`;
				content += `• **Type testé:** ${typeNames[type]}\n`;
				content += `• **Message:** ${testResult.message || 'Alerte de test envoyée'}\n`;
				content += `• **Statut:** Test réussi ✅\n\n`;
				content += `⏰ **Test effectué:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Menu de sélection pour tester d'autres types (Type 17)
				const testSelect = new ActionRowBuilder()
					.addComponents(
						new StringSelectMenuBuilder()
							.setCustomId('alerts_test_other')
							.setPlaceholder('Tester un autre type d\'alerte...')
							.addOptions([
								{
									label: 'Baisse d\'activité',
									value: 'activity_drop',
									emoji: '📉'
								},
								{
									label: 'Perte de membres',
									value: 'member_loss',
									emoji: '👥'
								},
								{
									label: 'Absence prolongée',
									value: 'absence',
									emoji: '💤'
								}
							])
					);

				// Boutons d'action (Type 10)
				const buttons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('alerts_test_repeat')
							.setLabel('Répéter le test')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('🔄'),
						new ButtonBuilder()
							.setCustomId('alerts_test_all')
							.setLabel('Tester tout')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('🧪'),
						new ButtonBuilder()
							.setCustomId('alerts_test_config')
							.setLabel('Configuration')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('⚙️')
					);

				await interaction.editReply({
					content: content,
					components: [testSelect, buttons]
				});
			}
			else {
				await interaction.editReply({
					content: `❌ Erreur lors du test: ${testResult.error || 'Erreur inconnue'}`,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors du test d\'alerte:', error);

			if (interaction.deferred) {
				await interaction.editReply({
					content: '❌ Erreur lors du test de l\'alerte.',
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors du test de l\'alerte.',
				});
			}
		}
	},

	async handleHistory(interaction, alertManager) {
		const limite = interaction.options.getInteger('limite') || 10;

		try {
			await interaction.deferReply();

			const history = await alertManager.getAlertHistory(limite);

			if (history && history.length > 0) {
				const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

				const typeNames = {
					'activity_drop': 'Baisse d\'activité',
					'member_loss': 'Perte de membres',
					'absence': 'Absence prolongée',
				};

				let content = `📜 **HISTORIQUE DES ALERTES** 📜\n\n`;
				content += `📊 **${history.length} alerte(s) dans l'historique**\n\n`;

				// Afficher les 5 dernières alertes
				const recentAlerts = history.slice(-5).reverse();
				content += `🕒 **Alertes récentes:**\n`;
				
				recentAlerts.forEach((alert, index) => {
					const date = new Date(alert.timestamp);
					const typeEmojis = {
						'activity_drop': '📉',
						'member_loss': '👥',
						'absence': '💤'
					};
					
					content += `${typeEmojis[alert.type] || '⚠️'} **${typeNames[alert.type] || alert.type}** - <t:${Math.floor(date.getTime() / 1000)}:R>\n`;
					if (alert.message) {
						content += `   └ ${alert.message.substring(0, 80)}${alert.message.length > 80 ? '...' : ''}\n`;
					}
				});

				content += `\n⏰ **Dernière mise à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Menu de sélection pour filtrer par type (Type 17)
				const filterSelect = new ActionRowBuilder()
					.addComponents(
						new StringSelectMenuBuilder()
							.setCustomId('alerts_history_filter')
							.setPlaceholder('Filtrer par type d\'alerte...')
							.addOptions([
								{
									label: 'Toutes les alertes',
									value: 'all',
									emoji: '📜'
								},
								{
									label: 'Baisse d\'activité',
									value: 'activity_drop',
									emoji: '📉'
								},
								{
									label: 'Perte de membres',
									value: 'member_loss',
									emoji: '👥'
								},
								{
									label: 'Absence prolongée',
									value: 'absence',
									emoji: '💤'
								}
							])
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
							.setLabel('Nettoyer')
							.setStyle(ButtonStyle.Danger)
							.setEmoji('🗑️')
					);

				await interaction.editReply({
					content: content,
					components: [filterSelect, buttons]
				});
			}
			else {
				const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

				let content = `📜 **HISTORIQUE DES ALERTES** 📜\n\n`;
				content += `ℹ️ **Aucun historique d'alerte disponible.**\n\n`;
				content += `💡 **Suggestions:**\n`;
				content += `• Configurez des alertes pour commencer le suivi\n`;
				content += `• Testez une alerte pour générer un premier historique\n`;
				content += `• Vérifiez que le système d'alertes est activé\n\n`;
				content += `⏰ **Consulté:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Boutons d'action (Type 10)
				const buttons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('alerts_config_setup')
							.setLabel('Configurer alertes')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('⚙️'),
						new ButtonBuilder()
							.setCustomId('alerts_test_sample')
							.setLabel('Tester une alerte')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('🧪'),
						new ButtonBuilder()
							.setCustomId('alerts_status_check')
							.setLabel('Vérifier statut')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('📊')
					);

				await interaction.editReply({
					content: content,
					components: [buttons]
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la récupération de l\'historique:', error);

			if (interaction.deferred) {
				await interaction.editReply({
					content: '❌ Erreur lors de la récupération de l\'historique des alertes.',
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la récupération de l\'historique des alertes.',
				});
			}
		}
	},

	async handleStatus(interaction, alertManager) {
		try {
			await interaction.deferReply();

			const status = await alertManager.getStatus();

			if (status) {
				const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle } = require('discord.js');

				const statusEmoji = status.enabled ? '✅' : '❌';
				const statusColor = status.enabled ? '🟢' : '🔴';

				let content = `${statusEmoji} **STATUT DES ALERTES** 📊\n\n`;
				content += `📋 **État actuel du système d'alertes**\n\n`;
				
				// Configuration générale
				content += `⚙️ **Configuration générale**\n`;
				content += `${statusColor} **État:** ${status.enabled ? 'Activé' : 'Désactivé'}\n`;
				content += `📢 **Canal:** ${status.channel ? `<#${status.channel}>` : '❌ Non configuré'}\n`;
				content += `⏰ **Dernière vérification:** ${status.lastCheck ? new Date(status.lastCheck).toLocaleString('fr-FR') : 'Jamais'}\n\n`;
				
				// Seuils configurés
				content += `🎯 **Seuils configurés**\n`;
				content += `📉 **Baisse d'activité:** ${status.thresholds?.activity_drop || 'Non défini'}%\n`;
				content += `👥 **Perte de membres:** ${status.thresholds?.member_loss || 'Non défini'}%\n`;
				content += `💤 **Absence prolongée:** ${status.thresholds?.absence || 'Non défini'}%\n\n`;
				
				// Statistiques
				content += `📊 **Statistiques**\n`;
				content += `🚨 **Alertes envoyées:** ${status.stats?.totalAlerts || 0}\n`;
				content += `📅 **Alertes aujourd'hui:** ${status.stats?.todayAlerts || 0}\n`;
				content += `⏱️ **Dernière alerte:** ${status.stats?.lastAlert ? new Date(status.stats.lastAlert).toLocaleString('fr-FR') : 'Aucune'}\n\n`;
				content += `⏰ **Généré le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Menu de sélection pour les actions (Type 17)
				const selectMenu = new StringSelectMenuBuilder()
					.setCustomId('alerts_status_action')
					.setPlaceholder('Choisir une action...')
					.addOptions([
						{
							label: 'Actualiser le statut',
							description: 'Rafraîchir les informations de statut',
							value: 'refresh',
							emoji: '🔄'
						},
						{
							label: 'Modifier la configuration',
							description: 'Changer les paramètres d\'alertes',
							value: 'config',
							emoji: '⚙️'
						},
						{
							label: 'Voir l\'historique',
							description: 'Consulter l\'historique des alertes',
							value: 'history',
							emoji: '📋'
						},
						{
							label: 'Tester les alertes',
							description: 'Lancer un test du système',
							value: 'test',
							emoji: '🧪'
						}
					]);

				const selectRow = new ActionRowBuilder().addComponents(selectMenu);

				// Boutons d'action rapide (Type 10)
				const quickButtons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('alerts_toggle_quick')
							.setLabel(status.enabled ? 'Désactiver' : 'Activer')
							.setStyle(status.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
							.setEmoji(status.enabled ? '❌' : '✅'),
						new ButtonBuilder()
							.setCustomId('alerts_config_quick')
							.setLabel('Configuration')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('⚙️'),
						new ButtonBuilder()
							.setCustomId('alerts_test_quick')
							.setLabel('Test')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('🧪'),
						new ButtonBuilder()
							.setCustomId('alerts_history_quick')
							.setLabel('Historique')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('📋')
					);

				await interaction.editReply({
					content: content,
					components: [selectRow, quickButtons]
				});
			}
			else {
				await interaction.editReply({
					content: '❌ Impossible de récupérer le statut des alertes.',
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la récupération du statut:', error);

			if (interaction.deferred) {
				await interaction.editReply({
					content: '❌ Erreur lors de la récupération du statut des alertes.',
				});
			}
			else {
				await interaction.editReply({
					content: '❌ Erreur lors de la récupération du statut des alertes.',
				});
			}
		}
	},

	async showCurrentConfig(interaction, alertManager) {
		try {
			const config = await alertManager.getConfig();

			const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

			let content = `⚙️ **CONFIGURATION DES ALERTES** ⚙️\n\n`;

			if (!config || Object.keys(config).length === 0) {
				content += `❌ **Aucune configuration trouvée**\n\n`;
				content += `💡 **Pour commencer:**\n`;
				content += `• Utilisez \`/alerts config\` pour configurer les alertes\n`;
				content += `• Définissez des seuils avec \`/alerts seuils\`\n`;
				content += `• Testez avec \`/alerts test\`\n\n`;
			} else {
				content += `✅ **Configuration actuelle:**\n\n`;

				// Statut général
				content += `🔔 **Alertes activées:** ${config.enabled ? '✅ Oui' : '❌ Non'}\n`;
				if (config.channel) {
					content += `📢 **Canal d'alerte:** <#${config.channel}>\n`;
				}
				content += `\n`;

				// Seuils configurés
				if (config.thresholds) {
					content += `📊 **Seuils configurés:**\n`;
					
					if (config.thresholds.activity_drop) {
						content += `📉 **Baisse d'activité:** ${config.thresholds.activity_drop}% de baisse\n`;
					}
					if (config.thresholds.member_loss) {
						content += `👥 **Perte de membres:** ${config.thresholds.member_loss} membres perdus\n`;
					}
					if (config.thresholds.absence) {
						content += `💤 **Absence prolongée:** ${config.thresholds.absence} jours\n`;
					}
					content += `\n`;
				}

				// Dernière vérification
				if (config.lastCheck) {
					const lastCheck = new Date(config.lastCheck);
					content += `🕒 **Dernière vérification:** <t:${Math.floor(lastCheck.getTime() / 1000)}:R>\n`;
				}
			}

			content += `\n⏰ **Configuration consultée:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Menu de sélection pour modifier la configuration (Type 17)
			const configSelect = new ActionRowBuilder()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('alerts_config_modify')
						.setPlaceholder('Modifier la configuration...')
						.addOptions([
							{
								label: 'Activer/Désactiver alertes',
								value: 'toggle_enabled',
								emoji: '🔔'
							},
							{
								label: 'Changer canal d\'alerte',
								value: 'change_channel',
								emoji: '📢'
							},
							{
								label: 'Configurer seuils',
								value: 'configure_thresholds',
								emoji: '📊'
							},
							{
								label: 'Réinitialiser config',
								value: 'reset_config',
								emoji: '🔄'
							}
						])
				);

			// Boutons d'action (Type 10)
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('alerts_config_test')
						.setLabel('Tester alertes')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🧪'),
					new ButtonBuilder()
						.setCustomId('alerts_config_export')
						.setLabel('Exporter config')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📤'),
					new ButtonBuilder()
						.setCustomId('alerts_config_help')
						.setLabel('Aide')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('❓')
				);

			await interaction.editReply({
				content: content,
				components: [configSelect, buttons]
			});

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'affichage de la configuration:', error);

			await interaction.editReply({
				content: '❌ Erreur lors de l\'affichage de la configuration des alertes.',
			});
		}
	},
};