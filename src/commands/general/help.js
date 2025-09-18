const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');

const config = require('../../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Afficher l\'aide et les commandes disponibles')
		.addStringOption(option =>
			option.setName('commande')
				.setDescription('Commande spécifique pour laquelle obtenir de l\'aide')
				.setRequired(false),
		),

	async execute(interaction) {
		const commandName = interaction.options.getString('commande');

		if (commandName) {
			await this.showCommandHelp(interaction, commandName);
		}
		else {
			await this.showGeneralHelp(interaction);
		}
	},

	async showGeneralHelp(interaction, isUpdate = false) {

		let content = '🤖 **LUX COMPTA - GUIDE D\'UTILISATION** 🤖\n\n';
		content += `📊 **Bot de comptabilité et statistiques pour ${config.server.name}**\n\n`;

		// Commandes générales
		content += '📊 **Commandes générales:**\n';
		content += '• `/help` - Afficher cette aide\n';
		content += '• `/stats` - Voir les statistiques du serveur\n';
		content += '• `/info` - Informations sur le bot\n\n';

		// Vérifier si l'utilisateur a les permissions admin
		const isAdmin = interaction.member && interaction.member.roles && interaction.member.roles.cache.some(role =>
			config.permissions && config.permissions.admin_roles && config.permissions.admin_roles.includes(role.name),
		);

		if (isAdmin) {
			content += '⚙️ **Commandes administrateur:**\n';
			content += '• `/rapport` - Gérer les rapports\n';
			content += '• `/config` - Configuration du bot\n';
			content += '• `/maintenance` - Outils de maintenance\n\n';
		}

		// Fonctionnalités principales
		content += '📈 **Fonctionnalités principales:**\n';
		content += '• Suivi des statistiques en temps réel\n';
		content += '• Génération de rapports CSV\n';
		content += '• Alertes d\'activité\n';
		content += '• Archivage automatique\n';
		content += '• Intégration Git\n\n';

		content += '🔧 **Composants interactifs:**\n';
		content += '• Sélecteur de période\n';
		content += '• Boutons d\'action\n';
		content += '• Téléchargement de rapports\n';
		content += '• Envoi par email\n\n';

		content += `⏰ **Guide consulté:** <t:${Math.floor(Date.now() / 1000)}:F>\n`;
		content += `📋 **Version:** ${config.bot.version}`;

		// Menu de sélection pour l'aide détaillée (Type 17)
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId('help_category_select')
			.setPlaceholder('Choisir une catégorie pour plus de détails...')
			.addOptions([
				{
					label: 'Statistiques',
					description: 'Commandes liées aux statistiques',
					value: 'stats',
					emoji: '📊',
				},
				{
					label: 'Rapports',
					description: 'Génération et gestion des rapports',
					value: 'reports',
					emoji: '📋',
				},
				{
					label: 'Configuration',
					description: 'Paramètres et configuration',
					value: 'config',
					emoji: '⚙️',
				},
				{
					label: 'Composants',
					description: 'Utilisation des composants interactifs',
					value: 'components',
					emoji: '🔧',
				},
			]);

		// Boutons d'action (Type 10)
		const buttons = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('help_quick_start')
					.setLabel('Guide rapide')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('🚀'),
				new ButtonBuilder()
					.setCustomId('help_examples')
					.setLabel('Exemples')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('📝'),
				new ButtonBuilder()
					.setCustomId('help_support')
					.setLabel('Support')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('❓'),
			);

		const selectRow = new ActionRowBuilder().addComponents(selectMenu);

		if (isUpdate) {
			await interaction.update({
				content: content,
				components: [selectRow, buttons],
				embeds: [],
			});
		}
		else {
			await interaction.reply({
				content: content,
				components: [selectRow, buttons],
			});
		}
	},

	async showCommandHelp(interaction, commandName) {
		const commandHelp = this.getCommandHelp(commandName);

		if (!commandHelp) {
			return interaction.reply({
				content: `❌ Commande \`${commandName}\` non trouvée.`,
				ephemeral: true,
			});
		}

		let content = `📖 **AIDE - /${commandName.toUpperCase()}** 📖\n\n`;
		content += `📝 **Description:**\n${commandHelp.description}\n\n`;

		if (commandHelp.usage) {
			content += `💡 **Utilisation:**\n${commandHelp.usage}\n\n`;
		}

		if (commandHelp.examples) {
			content += `📝 **Exemples:**\n${commandHelp.examples}\n\n`;
		}

		if (commandHelp.permissions) {
			content += `🔒 **Permissions requises:**\n${commandHelp.permissions}\n\n`;
		}

		content += `⏰ **Aide consultée:** <t:${Math.floor(Date.now() / 1000)}:F>`;

		// Menu de sélection pour voir d'autres commandes (Type 17)
		const commandSelect = new ActionRowBuilder()
			.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId('help_command_select')
					.setPlaceholder('Voir l\'aide d\'une autre commande...')
					.addOptions([
						{
							label: 'stats',
							description: 'Statistiques du serveur',
							value: 'stats',
							emoji: '📊',
						},
						{
							label: 'rapport',
							description: 'Gestion des rapports',
							value: 'rapport',
							emoji: '📋',
						},
						{
							label: 'config',
							description: 'Configuration du bot',
							value: 'config',
							emoji: '⚙️',
						},
						{
							label: 'help',
							description: 'Système d\'aide',
							value: 'help',
							emoji: '❓',
						},
					]),
			);

		// Boutons d'action (Type 10)
		const buttons = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('help_back_main')
					.setLabel('Retour au menu principal')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('🏠'),
				new ButtonBuilder()
					.setCustomId('help_try_command')
					.setLabel('Essayer la commande')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('🚀'),
				new ButtonBuilder()
					.setCustomId('help_more_info')
					.setLabel('Plus d\'infos')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('ℹ️'),
			);

		await interaction.reply({
			content: content,
			components: [commandSelect, buttons],
		});
	},

	getCommandHelp(commandName) {
		const commands = {
			'stats': {
				description: 'Affiche les statistiques détaillées du serveur pour différentes périodes.',
				usage: '`/stats [periode] [type]`\n\n**Périodes:** daily, weekly, monthly, all\n**Types:** general, messages, members, channels',
				examples: '`/stats periode:daily type:general`\n`/stats periode:weekly type:messages`\n`/stats periode:monthly type:members`',
				permissions: 'Rôles avec accès aux statistiques',
			},
			'rapport': {
				description: 'Gère la génération et l\'envoi des rapports CSV.',
				usage: '`/rapport generer [periode]` - Générer un rapport\n`/rapport liste` - Lister les rapports\n`/rapport archiver` - Archiver les anciens rapports',
				examples: '`/rapport generer periode:daily`\n`/rapport liste`\n`/rapport archiver`',
				permissions: 'Administrateurs uniquement',
			},
			'config': {
				description: 'Gère la configuration du bot et ses paramètres.',
				usage: '`/config afficher` - Voir la configuration\n`/config modifier [parametre]` - Modifier un paramètre\n`/config reset` - Réinitialiser\n`/config backup` - Sauvegarder',
				examples: '`/config afficher`\n`/config modifier parametre:alert_threshold`\n`/config backup`',
				permissions: 'Administrateurs uniquement',
			},
			'help': {
				description: 'Affiche l\'aide générale ou l\'aide d\'une commande spécifique.',
				usage: '`/help` - Aide générale\n`/help [commande]` - Aide spécifique',
				examples: '`/help`\n`/help stats`\n`/help rapport`',
				permissions: 'Tous les utilisateurs',
			},
		};

		return commands[commandName] || null;
	},

	async handleCategorySelect(interaction, category) {

		// Si l'utilisateur sélectionne le menu principal, afficher l'aide générale
		if (category === 'main_menu') {
			await this.showGeneralHelp(interaction, true); // true pour indiquer que c'est une mise à jour
			return;
		}

		const categoryHelp = this.getCategoryHelp(category);

		let content = `📚 **${categoryHelp.title.toUpperCase()}** 📚\n\n`;
		content += `📝 **Description:**\n${categoryHelp.description}\n\n`;

		if (categoryHelp.commands) {
			content += '🔧 **Commandes disponibles:**\n';
			categoryHelp.commands.forEach(cmd => {
				content += `• **/${cmd.name}** - ${cmd.description}\n`;
			});
			content += '\n';
		}

		if (categoryHelp.tips) {
			content += `💡 **Conseils d'utilisation:**\n${categoryHelp.tips}\n\n`;
		}

		content += `⏰ **Catégorie consultée:** <t:${Math.floor(Date.now() / 1000)}:F>`;

		// Créer le menu de sélection pour permettre de choisir une autre catégorie (Type 17)
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId('help_category_select')
			.setPlaceholder('Choisir une autre catégorie ou revenir au menu principal...')
			.addOptions([
				{
					label: 'Menu principal',
					description: 'Revenir au menu d\'aide principal',
					value: 'main_menu',
					emoji: '🏠',
				},
				{
					label: 'Statistiques',
					description: 'Commandes liées aux statistiques',
					value: 'stats',
					emoji: '📊',
				},
				{
					label: 'Rapports',
					description: 'Génération et gestion des rapports',
					value: 'reports',
					emoji: '📋',
				},
				{
					label: 'Configuration',
					description: 'Paramètres et configuration',
					value: 'config',
					emoji: '⚙️',
				},
				{
					label: 'Composants',
					description: 'Utilisation des composants interactifs',
					value: 'components',
					emoji: '🔧',
				},
			]);

		// Boutons d'action (Type 10)
		const buttons = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('help_category_demo')
					.setLabel('Voir démo')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('🎬'),
				new ButtonBuilder()
					.setCustomId('help_category_examples')
					.setLabel('Exemples pratiques')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('📋'),
				new ButtonBuilder()
					.setCustomId('help_category_faq')
					.setLabel('FAQ')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('❓'),
			);

		const selectRow = new ActionRowBuilder().addComponents(selectMenu);

		await interaction.update({
			content: content,
			components: [selectRow, buttons],
			embeds: [],
		});
	},

	getCategoryHelp(category) {
		const categories = {
			'main_menu': {
				title: 'Menu principal',
				description: 'Retour au menu d\'aide principal',
				isMainMenu: true,
			},
			'stats': {
				title: 'Statistiques',
				description: 'Le système de statistiques suit l\'activité du serveur en temps réel.',
				commands: [
					{
						name: 'stats',
						description: 'Affiche les statistiques pour différentes périodes et types de données.',
					},
				],
				tips: '• Utilisez les boutons pour actualiser les données\n• Les statistiques sont mises à jour en temps réel\n• Exportez en CSV pour une analyse approfondie',
			},
			'reports': {
				title: 'Rapports',
				description: 'Génération et gestion des rapports CSV automatiques.',
				commands: [
					{
						name: 'rapport generer',
						description: 'Génère un rapport pour la période spécifiée.',
					},
					{
						name: 'rapport liste',
						description: 'Affiche tous les rapports disponibles.',
					},
					{
						name: 'rapport archiver',
						description: 'Archive les anciens rapports pour libérer de l\'espace.',
					},
				],
				tips: '• Les rapports sont générés automatiquement\n• Utilisez les composants pour télécharger ou envoyer par email\n• L\'archivage se fait automatiquement chaque mois',
			},
			'config': {
				title: 'Configuration',
				description: 'Gestion des paramètres et de la configuration du bot.',
				commands: [
					{
						name: 'config afficher',
						description: 'Montre tous les paramètres actuels.',
					},
					{
						name: 'config modifier',
						description: 'Modifie un paramètre spécifique.',
					},
					{
						name: 'config backup',
						description: 'Crée une sauvegarde de la configuration.',
					},
				],
				tips: '• Sauvegardez avant de modifier\n• Certains changements nécessitent un redémarrage\n• Les sauvegardes sont horodatées',
			},
			'components': {
				title: 'Composants interactifs',
				description: 'Utilisation des menus et boutons pour interagir avec le bot.',
				tips: '• **Sélecteur de période (Type 17):** Choisissez la période des données\n• **Boutons d\'action (Type 10):** Téléchargez, envoyez par email ou visualisez\n• **Navigation:** Utilisez les boutons pour naviguer entre les pages\n• **Actualisation:** Les données peuvent être actualisées en temps réel',
			},
		};

		return categories[category] || { title: 'Catégorie inconnue', description: 'Cette catégorie n\'existe pas.' };
	},
};