const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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
		await interaction.deferReply({ ephemeral: true });

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
				const embed = new EmbedBuilder()
					.setTitle('✅ Email de test envoyé avec succès')
					.setDescription('L\'email avec le thème lanterne nocturne a été envoyé.')
					.setColor('#00ff00')
					.addFields([
						{
							name: '📧 Destinataire',
							value: destinataire,
							inline: true,
						},
						{
							name: '📝 Sujet',
							value: sujet,
							inline: true,
						},
						{
							name: '🎨 Thème',
							value: '🏮 Lanterne Nocturne',
							inline: true,
						},
						{
							name: '⏰ Envoyé à',
							value: `${templateData.date} à ${templateData.time}`,
							inline: false,
						},
						{
							name: '📊 Statistiques incluses',
							value: templateData.stats.map(s => `• ${s.label}: ${s.value}`).join('\n'),
							inline: false,
						},
					])
					.setTimestamp()
					.setFooter({
						text: 'LUX-Compta Email Test',
						iconURL: interaction.client.user.displayAvatarURL(),
					});

				await interaction.editReply({ embeds: [embed] });

				// Log dans la console
				console.log(`📧 Email de test envoyé à ${destinataire} avec le thème nocturne`);

			}
			else {
				const errorEmbed = new EmbedBuilder()
					.setTitle('❌ Erreur lors de l\'envoi')
					.setDescription('L\'email n\'a pas pu être envoyé.')
					.setColor('#ff0000')
					.addFields([
						{
							name: '🚫 Erreur',
							value: emailResult.error || 'Erreur inconnue',
							inline: false,
						},
						{
							name: '📧 Destinataire visé',
							value: destinataire,
							inline: true,
						},
						{
							name: '📝 Sujet visé',
							value: sujet,
							inline: true,
						},
					])
					.setTimestamp();

				await interaction.editReply({ embeds: [errorEmbed] });
			}

		}
		catch (error) {
			console.error('❌ Erreur dans la commande email-test:', error);

			const errorEmbed = new EmbedBuilder()
				.setTitle('❌ Erreur système')
				.setDescription('Une erreur inattendue s\'est produite.')
				.setColor('#ff0000')
				.addFields([
					{
						name: '🐛 Détails de l\'erreur',
						value: error.message || 'Erreur inconnue',
						inline: false,
					},
				])
				.setTimestamp();

			if (interaction.deferred) {
				await interaction.editReply({ embeds: [errorEmbed] });
			}
			else {
				await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
			}
		}
	},
};