const { Events } = require('discord.js');
const InteractionHandler = require('../utils/interactionHandler');

// Map des handlers de composants
const componentHandlers = {
	// Dashboard handlers
	'dashboard_*': async (interaction) => {
		const DashboardManager = require('../managers/DashboardManager');
		await DashboardManager.handleComponents(interaction);
	},
	
	// Customization handlers
	'customize_*': async (interaction) => {
		const CustomizationManager = require('../managers/CustomizationManager');
		await CustomizationManager.handleComponents(interaction);
	},
	
	// Archive handlers
	'archive_*': async (interaction) => {
		const ArchiveManager = require('../managers/ArchiveManager');
		await ArchiveManager.handleComponents(interaction);
	},
	
	// Alert handlers
	'alert_*': async (interaction) => {
		const AlertManager = require('../managers/AlertManager');
		await AlertManager.handleComponents(interaction);
	},
	
	// Config handlers
	'config_*': async (interaction) => {
		const configCommand = interaction.client.commands.get('config');
		if (configCommand && configCommand.handleComponents) {
			await configCommand.handleComponents(interaction);
		}
	},
	
	// Report handlers
	'report_*': async (interaction) => {
		const reportCommand = interaction.client.commands.get('report');
		if (reportCommand && reportCommand.handleComponents) {
			await reportCommand.handleComponents(interaction);
		}
	},
	
	// Stats handlers
	'stats_*': async (interaction) => {
		const statsCommand = interaction.client.commands.get('stats');
		if (statsCommand && statsCommand.handleComponents) {
			await statsCommand.handleComponents(interaction);
		} else {
			console.warn('Stats command ou handleComponents non trouvé');
			await interaction.reply({
				content: '❌ Commande stats non disponible.',
				ephemeral: true
			});
		}
	},
	
	// Help handlers
	'help_*': async (interaction) => {
		const helpCommand = interaction.client.commands.get('help');
		if (helpCommand && helpCommand.handleComponents) {
			await helpCommand.handleComponents(interaction);
		}
	}
};

// Créer le gestionnaire d'événements avec InteractionHandler
module.exports = InteractionHandler.createEventHandler({}, componentHandlers);