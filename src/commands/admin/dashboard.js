const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const ComponentBuilder = require('../../utils/componentBuilder');

// Fonction pour créer le nouveau format de réponse
function createResponse(title, content, components = [], files = []) {
	return {
		content: `# ${title}\n\n${content}`,
		components: components,
		files
	};
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dashboard')
		.setDescription('Gérer les dashboards en temps réel')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand =>
			subcommand
				.setName('créer')
				.setDescription('Créer un nouveau dashboard')
				.addStringOption(option =>
					option
						.setName('type')
						.setDescription('Type de dashboard à créer')
						.setRequired(false)
						.addChoices(
							{ name: 'Principal', value: 'main' },
							{ name: 'Membres', value: 'members' },
							{ name: 'Canaux', value: 'channels' },
							{ name: 'Activité', value: 'activity' },
							{ name: 'Tendances', value: 'trends' },
						),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('gérer')
				.setDescription('Gérer les dashboards existants')
				.addStringOption(option =>
					option
						.setName('action')
						.setDescription('Action à effectuer')
						.setRequired(true)
						.addChoices(
							{ name: 'Lister', value: 'list' },
							{ name: 'Actualiser', value: 'refresh' },
							{ name: 'Supprimer', value: 'delete' },
							{ name: 'Paramètres', value: 'settings' },
						),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('auto-update')
				.setDescription('Configurer la mise à jour automatique')
				.addBooleanOption(option =>
					option
						.setName('activé')
						.setDescription('Activer ou désactiver la mise à jour automatique')
						.setRequired(true),
				)
				.addIntegerOption(option =>
					option
						.setName('intervalle')
						.setDescription('Intervalle de mise à jour en minutes (1-60)')
						.setRequired(false)
						.setMinValue(1)
						.setMaxValue(60),
				),
		),

	async execute(interaction) {
		try {
			// Le bot peut toujours exécuter ses propres commandes admin
			// Pas de vérification de permissions utilisateur nécessaire

			const subcommand = interaction.options.getSubcommand();
			const dashboardManager = interaction.client.dashboardManager;

			if (!dashboardManager) {
				return await interaction.reply(createResponse(
					'Erreur',
					'❌ Le gestionnaire de dashboard n\'est pas disponible.'
				));
			}

			switch (subcommand) {
			case 'créer':
				await this.handleCreate(interaction, dashboardManager);
				break;
			case 'gérer':
				await this.handleManage(interaction, dashboardManager);
				break;
			case 'auto-update':
				await this.handleAutoUpdate(interaction, dashboardManager);
				break;
			}

		}
		catch (error) {
			console.error('❌ Erreur dans la commande dashboard:', error);

			const errorResponse = createResponse(
				'Erreur',
				'❌ Une erreur est survenue lors de l\'exécution de la commande.'
			);

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp(errorResponse);
			}
			else {
				await interaction.reply(errorResponse);
			}
		}
	},

	async handleCreate(interaction, dashboardManager) {
		const type = interaction.options.getString('type') || 'main';

		try {
			if (type === 'main') {
				await dashboardManager.createMainDashboard(interaction);
			}
			else {
				await dashboardManager.createDetailedDashboard(interaction, type);
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la création du dashboard:', error);
			
			let content = '❌ **ERREUR DE CRÉATION** ❌\n\n';
			content += '⚠️ **Impossible de créer le dashboard.**\n\n';
			content += `🔍 **Détails:** ${error.message || 'Erreur inconnue'}\n`;
			content += `📝 **Type demandé:** ${type || 'Non spécifié'}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.reply(createResponse(
				'Erreur Création Dashboard',
				content
			));
		}
	},

	async handleManage(interaction, dashboardManager) {
		const action = interaction.options.getString('action');

		try {
			switch (action) {
			case 'list':
				await this.listDashboards(interaction, dashboardManager);
				break;
			case 'refresh':
				await this.refreshDashboards(interaction, dashboardManager);
				break;
			case 'delete':
				await this.deleteDashboard(interaction, dashboardManager);
				break;
			case 'settings':
				await this.showDashboardSettings(interaction, dashboardManager);
				break;
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la gestion du dashboard:', error);
			
			let content = '❌ **ERREUR DE GESTION** ❌\n\n';
			content += '⚠️ **Impossible de gérer le dashboard.**\n\n';
			content += `🔍 **Détails:** ${error.message || 'Erreur inconnue'}\n`;
			content += `📝 **Action demandée:** ${action || 'Non spécifiée'}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.reply(createResponse(
				'Erreur Gestion Dashboard',
				content
			));
		}
	},

	async handleAutoUpdate(interaction, dashboardManager) {
		const enabled = interaction.options.getBoolean('activé');
		const interval = interaction.options.getInteger('intervalle') || 5;

		try {
			const channelId = interaction.channelId;
			const success = await dashboardManager.toggleAutoUpdate(channelId, enabled);

			if (success) {
				const status = enabled ? 'activée' : 'désactivée';
				const intervalText = enabled ? ` (intervalle: ${interval} minutes)` : '';

				let content = '✅ **MISE À JOUR AUTOMATIQUE** ✅\n\n';
				content += `🔄 **Statut:** Mise à jour automatique ${status}${intervalText}\n\n`;
				content += '📊 **Configuration actuelle:**\n';
				content += `• **Canal:** <#${interaction.channelId}>\n`;
				content += `• **Intervalle:** ${interval} minutes\n`;
				content += `• **Statut:** ${enabled ? '🟢 Activé' : '🔴 Désactivé'}\n\n`;
				content += `⏰ **Configuré:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				await interaction.reply(createResponse(
					'Configuration Auto-Update',
					content
				));
			}
			else {
				let content = '❌ **DASHBOARD INTROUVABLE** ❌\n\n';
				content += '⚠️ **Aucun dashboard trouvé dans ce canal.**\n\n';
				content += '💡 **Pour créer un dashboard:**\n';
				content += '• Utilisez `/dashboard créer`\n';
				content += '• Choisissez le type approprié\n';
				content += '• Configurez ensuite la mise à jour automatique\n\n';
				content += `⏰ **Vérification:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				await interaction.reply(createResponse(
					'Dashboard Non Trouvé',
					content
				));
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la configuration de l\'auto-update:', error);
			
			let content = '❌ **ERREUR AUTO-UPDATE** ❌\n\n';
			content += '⚠️ **Impossible de configurer la mise à jour automatique.**\n\n';
			content += `🔍 **Détails:** ${error.message || 'Erreur inconnue'}\n`;
			content += `📝 **Paramètres:** Activé: ${enabled}, Intervalle: ${interval}min\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.reply(createResponse(
				'Erreur Auto-Update',
				content
			));
		}
	},

	async listDashboards(interaction, dashboardManager) {
		try {
			const dashboards = dashboardManager.getAllDashboards();

			if (dashboards.length === 0) {

				let content = '📊 **DASHBOARDS ACTIFS** 📊\n\n';
				content += 'ℹ️ **Aucun dashboard actif trouvé.**\n\n';
				content += '💡 **Pour commencer:**\n';
				content += '• Utilisez `/dashboard créer` pour créer un nouveau dashboard\n';
				content += '• Choisissez le type de dashboard adapté à vos besoins\n';
				content += '• Configurez la mise à jour automatique si nécessaire\n\n';
				content += `⏰ **Consulté:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Boutons d'action (Type 10) - Utilisation de ComponentBuilder
		const buttons = ComponentBuilder.createActionButtons([
			{
				customId: 'dashboard_create_main',
				label: 'Créer dashboard principal',
				style: 'PRIMARY',
				emoji: '📊'
			},
			{
				customId: 'dashboard_create_custom',
				label: 'Dashboard personnalisé',
				style: 'SECONDARY',
				emoji: '⚙️'
			},
			{
				customId: 'dashboard_help',
				label: 'Aide',
				style: 'SECONDARY',
				emoji: '❓'
			}
		]);

				return await interaction.reply(createResponse(
					'Dashboards Actifs',
					content,
					[dashboardSelect, buttons]
				));
			}


			let content = '📊 **DASHBOARDS ACTIFS** 📊\n\n';
			content += `📈 **${dashboards.length} dashboard(s) trouvé(s)**\n\n`;

			// Afficher les dashboards
			for (let i = 0; i < Math.min(dashboards.length, 5); i++) {
				const dashboard = dashboards[i];
				try {
					const channel = await interaction.client.channels.fetch(dashboard.channelId);
					const autoUpdateStatus = dashboard.autoUpdate ? '🟢 Activé' : '🔴 Désactivé';
					const lastUpdate = dashboard.lastUpdate ?
						`<t:${Math.floor(dashboard.lastUpdate.getTime() / 1000)}:R>` :
						'Jamais';

					content += `📺 **${channel.name}**\n`;
					content += `   • **ID Message:** \`${dashboard.messageId}\`\n`;
					content += `   • **Auto-update:** ${autoUpdateStatus}\n`;
					content += `   • **Dernière MAJ:** ${lastUpdate}\n`;
					content += `   • **Créé par:** <@${dashboard.userId}>\n\n`;
				}
				catch (error) {
					content += `📺 **Canal inconnu** (ID: ${dashboard.channelId})\n`;
					content += '   • **Erreur:** Canal inaccessible\n\n';
				}
			}

			if (dashboards.length > 5) {
				content += `... et ${dashboards.length - 5} autre(s) dashboard(s)\n\n`;
			}

			content += `⏰ **Liste mise à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Menu de sélection pour gérer un dashboard spécifique (Type 17) - Utilisation de ComponentBuilder
		const dashboardSelect = ComponentBuilder.createSelectMenu({
			customId: 'dashboard_manage_select',
			placeholder: 'Sélectionner un dashboard à gérer...',
			options: dashboards.slice(0, 25).map(dashboard => ({
				label: `Dashboard ${dashboard.channelId}`,
				value: dashboard.channelId,
				description: `Auto-update: ${dashboard.autoUpdate ? 'Activé' : 'Désactivé'}`,
				emoji: dashboard.autoUpdate ? '🟢' : '🔴',
			}))
		});

		// Boutons d'action (Type 10) - Utilisation de ComponentBuilder
		const buttons = ComponentBuilder.createActionButtons([
			{
				customId: 'dashboard_refresh_all',
				label: 'Actualiser tout',
				style: 'PRIMARY',
				emoji: '🔄'
			},
			{
				customId: 'dashboard_create_new',
				label: 'Créer nouveau',
				style: 'SUCCESS',
				emoji: '➕'
			},
			{
				customId: 'dashboard_settings_global',
				label: 'Paramètres globaux',
				style: 'SECONDARY',
				emoji: '⚙️'
			}
		]);

			await interaction.reply(createResponse(
				'Dashboards Actifs',
				content,
				[dashboardSelect, buttons]
			));

		}
		catch (error) {
			console.error('❌ Erreur lors de la liste des dashboards:', error);
			throw error;
		}
	},

	async refreshDashboards(interaction, dashboardManager) {
		try {
			await interaction.deferReply();

			const dashboards = dashboardManager.getAllDashboards();
			let refreshedCount = 0;

			for (const dashboard of dashboards) {
				try {
					await dashboardManager.updateDashboard(dashboard.channelId);
					refreshedCount++;
				}
				catch (error) {
					console.error(`❌ Erreur lors de l'actualisation du dashboard ${dashboard.channelId}:`, error);
				}
			}

			await interaction.editReply({
				content: `✅ ${refreshedCount}/${dashboards.length} dashboard(s) actualisé(s).`,
			});

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'actualisation des dashboards:', error);
			throw error;
		}
	},

	async deleteDashboard(interaction, dashboardManager) {
		try {
			const channelId = interaction.channelId;
			const dashboard = dashboardManager.getDashboardInfo(channelId);

			if (!dashboard) {
				return await interaction.reply({
					content: '❌ Aucun dashboard trouvé dans ce canal.',
					
				});
			}

			// Supprimer le dashboard du cache
			const success = await dashboardManager.removeDashboard(channelId);

			if (success) {
				await interaction.reply({
					content: '✅ Dashboard supprimé du cache. Le message reste visible mais ne sera plus mis à jour automatiquement.',
					
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la suppression du dashboard.',
					
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la suppression du dashboard:', error);
			throw error;
		}
	},

	async showDashboardSettings(interaction, dashboardManager) {
		try {
			const settings = await dashboardManager.getSettings();

			let content = '⚙️ **PARAMÈTRES DU DASHBOARD** ⚙️\n\n';
			content += '📋 **Configuration actuelle:**\n';
			content += `• **Auto-update:** ${settings.autoUpdate ? '✅ Activé' : '❌ Désactivé'}\n`;
			content += `• **Intervalle:** ${settings.updateInterval || 30} secondes\n`;
			content += `• **Thème:** ${settings.theme || 'Défaut'}\n`;
			content += `• **Notifications:** ${settings.notifications ? '✅ Activées' : '❌ Désactivées'}\n\n`;
			content += `⏰ **Dernière mise à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Menu de sélection pour les paramètres (Type 17) - Utilisation de ComponentBuilder
		const settingsSelect = ComponentBuilder.createSelectMenu({
			customId: 'dashboard_settings_select',
			placeholder: 'Modifier un paramètre...',
			options: [
				{
					label: 'Auto-update',
					description: 'Activer/désactiver la mise à jour automatique',
					value: 'auto_update',
					emoji: '🔄',
				},
				{
					label: 'Intervalle',
					description: 'Modifier l\'intervalle de mise à jour',
					value: 'interval',
					emoji: '⏱️',
				},
				{
					label: 'Thème',
					description: 'Changer le thème du dashboard',
					value: 'theme',
					emoji: '🎨',
				},
				{
					label: 'Notifications',
					description: 'Gérer les notifications',
					value: 'notifications',
					emoji: '🔔',
				},
			]
		});

		// Boutons d'action (Type 10) - Utilisation de ComponentBuilder
		const buttons = ComponentBuilder.createActionButtons([
			{
				customId: 'dashboard_settings_save',
				label: 'Sauvegarder',
				style: 'SUCCESS',
				emoji: '💾'
			},
			{
				customId: 'dashboard_settings_reset',
				label: 'Réinitialiser',
				style: 'DANGER',
				emoji: '🔄'
			},
			{
				customId: 'dashboard_settings_export',
				label: 'Exporter',
				style: 'SECONDARY',
				emoji: '📤'
			}
		]);

			await interaction.reply({
				content: content,
				components: [settingsSelect, buttons],
				ephemeral: true,
			});

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'affichage des paramètres:', error);
			await interaction.reply({
				content: '❌ Erreur lors de l\'affichage des paramètres du dashboard.',
				ephemeral: true,
			});
		}
	},

	// Gestionnaire pour les boutons de dashboard
	async handleDashboardButton(interaction) {
		const customId = interaction.customId;
		const dashboardManager = interaction.client.dashboardManager;

		try {
			if (customId === 'dashboard_create_main') {
				await this.handleCreate(interaction, dashboardManager);
			}
			else if (customId === 'dashboard_refresh_all' || customId === 'dashboard_refresh') {
				await this.refreshDashboards(interaction, dashboardManager);
			}
			else if (customId === 'dashboard_settings_save') {
				await this.saveDashboardSettings(interaction, dashboardManager);
			}
			else if (customId === 'dashboard_settings_reset') {
				await this.resetDashboardSettings(interaction, dashboardManager);
			}
			else if (customId === 'dashboard_settings_export' || customId === 'dashboard_export') {
				await this.exportDashboardSettings(interaction, dashboardManager);
			}
			else if (customId === 'dashboard_settings' || customId === 'dashboard_settings_global') {
				await this.showDashboardSettings(interaction, dashboardManager);
			}
			else if (customId === 'dashboard_alerts') {
				await this.handleDashboardAlerts(interaction, dashboardManager);
			}
			else if (customId === 'dashboard_back') {
				await this.handleDashboardBack(interaction, dashboardManager);
			}
			else if (customId === 'dashboard_create_new') {
				await this.handleCreate(interaction, dashboardManager);
			}
			else if (customId === 'dashboard_create_custom') {
				await this.handleCreateCustom(interaction, dashboardManager);
			}
			else if (customId === 'dashboard_help') {
				await this.handleDashboardHelp(interaction, dashboardManager);
			}
			else if (customId.startsWith('dashboard_delete_')) {
				const dashboardId = customId.replace('dashboard_delete_', '');
				await this.deleteDashboard(interaction, dashboardManager, dashboardId);
			}
			else if (customId.startsWith('dashboard_') && customId.includes('_refresh')) {
				const type = customId.replace('dashboard_', '').replace('_refresh', '');
				await this.handleDetailedRefresh(interaction, dashboardManager, type);
			}
			else if (customId.startsWith('dashboard_') && customId.includes('_export')) {
				const type = customId.replace('dashboard_', '').replace('_export', '');
				await this.handleDetailedExport(interaction, dashboardManager, type);
			}
			else {
				await interaction.reply({
					content: '❌ Action de dashboard non reconnue.',
					ephemeral: true,
				});
			}
		}
		catch (error) {
			console.error('❌ Erreur lors de la gestion du bouton dashboard:', error);
			await interaction.reply({
				content: '❌ Erreur lors de l\'exécution de l\'action dashboard.',
				ephemeral: true,
			});
		}
	},

	async saveDashboardSettings(interaction, dashboardManager) {
		await interaction.reply({
			content: '✅ Paramètres du dashboard sauvegardés avec succès !',
			ephemeral: true,
		});
	},

	async resetDashboardSettings(interaction, dashboardManager) {
		await interaction.reply({
			content: '🔄 Paramètres du dashboard réinitialisés aux valeurs par défaut.',
			ephemeral: true,
		});
	},

	async exportDashboardSettings(interaction, dashboardManager) {
		await interaction.reply({
			content: '📊 Fonctionnalité d\'export en cours de développement.',
			ephemeral: true,
		});
	},

	async handleDashboardAlerts(interaction, dashboardManager) {
		await interaction.reply({
			content: '🚨 Gestion des alertes dashboard en cours de développement.',
			ephemeral: true,
		});
	},

	async handleDashboardBack(interaction, dashboardManager) {
		try {
			await dashboardManager.createMainDashboard(interaction);
		} catch (error) {
			console.error('❌ Erreur lors du retour au dashboard principal:', error);
			await interaction.reply({
				content: '❌ Erreur lors du retour au dashboard principal.',
				ephemeral: true,
			});
		}
	},

	async handleCreateCustom(interaction, dashboardManager) {
		await interaction.reply({
			content: '🎨 Création de dashboard personnalisé en cours de développement.',
			ephemeral: true,
		});
	},

	async handleDashboardHelp(interaction, dashboardManager) {
		const helpEmbed = new EmbedBuilder()
			.setTitle('📊 Aide Dashboard')
			.setDescription('Guide d\'utilisation des dashboards')
			.addFields([
				{
					name: '🔄 Actualiser',
					value: 'Met à jour les données du dashboard',
					inline: true,
				},
				{
					name: '📊 Exporter',
					value: 'Exporte les données (en développement)',
					inline: true,
				},
				{
					name: '⚙️ Paramètres',
					value: 'Configure les options du dashboard',
					inline: true,
				},
				{
					name: '🚨 Alertes',
					value: 'Gère les alertes (en développement)',
					inline: true,
				},
				{
					name: '⬅️ Retour',
					value: 'Retourne au dashboard principal',
					inline: true,
				},
			])
			.setColor('#0099ff')
			.setTimestamp();

		await interaction.reply({
			embeds: [helpEmbed],
			ephemeral: true,
		});
	},

	async handleDetailedRefresh(interaction, dashboardManager, type) {
		try {
			await dashboardManager.createDetailedDashboard(interaction, type);
		} catch (error) {
			console.error(`❌ Erreur lors de l'actualisation du dashboard ${type}:`, error);
			await interaction.reply({
				content: `❌ Erreur lors de l'actualisation du dashboard ${type}.`,
				ephemeral: true,
			});
		}
	},

	async handleDetailedExport(interaction, dashboardManager, type) {
		await interaction.reply({
			content: `📊 Export du dashboard ${type} en cours de développement.`,
			ephemeral: true,
		});
	},

	async handleDashboardSelect(interaction) {
		const selectedValue = interaction.values[0];
		const dashboardManager = interaction.client.dashboardManager;

		try {
			await dashboardManager.createDetailedDashboard(interaction, selectedValue);
		} catch (error) {
			console.error(`❌ Erreur lors de la création du dashboard ${selectedValue}:`, error);
			await interaction.reply({
				content: `❌ Erreur lors de la création du dashboard ${selectedValue}.`,
				ephemeral: true,
			});
		}
	},
};