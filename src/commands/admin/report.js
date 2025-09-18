const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');

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
				await interaction.editReply({ content: content });
			}
			else {
				await interaction.reply({ content: content, ephemeral: true });
			}
		}
	},

	async handleGenerate(interaction, reportManager) {
		await interaction.deferReply();

		const period = interaction.options.getString('period');

		let content = '⏳ **GÉNÉRATION DU RAPPORT** ⏳\n\n';
		content += `📊 **Génération du rapport ${this.getPeriodLabel(period)} en cours...**\n\n`;
		content += `⏰ **Démarré:** <t:${Math.floor(Date.now() / 1000)}:F>`;

		await interaction.editReply({ content: content });

		try {
			const result = await reportManager.generateReport(period);


			content = '✅ **RAPPORT GÉNÉRÉ AVEC SUCCÈS** ✅\n\n';
			content += `📊 **Le rapport ${this.getPeriodLabel(period)} a été généré avec succès !**\n\n`;
			content += '📋 **Détails du rapport:**\n';
			content += `• **📄 Fichier:** ${result.filename}\n`;
			content += `• **📊 Entrées:** ${result.totalEntries}\n`;
			content += `• **📅 Période:** ${this.getPeriodLabel(period)}\n\n`;
			content += `⏰ **Généré:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Boutons d'action (Type 10)
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('report_download')
						.setLabel('Télécharger')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('💾'),
					new ButtonBuilder()
						.setCustomId('report_send_email')
						.setLabel('Envoyer par mail')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📧'),
					new ButtonBuilder()
						.setCustomId('report_view')
						.setLabel('Aperçu')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('👁️'),
				);

			await interaction.editReply({
				content: content,
				components: [buttons],
			});
		}
		catch (error) {
			content = '❌ **ERREUR DE GÉNÉRATION** ❌\n\n';
			content += '⚠️ **Impossible de générer le rapport.**\n\n';
			content += `🔍 **Détails:** ${error.message}\n`;
			content += `📅 **Période demandée:** ${this.getPeriodLabel(period)}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.editReply({ content: content });
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

				await interaction.editReply({ content: content });
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

			// Menu de sélection pour filtrer par période (Type 17)
			const periodSelect = new ActionRowBuilder()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('report_filter_period')
						.setPlaceholder('🔍 Filtrer par période')
						.addOptions([
							{
								label: 'Tous les rapports',
								value: 'all',
								emoji: '📊',
							},
							{
								label: 'Quotidien',
								value: 'daily',
								emoji: '📅',
							},
							{
								label: 'Hebdomadaire',
								value: 'weekly',
								emoji: '📆',
							},
							{
								label: 'Mensuel',
								value: 'monthly',
								emoji: '🗓️',
							},
						]),
				);

			// Boutons d'action (Type 10)
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('reports_refresh')
						.setLabel('Actualiser')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🔄'),
					new ButtonBuilder()
						.setCustomId('reports_export')
						.setLabel('Exporter liste')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📤'),
					new ButtonBuilder()
						.setCustomId('reports_cleanup')
						.setLabel('Nettoyer')
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🗑️'),
				);

			await interaction.editReply({
				content: content,
				components: [periodSelect, buttons],
			});
		}
		catch (error) {
			let content = '❌ **ERREUR** ❌\n\n';
			content += '⚠️ **Impossible de récupérer la liste des rapports.**\n\n';
			content += `🔍 **Détails:** ${error.message}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.editReply({ content: content });
		}
	},

	async handleSend(interaction, reportManager, emailManager) {
		await interaction.deferReply();

		const filename = interaction.options.getString('filename');
		const email = interaction.options.getString('email');

		let content = '📧 **ENVOI DU RAPPORT** 📧\n\n';
		content += `📤 **Envoi du rapport "${filename}" par email...**\n\n`;
		content += `⏰ **Démarré:** <t:${Math.floor(Date.now() / 1000)}:F>`;

		await interaction.editReply({ content: content });

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

			await interaction.editReply({
				content: content,
				components: [buttons],
			});
		}
		catch (error) {
			content = '❌ **ERREUR D\'ENVOI** ❌\n\n';
			content += '⚠️ **Impossible d\'envoyer le rapport par email.**\n\n';
			content += `🔍 **Détails:** ${error.message}\n`;
			content += `📄 **Fichier:** ${filename}\n`;
			content += `📧 **Email:** ${email || 'Email par défaut'}\n`;
			content += `⏰ **Erreur survenue:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.editReply({ content: content });
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
};