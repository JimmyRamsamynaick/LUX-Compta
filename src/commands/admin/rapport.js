const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const ComponentBuilder = require('../../utils/componentBuilder');

const config = require('../../../config.json');

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
		.setName('rapport')
		.setDescription('Gérer les rapports de statistiques du serveur')
		.addSubcommand(subcommand =>
			subcommand
				.setName('generer')
				.setDescription('Générer un rapport pour une période donnée')
				.addStringOption(option =>
					option.setName('periode')
						.setDescription('Période du rapport')
						.setRequired(true)
						.addChoices(
							{ name: 'Aujourd\'hui', value: 'daily' },
							{ name: 'Cette semaine', value: 'weekly' },
							{ name: 'Ce mois', value: 'monthly' },
						),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('liste')
				.setDescription('Afficher la liste des rapports disponibles'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('archiver')
				.setDescription('Archiver les anciens rapports'),
		),

	async execute(interaction) {
		// Le bot peut toujours exécuter ses propres commandes admin
		// Pas de vérification de permissions utilisateur nécessaire

		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
			case 'generer':
				await this.handleGenerate(interaction);
				break;
			case 'liste':
				await this.handleList(interaction);
				break;
			case 'archiver':
				await this.handleArchive(interaction);
				break;
			}
		}
		catch (error) {
			console.error('Erreur dans la commande rapport:', error);
			await interaction.reply({
				content: '❌ Une erreur est survenue lors de l\'exécution de la commande.',
				
			});
		}
	},

	async handleGenerate(interaction) {
		const periode = interaction.options.getString('periode');
		const reportManager = interaction.client.reportManager;
		const statsManager = interaction.client.statsManager;

		await interaction.deferReply();

		try {
			// Générer le rapport
			const reportPath = await reportManager.generateReport(periode, interaction.guild);
			const stats = await statsManager.getStats(periode);


			let content = '📊 **RAPPORT GÉNÉRÉ AVEC SUCCÈS** ✅\n\n';
			content += `📋 **Rapport ${periode} généré pour ${interaction.guild.name}**\n\n`;
			content += `📈 **Messages:** ${stats.messages}\n`;
			content += `👥 **Membres actifs:** ${stats.activeMembers}\n`;
			content += `📅 **Période:** ${this.getPeriodLabel(periode)}\n\n`;
			content += `⏰ **Généré le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Menu de sélection pour changer de période (Type 17) - Utilisation de ComponentBuilder
			const selectMenu = ComponentBuilder.createSelectMenu({
				customId: 'report_period_select',
				placeholder: 'Choisir une période',
				options: [
					{
						label: 'Aujourd\'hui',
						description: 'Rapport quotidien',
						value: 'daily',
						emoji: '📅',
					},
					{
						label: 'Cette semaine',
						description: 'Rapport hebdomadaire',
						value: 'weekly',
						emoji: '📊',
					},
					{
						label: 'Ce mois',
						description: 'Rapport mensuel',
						value: 'monthly',
						emoji: '📈',
					},
				]
			});

			// Boutons d'action (Type 10) - Utilisation de ComponentBuilder
			const buttons = ComponentBuilder.createActionButtons([
				{
					customId: `download_report_${periode}`,
					label: 'Télécharger',
					style: 'PRIMARY',
					emoji: '📥'
				},
				{
					customId: `email_report_${periode}`,
					label: 'Envoyer par mail',
					style: 'SECONDARY',
					emoji: '📧'
				},
				{
					customId: `view_report_${periode}`,
					label: 'Visualiser',
					style: 'SUCCESS',
					emoji: '👁️'
				}
			]);

			await interaction.editReply(createResponse(
			'Rapport Généré',
			content,
			[selectMenu, buttons]
		));

		}
		catch (error) {
			console.error('Erreur lors de la génération du rapport:', error);
			await interaction.editReply(createResponse(
				'Erreur',
				'❌ Erreur lors de la génération du rapport.'
			));
		}
	},

	async handleList(interaction) {
		const reportManager = interaction.client.reportManager;

		await interaction.deferReply();

		try {
			const reports = await reportManager.listReports();

			if (reports.length === 0) {
				return interaction.editReply(createResponse(
					'Aucun Rapport',
					'📋 Aucun rapport disponible.'
				));
			}


			let content = '📋 **RAPPORTS DISPONIBLES** 📋\n\n';
			content += `📊 **${reports.length} rapport(s) trouvé(s)**\n\n`;

			// Grouper les rapports par type
			const groupedReports = reports.reduce((acc, report) => {
				const type = report.type || 'general';
				if (!acc[type]) acc[type] = [];
				acc[type].push(report);
				return acc;
			}, {});

			Object.entries(groupedReports).forEach(([type, typeReports]) => {
				content += `${this.getTypeEmoji(type)} **${this.getTypeLabel(type)}:**\n`;
				const reportList = typeReports
					.slice(0, 5) // Limiter à 5 rapports par type
					.map(report => `• ${report.name} (${report.size})`)
					.join('\n');
				content += reportList || 'Aucun rapport';
				content += '\n\n';
			});

			content += `⏰ **Dernière mise à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Boutons d'action (Type 10) - Utilisation de ComponentBuilder
		const buttons = ComponentBuilder.createActionButtons([
			{
				customId: 'reports_refresh',
				label: 'Actualiser',
				style: 'PRIMARY',
				emoji: '🔄'
			},
			{
				customId: 'reports_archive',
				label: 'Archiver anciens',
				style: 'SECONDARY',
				emoji: '📦'
			},
			{
				customId: 'reports_cleanup',
				label: 'Nettoyer',
				style: 'DANGER',
				emoji: '🗑️'
			}
		]);

			await interaction.editReply(createResponse(
				'Rapports Disponibles',
				content,
				[buttons]
			));

		}
		catch (error) {
			console.error('Erreur lors de la liste des rapports:', error);
			await interaction.editReply(createResponse(
				'Erreur',
				'❌ Erreur lors de la récupération de la liste des rapports.'
			));
		}
	},

	async handleArchive(interaction) {
		const reportManager = interaction.client.reportManager;

		await interaction.deferReply();

		try {
			const result = await reportManager.archiveOldReports();


			let content = '📦 **ARCHIVAGE DES RAPPORTS** 📦\n\n';
			content += '✅ **Archivage terminé avec succès !**\n\n';
			content += '📊 **Résultats:**\n';
			content += `• **${result.archived}** rapport(s) archivé(s)\n`;
			content += `• **${result.deleted}** ancien(s) fichier(s) supprimé(s)\n`;
			content += `• **${result.size}** d'espace libéré\n\n`;

			if (result.errors && result.errors.length > 0) {
				content += '⚠️ **Erreurs rencontrées:**\n';
				result.errors.slice(0, 3).forEach(error => {
					content += `• ${error}\n`;
				});
				if (result.errors.length > 3) {
					content += `• ... et ${result.errors.length - 3} autre(s) erreur(s)\n`;
				}
				content += '\n';
			}

			content += `⏰ **Archivage effectué:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Boutons d'action (Type 10) - Utilisation de ComponentBuilder
		const buttons = ComponentBuilder.createActionButtons([
			{
				customId: 'archive_view',
				label: 'Voir archives',
				style: 'PRIMARY',
				emoji: '📁'
			},
			{
				customId: 'archive_restore',
				label: 'Restaurer',
				style: 'SECONDARY',
				emoji: '↩️'
			},
			{
				customId: 'archive_cleanup',
				label: 'Nettoyer archives',
				style: 'DANGER',
				emoji: '🗑️'
			}
		]);

			await interaction.editReply(createResponse(
				'Archivage Terminé',
				content,
				[buttons]
			));

		}
		catch (error) {
			console.error('Erreur lors de l\'archivage:', error);
			await interaction.editReply(createResponse(
				'Erreur',
				'❌ Erreur lors de l\'archivage des rapports.'
			));
		}
	},

	getPeriodLabel(period) {
		const labels = {
			'daily': 'Aujourd\'hui',
			'weekly': 'Cette semaine',
			'monthly': 'Ce mois',
		};
		return labels[period] || period;
	},

	getTypeEmoji(type) {
		const emojis = {
			'daily': '📅',
			'weekly': '📊',
			'monthly': '📈',
			'general': '📋',
		};
		return emojis[type] || '📄';
	},

	getTypeLabel(type) {
		const labels = {
			'daily': 'Rapports quotidiens',
			'weekly': 'Rapports hebdomadaires',
			'monthly': 'Rapports mensuels',
			'general': 'Rapports généraux',
		};
		return labels[type] || 'Autres rapports';
	},
};