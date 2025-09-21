const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const ComponentBuilder = require('../../utils/componentBuilder');
const fs = require('fs').promises;
const path = require('path');
const config = require('../../../config.json');

// Fonction pour créer le nouveau format de réponse
function createResponse(title, content, components = []) {
	return {
		content: `# ${title}\n\n${content}`,
		components: components
	};
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Gérer la configuration du bot')
		.addSubcommand(subcommand =>
			subcommand
				.setName('afficher')
				.setDescription('Afficher la configuration actuelle'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('modifier')
				.setDescription('Modifier un paramètre de configuration')
				.addStringOption(option =>
					option.setName('parametre')
						.setDescription('Paramètre à modifier')
						.setRequired(true)
						.addChoices(
							{ name: 'Seuil d\'alerte activité', value: 'alert_threshold' },
							{ name: 'Canal d\'alertes', value: 'alert_channel' },
							{ name: 'Fréquence des commits Git', value: 'git_frequency' },
							{ name: 'Auto-archivage', value: 'auto_archive' },
							{ name: 'Rôles admin', value: 'admin_roles' },
						),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('reset')
				.setDescription('Réinitialiser la configuration par défaut'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('backup')
				.setDescription('Sauvegarder la configuration actuelle'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('logs-channel')
				.setDescription('📝 Configurer le canal pour les logs du bot')
				.addChannelOption(option =>
					option
						.setName('channel')
						.setDescription('Canal où envoyer les logs')
						.setRequired(true)
						.addChannelTypes(0), // Text channel
				),
		),

	async execute(interaction) {
		// Le bot peut toujours exécuter ses propres commandes admin
		// Pas de vérification de permissions utilisateur nécessaire

		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
			case 'afficher':
				await this.handleShow(interaction);
				break;
			case 'modifier':
				await this.handleModify(interaction);
				break;
			case 'reset':
				await this.handleReset(interaction);
				break;
			case 'backup':
				await this.handleBackup(interaction);
				break;
			case 'logs-channel':
				await this.handleLogsChannel(interaction);
				break;
			}
		}
		catch (error) {
			console.error('Erreur dans la commande config:', error);
			await interaction.reply(createResponse(
				'Erreur',
				'❌ Une erreur est survenue lors de l\'exécution de la commande.'
			));
		}
	},

	async handleShow(interaction) {
		let content = `Voici la configuration complète de **${config.bot.name}** pour le serveur **${config.server.name}**.

🤖 **Informations du Bot**
**Nom:** ${config.bot.name}
**Description:** ${config.bot.description}
**Version:** ${config.bot.version}
**Statut:** ${config.bot.status}
**Activité:** ${config.bot.activity.name}

🏢 **Serveur**
**Nom:** ${config.server.name}
**Fuseau horaire:** ${config.server.timezone}

📊 **Statistiques**
**Suivi des membres:** ${config.statistics.track.members ? '✅' : '❌'}
**Suivi des messages:** ${config.statistics.track.messages ? '✅' : '❌'}
**Activité vocale:** ${config.statistics.track.voice_activity ? '✅' : '❌'}
**Réactions:** ${config.statistics.track.reactions ? '✅' : '❌'}
**Canaux:** ${config.statistics.track.channels ? '✅' : '❌'}

📈 **Rapports**
**Formats disponibles:** ${config.reports.formats.join(', ')}
**Rapport quotidien:** ${config.reports.periods.daily.enabled ? '✅' : '❌'} (${config.reports.periods.daily.time})
**Rapport hebdomadaire:** ${config.reports.periods.weekly.enabled ? '✅' : '❌'} (${config.reports.periods.weekly.day} à ${config.reports.periods.weekly.time})
**Rapport mensuel:** ${config.reports.periods.monthly.enabled ? '✅' : '❌'} (${config.reports.periods.monthly.day} jour à ${config.reports.periods.monthly.time})
**Auto-archivage:** ${config.reports.auto_archive.enabled ? '✅' : '❌'} (après ${config.reports.auto_archive.after_days} jours)

🚨 **Alertes**
**Statut:** ${config.alerts.enabled ? '✅ Activées' : '❌ Désactivées'}
**Seuil baisse membres:** ${config.alerts.thresholds.member_decrease}
**Seuil baisse messages:** ${config.alerts.thresholds.message_decrease}
**Seuil baisse activité:** ${config.alerts.thresholds.activity_decrease}%
**Cooldown:** ${config.alerts.cooldown_hours}h
**Canal d'alertes:** <#${config.alerts.channelId}>

🔧 **Git**
**Auto-commit:** ${config.git.auto_commit ? '✅' : '❌'}
**Fréquence:** ${config.git.commit_frequency}
**Création de tags:** ${config.git.create_tags ? '✅' : '❌'}

👥 **Permissions**
**Rôles admin:** ${config.permissions.admin_roles.join(', ')}
**Accès rapports:** ${config.permissions.report_access.join(', ')}
**Accès stats:** ${config.permissions.stats_access.join(', ')}

📝 **Logs**
**Canal:** <#${config.logs.channelId}>
**Dernière mise à jour:** ${new Date(config.logs.updatedAt).toLocaleString('fr-FR')}

Utilisez les boutons ci-dessous pour modifier la configuration.`;

		// Menu de sélection pour les paramètres - Utilisation de ComponentBuilder
	const selectRow = ComponentBuilder.createSelectMenu(
		'config_parameter_select',
		'Choisir un paramètre à modifier...',
		[
			{
				label: 'Seuil d\'alerte activité',
				description: 'Modifier le seuil d\'alerte d\'activité',
				value: 'alert_threshold',
				emoji: '📈',
			},
			{
				label: 'Canal d\'alertes',
				description: 'Configurer le canal d\'alertes',
				value: 'alert_channel',
				emoji: '📢',
			},
			{
				label: 'Fréquence des commits Git',
				description: 'Modifier la fréquence des commits automatiques',
				value: 'git_frequency',
				emoji: '📅',
			},
			{
				label: 'Auto-archivage',
				description: 'Activer/désactiver l\'auto-archivage',
				value: 'auto_archive',
				emoji: '🗂️',
			},
			{
				label: 'Rôles admin',
				description: 'Gérer les rôles administrateurs',
				value: 'admin_roles',
				emoji: '👑',
			},
		]
	);

	// Boutons d'action - Utilisation de ComponentBuilder
	const buttons = ComponentBuilder.createActionButtons([
		{
			customId: 'config_modify',
			label: 'Modifier',
			style: 'PRIMARY',
			emoji: '✏️'
		},
		{
			customId: 'config_backup',
			label: 'Sauvegarder',
			style: 'SECONDARY',
			emoji: '💾'
		},
		{
			customId: 'config_reset',
			label: 'Réinitialiser',
			style: 'DANGER',
			emoji: '🔄'
		},
		{
			customId: 'config_refresh',
			label: 'Actualiser',
			style: 'SECONDARY',
			emoji: '🔄'
		}
	]);

		await interaction.reply(createResponse(
		`Configuration de ${config.bot.name}`,
		content,
		[selectRow, buttons]
	));
	},

	async handleModify(interaction) {
		const parametre = interaction.options.getString('parametre');

		// Créer un modal pour la modification
		const modal = new ModalBuilder()
			.setCustomId(`config_modal_${parametre}`)
			.setTitle(`Modifier: ${this.getParameterLabel(parametre)}`);

		const input = new TextInputBuilder()
			.setCustomId('config_value')
			.setLabel('Nouvelle valeur')
			.setStyle(TextInputStyle.Short)
			.setPlaceholder(this.getParameterPlaceholder(parametre))
			.setValue(this.getCurrentValue(parametre).toString())
			.setRequired(true);

		const actionRow = new ActionRowBuilder().addComponents(input);
		modal.addComponents(actionRow);

		await interaction.showModal(modal);
	},

	async handleReset(interaction) {
		await interaction.deferReply();

		try {
			// Créer une sauvegarde avant reset
			const backupPath = path.join(__dirname, '../../../config_backup.json');
			await fs.writeFile(backupPath, JSON.stringify(config, null, 2));

			// Charger la configuration par défaut
			const defaultConfig = require('../../../config.default.json');
			const configPath = path.join(__dirname, '../../../config.json');
			await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));

			let content = '🔄 **CONFIGURATION RÉINITIALISÉE** ✅\n\n';
			content += '📋 **La configuration a été réinitialisée aux valeurs par défaut**\n\n';
			content += '💾 **Sauvegarde créée:** `config_backup.json`\n';
			content += '🔄 **Le bot va redémarrer dans 3 secondes pour appliquer les changements**\n\n';
			content += `⏰ **Réinitialisé le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			const restartButton = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('config_restart_now')
						.setLabel('Redémarrer maintenant')
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🔄'),
				);

			await interaction.editReply(createResponse(
				'Configuration Réinitialisée',
				content,
				[restartButton]
			));

			// Redémarrer le bot pour appliquer les changements
			setTimeout(() => {
				process.exit(0);
			}, 3000);

		}
		catch (error) {
			console.error('Erreur lors de la réinitialisation:', error);
			await interaction.editReply(createResponse(
				'Erreur',
				'❌ Erreur lors de la réinitialisation de la configuration.'
			));
		}
	},

	async handleBackup(interaction) {
		await interaction.deferReply();

		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const backupPath = path.join(__dirname, `../../../config_backup_${timestamp}.json`);

			await fs.writeFile(backupPath, JSON.stringify(config, null, 2));

			let content = '💾 **SAUVEGARDE CRÉÉE** ✅\n\n';
			content += '📁 **Configuration sauvegardée dans:**\n';
			content += `\`config_backup_${timestamp}.json\`\n\n`;
			content += `📊 **Taille du fichier:** ${JSON.stringify(config, null, 2).length} caractères\n`;
			content += `⏰ **Créé le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			const actionButtons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('config_backup_another')
						.setLabel('Nouvelle sauvegarde')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('💾'),
					new ButtonBuilder()
						.setCustomId('config_show_current')
						.setLabel('Voir configuration')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('👁️'),
				);

			await interaction.editReply(createResponse(
				'Configuration Sauvegardée',
				content,
				[actionButtons]
			));

		}
		catch (error) {
			console.error('Erreur lors de la sauvegarde:', error);
			await interaction.editReply(createResponse(
				'Erreur',
				'❌ Erreur lors de la sauvegarde de la configuration.'
			));
		}
	},

	async handleLogsChannel(interaction) {
		const channel = interaction.options.getChannel('channel');

		try {
			// Vérifier que c'est un canal textuel
			if (channel.type !== 0) {
				return await interaction.reply(createResponse(
					'Erreur de Configuration',
					'❌ Le canal sélectionné doit être un canal textuel.'
				));
			}

			// Vérifier les permissions du bot dans ce canal
			const botPermissions = channel.permissionsFor(interaction.client.user);
			if (!botPermissions.has(['SendMessages', 'ViewChannel'])) {
				return await interaction.reply(createResponse(
					'Erreur de Permissions',
					'❌ Le bot n\'a pas les permissions nécessaires dans ce canal (Voir le canal, Envoyer des messages).'
				));
			}

			// Sauvegarder la configuration
			const configPath = path.join(__dirname, '../../../config.json');
			const currentConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));

			// Ajouter ou mettre à jour le canal de logs
			if (!currentConfig.logs) {
				currentConfig.logs = {};
			}
			currentConfig.logs.channelId = channel.id;
			currentConfig.logs.channelName = channel.name;
			currentConfig.logs.guildId = interaction.guild.id;
			currentConfig.logs.updatedAt = new Date().toISOString();
			currentConfig.logs.updatedBy = interaction.user.id;

			// Sauvegarder
			await fs.writeFile(configPath, JSON.stringify(currentConfig, null, 2));

			// Mettre à jour la configuration en mémoire si elle existe
			if (interaction.client.config) {
				interaction.client.config.logs = currentConfig.logs;
			}

			// Envoyer un message de test dans le canal configuré
			let testContent = '✅ **CANAL DE LOGS CONFIGURÉ** 📝\n\n';
			testContent += '📋 **Ce canal a été configuré pour recevoir les logs du bot LUX-Compta**\n\n';
			testContent += `👤 **Configuré par:** <@${interaction.user.id}>\n`;
			testContent += `⏰ **Date:** ${new Date().toLocaleString('fr-FR')}\n\n`;
			testContent += '📋 **Types de logs reçus:**\n';
			testContent += '• 🚨 Erreurs système\n';
			testContent += '• ⚡ Commandes importantes\n';
			testContent += '• 📊 Rapports automatiques\n';
			testContent += '• 🔒 Alertes de sécurité\n\n';
			testContent += `⏰ **Configuré le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			const testButtons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('logs_test_message')
						.setLabel('Test de log')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('🧪'),
					new ButtonBuilder()
						.setCustomId('logs_config_info')
						.setLabel('Infos config')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('ℹ️'),
				);

			await channel.send({
				content: testContent,
				components: [testButtons],
			});

			// Répondre à l'utilisateur
			await interaction.reply(createResponse(
				'Canal de Logs Configuré',
				`✅ **Canal de logs configuré avec succès**\n\nLe canal ${channel} a été configuré pour recevoir les logs du bot.\n\n📝 **Canal configuré**\n${channel} (${channel.id})\n\n🔧 **Configuration**\nSauvegardée dans config.json\n\n✅ **Test**\nMessage de test envoyé`
			));

			// Log dans la console
			console.log(`📝 Canal de logs configuré: ${channel.name} (${channel.id}) par ${interaction.user.tag}`);

		}
		catch (error) {
			console.error('❌ Erreur lors de la configuration du canal de logs:', error);

			await interaction.reply(createResponse(
				'Erreur de Configuration',
				`❌ **Erreur de configuration**\n\nImpossible de configurer le canal de logs.\n\n🚫 **Erreur**\n${error.message || 'Erreur inconnue'}`
			));
		}
	},

	getParameterLabel(param) {
		const labels = {
			'alert_threshold': 'Seuil d\'alerte activité (%)',
			'alert_channel': 'Canal d\'alertes (ID)',
			'git_frequency': 'Fréquence des commits Git',
			'auto_archive': 'Auto-archivage (true/false)',
			'admin_roles': 'Rôles admin (séparés par des virgules)',
		};
		return labels[param] || param;
	},

	getParameterPlaceholder(param) {
		const placeholders = {
			'alert_threshold': '20',
			'alert_channel': '123456789012345678',
			'git_frequency': '0 */6 * * *',
			'auto_archive': 'true',
			'admin_roles': 'Admin,Modérateur',
		};
		return placeholders[param] || '';
	},

	getCurrentValue(param) {
		switch (param) {
		case 'alert_threshold':
			return config.alerts.activityThreshold;
		case 'alert_channel':
			return config.alerts.channelId;
		case 'git_frequency':
			return config.git.frequency;
		case 'auto_archive':
			return config.reports.autoArchive;
		case 'admin_roles':
			return config.permissions.admin_roles.join(',');
		default:
			return '';
		}
	},
};