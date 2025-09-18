const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

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
					ephemeral: true,
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
				await interaction.followUp({ content: errorMessage, ephemeral: true });
			}
			else {
				await interaction.reply({ content: errorMessage, ephemeral: true });
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
				ephemeral: true,
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
				ephemeral: true,
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
					ephemeral: true,
				});
			}
			else {
				await interaction.reply({
					content: '❌ Aucun dashboard trouvé dans ce canal.',
					ephemeral: true,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la configuration de l\'auto-update:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la configuration de la mise à jour automatique.',
				ephemeral: true,
			});
		}
	},

	async listDashboards(interaction, dashboardManager) {
		try {
			const dashboards = dashboardManager.getAllDashboards();

			if (dashboards.length === 0) {
				return await interaction.reply({
					content: '📊 Aucun dashboard actif trouvé.',
					ephemeral: true,
				});
			}

			const { EmbedBuilder } = require('discord.js');

			const embed = new EmbedBuilder()
				.setTitle('📊 Dashboards actifs')
				.setDescription(`${dashboards.length} dashboard(s) trouvé(s)`)
				.setColor('#00ff00')
				.setTimestamp();

			for (const dashboard of dashboards) {
				const channel = await interaction.client.channels.fetch(dashboard.channelId);
				const autoUpdateStatus = dashboard.autoUpdate ? '🟢 Activé' : '🔴 Désactivé';
				const lastUpdate = dashboard.lastUpdate ?
					`<t:${Math.floor(dashboard.lastUpdate.getTime() / 1000)}:R>` :
					'Jamais';

				embed.addFields([
					{
						name: `📺 ${channel.name}`,
						value: [
							`**ID:** ${dashboard.messageId}`,
							`**Auto-update:** ${autoUpdateStatus}`,
							`**Dernière MAJ:** ${lastUpdate}`,
							`**Créé par:** <@${dashboard.userId}>`,
						].join('\n'),
						inline: true,
					},
				]);
			}

			await interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});

		}
		catch (error) {
			console.error('❌ Erreur lors de la liste des dashboards:', error);
			throw error;
		}
	},

	async refreshDashboards(interaction, dashboardManager) {
		try {
			await interaction.deferReply({ ephemeral: true });

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
					ephemeral: true,
				});
			}

			// Supprimer le dashboard du cache
			const success = await dashboardManager.removeDashboard(channelId);

			if (success) {
				await interaction.reply({
					content: '✅ Dashboard supprimé du cache. Le message reste visible mais ne sera plus mis à jour automatiquement.',
					ephemeral: true,
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la suppression du dashboard.',
					ephemeral: true,
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
			const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

			const channelId = interaction.channelId;
			const dashboard = dashboardManager.getDashboardInfo(channelId);

			if (!dashboard) {
				return await interaction.reply({
					content: '❌ Aucun dashboard trouvé dans ce canal.',
					ephemeral: true,
				});
			}

			const embed = new EmbedBuilder()
				.setTitle('⚙️ Paramètres du Dashboard')
				.setDescription('Configuration du dashboard de ce canal')
				.setColor('#00ff00')
				.addFields([
					{
						name: '📊 Informations',
						value: [
							`**ID Message:** ${dashboard.messageId}`,
							`**Canal:** <#${dashboard.channelId}>`,
							`**Créé par:** <@${dashboard.userId}>`,
							`**Créé le:** <t:${Math.floor(dashboard.lastUpdate.getTime() / 1000)}:F>`,
						].join('\n'),
						inline: false,
					},
					{
						name: '⚙️ Configuration',
						value: [
							`**Auto-update:** ${dashboard.autoUpdate ? '🟢 Activé' : '🔴 Désactivé'}`,
							`**Dernière MAJ:** <t:${Math.floor(dashboard.lastUpdate.getTime() / 1000)}:R>`,
						].join('\n'),
						inline: false,
					},
				])
				.setTimestamp();

			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('dashboard_toggle_auto')
						.setLabel(dashboard.autoUpdate ? 'Désactiver Auto-update' : 'Activer Auto-update')
						.setStyle(dashboard.autoUpdate ? ButtonStyle.Danger : ButtonStyle.Success)
						.setEmoji(dashboard.autoUpdate ? '🔴' : '🟢'),
					new ButtonBuilder()
						.setCustomId('dashboard_force_refresh')
						.setLabel('Actualiser maintenant')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🔄'),
					new ButtonBuilder()
						.setCustomId('dashboard_delete_confirm')
						.setLabel('Supprimer')
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🗑️'),
				);

			await interaction.reply({
				embeds: [embed],
				components: [buttons],
				ephemeral: true,
			});

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'affichage des paramètres:', error);
			throw error;
		}
	},
};