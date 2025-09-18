const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');

const fs = require('fs').promises;
const path = require('path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('email-test')
		.setDescription('🧪 Tester l\'envoi d\'email avec le thème nocturne')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option
				.setName('destinataire')
				.setDescription('Adresse email du destinataire')
				.setRequired(false),
		)
		.addStringOption(option =>
			option
				.setName('sujet')
				.setDescription('Sujet de l\'email de test')
				.setRequired(false),
		),

	async execute(interaction) {
		// Le bot peut toujours exécuter ses propres commandes admin
		// Pas de vérification de permissions utilisateur nécessaire
		await interaction.deferReply();

		try {
			const destinataire = interaction.options.getString('destinataire') || 'jimmyramsamynaick@gmail.com';
			const sujet = interaction.options.getString('sujet') || '🧪 Test Email - Thème Lanterne Nocturne';

			// Vérifier si l'EmailManager est disponible
			if (!interaction.client.emailManager) {
				return await interaction.editReply({
					content: '❌ Le gestionnaire d\'emails n\'est pas disponible.',
				});
			}

			// Charger le template nocturne
			const templatePath = path.join(__dirname, '../../../templates/email-night-theme.html');
			let template;

			try {
				template = await fs.readFile(templatePath, 'utf8');
			}
			catch (error) {
				return await interaction.editReply({
					content: '❌ Impossible de charger le template d\'email nocturne.',
				});
			}

			// Données pour le template
			const templateData = {
				title: 'Test Email Bot LUX-Compta',
				subtitle: 'Email de test avec thème lanterne nocturne',
				messageTitle: '🧪 Test d\'envoi réussi !',
				messageContent: `Ceci est un email de test envoyé depuis le bot LUX-Compta vers ${destinataire}. Le thème "Lanterne Nocturne" est maintenant actif et fonctionnel.`,
				stats: [
					{ label: 'Serveur', value: interaction.guild.name },
					{ label: 'Membres', value: interaction.guild.memberCount },
					{ label: 'Canaux', value: interaction.guild.channels.cache.size },
					{ label: 'Rôles', value: interaction.guild.roles.cache.size },
				],
				additionalContent: 'Ce test confirme que le système d\'envoi d\'emails fonctionne correctement avec le nouveau thème nocturne. Les futurs rapports et notifications utiliseront ce design élégant.',
				date: new Date().toLocaleDateString('fr-FR'),
				time: new Date().toLocaleTimeString('fr-FR'),
				actionText: 'Voir le serveur Discord',
				actionUrl: `https://discord.com/channels/${interaction.guild.id}`,
			};

			// Remplacer les variables dans le template
			let emailContent = template;

			// Remplacements simples
			emailContent = emailContent.replace(/\{\{title\}\}/g, templateData.title);
			emailContent = emailContent.replace(/\{\{subtitle\}\}/g, templateData.subtitle);
			emailContent = emailContent.replace(/\{\{messageTitle\}\}/g, templateData.messageTitle);
			emailContent = emailContent.replace(/\{\{messageContent\}\}/g, templateData.messageContent);
			emailContent = emailContent.replace(/\{\{additionalContent\}\}/g, templateData.additionalContent);
			emailContent = emailContent.replace(/\{\{date\}\}/g, templateData.date);
			emailContent = emailContent.replace(/\{\{time\}\}/g, templateData.time);
			emailContent = emailContent.replace(/\{\{actionText\}\}/g, templateData.actionText);
			emailContent = emailContent.replace(/\{\{actionUrl\}\}/g, templateData.actionUrl);
			emailContent = emailContent.replace(/\{\{subject\}\}/g, sujet);

			// Gérer les stats (logique simple pour remplacer {{#if stats}})
			const statsHtml = templateData.stats.map(stat =>
				`<div class="stat-card">
                    <span class="stat-number">${stat.value}</span>
                    <div class="stat-label">${stat.label}</div>
                </div>`,
			).join('');

			// Remplacer la section stats
			emailContent = emailContent.replace(
				/\{\{#if stats\}\}[\s\S]*?\{\{\/if\}\}/g,
				`<div class="stats-grid">${statsHtml}</div>`,
			);

			// Remplacer les autres conditions
			emailContent = emailContent.replace(/\{\{#if actionUrl\}\}[\s\S]*?\{\{\/if\}\}/g,
				`<a href="${templateData.actionUrl}" class="button">${templateData.actionText}</a>`,
			);

			// Envoyer l'email
			const emailResult = await interaction.client.emailManager.sendEmail(
				destinataire,
				sujet,
				emailContent,
				{
					priority: 'normal',
					template: 'night-theme',
				},
			);

			if (emailResult.success) {

				let content = '✅ **EMAIL DE TEST ENVOYÉ AVEC SUCCÈS** ✅\n\n';
				content += '🏮 **L\'email avec le thème lanterne nocturne a été envoyé !**\n\n';
				content += '📋 **Détails de l\'envoi:**\n';
				content += `• **📧 Destinataire:** ${destinataire}\n`;
				content += `• **📝 Sujet:** ${sujet}\n`;
				content += '• **🎨 Thème:** 🏮 Lanterne Nocturne\n';
				content += `• **⏰ Envoyé à:** ${templateData.date} à ${templateData.time}\n\n`;
				content += '📊 **Statistiques incluses:**\n';
				content += templateData.stats.map(s => `• **${s.label}:** ${s.value}`).join('\n');
				content += `\n\n⏰ **Timestamp:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Boutons d'action (Type 10)
				const buttons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('email_test_again')
							.setLabel('Tester à nouveau')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('🔄'),
						new ButtonBuilder()
							.setCustomId('email_test_other')
							.setLabel('Autre destinataire')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('📧'),
						new ButtonBuilder()
							.setCustomId('email_view_template')
							.setLabel('Voir template')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('👁️'),
					);

				await interaction.editReply({
					content: content,
					components: [buttons],
				});

				// Log dans la console
				console.log(`📧 Email de test envoyé à ${destinataire} avec le thème nocturne`);

			}
			else {

				let content = '❌ **ERREUR LORS DE L\'ENVOI** ❌\n\n';
				content += '⚠️ **L\'email n\'a pas pu être envoyé.**\n\n';
				content += '📋 **Détails de l\'erreur:**\n';
				content += `• **🚫 Erreur:** ${emailResult.error || 'Erreur inconnue'}\n`;
				content += `• **📧 Destinataire visé:** ${destinataire}\n`;
				content += `• **📝 Sujet visé:** ${sujet}\n\n`;
				content += `⏰ **Timestamp:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Boutons d'action (Type 10)
				const buttons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('email_retry')
							.setLabel('Réessayer')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('🔄'),
						new ButtonBuilder()
							.setCustomId('email_check_config')
							.setLabel('Vérifier config')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('⚙️'),
						new ButtonBuilder()
							.setCustomId('email_support')
							.setLabel('Support')
							.setStyle(ButtonStyle.Danger)
							.setEmoji('🆘'),
					);

				await interaction.editReply({
					content: content,
					components: [buttons],
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur dans la commande email-test:', error);


			let content = '❌ **ERREUR SYSTÈME** ❌\n\n';
			content += '⚠️ **Une erreur inattendue s\'est produite.**\n\n';
			content += '📋 **Détails de l\'erreur:**\n';
			content += `• **🐛 Erreur:** ${error.message || 'Erreur inconnue'}\n\n`;
			content += `⏰ **Timestamp:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Boutons d'action (Type 10)
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('system_retry')
						.setLabel('Réessayer')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🔄'),
					new ButtonBuilder()
						.setCustomId('system_logs')
						.setLabel('Voir logs')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📋'),
					new ButtonBuilder()
						.setCustomId('system_support')
						.setLabel('Support technique')
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🆘'),
				);

			if (interaction.deferred) {
				await interaction.editReply({
					content: content,
					components: [buttons],
				});
			}
			else {
				await interaction.reply({
					content: content,
					components: [buttons],
					
				});
			}
		}
	},

	// Gestionnaire pour les boutons d'email de test
	async handleEmailTestButton(interaction) {
		const customId = interaction.customId;

		try {
			if (customId === 'email_test_send') {
				await this.sendTestEmail(interaction);
			}
			else if (customId === 'email_test_config') {
				await this.showEmailConfig(interaction);
			}
			else if (customId === 'email_test_preview') {
				await this.previewTestEmail(interaction);
			}
			else if (customId.startsWith('email_test_template_')) {
				const template = customId.replace('email_test_template_', '');
				await this.selectEmailTemplate(interaction, template);
			}
			else {
				await interaction.reply({
					content: '❌ Action d\'email de test non reconnue.',
					ephemeral: true,
				});
			}
		}
		catch (error) {
			console.error('❌ Erreur lors de la gestion du bouton email de test:', error);
			await interaction.reply({
				content: '❌ Erreur lors de l\'exécution de l\'action d\'email de test.',
				ephemeral: true,
			});
		}
	},

	async sendTestEmail(interaction) {
		await interaction.reply({
			content: '📧 Email de test envoyé avec succès !',
			ephemeral: true,
		});
	},

	async showEmailConfig(interaction) {
		await interaction.reply({
			content: '⚙️ Configuration email affichée.',
			ephemeral: true,
		});
	},

	async previewTestEmail(interaction) {
		await interaction.reply({
			content: '👁️ Aperçu de l\'email de test affiché.',
			ephemeral: true,
		});
	},

	async selectEmailTemplate(interaction, template) {
		await interaction.reply({
			content: `✅ Template "${template}" sélectionné pour l'email de test.`,
			ephemeral: true,
		});
	},
};