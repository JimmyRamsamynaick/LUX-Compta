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
					ephemeral: true,
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
					ephemeral: true,
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
					ephemeral: true,
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
				config.permissions.adminRoles = newValue.split(',').map(role => role.trim());
				break;
			}

			// Sauvegarder la configuration
			await fs.writeFile(configPath, JSON.stringify(config, null, 2));

			await interaction.reply({
				content: `✅ Paramètre **${parameter}** mis à jour avec la valeur: \`${newValue}\``,
				ephemeral: true,
			});

		}
		catch (error) {
			console.error('Erreur lors de la mise à jour de la configuration:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la mise à jour de la configuration.',
				ephemeral: true,
			});
		}
	},
};