const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
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
		const embed = new EmbedBuilder()
			.setTitle('🤖 LUX Compta - Guide d\'utilisation')
			.setDescription(`Bot de comptabilité et statistiques pour **${config.server.name}**`)
			.setColor('#0099ff')
			.setThumbnail(interaction.client.user.displayAvatarURL())
			.setTimestamp()
			.setFooter({ text: `Version ${config.bot.version}`, iconURL: interaction.client.user.displayAvatarURL() });

		// Commandes générales
		embed.addFields({
			name: '📊 Commandes générales',
			value: '`/help` - Afficher cette aide\n`/stats` - Voir les statistiques du serveur\n`/info` - Informations sur le bot',
			inline: false,
		});

		// Vérifier si l'utilisateur a les permissions admin
		const isAdmin = interaction.member && interaction.member.roles && interaction.member.roles.cache.some(role =>
			config.permissions && config.permissions.admin_roles && config.permissions.admin_roles.includes(role.name)
		);

		if (isAdmin) {
			embed.addFields({
				name: '⚙️ Commandes administrateur',
				value: '`/rapport` - Gérer les rapports\n`/config` - Configuration du bot\n`/maintenance` - Outils de maintenance',
				inline: false,
			});
		}

		// Fonctionnalités principales
		embed.addFields(
			{
				name: '📈 Fonctionnalités',
				value: '• Suivi des statistiques en temps réel\n• Génération de rapports CSV\n• Alertes d\'activité\n• Archivage automatique\n• Intégration Git',
				inline: true,
			},
			{
				name: '🔧 Composants interactifs',
				value: '• Sélecteur de période\n• Boutons d\'action\n• Téléchargement de rapports\n• Envoi par email',
				inline: true,
			},
		);

		// Menu de sélection pour l'aide détaillée
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId('help_category_select')
			.setPlaceholder('Choisir une catégorie pour plus de détails')
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

		const row = new ActionRowBuilder().addComponents(selectMenu);

		if (isUpdate) {
			await interaction.update({ embeds: [embed], components: [row] });
		} else {
			await interaction.reply({
				embeds: [embed],
				components: [row],
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

		const embed = new EmbedBuilder()
			.setTitle(`📖 Aide - /${commandName}`)
			.setDescription(commandHelp.description)
			.setColor('#00ff00')
			.setTimestamp()
			.setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

		if (commandHelp.usage) {
			embed.addFields({ name: '💡 Utilisation', value: commandHelp.usage, inline: false });
		}

		if (commandHelp.examples) {
			embed.addFields({ name: '📝 Exemples', value: commandHelp.examples, inline: false });
		}

		if (commandHelp.permissions) {
			embed.addFields({ name: '🔒 Permissions requises', value: commandHelp.permissions, inline: false });
		}

		await interaction.reply({ embeds: [embed] });
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

		const embed = new EmbedBuilder()
			.setTitle(`📚 ${categoryHelp.title}`)
			.setDescription(categoryHelp.description)
			.setColor('#0099ff')
			.setTimestamp()
			.setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

		if (categoryHelp.commands) {
			categoryHelp.commands.forEach(cmd => {
				embed.addFields({
					name: `/${cmd.name}`,
					value: cmd.description,
					inline: false,
				});
			});
		}

		if (categoryHelp.tips) {
			embed.addFields({
				name: '💡 Conseils',
				value: categoryHelp.tips,
				inline: false,
			});
		}

		// Créer le menu de sélection pour permettre de choisir une autre catégorie
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId('help_category_select')
			.setPlaceholder('Choisir une autre catégorie ou revenir au menu principal')
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

		const row = new ActionRowBuilder().addComponents(selectMenu);

		await interaction.update({ embeds: [embed], components: [row] });
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