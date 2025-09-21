const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');

const config = require('../../../config.json');

// Fonction utilitaire pour créer le nouveau format de réponse
function createResponse(title, content, components = [], files = []) {
    const response = {
        flags: 32768,
        components: [{
            type: 17,
            components: [{
                type: 10,
                content: `## 📊 ${title}\n\n${content}`
            }]
        }]
    };
    
    // Ajouter les composants (boutons, menus) si fournis
    if (components && components.length > 0) {
        response.components = response.components.concat(components);
    }
    
    // Ajouter les fichiers si fournis
    if (files && files.length > 0) {
        response.files = files;
    }
    
    return response;
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

			// Menu de sélection pour changer de période (Type 17)
			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId('report_period_select')
				.setPlaceholder('Choisir une période')
				.addOptions([
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
				]);

			const selectRow = new ActionRowBuilder().addComponents(selectMenu);

			// Boutons d'action (Type 10)
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId(`download_report_${periode}`)
						.setLabel('Télécharger')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('📥'),
					new ButtonBuilder()
						.setCustomId(`email_report_${periode}`)
						.setLabel('Envoyer par mail')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📧'),
					new ButtonBuilder()
						.setCustomId(`view_report_${periode}`)
						.setLabel('Visualiser')
						.setStyle(ButtonStyle.Success)
						.setEmoji('👁️'),
				);

			await interaction.editReply(createResponse(
				'Rapport Généré',
				content,
				[selectRow, buttons]
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

			// Boutons d'action (Type 10)
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('reports_refresh')
						.setLabel('Actualiser')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🔄'),
					new ButtonBuilder()
						.setCustomId('reports_archive')
						.setLabel('Archiver anciens')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📦'),
					new ButtonBuilder()
						.setCustomId('reports_cleanup')
						.setLabel('Nettoyer')
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🗑️'),
				);

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

			// Boutons d'action (Type 10)
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('archive_view')
						.setLabel('Voir archives')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('📁'),
					new ButtonBuilder()
						.setCustomId('archive_restore')
						.setLabel('Restaurer')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('↩️'),
					new ButtonBuilder()
						.setCustomId('archive_cleanup')
						.setLabel('Nettoyer archives')
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🗑️'),
				);

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