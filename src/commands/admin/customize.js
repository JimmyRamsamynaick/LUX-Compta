const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('customize')
		.setDescription('Personnaliser l\'apparence et le comportement du bot')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand =>
			subcommand
				.setName('menu')
				.setDescription('Ouvrir le menu de personnalisation'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('thème')
				.setDescription('Gérer les thèmes')
				.addStringOption(option =>
					option
						.setName('action')
						.setDescription('Action à effectuer')
						.setRequired(true)
						.addChoices(
							{ name: 'Sélectionner', value: 'select' },
							{ name: 'Créer', value: 'create' },
							{ name: 'Exporter', value: 'export' },
							{ name: 'Importer', value: 'import' },
							{ name: 'Réinitialiser', value: 'reset' },
						),
				)
				.addStringOption(option =>
					option
						.setName('nom')
						.setDescription('Nom du thème (pour créer/sélectionner)')
						.setRequired(false),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('couleur')
				.setDescription('Modifier une couleur spécifique')
				.addStringOption(option =>
					option
						.setName('type')
						.setDescription('Type de couleur à modifier')
						.setRequired(true)
						.addChoices(
							{ name: 'Principale', value: 'primary' },
							{ name: 'Secondaire', value: 'secondary' },
							{ name: 'Succès', value: 'success' },
							{ name: 'Avertissement', value: 'warning' },
							{ name: 'Erreur', value: 'error' },
						),
				)
				.addStringOption(option =>
					option
						.setName('valeur')
						.setDescription('Code couleur hexadécimal (ex: #00ff00)')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('emoji')
				.setDescription('Modifier un emoji spécifique')
				.addStringOption(option =>
					option
						.setName('type')
						.setDescription('Type d\'emoji à modifier')
						.setRequired(true)
						.addChoices(
							{ name: 'Stats', value: 'stats' },
							{ name: 'Membres', value: 'members' },
							{ name: 'Messages', value: 'messages' },
							{ name: 'Vocal', value: 'voice' },
							{ name: 'Succès', value: 'success' },
							{ name: 'Erreur', value: 'error' },
							{ name: 'Avertissement', value: 'warning' },
						),
				)
				.addStringOption(option =>
					option
						.setName('valeur')
						.setDescription('Emoji ou code emoji')
						.setRequired(true),
				),
		),

	async execute(interaction) {
		try {
			// Le bot peut toujours exécuter ses propres commandes admin
			// Pas de vérification de permissions utilisateur nécessaire

			const subcommand = interaction.options.getSubcommand();
			const customizationManager = interaction.client.customizationManager;

			if (!customizationManager) {
				return await interaction.reply({
					content: '❌ Le gestionnaire de personnalisation n\'est pas disponible.',
					flags: 64,
				});
			}

			switch (subcommand) {
			case 'menu':
				await this.handleMenu(interaction, customizationManager);
				break;
			case 'thème':
				await this.handleTheme(interaction, customizationManager);
				break;
			case 'couleur':
				await this.handleColor(interaction, customizationManager);
				break;
			case 'emoji':
				await this.handleEmoji(interaction, customizationManager);
				break;
			}

		}
		catch (error) {
			console.error('❌ Erreur dans la commande customize:', error);

			const errorMessage = '❌ Une erreur est survenue lors de l\'exécution de la commande.';

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: errorMessage, flags: 64 });
			}
			else {
				await interaction.reply({ content: errorMessage, flags: 64 });
			}
		}
	},

	async handleMenu(interaction, customizationManager) {
		try {
			await customizationManager.showCustomizationMenu(interaction);
		}
		catch (error) {
			console.error('❌ Erreur lors de l\'affichage du menu:', error);
			await interaction.reply({
				content: '❌ Erreur lors de l\'ouverture du menu de personnalisation.',
				flags: 64,
			});
		}
	},

	async handleTheme(interaction, customizationManager) {
		const action = interaction.options.getString('action');
		const nom = interaction.options.getString('nom');

		try {
			switch (action) {
			case 'select':
				await this.selectTheme(interaction, customizationManager, nom);
				break;
			case 'create':
				await this.createTheme(interaction, customizationManager, nom);
				break;
			case 'export':
				await this.exportTheme(interaction, customizationManager, nom);
				break;
			case 'import':
				await this.importTheme(interaction, customizationManager);
				break;
			case 'reset':
				await this.resetTheme(interaction, customizationManager);
				break;
			}
		}
		catch (error) {
			console.error('❌ Erreur lors de la gestion du thème:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la gestion du thème.',
				flags: 64,
			});
		}
	},

	async handleColor(interaction, customizationManager) {
		const type = interaction.options.getString('type');
		const valeur = interaction.options.getString('valeur');

		try {
			// Valider le format de couleur
			if (!customizationManager.validateColor(valeur)) {
				return await interaction.reply({
					content: '❌ Format de couleur invalide. Utilisez le format hexadécimal (ex: #00ff00).',
					flags: 64,
				});
			}

			const success = await customizationManager.updateColor(type, valeur);

			if (success) {

				let content = '🎨 **COULEUR MISE À JOUR** ✅\n\n';
				content += `📋 **La couleur ${type} a été mise à jour avec succès**\n\n`;
				content += '🎨 **Nouvelle couleur:**\n';
				content += `**${type}:** ${valeur}\n\n`;
				content += `⏰ **Mis à jour le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				const colorButtons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('color_preview')
							.setLabel('Aperçu')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('👁️'),
						new ButtonBuilder()
							.setCustomId('color_revert')
							.setLabel('Annuler')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('↩️'),
						new ButtonBuilder()
							.setCustomId('color_apply_all')
							.setLabel('Appliquer partout')
							.setStyle(ButtonStyle.Success)
							.setEmoji('✅'),
					);

				await interaction.reply({
					content: content,
					components: [colorButtons],
					flags: 64,
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la mise à jour de la couleur.',
					flags: 64,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la modification de couleur:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la modification de la couleur.',
				flags: 64,
			});
		}
	},

	async handleEmoji(interaction, customizationManager) {
		const type = interaction.options.getString('type');
		const valeur = interaction.options.getString('valeur');

		try {
			// Valider l'emoji
			if (!customizationManager.validateEmoji(valeur)) {
				return await interaction.reply({
					content: '❌ Format d\'emoji invalide.',
					flags: 64,
				});
			}

			const success = await customizationManager.updateEmoji(type, valeur);

			if (success) {

				let content = '😀 **EMOJI MIS À JOUR** ✅\n\n';
				content += `📋 **L'emoji ${type} a été mis à jour avec succès**\n\n`;
				content += '😀 **Nouvel emoji:**\n';
				content += `**${type}:** ${valeur}\n\n`;
				content += `⏰ **Mis à jour le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				const emojiButtons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('emoji_preview')
							.setLabel('Aperçu')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('👁️'),
						new ButtonBuilder()
							.setCustomId('emoji_revert')
							.setLabel('Annuler')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('↩️'),
						new ButtonBuilder()
							.setCustomId('emoji_test')
							.setLabel('Tester')
							.setStyle(ButtonStyle.Success)
							.setEmoji('🧪'),
					);

				await interaction.reply({
					content: content,
					components: [emojiButtons],
					flags: 64,
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la mise à jour de l\'emoji.',
					flags: 64,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la modification d\'emoji:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la modification de l\'emoji.',
				flags: 64,
			});
		}
	},

	async selectTheme(interaction, customizationManager, nom) {
		if (!nom) {
			// Afficher le sélecteur de thème
			await customizationManager.showThemeSelector(interaction);
			return;
		}

		const success = await customizationManager.applyTheme(nom);

		if (success) {
			const theme = await customizationManager.getTheme(nom);

			let content = '🎨 **THÈME APPLIQUÉ** ✅\n\n';
			content += `📋 **Le thème "${theme.name}" a été appliqué avec succès**\n\n`;

			// Couleurs
			content += '🎨 **Couleurs:**\n';
			content += `🔵 **Principale:** ${theme.colors.primary}\n`;
			content += `🟣 **Secondaire:** ${theme.colors.secondary}\n`;
			content += `🟢 **Succès:** ${theme.colors.success}\n\n`;

			// Emojis
			content += '😀 **Emojis:**\n';
			content += `📊 **Stats:** ${theme.emojis.stats}\n`;
			content += `👥 **Membres:** ${theme.emojis.members}\n`;
			content += `💬 **Messages:** ${theme.emojis.messages}\n\n`;

			content += `⏰ **Appliqué le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Menu de sélection pour d'autres thèmes (Type 17)
			const themeSelect = new StringSelectMenuBuilder()
				.setCustomId('theme_quick_select')
				.setPlaceholder('Changer de thème...')
				.addOptions([
					{
						label: 'Thème par défaut',
						description: 'Revenir au thème par défaut',
						value: 'default',
						emoji: '🔄',
					},
					{
						label: 'Thème sombre',
						description: 'Appliquer le thème sombre',
						value: 'dark',
						emoji: '🌙',
					},
					{
						label: 'Thème coloré',
						description: 'Appliquer le thème coloré',
						value: 'colorful',
						emoji: '🌈',
					},
				]);

			const selectRow = new ActionRowBuilder().addComponents(themeSelect);

			// Boutons d'action (Type 10)
			const themeButtons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('theme_customize')
						.setLabel('Personnaliser')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('✏️'),
					new ButtonBuilder()
						.setCustomId('theme_export')
						.setLabel('Exporter')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📤'),
					new ButtonBuilder()
						.setCustomId('theme_duplicate')
						.setLabel('Dupliquer')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📋'),
				);

			await interaction.reply({
				content: content,
				components: [selectRow, themeButtons],
				flags: 64,
			});
		}
		else {
			await interaction.reply({
				content: `❌ Impossible d'appliquer le thème "${nom}". Vérifiez que le thème existe.`,
				flags: 64,
			});
		}
	},

	async createTheme(interaction, customizationManager, nom) {
		if (!nom) {
			return await interaction.reply({
				content: '❌ Vous devez spécifier un nom pour le nouveau thème.',
				flags: 64,
			});
		}

		// Pour l'instant, créer un thème basé sur le thème actuel
		const currentTheme = await customizationManager.getCurrentTheme();

		const themeId = await customizationManager.createCustomTheme(
			nom,
			currentTheme.colors,
			currentTheme.emojis,
		);

		if (themeId) {

			let content = '🎨 **NOUVEAU THÈME CRÉÉ** ✅\n\n';
			content += `📋 **Le thème "${nom}" a été créé avec succès**\n\n`;
			content += `🆔 **ID:** ${themeId}\n`;
			content += `📋 **Basé sur:** ${currentTheme.name}\n\n`;
			content += `⏰ **Créé le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			const createButtons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('theme_apply_new')
						.setLabel('Appliquer maintenant')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('✅'),
					new ButtonBuilder()
						.setCustomId('theme_edit_new')
						.setLabel('Modifier')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('✏️'),
					new ButtonBuilder()
						.setCustomId('theme_share')
						.setLabel('Partager')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📤'),
				);

			await interaction.reply({
				content: content,
				components: [createButtons],
				flags: 64,
			});
		}
		else {
			await interaction.reply({
				content: '❌ Erreur lors de la création du thème.',
				flags: 64,
			});
		}
	},

	async exportTheme(interaction, customizationManager, nom) {
		try {
			const themeId = nom || 'current';
			const exportData = await customizationManager.exportTheme(themeId);

			if (exportData) {

				const attachment = new AttachmentBuilder(
					Buffer.from(exportData, 'utf8'),
					{ name: `theme_${themeId}_${Date.now()}.json` },
				);

				await interaction.reply({
					content: `📤 Export du thème "${themeId}" terminé.`,
					files: [attachment],
					flags: 64,
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de l\'export du thème.',
					flags: 64,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'export:', error);
			await interaction.reply({
				content: '❌ Erreur lors de l\'export du thème.',
				flags: 64,
			});
		}
	},

	async importTheme(interaction, customizationManager) {
		await interaction.reply({
			content: '📥 Pour importer un thème, utilisez le menu de personnalisation et sélectionnez l\'option "Importer".',
			flags: 64,
		});
	},

	async resetTheme(interaction, customizationManager) {
		try {
			const success = await customizationManager.resetCustomization();

			if (success) {

				let content = '🔄 **THÈME RÉINITIALISÉ** ✅\n\n';
				content += '📋 **Le thème a été réinitialisé aux paramètres par défaut**\n\n';
				content += '🎨 **Couleurs par défaut restaurées**\n';
				content += '😀 **Emojis par défaut restaurés**\n';
				content += '⚙️ **Paramètres par défaut restaurés**\n\n';
				content += `⏰ **Réinitialisé le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				const resetButtons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('theme_view_default')
							.setLabel('Voir le thème')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('👁️'),
						new ButtonBuilder()
							.setCustomId('theme_customize_new')
							.setLabel('Personnaliser')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('✏️'),
						new ButtonBuilder()
							.setCustomId('theme_backup_restore')
							.setLabel('Restaurer sauvegarde')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('📥'),
					);

				await interaction.reply({
					content: content,
					components: [resetButtons],
					flags: 64,
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la réinitialisation.',
					flags: 64,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la réinitialisation:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la réinitialisation de la personnalisation.',
				flags: 64,
			});
		}
	},
};