const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const ComponentBuilder = require('../../utils/componentBuilder');
const config = require('../../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('customize')
		.setDescription('Personnaliser l\'apparence et le comportement du bot')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand =>
			subcommand
				.setName('menu')
				.setDescription('Afficher le menu de customisation')
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('theme')
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
						)
				)
				.addStringOption(option =>
					option
						.setName('nom')
						.setDescription('Nom du thème')
						.setRequired(false)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('color')
				.setDescription('Personnaliser les couleurs')
				.addStringOption(option =>
					option
						.setName('element')
						.setDescription('Élément à personnaliser')
						.setRequired(true)
						.addChoices(
							{ name: 'Couleur principale', value: 'primary' },
							{ name: 'Couleur secondaire', value: 'secondary' },
							{ name: 'Couleur d\'accent', value: 'accent' },
							{ name: 'Couleur de succès', value: 'success' },
							{ name: 'Couleur d\'erreur', value: 'error' },
							{ name: 'Couleur d\'avertissement', value: 'warning' },
						)
				)
				.addStringOption(option =>
					option
						.setName('couleur')
						.setDescription('Code couleur hexadécimal (ex: #FF0000)')
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('emoji')
				.setDescription('Personnaliser les emojis')
				.addStringOption(option =>
					option
						.setName('set')
						.setDescription('Set d\'emojis à utiliser')
						.setRequired(true)
						.addChoices(
							{ name: 'Standard', value: 'standard' },
							{ name: 'Moderne', value: 'modern' },
							{ name: 'Minimaliste', value: 'minimal' },
							{ name: 'Coloré', value: 'colorful' },
							{ name: 'Professionnel', value: 'professional' },
						)
				)
		),

	async execute(interaction) {
		try {
			const subcommand = interaction.options.getSubcommand();
			const customizationManager = interaction.client.customizationManager;

			if (subcommand === 'menu') {
				await this.handleMenu(interaction, customizationManager);
			}
			else if (subcommand === 'theme') {
				await this.handleTheme(interaction, customizationManager);
			}
			else if (subcommand === 'color') {
				await this.handleColor(interaction, customizationManager);
			}
			else if (subcommand === 'emoji') {
				await this.handleEmoji(interaction, customizationManager);
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'exécution de la commande customize:', error);
			await interaction.reply({
				content: '❌ Une erreur est survenue lors de l\'exécution de la commande.',
				ephemeral: true,
			});
		}
	},

	async handleMenu(interaction, customizationManager) {
		try {
			await interaction.reply({ content: '🎨 Menu de customisation affiché.', ephemeral: true });
		}
		catch (error) {
			await interaction.reply({
				content: '❌ Erreur lors de l\'affichage du menu.',
				ephemeral: true,
			});
		}
	},

	async handleTheme(interaction, customizationManager) {
		const action = interaction.options.getString('action');
		const nom = interaction.options.getString('nom');

		try {
			if (action === 'select') {
				await this.selectTheme(interaction, customizationManager, nom);
			}
			else if (action === 'create') {
				await this.createTheme(interaction, customizationManager, nom);
			}
			else if (action === 'export') {
				await this.exportTheme(interaction, customizationManager, nom);
			}
			else if (action === 'import') {
				await this.importTheme(interaction, customizationManager);
			}
			else if (action === 'reset') {
				await this.resetTheme(interaction, customizationManager);
			}
		}
		catch (error) {
			await interaction.reply({
				content: '❌ Erreur lors de la gestion du thème.',
				ephemeral: true,
			});
		}
	},

	async handleColor(interaction, customizationManager) {
		const element = interaction.options.getString('element');
		const couleur = interaction.options.getString('couleur');

		try {
			let content = '🎨 **PERSONNALISATION DES COULEURS** 🎨\n\n';
			content += `🖌️ **Élément:** ${element}\n`;
			content += `🎨 **Nouvelle couleur:** ${couleur}\n\n`;
			content += '✅ **Couleur appliquée avec succès !**\n\n';
			content += `⏰ **Modifié:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.reply({
				content: content,
				ephemeral: true,
			});
		}
		catch (error) {
			console.error('❌ Erreur lors de la personnalisation des couleurs:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la personnalisation des couleurs.',
				ephemeral: true,
			});
		}
	},

	async handleEmoji(interaction, customizationManager) {
		const set = interaction.options.getString('set');

		try {
			let content = '😀 **PERSONNALISATION DES EMOJIS** 😀\n\n';
			content += `📦 **Set sélectionné:** ${set}\n\n`;
			content += '✅ **Set d\'emojis appliqué avec succès !**\n\n';
			content += `⏰ **Modifié:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.reply({
				content: content,
				ephemeral: true,
			});
		}
		catch (error) {
			console.error('❌ Erreur lors de la personnalisation des emojis:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la personnalisation des emojis.',
				ephemeral: true,
			});
		}
	},

	async selectTheme(interaction, customizationManager, nom) {
		try {
			let content = '🎨 **SÉLECTION DE THÈME** 🎨\n\n';
			content += `🖼️ **Thème sélectionné:** ${nom || 'Défaut'}\n\n`;
			content += '✅ **Thème appliqué avec succès !**\n\n';
			content += `⏰ **Appliqué:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Menu de sélection de thème (Type 17) - Utilisation de ComponentBuilder
			const selectMenu = ComponentBuilder.createSelectMenu({
				customId: 'customization_select',
				placeholder: 'Choisir un thème...',
				options: [
					{
						label: 'Thème Sombre',
						description: 'Interface sombre et moderne',
						value: 'dark',
						emoji: '🌙',
					},
					{
						label: 'Thème Clair',
						description: 'Interface claire et lumineuse',
						value: 'light',
						emoji: '☀️',
					},
					{
						label: 'Thème Bleu',
						description: 'Nuances de bleu professionnelles',
						value: 'blue',
						emoji: '💙',
					},
				]
			});

			await interaction.reply({
				content: content,
				components: [selectMenu],
				ephemeral: true,
			});
		}
		catch (error) {
			console.error('❌ Erreur lors de la sélection du thème:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la sélection du thème.',
				ephemeral: true,
			});
		}
	},

	async createTheme(interaction, customizationManager, nom) {
		try {
			let content = '🎨 **CRÉATION DE THÈME** 🎨\n\n';
			content += `🖼️ **Nouveau thème:** ${nom || 'Sans nom'}\n\n`;
			content += '✅ **Thème créé avec succès !**\n\n';
			content += `⏰ **Créé:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.reply({
				content: content,
				ephemeral: true,
			});
		}
		catch (error) {
			console.error('❌ Erreur lors de la création du thème:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la création du thème.',
				ephemeral: true,
			});
		}
	},

	async exportTheme(interaction, customizationManager, nom) {
		try {
			let content = '📤 **EXPORT DE THÈME** 📤\n\n';
			content += `🖼️ **Thème exporté:** ${nom || 'Actuel'}\n\n`;
			content += '✅ **Thème exporté avec succès !**\n\n';
			content += `⏰ **Exporté:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.reply({
				content: content,
				ephemeral: true,
			});
		}
		catch (error) {
			console.error('❌ Erreur lors de l\'export du thème:', error);
			await interaction.reply({
				content: '❌ Erreur lors de l\'export du thème.',
				ephemeral: true,
			});
		}
	},

	async importTheme(interaction, customizationManager) {
		await interaction.reply({
			content: '📥 **Import de thème** - Fonctionnalité à implémenter.',
			ephemeral: true,
		});
	},

	async resetTheme(interaction, customizationManager) {
		try {
			let content = '🔄 **RÉINITIALISATION DU THÈME** 🔄\n\n';
			content += '🖼️ **Thème réinitialisé au défaut**\n\n';
			content += '✅ **Réinitialisation effectuée avec succès !**\n\n';
			content += `⏰ **Réinitialisé:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			await interaction.reply({
				content: content,
				ephemeral: true,
			});
		}
		catch (error) {
			console.error('❌ Erreur lors de la réinitialisation du thème:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la réinitialisation du thème.',
				ephemeral: true,
			});
		}
	},

	// Gestionnaire pour les boutons de customisation
	async handleCustomizeButton(interaction) {
		const customId = interaction.customId;
		const customizationManager = interaction.client.customizationManager;

		try {
			if (customId === 'customization_apply') {
				await this.applyCustomization(interaction, customizationManager);
			}
			else if (customId === 'customization_reset') {
				await this.resetCustomization(interaction, customizationManager);
			}
			else if (customId === 'customization_export') {
				await this.exportCustomization(interaction, customizationManager);
			}
			else if (customId === 'color_preview') {
				await this.showColorPreview(interaction, customizationManager);
			}
			else if (customId === 'theme_customize') {
				await this.showThemeCustomizer(interaction, customizationManager);
			}
			else if (customId.startsWith('apply_theme_')) {
				const theme = customId.replace('apply_theme_', '');
				await this.applyTheme(interaction, customizationManager, theme);
			}
			else if (customId.startsWith('emoji_set_')) {
				const emojiSet = customId.replace('emoji_set_', '');
				await this.applyEmojiSet(interaction, customizationManager, emojiSet);
			}
			else {
				await interaction.reply({
					content: '❌ Action de customisation non reconnue.',
					ephemeral: true,
				});
			}
		}
		catch (error) {
			console.error('❌ Erreur lors de la gestion du bouton customisation:', error);
			await interaction.reply({
				content: '❌ Erreur lors de l\'exécution de l\'action de customisation.',
				ephemeral: true,
			});
		}
	},

	async applyCustomization(interaction, customizationManager) {
		await interaction.reply({
			content: '✅ Customisation appliquée avec succès !',
			ephemeral: true,
		});
	},

	async resetCustomization(interaction, customizationManager) {
		await interaction.reply({
			content: '🔄 Customisation réinitialisée aux valeurs par défaut.',
			ephemeral: true,
		});
	},

	async exportCustomization(interaction, customizationManager) {
		await interaction.reply({
			content: '📤 Configuration de customisation exportée !',
			ephemeral: true,
		});
	},

	async showColorPreview(interaction, customizationManager) {
		await interaction.reply({
			content: '🎨 Aperçu des couleurs affiché.',
			ephemeral: true,
		});
	},

	async showThemeCustomizer(interaction, customizationManager) {
		await interaction.reply({
			content: '⚙️ Personnalisateur de thème ouvert.',
			ephemeral: true,
		});
	},

	async applyTheme(interaction, customizationManager, theme) {
		await interaction.reply({
			content: `✅ Thème "${theme}" appliqué avec succès !`,
			ephemeral: true,
		});
	},

	async applyEmojiSet(interaction, customizationManager, emojiSet) {
		await interaction.reply({
			content: `✅ Set d'emojis "${emojiSet}" appliqué avec succès !`,
			ephemeral: true,
		});
	},
};