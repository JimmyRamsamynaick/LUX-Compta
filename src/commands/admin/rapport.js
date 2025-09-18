const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../../config.json');

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
		// Vérifier les permissions admin
		if (!interaction.member.roles.cache.some(role => config.permissions.adminRoles.includes(role.name))) {
			return interaction.reply({
				content: '❌ Vous n\'avez pas les permissions nécessaires pour utiliser cette commande.',
				ephemeral: true,
			});
		}

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
				ephemeral: true,
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

			// Créer l'embed de confirmation
			const embed = new EmbedBuilder()
				.setTitle('📊 Rapport généré avec succès')
				.setDescription(`Rapport ${periode} généré pour **${interaction.guild.name}**`)
				.addFields(
					{ name: '📈 Messages', value: stats.messages.toString(), inline: true },
					{ name: '👥 Membres actifs', value: stats.activeMembers.toString(), inline: true },
					{ name: '📅 Période', value: this.getPeriodLabel(periode), inline: true },
				)
				.setColor('#00ff00')
				.setTimestamp()
				.setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

			// Créer les composants interactifs
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

			const selectRow = new ActionRowBuilder().addComponents(selectMenu);

			await interaction.editReply({
				embeds: [embed],
				components: [selectRow, buttons],
			});

		}
		catch (error) {
			console.error('Erreur lors de la génération du rapport:', error);
			await interaction.editReply({
				content: '❌ Erreur lors de la génération du rapport.',
				ephemeral: true,
			});
		}
	},

	async handleList(interaction) {
		const reportManager = interaction.client.reportManager;

		await interaction.deferReply();

		try {
			const reports = await reportManager.listReports();

			if (reports.length === 0) {
				return interaction.editReply({
					content: '📋 Aucun rapport disponible.',
					ephemeral: true,
				});
			}

			const embed = new EmbedBuilder()
				.setTitle('📋 Rapports disponibles')
				.setDescription('Liste des rapports générés')
				.setColor('#0099ff')
				.setTimestamp()
				.setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

			// Grouper les rapports par type
			const groupedReports = reports.reduce((acc, report) => {
				const type = report.type || 'general';
				if (!acc[type]) acc[type] = [];
				acc[type].push(report);
				return acc;
			}, {});

			Object.entries(groupedReports).forEach(([type, typeReports]) => {
				const reportList = typeReports
					.slice(0, 5) // Limiter à 5 rapports par type
					.map(report => `• ${report.name} (${report.size})`)
					.join('\n');

				embed.addFields({
					name: `${this.getTypeEmoji(type)} ${this.getTypeLabel(type)}`,
					value: reportList || 'Aucun rapport',
					inline: false,
				});
			});

			await interaction.editReply({ embeds: [embed] });

		}
		catch (error) {
			console.error('Erreur lors de la liste des rapports:', error);
			await interaction.editReply({
				content: '❌ Erreur lors de la récupération de la liste des rapports.',
				ephemeral: true,
			});
		}
	},

	async handleArchive(interaction) {
		const reportManager = interaction.client.reportManager;

		await interaction.deferReply();

		try {
			const archivedCount = await reportManager.archiveOldReports();

			const embed = new EmbedBuilder()
				.setTitle('📦 Archivage terminé')
				.setDescription(`${archivedCount} rapport(s) archivé(s) avec succès`)
				.setColor('#ff9900')
				.setTimestamp()
				.setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

			await interaction.editReply({ embeds: [embed] });

		}
		catch (error) {
			console.error('Erreur lors de l\'archivage:', error);
			await interaction.editReply({
				content: '❌ Erreur lors de l\'archivage des rapports.',
				ephemeral: true,
			});
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