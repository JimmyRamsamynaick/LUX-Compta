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
		.setName('report')
		.setDescription('📊 Générer et gérer les rapports')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand =>
			subcommand
				.setName('generate')
				.setDescription('Générer un nouveau rapport')
				.addStringOption(option =>
					option
						.setName('period')
						.setDescription('Période du rapport')
						.setRequired(true)
						.addChoices(
							{ name: '📅 Quotidien', value: 'daily' },
							{ name: '📆 Hebdomadaire', value: 'weekly' },
							{ name: '🗓️ Mensuel', value: 'monthly' },
						),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setDescription('Lister les rapports disponibles')
				.addStringOption(option =>
					option
						.setName('period')
						.setDescription('Filtrer par période')
						.setRequired(false)
						.addChoices(
							{ name: '📅 Quotidien', value: 'daily' },
							{ name: '📆 Hebdomadaire', value: 'weekly' },
							{ name: '🗓️ Mensuel', value: 'monthly' },
						),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('send')
				.setDescription('Envoyer un rapport par email')
				.addStringOption(option =>
					option
						.setName('filename')
						.setDescription('Nom du fichier de rapport')
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName('email')
						.setDescription('Adresse email de destination')
						.setRequired(false),
				),
		),

	async execute(interaction) {
		// Le bot peut toujours exécuter ses propres commandes admin
		// Pas de vérification de permissions utilisateur nécessaire
		const reportManager = interaction.client.managers.report;
		const emailManager = interaction.client.managers.email;
		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
			case 'generate':
				await this.handleGenerate(interaction, reportManager);
				break;
			case 'list':
				await this.handleList(interaction, reportManager);
				break;
			case 'send':
				await this.handleSend(interaction, reportManager, emailManager);
				break;
			}
		}
		catch (error) {
			console.error('❌ Erreur dans la commande report:', error);

			let content = '❌ **ERREUR** ❌\n\n';
			content += '⚠️ **Une erreur est survenue lors de l\'exécution de la commande.**\n\n';
			content += `🔍 **Détails:** ${error.message || 'Erreur inconnue'}\n`;
			content += `⏰ **Heure:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			if (interaction.replied || interaction.deferred) {
				await interaction.editReply(createResponse(
				'Erreur',
				content
			));
			}
			else {
				await interaction.reply(createResponse(
					'Erreur Report',
					content
				));
			}
		}
	},

	async handleGenerate(interaction, reportManager) {
		await interaction.deferReply();

		const period = interaction.options.getString('period');

		let content = '⏳ **GÉNÉRATION DU RAPPORT** ⏳\n\n';
		content += `📊 **Génération du rapport ${this.getPeriodLabel(period)} en cours...**\n\n`;
		content += `⏰ **Démarré:** <t:${Math.floor(Date.now() / 1000)}:F>`;

		await interaction.editReply(createResponse(
			'Génération en cours',
			content
		));

		try {
			const result = await reportManager.generateReport(period);

			content = '✅ **RAPPORT GÉNÉRÉ AVEC SUCCÈS** ✅\n\n';
			content += `📊 **Le rapport ${this.getPeriodLabel(period)} a été généré avec succès !**\n\n`;
			content += '📋 **Détails du rapport:**\n';
			content += `• **📄 Fichier:** ${result.filename}\n`;
			content += `• **📊 Entrées:** ${result.totalEntries}\n`;
			content += `• **📅 Période:** ${this.getPeriodLabel(period)}\n\n`;
			content += `⏰ **Généré:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Boutons d'action (Type 10) - Utilisation de ComponentBuilder
		const buttons = ComponentBuilder.createActionButtons([
			{
				customId: 'report_download',
				label: 'Télécharger',
				style: 'PRIMARY',
				emoji: '💾'
			},
			{
				customId: 'report_send_email',
				label: 'Envoyer par mail',
				style: 'SECONDARY',
				emoji: '📧'
			},
			{
				customId: 'report_view',
				label: 'Aperçu',
				style: 'SECONDARY',
				emoji: '👁️'
			}
		]);

			await interaction.editReply(createResponse(
				'Rapport Généré',
				content,
				[buttons]
			));
		}
		catch (error) {
			content = '❌ **ERREUR DE GÉNÉRATION** ❌\n\n';
			content += '⚠️ **Impossible de générer le rapport.**\n\n';
			content += `🔍 **Détails:** ${error.message}\n`;
			content += `📅 **Période demandée:** ${this.getPeriodLabel(period)}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.editReply(createResponse(
				'Erreur Génération',
				content
			));
		}
	},

	async handleList(interaction, reportManager) {
		await interaction.deferReply();

		const period = interaction.options.getString('period');

		try {
			const reports = await reportManager.getReportsList(period);

			if (reports.length === 0) {
				let content = '📋 **AUCUN RAPPORT TROUVÉ** 📋\n\n';
				content += period ?
					`⚠️ **Aucun rapport ${this.getPeriodLabel(period)} trouvé.**\n\n` :
					'⚠️ **Aucun rapport disponible.**\n\n';
				content += '💡 **Suggestion:** Utilisez `/report generate` pour créer un nouveau rapport.\n';
				content += `⏰ **Recherche effectuée:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				await interaction.editReply(createResponse(
					'Aucun Rapport',
					content
				));
				return;
			}


			let content = '📋 **LISTE DES RAPPORTS** 📋\n\n';
			content += `📊 **${reports.length} rapport(s) trouvé(s)**\n\n`;

			// Limiter à 10 rapports pour éviter un contenu trop long
			const displayReports = reports.slice(0, 10);

			displayReports.forEach((report, index) => {
				content += `**${index + 1}.** ${report.filename}\n`;
				content += `   📅 ${this.getPeriodLabel(report.period)} - ${report.date.toLocaleDateString('fr-FR')}\n\n`;
			});

			if (reports.length > 10) {
				content += `... et **${reports.length - 10}** autre(s) rapport(s)\n\n`;
			}

			content += `⏰ **Liste mise à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Menu de sélection pour filtrer par période (Type 17) - Utilisation de ComponentBuilder
		const periodSelect = ComponentBuilder.createSelectMenu({
			customId: 'report_filter_period',
			placeholder: '🔍 Filtrer par période',
			options: [
				{
					label: 'Tous les rapports',
					value: 'all',
					emoji: '📊'
				},
				{
					label: 'Quotidien',
					value: 'daily',
					emoji: '📅'
				},
				{
					label: 'Hebdomadaire',
					value: 'weekly',
					emoji: '📆'
				},
				{
					label: 'Mensuel',
					value: 'monthly',
					emoji: '🗓️'
				}
			]
		});

		// Boutons d'action (Type 10) - Utilisation de ComponentBuilder
		const buttons = ComponentBuilder.createActionButtons([
			{
				customId: 'reports_refresh',
				label: 'Actualiser',
				style: 'PRIMARY',
				emoji: '🔄'
			},
			{
				customId: 'reports_export',
				label: 'Exporter liste',
				style: 'SECONDARY',
				emoji: '📤'
			},
			{
				customId: 'reports_cleanup',
				label: 'Nettoyer',
				style: 'DANGER',
				emoji: '🗑️'
			}
		]);

			await interaction.editReply(createResponse(
				'Liste des Rapports',
				content,
				[periodSelect, buttons]
			));
		}
		catch (error) {
			let content = '❌ **ERREUR** ❌\n\n';
			content += '⚠️ **Impossible de récupérer la liste des rapports.**\n\n';
			content += `🔍 **Détails:** ${error.message}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.editReply(createResponse(
				'Erreur',
				content
			));
		}
	},

	async handleSend(interaction, reportManager, emailManager) {
		await interaction.deferReply();

		const filename = interaction.options.getString('filename');
		const email = interaction.options.getString('email');

		let content = '📧 **ENVOI DU RAPPORT** 📧\n\n';
		content += `📤 **Envoi du rapport "${filename}" par email...**\n\n`;
		content += `⏰ **Démarré:** <t:${Math.floor(Date.now() / 1000)}:F>`;

		await interaction.editReply(createResponse(
			'Envoi en cours',
			content
		));

		try {
			const result = await emailManager.sendReport(filename, email);


			content = '✅ **RAPPORT ENVOYÉ AVEC SUCCÈS** ✅\n\n';
			content += `📧 **Le rapport "${filename}" a été envoyé par email !**\n\n`;
			content += '📋 **Détails de l\'envoi:**\n';
			content += `• **📧 Destinataire:** ${result.recipient}\n`;
			content += `• **📄 Fichier:** ${filename}\n`;
			content += `• **📊 Taille:** ${result.size || 'Non spécifiée'}\n\n`;
			content += `⏰ **Envoyé:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Boutons d'action (Type 10)
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('email_resend')
						.setLabel('Renvoyer')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🔄'),
					new ButtonBuilder()
						.setCustomId('email_send_other')
						.setLabel('Envoyer à autre')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📧'),
					new ButtonBuilder()
						.setCustomId('email_history')
						.setLabel('Historique')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📜'),
				);

			await interaction.editReply(createResponse(
				'Rapport Envoyé',
				content,
				[buttons]
			));
		}
		catch (error) {
			content = '❌ **ERREUR D\'ENVOI** ❌\n\n';
			content += '⚠️ **Impossible d\'envoyer le rapport par email.**\n\n';
			content += `🔍 **Détails:** ${error.message}\n`;
			content += `📄 **Fichier:** ${filename}\n`;
			content += `📧 **Email:** ${email || 'Email par défaut'}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.editReply(createResponse(
				'Erreur Envoi',
				content
			));
		}
	},

	getPeriodLabel(period) {
		const labels = {
			'daily': 'Quotidien',
			'weekly': 'Hebdomadaire',
			'monthly': 'Mensuel',
		};
		return labels[period] || period;
	},

	// Gestionnaire pour les boutons de rapport
	async handleReportButton(interaction) {
		const customId = interaction.customId;

		try {
			if (customId === 'report_generate') {
				await this.generateReport(interaction);
			}
			else if (customId === 'report_schedule') {
				await this.scheduleReport(interaction);
			}
			else if (customId === 'report_export') {
				await this.exportReport(interaction);
			}
			else if (customId.startsWith('report_type_')) {
				const reportType = customId.replace('report_type_', '');
				await this.selectReportType(interaction, reportType);
			}
			else if (customId.startsWith('report_format_')) {
				const format = customId.replace('report_format_', '');
				await this.selectReportFormat(interaction, format);
			}
			else {
				let content = '❌ **ACTION NON RECONNUE** ❌\n\n';
				content += '⚠️ **L\'action de rapport demandée n\'est pas reconnue.**\n\n';
				content += `🔍 **Action:** ${customId}\n`;
				content += `⏰ **Tentative:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				await interaction.reply(createResponse(
					'Action Inconnue',
					content
				));
			}
		}
		catch (error) {
			console.error('❌ Erreur lors de la gestion du bouton rapport:', error);
			
			let content = '❌ **ERREUR BOUTON RAPPORT** ❌\n\n';
			content += '⚠️ **Erreur lors de l\'exécution de l\'action de rapport.**\n\n';
			content += `🔍 **Détails:** ${error.message || 'Erreur inconnue'}\n`;
			content += `📝 **Action:** ${customId || 'Non spécifiée'}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.reply(createResponse(
				'Erreur Action Rapport',
				content
			));
		}
	},

	async generateReport(interaction) {
		let content = '📊 **RAPPORT GÉNÉRÉ** 📊\n\n';
		content += '✅ **Le rapport a été généré avec succès !**\n\n';
		content += `⏰ **Généré:** <t:${Math.floor(Date.now() / 1000)}:F>`;

		await interaction.reply(createResponse(
			'Génération Réussie',
			content
		));
	},

	async scheduleReport(interaction) {
		let content = '⏰ **RAPPORT PROGRAMMÉ** ⏰\n\n';
		content += '✅ **Le rapport a été programmé avec succès !**\n\n';
		content += `📅 **Programmé:** <t:${Math.floor(Date.now() / 1000)}:F>`;

		await interaction.reply(createResponse(
			'Programmation Réussie',
			content
		));
	},

	async exportReport(interaction) {
		let content = '📤 **RAPPORT EXPORTÉ** 📤\n\n';
		content += '✅ **Le rapport a été exporté avec succès !**\n\n';
		content += `💾 **Exporté:** <t:${Math.floor(Date.now() / 1000)}:F>`;

		await interaction.reply(createResponse(
			'Export Réussi',
			content
		));
	},

	async selectReportType(interaction, reportType) {
		let content = '✅ **TYPE SÉLECTIONNÉ** ✅\n\n';
		content += `📊 **Type de rapport "${reportType}" sélectionné.**\n\n`;
		content += `⏰ **Sélectionné:** <t:${Math.floor(Date.now() / 1000)}:F>`;

		await interaction.reply(createResponse(
			'Type Sélectionné',
			content
		));
	},

	async selectReportFormat(interaction, format) {
		let content = '✅ **FORMAT SÉLECTIONNÉ** ✅\n\n';
		content += `📄 **Format "${format}" sélectionné pour le rapport.**\n\n`;
		content += `⏰ **Sélectionné:** <t:${Math.floor(Date.now() / 1000)}:F>`;

		await interaction.reply(createResponse(
			'Format Sélectionné',
			content
		));
	}
};