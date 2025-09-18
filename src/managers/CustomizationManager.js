const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

class CustomizationManager {
	constructor(client) {
		this.client = client;
		this.configPath = path.join(__dirname, '../../config.json');
		this.themesPath = path.join(__dirname, '../../themes');
		this.templatesPath = path.join(__dirname, '../../templates');

		this.defaultThemes = {
			default: {
				name: 'Défaut',
				colors: {
					primary: '#00ff00',
					secondary: '#0099ff',
					success: '#00ff00',
					warning: '#ffaa00',
					error: '#ff0000',
				},
				emojis: {
					stats: '📊',
					members: '👥',
					messages: '💬',
					voice: '🔊',
					success: '✅',
					error: '❌',
					warning: '⚠️',
				},
			},
			dark: {
				name: 'Sombre',
				colors: {
					primary: '#2f3136',
					secondary: '#36393f',
					success: '#43b581',
					warning: '#faa61a',
					error: '#f04747',
				},
				emojis: {
					stats: '📈',
					members: '👤',
					messages: '💭',
					voice: '🎤',
					success: '🟢',
					error: '🔴',
					warning: '🟡',
				},
			},
			light: {
				name: 'Clair',
				colors: {
					primary: '#ffffff',
					secondary: '#f6f6f6',
					success: '#28a745',
					warning: '#ffc107',
					error: '#dc3545',
				},
				emojis: {
					stats: '📊',
					members: '👥',
					messages: '💬',
					voice: '🔊',
					success: '✅',
					error: '❌',
					warning: '⚠️',
				},
			},
			corporate: {
				name: 'Entreprise',
				colors: {
					primary: '#1f4e79',
					secondary: '#2e5984',
					success: '#70ad47',
					warning: '#d9a441',
					error: '#c5504b',
				},
				emojis: {
					stats: '📋',
					members: '👔',
					messages: '📝',
					voice: '📞',
					success: '✔️',
					error: '✖️',
					warning: '⚡',
				},
			},
		};

		this.initializeCustomization();
	}

	async initializeCustomization() {
		try {
			// Créer les dossiers nécessaires
			await fs.mkdir(this.themesPath, { recursive: true });
			await fs.mkdir(this.templatesPath, { recursive: true });

			// Initialiser les thèmes par défaut
			await this.initializeDefaultThemes();

			console.log('🎨 CustomizationManager initialisé');
		}
		catch (error) {
			console.error('❌ Erreur lors de l\'initialisation du CustomizationManager:', error);
		}
	}

	async initializeDefaultThemes() {
		for (const [themeId, theme] of Object.entries(this.defaultThemes)) {
			const themePath = path.join(this.themesPath, `${themeId}.json`);

			try {
				await fs.access(themePath);
			}
			catch {
				// Le fichier n'existe pas, le créer
				await fs.writeFile(themePath, JSON.stringify(theme, null, 2));
			}
		}
	}

	async showCustomizationMenu(interaction) {
		try {
			const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
			const currentTheme = await this.getCurrentTheme();

			const embed = new EmbedBuilder()
				.setTitle('🎨 Personnalisation du Bot')
				.setDescription('Personnalisez l\'apparence et le comportement du bot')
				.setColor(currentTheme.colors.primary)
				.addFields([
					{
						name: '🎨 Thème actuel',
						value: `**${currentTheme.name}**\nCouleur principale: ${currentTheme.colors.primary}`,
						inline: true,
					},
					{
						name: '⚙️ Options disponibles',
						value: [
							'🎨 Changer de thème',
							'🔧 Modifier les couleurs',
							'😀 Personnaliser les emojis',
							'📝 Créer un modèle',
							'📋 Gérer les modèles',
						].join('\n'),
						inline: true,
					},
				])
				.setTimestamp();

			const components = this.createCustomizationComponents();

			await interaction.reply({
				embeds: [embed],
				components: components,
				
			});

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'affichage du menu de personnalisation:', error);
			throw error;
		}
	}

	createCustomizationComponents() {
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId('customization_select')
			.setPlaceholder('Sélectionner une option de personnalisation')
			.addOptions([
				{
					label: 'Changer de thème',
					description: 'Sélectionner un thème prédéfini',
					value: 'theme',
					emoji: '🎨',
				},
				{
					label: 'Couleurs personnalisées',
					description: 'Modifier les couleurs individuellement',
					value: 'colors',
					emoji: '🌈',
				},
				{
					label: 'Emojis personnalisés',
					description: 'Changer les emojis utilisés',
					value: 'emojis',
					emoji: '😀',
				},
				{
					label: 'Créer un modèle',
					description: 'Créer un nouveau modèle de rapport',
					value: 'template',
					emoji: '📝',
				},
				{
					label: 'Gérer les modèles',
					description: 'Modifier ou supprimer des modèles',
					value: 'manage_templates',
					emoji: '📋',
				},
			]);

		const buttons = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('customization_preview')
					.setLabel('Aperçu')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('👁️'),
				new ButtonBuilder()
					.setCustomId('customization_reset')
					.setLabel('Réinitialiser')
					.setStyle(ButtonStyle.Danger)
					.setEmoji('🔄'),
				new ButtonBuilder()
					.setCustomId('customization_export')
					.setLabel('Exporter')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('📤'),
				new ButtonBuilder()
					.setCustomId('customization_import')
					.setLabel('Importer')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('📥'),
			);

		return [
			new ActionRowBuilder().addComponents(selectMenu),
			buttons,
		];
	}

	async showThemeSelector(interaction) {
		try {
			const themes = await this.getAllThemes();
			const currentTheme = await this.getCurrentTheme();

			const embed = new EmbedBuilder()
				.setTitle('🎨 Sélection de thème')
				.setDescription('Choisissez un thème pour personnaliser l\'apparence du bot')
				.setColor(currentTheme.colors.primary)
				.setTimestamp();

			// Ajouter un aperçu de chaque thème
			for (const [themeId, theme] of Object.entries(themes)) {
				embed.addFields([
					{
						name: `${themeId === 'current' ? '✅ ' : ''}${theme.name}`,
						value: [
							`🎨 Couleur: ${theme.colors.primary}`,
							`${theme.emojis.stats} Stats | ${theme.emojis.members} Membres | ${theme.emojis.messages} Messages`,
						].join('\n'),
						inline: true,
					},
				]);
			}

			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId('theme_select')
				.setPlaceholder('Sélectionner un thème')
				.addOptions(
					Object.entries(themes).map(([themeId, theme]) => ({
						label: theme.name,
						description: `Couleur principale: ${theme.colors.primary}`,
						value: themeId,
						emoji: '🎨',
					})),
				);

			const components = [
				new ActionRowBuilder().addComponents(selectMenu),
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('theme_create')
						.setLabel('Créer un thème')
						.setStyle(ButtonStyle.Success)
						.setEmoji('➕'),
					new ButtonBuilder()
						.setCustomId('customization_back')
						.setLabel('Retour')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('⬅️'),
				),
			];

			await interaction.update({
				embeds: [embed],
				components: components,
			});

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'affichage du sélecteur de thème:', error);
			throw error;
		}
	}

	async showColorCustomizer(interaction) {
		try {
			const currentTheme = await this.getCurrentTheme();

			const embed = new EmbedBuilder()
				.setTitle('🌈 Personnalisation des couleurs')
				.setDescription('Modifiez les couleurs utilisées par le bot')
				.setColor(currentTheme.colors.primary)
				.addFields([
					{
						name: '🎨 Couleurs actuelles',
						value: [
							`**Principale:** ${currentTheme.colors.primary}`,
							`**Secondaire:** ${currentTheme.colors.secondary}`,
							`**Succès:** ${currentTheme.colors.success}`,
							`**Avertissement:** ${currentTheme.colors.warning}`,
							`**Erreur:** ${currentTheme.colors.error}`,
						].join('\n'),
						inline: false,
					},
				])
				.setTimestamp();

			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId('color_select')
				.setPlaceholder('Sélectionner une couleur à modifier')
				.addOptions([
					{
						label: 'Couleur principale',
						description: 'Couleur principale des embeds',
						value: 'primary',
						emoji: '🎨',
					},
					{
						label: 'Couleur secondaire',
						description: 'Couleur secondaire des éléments',
						value: 'secondary',
						emoji: '🎭',
					},
					{
						label: 'Couleur de succès',
						description: 'Couleur pour les messages de succès',
						value: 'success',
						emoji: '✅',
					},
					{
						label: 'Couleur d\'avertissement',
						description: 'Couleur pour les avertissements',
						value: 'warning',
						emoji: '⚠️',
					},
					{
						label: 'Couleur d\'erreur',
						description: 'Couleur pour les messages d\'erreur',
						value: 'error',
						emoji: '❌',
					},
				]);

			const components = [
				new ActionRowBuilder().addComponents(selectMenu),
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('color_preset')
						.setLabel('Couleurs prédéfinies')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🎨'),
					new ButtonBuilder()
						.setCustomId('customization_back')
						.setLabel('Retour')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('⬅️'),
				),
			];

			await interaction.update({
				embeds: [embed],
				components: components,
			});

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'affichage du personnalisateur de couleurs:', error);
			throw error;
		}
	}

	async showEmojiCustomizer(interaction) {
		try {
			const currentTheme = await this.getCurrentTheme();

			const embed = new EmbedBuilder()
				.setTitle('😀 Personnalisation des emojis')
				.setDescription('Modifiez les emojis utilisés par le bot')
				.setColor(currentTheme.colors.primary)
				.addFields([
					{
						name: '😀 Emojis actuels',
						value: [
							`**Stats:** ${currentTheme.emojis.stats}`,
							`**Membres:** ${currentTheme.emojis.members}`,
							`**Messages:** ${currentTheme.emojis.messages}`,
							`**Vocal:** ${currentTheme.emojis.voice}`,
							`**Succès:** ${currentTheme.emojis.success}`,
							`**Erreur:** ${currentTheme.emojis.error}`,
							`**Avertissement:** ${currentTheme.emojis.warning}`,
						].join('\n'),
						inline: false,
					},
				])
				.setTimestamp();

			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId('emoji_select')
				.setPlaceholder('Sélectionner un emoji à modifier')
				.addOptions([
					{
						label: 'Emoji Stats',
						description: 'Emoji pour les statistiques',
						value: 'stats',
						emoji: currentTheme.emojis.stats,
					},
					{
						label: 'Emoji Membres',
						description: 'Emoji pour les membres',
						value: 'members',
						emoji: currentTheme.emojis.members,
					},
					{
						label: 'Emoji Messages',
						description: 'Emoji pour les messages',
						value: 'messages',
						emoji: currentTheme.emojis.messages,
					},
					{
						label: 'Emoji Vocal',
						description: 'Emoji pour l\'activité vocale',
						value: 'voice',
						emoji: currentTheme.emojis.voice,
					},
					{
						label: 'Emoji Succès',
						description: 'Emoji pour les succès',
						value: 'success',
						emoji: currentTheme.emojis.success,
					},
					{
						label: 'Emoji Erreur',
						description: 'Emoji pour les erreurs',
						value: 'error',
						emoji: currentTheme.emojis.error,
					},
					{
						label: 'Emoji Avertissement',
						description: 'Emoji pour les avertissements',
						value: 'warning',
						emoji: currentTheme.emojis.warning,
					},
				]);

			const components = [
				new ActionRowBuilder().addComponents(selectMenu),
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('emoji_reset')
						.setLabel('Réinitialiser')
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🔄'),
					new ButtonBuilder()
						.setCustomId('customization_back')
						.setLabel('Retour')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('⬅️'),
				),
			];

			await interaction.update({
				embeds: [embed],
				components: components,
			});

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'affichage du personnalisateur d\'emojis:', error);
			throw error;
		}
	}

	async applyTheme(themeId) {
		try {
			const theme = await this.getTheme(themeId);
			if (!theme) {
				throw new Error('Thème non trouvé');
			}

			// Lire la configuration actuelle
			const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));

			// Appliquer le thème
			config.theme = themeId;
			config.embedColor = theme.colors.primary;
			config.customization = {
				colors: theme.colors,
				emojis: theme.emojis,
			};

			// Sauvegarder la configuration
			await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));

			console.log(`🎨 Thème "${theme.name}" appliqué avec succès`);
			return true;

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'application du thème:', error);
			return false;
		}
	}

	async updateColor(colorType, colorValue) {
		try {
			const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));

			if (!config.customization) {
				config.customization = { colors: {}, emojis: {} };
			}

			config.customization.colors[colorType] = colorValue;

			// Si c'est la couleur principale, mettre à jour embedColor aussi
			if (colorType === 'primary') {
				config.embedColor = colorValue;
			}

			await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));

			console.log(`🎨 Couleur ${colorType} mise à jour: ${colorValue}`);
			return true;

		}
		catch (error) {
			console.error('❌ Erreur lors de la mise à jour de la couleur:', error);
			return false;
		}
	}

	async updateEmoji(emojiType, emojiValue) {
		try {
			const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));

			if (!config.customization) {
				config.customization = { colors: {}, emojis: {} };
			}

			config.customization.emojis[emojiType] = emojiValue;

			await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));

			console.log(`😀 Emoji ${emojiType} mis à jour: ${emojiValue}`);
			return true;

		}
		catch (error) {
			console.error('❌ Erreur lors de la mise à jour de l\'emoji:', error);
			return false;
		}
	}

	async createCustomTheme(name, colors, emojis) {
		try {
			const themeId = name.toLowerCase().replace(/\s+/g, '_');
			const theme = {
				name: name,
				colors: colors,
				emojis: emojis,
				custom: true,
				created: new Date().toISOString(),
			};

			const themePath = path.join(this.themesPath, `${themeId}.json`);
			await fs.writeFile(themePath, JSON.stringify(theme, null, 2));

			console.log(`🎨 Thème personnalisé "${name}" créé`);
			return themeId;

		}
		catch (error) {
			console.error('❌ Erreur lors de la création du thème personnalisé:', error);
			return null;
		}
	}

	async getCurrentTheme() {
		try {
			const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));

			if (config.customization) {
				return {
					name: 'Personnalisé',
					colors: config.customization.colors || this.defaultThemes.default.colors,
					emojis: config.customization.emojis || this.defaultThemes.default.emojis,
				};
			}

			const themeId = config.theme || 'default';
			return await this.getTheme(themeId) || this.defaultThemes.default;

		}
		catch (error) {
			console.error('❌ Erreur lors de la récupération du thème actuel:', error);
			return this.defaultThemes.default;
		}
	}

	async getTheme(themeId) {
		try {
			if (this.defaultThemes[themeId]) {
				return this.defaultThemes[themeId];
			}

			const themePath = path.join(this.themesPath, `${themeId}.json`);
			const themeData = await fs.readFile(themePath, 'utf8');
			return JSON.parse(themeData);

		}
		catch (error) {
			return null;
		}
	}

	async getAllThemes() {
		try {
			const themes = { ...this.defaultThemes };

			// Ajouter les thèmes personnalisés
			const themeFiles = await fs.readdir(this.themesPath);

			for (const file of themeFiles) {
				if (file.endsWith('.json')) {
					const themeId = file.replace('.json', '');
					if (!themes[themeId]) {
						const theme = await this.getTheme(themeId);
						if (theme) {
							themes[themeId] = theme;
						}
					}
				}
			}

			return themes;

		}
		catch (error) {
			console.error('❌ Erreur lors de la récupération des thèmes:', error);
			return this.defaultThemes;
		}
	}

	async exportTheme(themeId) {
		try {
			const theme = await this.getTheme(themeId);
			if (!theme) {
				throw new Error('Thème non trouvé');
			}

			const exportData = {
				...theme,
				exported: new Date().toISOString(),
				version: '1.0.0',
			};

			return JSON.stringify(exportData, null, 2);

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'export du thème:', error);
			return null;
		}
	}

	async importTheme(themeData) {
		try {
			const theme = JSON.parse(themeData);

			// Valider la structure du thème
			if (!theme.name || !theme.colors || !theme.emojis) {
				throw new Error('Structure de thème invalide');
			}

			const themeId = theme.name.toLowerCase().replace(/\s+/g, '_');
			const themePath = path.join(this.themesPath, `${themeId}.json`);

			theme.imported = new Date().toISOString();
			await fs.writeFile(themePath, JSON.stringify(theme, null, 2));

			console.log(`📥 Thème "${theme.name}" importé avec succès`);
			return themeId;

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'import du thème:', error);
			return null;
		}
	}

	async resetCustomization() {
		try {
			const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));

			// Supprimer la personnalisation
			delete config.customization;
			config.theme = 'default';
			config.embedColor = this.defaultThemes.default.colors.primary;

			await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));

			console.log('🔄 Personnalisation réinitialisée');
			return true;

		}
		catch (error) {
			console.error('❌ Erreur lors de la réinitialisation:', error);
			return false;
		}
	}

	createColorModal(colorType) {
		const modal = new ModalBuilder()
			.setCustomId(`color_modal_${colorType}`)
			.setTitle(`Modifier la couleur ${colorType}`);

		const colorInput = new TextInputBuilder()
			.setCustomId('color_value')
			.setLabel('Code couleur hexadécimal')
			.setStyle(TextInputStyle.Short)
			.setPlaceholder('#00ff00')
			.setRequired(true)
			.setMaxLength(7)
			.setMinLength(7);

		modal.addComponents(new ActionRowBuilder().addComponents(colorInput));
		return modal;
	}

	createEmojiModal(emojiType) {
		const modal = new ModalBuilder()
			.setCustomId(`emoji_modal_${emojiType}`)
			.setTitle(`Modifier l'emoji ${emojiType}`);

		const emojiInput = new TextInputBuilder()
			.setCustomId('emoji_value')
			.setLabel('Emoji ou code emoji')
			.setStyle(TextInputStyle.Short)
			.setPlaceholder('📊 ou :chart_with_upwards_trend:')
			.setRequired(true)
			.setMaxLength(50);

		modal.addComponents(new ActionRowBuilder().addComponents(emojiInput));
		return modal;
	}

	validateColor(color) {
		const hexRegex = /^#[0-9A-Fa-f]{6}$/;
		return hexRegex.test(color);
	}

	validateEmoji(emoji) {
		// Validation basique pour les emojis
		return emoji.length > 0 && emoji.length <= 50;
	}
}

module.exports = CustomizationManager;