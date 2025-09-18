const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		// Gestion des commandes slash
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`Aucune commande correspondant à ${interaction.commandName} n'a été trouvée.`);
				return;
			}

			try {
				await command.execute(interaction);
			}
			catch (error) {
				console.error('Erreur lors de l\'exécution de la commande:', error);
				const reply = {
					content: 'Il y a eu une erreur lors de l\'exécution de cette commande !',
					
				};

				if (interaction.replied || interaction.deferred) {
					await interaction.followUp(reply);
				}
				else {
					await interaction.reply(reply);
				}
			}
		}

		// Gestion des composants (boutons, menus de sélection)
		if (interaction.isStringSelectMenu() || interaction.isButton()) {
			try {
				await this.handleComponents(interaction);
			}
			catch (error) {
				console.error('Erreur lors de la gestion des composants:', error);
				const reply = {
					content: 'Il y a eu une erreur lors du traitement de cette interaction !',
					
				};

				if (interaction.replied || interaction.deferred) {
					await interaction.followUp(reply);
				}
				else {
					await interaction.reply(reply);
				}
			}
		}

		// Gestion des modals
		if (interaction.isModalSubmit()) {
			try {
				await this.handleModals(interaction);
			}
			catch (error) {
				console.error('Erreur lors de la gestion des modals:', error);
				const reply = {
					content: 'Il y a eu une erreur lors du traitement de ce formulaire !',
					
				};

				if (interaction.replied || interaction.deferred) {
					await interaction.followUp(reply);
				}
				else {
					await interaction.reply(reply);
				}
			}
		}
	},

	async handleComponents(interaction) {
		const customId = interaction.customId;

		// Gestion des sélecteurs de période (Type 17)
		if (customId === 'report_period_select') {
			const selectMenus = require('../components/selectMenus');
			await selectMenus.handlePeriodSelect(interaction);
			return;
		}

		// Gestion des sélecteurs d'aide
		if (customId === 'help_category_select') {
			const selectMenus = require('../components/selectMenus');
			await selectMenus.handleHelpCategorySelect(interaction);
			return;
		}

		// Gestion des sélecteurs de type de rapport
		if (customId === 'report_type_select') {
			const selectMenus = require('../components/selectMenus');
			await selectMenus.handleReportTypeSelect(interaction);
			return;
		}

		// Gestion des sélecteurs de test d'alertes
		if (customId === 'alerts_test_select') {
			const selectMenus = require('../components/selectMenus');
			await selectMenus.handleAlertsTestSelect(interaction);
			return;
		}

		// Gestion des sélecteurs de seuils d'alertes
		if (customId === 'alerts_threshold_select') {
			const selectMenus = require('../components/selectMenus');
			await selectMenus.handleAlertsThresholdSelect(interaction);
			return;
		}

		// Gestion des sélecteurs de filtres d'historique d'alertes
		if (customId === 'alerts_history_filter') {
			const selectMenus = require('../components/selectMenus');
			await selectMenus.handleAlertsHistoryFilter(interaction);
			return;
		}

		// Gestion des sélecteurs de configuration d'alertes
		if (customId === 'alerts_config_modify') {
			const selectMenus = require('../components/selectMenus');
			await selectMenus.handleAlertsConfigModify(interaction);
			return;
		}

		// Gestion des actions rapides des alertes
		if (customId === 'alerts_quick_action') {
			const selectMenus = require('../components/selectMenus');
			await selectMenus.handleAlertsQuickAction(interaction);
			return;
		}

		// Gestion des boutons de test d'alertes
		if (customId.startsWith('alerts_test_')) {
			const alertsCommand = require('../commands/admin/alerts');
			
			if (customId === 'alerts_test_all') {
				await alertsCommand.handleTestAll(interaction);
				return;
			}
			
			if (customId === 'alerts_test_again') {
				await alertsCommand.handleTestAgain(interaction);
				return;
			}
			
			if (customId === 'alerts_test_logs') {
				await alertsCommand.handleTestLogs(interaction);
				return;
			}
		}

		// Gestion des boutons de téléchargement (Type 10)
		if (customId.startsWith('download_report_')) {
			const period = customId.replace('download_report_', '');
			const buttons = require('../components/buttons');
			await buttons.handleDownloadReport(interaction, period);
			return;
		}

		// Gestion des boutons d'envoi par email
		if (customId.startsWith('email_report_')) {
			const period = customId.replace('email_report_', '');
			const buttons = require('../components/buttons');
			await buttons.handleEmailReport(interaction, period);
			return;
		}

		// Gestion des boutons de visualisation
		if (customId.startsWith('view_report_')) {
			const period = customId.replace('view_report_', '');
			const buttons = require('../components/buttons');
			await buttons.handleViewReport(interaction, period);
			return;
		}

		// Gestion des boutons d'actualisation
		if (customId.startsWith('refresh_stats_')) {
			const parts = customId.replace('refresh_stats_', '').split('_');
			const period = parts[0];
			const type = parts[1] || 'general';
			const buttons = require('../components/buttons');
			await buttons.handleRefreshStats(interaction, period, type);
			return;
		}

		// Gestion des boutons de configuration
		if (customId.startsWith('config_')) {
			const action = customId.replace('config_', '');
			const buttons = require('../components/buttons');
			await buttons.handleConfigButton(interaction, action);
			return;
		}

		// Gestion des autres boutons
		if (customId.startsWith('export_stats_')) {
			const period = customId.replace('export_stats_', '');
			const buttons = require('../components/buttons');
			await buttons.handleDownloadReport(interaction, period);
			return;
		}

		// Gestion des boutons détaillés
		if (customId.startsWith('detailed_stats_')) {
			const period = customId.replace('detailed_stats_', '');
			const buttons = require('../components/buttons');
			await buttons.handleViewReport(interaction, period);
			return;
		}

		// Gestion des boutons d'alertes (configuration, seuils, historique, statut)
		if (customId.startsWith('alerts_')) {
			const alertsCommand = require('../commands/admin/alerts');
			
			// Boutons de configuration
			if (customId === 'alerts_config_view' || customId === 'alerts_config_test' || customId === 'alerts_config_advanced') {
				await alertsCommand.handleConfig(interaction, interaction.client.alertManager);
				return;
			}
			
			// Menu de sélection de configuration
			if (customId === 'alerts_config_modify') {
				await alertsCommand.handleConfigModify(interaction, interaction.client.alertManager);
				return;
			}
			
			// Boutons de configuration avancée
			if (customId === 'alerts_config_reset') {
				await alertsCommand.handleConfigReset(interaction, interaction.client.alertManager);
				return;
			}
			
			if (customId === 'alerts_config_export') {
				await alertsCommand.handleConfigExport(interaction, interaction.client.alertManager);
				return;
			}
			
			if (customId === 'alerts_reset_confirm') {
				await alertsCommand.handleResetConfirm(interaction, interaction.client.alertManager);
				return;
			}
			
			if (customId === 'alerts_reset_cancel') {
				await alertsCommand.handleResetCancel(interaction, interaction.client.alertManager);
				return;
			}
			
			// Boutons de seuils
			if (customId.startsWith('alerts_threshold_')) {
				await alertsCommand.handleThresholds(interaction, interaction.client.alertManager);
				return;
			}
			
			// Boutons d'historique
			if (customId.startsWith('alerts_history_')) {
				await alertsCommand.handleHistory(interaction, interaction.client.alertManager);
				return;
			}
			
			// Boutons de statut
			if (customId.startsWith('alerts_status_')) {
				await alertsCommand.handleStatus(interaction, interaction.client.alertManager);
				return;
			}
		}

		// Gestion des menus select dashboard
		if (customId === 'dashboard_select') {
			const dashboardCommand = require('../commands/admin/dashboard');
			await dashboardCommand.handleDashboardSelect(interaction);
			return;
		}

		// Gestion des boutons de dashboard
		if (customId.startsWith('dashboard_')) {
			const dashboardCommand = require('../commands/admin/dashboard');
			await dashboardCommand.handleDashboardButton(interaction);
			return;
		}

		// Gestion des boutons d'archive
		if (customId.startsWith('archive_') || customId.includes('archive')) {
			const archiveCommand = require('../commands/admin/archive');
			await archiveCommand.handleArchiveButton(interaction);
			return;
		}

		// Gestion des boutons de customisation
		if (customId.startsWith('customization_') || customId.startsWith('theme_') || customId.startsWith('color_') || customId.startsWith('emoji_')) {
			const customizeCommand = require('../commands/admin/customize');
			await customizeCommand.handleCustomizeButton(interaction);
			return;
		}

		// Gestion des boutons d'email de test
		if (customId.startsWith('email_')) {
			const emailTestCommand = require('../commands/admin/email-test');
			await emailTestCommand.handleEmailButton(interaction);
			return;
		}

		// Gestion des boutons de rapport
		if (customId.startsWith('report_')) {
			const reportCommand = require('../commands/admin/report');
			await reportCommand.handleReportButton(interaction);
			return;
		}

		// Gestion des boutons d'aide
		if (customId.startsWith('help_')) {
			const helpCommand = require('../commands/general/help');
			await helpCommand.handleHelpButton(interaction);
			return;
		}

		// Gestion des boutons de stats
		if (customId.startsWith('stats_')) {
			const statsCommand = require('../commands/admin/stats');
			await statsCommand.handleStatsButton(interaction);
			return;
		}

		console.log(`Composant non géré: ${customId}`);
	},

	async handleModals(interaction) {
		const customId = interaction.customId;

		// Gestion des modals d'email
		if (customId.startsWith('email_modal_')) {
			const period = customId.replace('email_modal_', '');
			const buttons = require('../components/buttons');
			await buttons.handleEmailModal(interaction, period);
			return;
		}

		// Gestion des modals de configuration
		if (customId.startsWith('config_modal_')) {
			const parameter = customId.replace('config_modal_', '');
			await this.handleConfigModal(interaction, parameter);
			return;
		}

		console.log(`Modal non géré: ${customId}`);
	},

	async handleConfigModal(interaction, parameter) {
		const newValue = interaction.fields.getTextInputValue('config_value');
		const fs = require('fs').promises;
		const path = require('path');

		try {
			// Charger la configuration actuelle
			const configPath = path.join(__dirname, '../../config.json');
			const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

			// Mettre à jour la valeur selon le paramètre
			switch (parameter) {
			case 'alert_threshold':
				config.alerts.activityThreshold = parseInt(newValue);
				break;
			case 'alert_channel':
				config.alerts.channelId = newValue;
				break;
			case 'git_frequency':
				config.git.frequency = newValue;
				break;
			case 'auto_archive':
				config.reports.autoArchive = newValue.toLowerCase() === 'true';
				break;
			case 'admin_roles':
				config.permissions.admin_roles = newValue.split(',').map(role => role.trim());
				break;
			}

			// Sauvegarder la configuration
			await fs.writeFile(configPath, JSON.stringify(config, null, 2));

			await interaction.reply({
				content: `✅ Paramètre **${parameter}** mis à jour avec la valeur: \`${newValue}\``,
				
			});

		}
		catch (error) {
			console.error('Erreur lors de la mise à jour de la configuration:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la mise à jour de la configuration.',
				
			});
		}
	},
};