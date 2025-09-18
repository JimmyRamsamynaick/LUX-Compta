const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

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
					ephemeral: true,
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
				await interaction.followUp({ content: errorMessage, ephemeral: true });
			}
			else {
				await interaction.reply({ content: errorMessage, ephemeral: true });
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
				ephemeral: true,
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
				ephemeral: true,
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
					ephemeral: true,
				});
			}

			const success = await customizationManager.updateColor(type, valeur);

			if (success) {
				const { EmbedBuilder } = require('discord.js');

				const embed = new EmbedBuilder()
					.setTitle('🎨 Couleur mise à jour')
					.setDescription(`La couleur **${type}** a été mise à jour avec succès.`)
					.setColor(valeur)
					.addFields([
						{
							name: 'Nouvelle couleur',
							value: `**${type}:** ${valeur}`,
							inline: true,
						},
					])
					.setTimestamp();

				await interaction.reply({
					embeds: [embed],
					ephemeral: true,
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la mise à jour de la couleur.',
					ephemeral: true,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la modification de couleur:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la modification de la couleur.',
				ephemeral: true,
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
					ephemeral: true,
				});
			}

			const success = await customizationManager.updateEmoji(type, valeur);

			if (success) {
				const { EmbedBuilder } = require('discord.js');

				const embed = new EmbedBuilder()
					.setTitle('😀 Emoji mis à jour')
					.setDescription(`L'emoji **${type}** a été mis à jour avec succès.`)
					.setColor('#00ff00')
					.addFields([
						{
							name: 'Nouvel emoji',
							value: `**${type}:** ${valeur}`,
							inline: true,
						},
					])
					.setTimestamp();

				await interaction.reply({
					embeds: [embed],
					ephemeral: true,
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la mise à jour de l\'emoji.',
					ephemeral: true,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la modification d\'emoji:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la modification de l\'emoji.',
				ephemeral: true,
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
			const { EmbedBuilder } = require('discord.js');

			const embed = new EmbedBuilder()
				.setTitle('🎨 Thème appliqué')
				.setDescription(`Le thème **${theme.name}** a été appliqué avec succès.`)
				.setColor(theme.colors.primary)
				.addFields([
					{
						name: 'Couleurs',
						value: [
							`**Principale:** ${theme.colors.primary}`,
							`**Secondaire:** ${theme.colors.secondary}`,
							`**Succès:** ${theme.colors.success}`,
						].join('\n'),
						inline: true,
					},
					{
						name: 'Emojis',
						value: [
							`**Stats:** ${theme.emojis.stats}`,
							`**Membres:** ${theme.emojis.members}`,
							`**Messages:** ${theme.emojis.messages}`,
						].join('\n'),
						inline: true,
					},
				])
				.setTimestamp();

			await interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});
		}
		else {
			await interaction.reply({
				content: `❌ Impossible d'appliquer le thème "${nom}". Vérifiez que le thème existe.`,
				ephemeral: true,
			});
		}
	},

	async createTheme(interaction, customizationManager, nom) {
		if (!nom) {
			return await interaction.reply({
				content: '❌ Vous devez spécifier un nom pour le nouveau thème.',
				ephemeral: true,
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
			const { EmbedBuilder } = require('discord.js');

			const embed = new EmbedBuilder()
				.setTitle('🎨 Thème créé')
				.setDescription(`Le thème personnalisé **${nom}** a été créé avec succès.`)
				.setColor(currentTheme.colors.primary)
				.addFields([
					{
						name: 'Informations',
						value: [
							`**Nom:** ${nom}`,
							`**ID:** ${themeId}`,
							`**Basé sur:** ${currentTheme.name}`,
						].join('\n'),
						inline: false,
					},
				])
				.setTimestamp();

			await interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});
		}
		else {
			await interaction.reply({
				content: '❌ Erreur lors de la création du thème.',
				ephemeral: true,
			});
		}
	},

	async exportTheme(interaction, customizationManager, nom) {
		try {
			const themeId = nom || 'current';
			const exportData = await customizationManager.exportTheme(themeId);

			if (exportData) {
				const { AttachmentBuilder } = require('discord.js');

				const attachment = new AttachmentBuilder(
					Buffer.from(exportData, 'utf8'),
					{ name: `theme_${themeId}_${Date.now()}.json` },
				);

				await interaction.reply({
					content: `📤 Export du thème "${themeId}" terminé.`,
					files: [attachment],
					ephemeral: true,
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de l\'export du thème.',
					ephemeral: true,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'export:', error);
			await interaction.reply({
				content: '❌ Erreur lors de l\'export du thème.',
				ephemeral: true,
			});
		}
	},

	async importTheme(interaction, customizationManager) {
		await interaction.reply({
			content: '📥 Pour importer un thème, utilisez le menu de personnalisation et sélectionnez l\'option "Importer".',
			ephemeral: true,
		});
	},

	async resetTheme(interaction, customizationManager) {
		try {
			const success = await customizationManager.resetCustomization();

			if (success) {
				const { EmbedBuilder } = require('discord.js');

				const embed = new EmbedBuilder()
					.setTitle('🔄 Personnalisation réinitialisée')
					.setDescription('La personnalisation a été réinitialisée au thème par défaut.')
					.setColor('#00ff00')
					.setTimestamp();

				await interaction.reply({
					embeds: [embed],
					ephemeral: true,
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la réinitialisation.',
					ephemeral: true,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la réinitialisation:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la réinitialisation de la personnalisation.',
				ephemeral: true,
			});
		}
	},
};