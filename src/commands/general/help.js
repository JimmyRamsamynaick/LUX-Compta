const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const CustomEmbedBuilder = require('../../utils/embedBuilder');
const ComponentBuilder = require('../../utils/componentBuilder');
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
		const title = '🤖 LUX COMPTA - GUIDE D\'UTILISATION';
		
		let content = `📊 **Bot de comptabilité et statistiques pour ${config.server.name}**\n\n`;

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

		// Créer l'embed avec CustomEmbedBuilder
		const embed = CustomEmbedBuilder.createInfo(title, content);

		// Menu de sélection pour l'aide détaillée
		const selectMenu = ComponentBuilder.createSelectMenu(
			'help_category_select',
			'Choisir une catégorie pour plus de détails...',
			[
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
			]
		);

		// Boutons d'action
		const buttons = ComponentBuilder.createActionButtons([
			{
				customId: 'help_quick_start',
				label: '🚀 Démarrage rapide',
				style: 'Primary'
			},
			{
				customId: 'help_examples',
				label: '📝 Exemples',
				style: 'Secondary'
			},
			{
				customId: 'help_support',
				label: '🆘 Support',
				style: 'Secondary'
			}
		]);

		const response = CustomEmbedBuilder.createResponse(embed, [selectMenu, buttons]);

		if (isUpdate) {
			await interaction.update(response);
		} else {
			await interaction.reply(response);
		}
	},

	async showCommandHelp(interaction, commandName) {
		const commandHelp = this.getCommandHelp(commandName);

		if (!commandHelp) {
			return interaction.reply({
				content: `❌ Commande \`${commandName}\` non trouvée.`,
				
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

	async handleHelpButton(interaction) {
		const customId = interaction.customId;

		try {
			if (customId === 'help_quick_start') {
				await this.showQuickStart(interaction);
			} else if (customId === 'help_examples') {
				await this.showExamples(interaction);
			} else if (customId === 'help_support') {
				await this.showSupport(interaction);
			} else if (customId === 'help_back_main') {
				await this.showGeneralHelp(interaction, true);
			} else if (customId === 'help_try_command') {
				await this.showTryCommand(interaction);
			} else if (customId === 'help_more_info') {
				await this.showMoreInfo(interaction);
			} else if (customId === 'help_category_demo') {
				await this.showCategoryDemo(interaction);
			} else if (customId === 'help_category_examples') {
				await this.showCategoryExamples(interaction);
			} else if (customId === 'help_category_faq') {
				await this.showCategoryFAQ(interaction);
			}
		} catch (error) {
			console.error('Erreur dans handleHelpButton:', error);
			await interaction.reply({
				content: '❌ Une erreur est survenue lors du traitement de votre demande.',
				ephemeral: true
			});
		}
	},

	async showQuickStart(interaction) {
		let content = '🚀 **GUIDE DE DÉMARRAGE RAPIDE** 🚀\n\n';
		content += '**Étape 1:** Utilisez `/help` pour voir toutes les commandes\n';
		content += '**Étape 2:** Essayez `/stats` pour voir les statistiques\n';
		content += '**Étape 3:** Explorez les boutons et menus interactifs\n\n';
		content += '💡 **Conseil:** Commencez par les commandes de base avant d\'explorer les fonctionnalités avancées.';

		await interaction.update({
			content: content,
			components: []
		});
	},

	async showExamples(interaction) {
		let content = '📝 **EXEMPLES D\'UTILISATION** 📝\n\n';
		content += '**Statistiques:**\n';
		content += '• `/stats` - Statistiques générales\n';
		content += '• Cliquez sur "Actualiser" pour mettre à jour\n\n';
		content += '**Rapports:**\n';
		content += '• `/rapport generer` - Créer un rapport\n';
		content += '• Utilisez les boutons pour télécharger\n\n';
		content += '**Navigation:**\n';
		content += '• Utilisez les menus déroulants pour changer de catégorie\n';
		content += '• Les boutons permettent des actions rapides';

		await interaction.update({
			content: content,
			components: []
		});
	},

	async showSupport(interaction) {
		let content = '❓ **SUPPORT ET AIDE** ❓\n\n';
		content += '**Problèmes courants:**\n';
		content += '• Commande non reconnue → Vérifiez l\'orthographe\n';
		content += '• Pas de permissions → Contactez un administrateur\n';
		content += '• Bot ne répond pas → Vérifiez qu\'il est en ligne\n\n';
		content += '**Contact:**\n';
		content += '• Mentionnez un administrateur\n';
		content += '• Utilisez le canal de support\n';
		content += '• Consultez la documentation complète';

		await interaction.update({
			content: content,
			components: []
		});
	},

	async showTryCommand(interaction) {
		let content = '🚀 **ESSAYER LA COMMANDE** 🚀\n\n';
		content += 'Vous pouvez maintenant essayer cette commande !\n\n';
		content += '💡 **Conseils:**\n';
		content += '• Tapez `/` pour voir toutes les commandes\n';
		content += '• Utilisez la saisie automatique\n';
		content += '• Lisez les descriptions des options';

		await interaction.update({
			content: content,
			components: []
		});
	},

	async showMoreInfo(interaction) {
		let content = 'ℹ️ **INFORMATIONS DÉTAILLÉES** ℹ️\n\n';
		content += 'Pour plus d\'informations détaillées:\n\n';
		content += '• Consultez la documentation complète\n';
		content += '• Explorez les différentes catégories d\'aide\n';
		content += '• Testez les fonctionnalités interactives\n';
		content += '• Demandez de l\'aide aux administrateurs';

		await interaction.update({
			content: content,
			components: []
		});
	},

	async showCategoryDemo(interaction) {
		let content = '🎬 **DÉMONSTRATION** 🎬\n\n';
		content += 'Voici une démonstration des fonctionnalités:\n\n';
		content += '1. Utilisez les commandes slash\n';
		content += '2. Interagissez avec les boutons\n';
		content += '3. Explorez les menus déroulants\n';
		content += '4. Téléchargez les rapports\n\n';
		content += '💡 Chaque interaction vous donnera des options supplémentaires !';

		await interaction.update({
			content: content,
			components: []
		});
	},

	async showCategoryExamples(interaction) {
		let content = '📋 **EXEMPLES PRATIQUES** 📋\n\n';
		content += 'Voici des exemples concrets d\'utilisation:\n\n';
		content += '**Scénario 1:** Consulter les stats du jour\n';
		content += '→ `/stats` puis sélectionner "Aujourd\'hui"\n\n';
		content += '**Scénario 2:** Générer un rapport mensuel\n';
		content += '→ `/rapport generer` puis choisir "Mensuel"\n\n';
		content += '**Scénario 3:** Configurer les alertes\n';
		content += '→ `/config` puis "Alertes"';

		await interaction.update({
			content: content,
			components: []
		});
	},

	async showCategoryFAQ(interaction) {
		let content = '❓ **QUESTIONS FRÉQUENTES** ❓\n\n';
		content += '**Q: Comment voir les statistiques ?**\n';
		content += 'R: Utilisez `/stats` et sélectionnez la période\n\n';
		content += '**Q: Comment télécharger un rapport ?**\n';
		content += 'R: Générez le rapport puis cliquez sur "Télécharger"\n\n';
		content += '**Q: Qui peut utiliser les commandes admin ?**\n';
		content += 'R: Seuls les utilisateurs avec les rôles appropriés\n\n';
		content += '**Q: Le bot ne répond pas ?**\n';
		content += 'R: Vérifiez qu\'il est en ligne et que vous avez les permissions';

		await interaction.update({
			content: content,
			components: []
		});
	},

	async handleComponents(interaction) {
		const customId = interaction.customId;

		try {
			// Gestion des menus déroulants
			if (customId === 'help_category_select') {
				const selectedCategory = interaction.values[0];
				await this.handleCategorySelect(interaction, selectedCategory);
				return;
			}

			if (customId === 'help_command_select') {
				const selectedCommand = interaction.values[0];
				await this.showCommandHelp(interaction, selectedCommand);
				return;
			}

			// Gestion des boutons
			switch (customId) {
				case 'help_quick_start':
					await this.showQuickStart(interaction);
					break;
				case 'help_examples':
					await this.showExamples(interaction);
					break;
				case 'help_support':
					await this.showSupport(interaction);
					break;
				case 'help_back_main':
					await this.showGeneralHelp(interaction, true);
					break;
				case 'help_try_command':
					await this.showTryCommand(interaction);
					break;
				case 'help_category_demo':
					await this.showCategoryDemo(interaction);
					break;
				case 'help_category_examples':
					await this.showCategoryExamples(interaction);
					break;
				case 'help_category_faq':
					await this.showCategoryFAQ(interaction);
					break;
				case 'help_more_info':
					await this.showMoreInfo(interaction);
					break;
				default:
					await interaction.reply({
						content: '❌ Action non reconnue.',
						ephemeral: true
					});
			}
		} catch (error) {
			console.error('Erreur dans handleComponents (help):', error);
			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({
					content: '❌ Une erreur est survenue lors du traitement de votre demande.',
					ephemeral: true
				});
			}
		}
	},
};