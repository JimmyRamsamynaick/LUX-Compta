const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');

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
				return await interaction.reply({
					content: '❌ Le gestionnaire de dashboard n\'est pas disponible.',
					flags: 64,
				});
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

			const errorMessage = '❌ Une erreur est survenue lors de l\'exécution de la commande.';

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: errorMessage, flags: 64 });
			}
			else {
				await interaction.reply({ content: errorMessage, flags: 64 });
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
			await interaction.reply({
				content: '❌ Erreur lors de la création du dashboard.',
				flags: 64,
			});
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
			await interaction.reply({
				content: '❌ Erreur lors de la gestion du dashboard.',
				flags: 64,
			});
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

				await interaction.reply({
					content: `✅ Mise à jour automatique ${status}${intervalText}.`,
					flags: 64,
				});
			}
			else {
				await interaction.reply({
					content: '❌ Aucun dashboard trouvé dans ce canal.',
					flags: 64,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la configuration de l\'auto-update:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la configuration de la mise à jour automatique.',
				flags: 64,
			});
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

				// Boutons d'action (Type 10)
				const buttons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('dashboard_create_main')
							.setLabel('Créer dashboard principal')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('📊'),
						new ButtonBuilder()
							.setCustomId('dashboard_create_custom')
							.setLabel('Dashboard personnalisé')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('⚙️'),
						new ButtonBuilder()
							.setCustomId('dashboard_help')
							.setLabel('Aide')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('❓'),
					);

				return await interaction.reply({
					content: content,
					components: [buttons],
					flags: 64,
				});
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

			// Menu de sélection pour gérer un dashboard spécifique (Type 17)
			const dashboardSelect = new ActionRowBuilder()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('dashboard_manage_select')
						.setPlaceholder('Sélectionner un dashboard à gérer...')
						.addOptions(
							dashboards.slice(0, 25).map(dashboard => ({
								label: `Dashboard ${dashboard.channelId}`,
								value: dashboard.channelId,
								description: `Auto-update: ${dashboard.autoUpdate ? 'Activé' : 'Désactivé'}`,
								emoji: dashboard.autoUpdate ? '🟢' : '🔴',
							})),
						),
				);

			// Boutons d'action (Type 10)
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('dashboard_refresh_all')
						.setLabel('Actualiser tout')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🔄'),
					new ButtonBuilder()
						.setCustomId('dashboard_create_new')
						.setLabel('Créer nouveau')
						.setStyle(ButtonStyle.Success)
						.setEmoji('➕'),
					new ButtonBuilder()
						.setCustomId('dashboard_settings_global')
						.setLabel('Paramètres globaux')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('⚙️'),
				);

			await interaction.reply({
				content: content,
				components: [dashboardSelect, buttons],
				flags: 64,
			});

		}
		catch (error) {
			console.error('❌ Erreur lors de la liste des dashboards:', error);
			throw error;
		}
	},

	async refreshDashboards(interaction, dashboardManager) {
		try {
			await interaction.deferReply({ flags: 64 });

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
					flags: 64,
				});
			}

			// Supprimer le dashboard du cache
			const success = await dashboardManager.removeDashboard(channelId);

			if (success) {
				await interaction.reply({
					content: '✅ Dashboard supprimé du cache. Le message reste visible mais ne sera plus mis à jour automatiquement.',
					flags: 64,
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la suppression du dashboard.',
					flags: 64,
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

			const channelId = interaction.channelId;
			const dashboard = dashboardManager.getDashboardInfo(channelId);

			if (!dashboard) {
				let content = '⚙️ **PARAMÈTRES DU DASHBOARD** ⚙️\n\n';
				content += '❌ **Aucun dashboard trouvé dans ce canal.**\n\n';
				content += '💡 **Pour commencer:**\n';
				content += '• Créez d\'abord un dashboard avec `/dashboard créer`\n';
				content += '• Choisissez le type de dashboard adapté\n';
				content += '• Revenez ensuite configurer les paramètres\n\n';
				content += `⏰ **Consulté:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Boutons d'action (Type 10)
				const buttons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('dashboard_create_here')
							.setLabel('Créer dashboard ici')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('📊'),
						new ButtonBuilder()
							.setCustomId('dashboard_list_all')
							.setLabel('Voir tous les dashboards')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('📋'),
						new ButtonBuilder()
							.setCustomId('dashboard_help_settings')
							.setLabel('Aide')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('❓'),
					);

				return await interaction.reply({
					content: content,
					components: [buttons],
					flags: 64,
				});
			}

			let content = '⚙️ **PARAMÈTRES DU DASHBOARD** ⚙️\n\n';
			content += '📊 **Configuration du dashboard de ce canal**\n\n';

			// Informations générales
			content += '📋 **Informations générales:**\n';
			content += `• **ID Message:** \`${dashboard.messageId}\`\n`;
			content += `• **Canal:** <#${dashboard.channelId}>\n`;
			content += `• **Créé par:** <@${dashboard.userId}>\n`;
			content += `• **Créé le:** <t:${Math.floor(dashboard.lastUpdate.getTime() / 1000)}:F>\n\n`;

			// Configuration
			content += '⚙️ **Configuration actuelle:**\n';
			content += `• **Auto-update:** ${dashboard.autoUpdate ? '🟢 Activé' : '🔴 Désactivé'}\n`;
			content += `• **Dernière MAJ:** <t:${Math.floor(dashboard.lastUpdate.getTime() / 1000)}:R>\n`;
			content += `• **Type:** ${dashboard.type || 'Principal'}\n\n`;

			content += `⏰ **Paramètres consultés:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Menu de sélection pour modifier les paramètres (Type 17)
			const settingsSelect = new ActionRowBuilder()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('dashboard_settings_modify')
						.setPlaceholder('Modifier un paramètre...')
						.addOptions([
							{
								label: dashboard.autoUpdate ? 'Désactiver Auto-update' : 'Activer Auto-update',
								value: 'toggle_auto_update',
								description: `Actuellement: ${dashboard.autoUpdate ? 'Activé' : 'Désactivé'}`,
								emoji: dashboard.autoUpdate ? '🔴' : '🟢',
							},
							{
								label: 'Changer intervalle de MAJ',
								value: 'change_interval',
								description: 'Modifier la fréquence de mise à jour',
								emoji: '⏱️',
							},
							{
								label: 'Modifier type de dashboard',
								value: 'change_type',
								description: 'Changer le type d\'affichage',
								emoji: '🔄',
							},
							{
								label: 'Réinitialiser paramètres',
								value: 'reset_settings',
								description: 'Remettre la configuration par défaut',
								emoji: '🔄',
							},
						]),
				);

			// Boutons d'action (Type 10)
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('dashboard_force_refresh')
						.setLabel('Actualiser maintenant')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🔄'),
					new ButtonBuilder()
						.setCustomId('dashboard_export_config')
						.setLabel('Exporter config')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📤'),
					new ButtonBuilder()
						.setCustomId('dashboard_delete_confirm')
						.setLabel('Supprimer')
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🗑️'),
				);

			await interaction.reply({
				content: content,
				components: [settingsSelect, buttons],
				flags: 64,
			});

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'affichage des paramètres:', error);
			throw error;
		}
	},
};