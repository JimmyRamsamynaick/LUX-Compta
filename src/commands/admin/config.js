const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const config = require('../../../config.json');

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
		// Vérifier les permissions admin
		if (!interaction.member.roles.cache.some(role => config.permissions.adminRoles.includes(role.name))) {
			return interaction.reply({
				content: '❌ Vous n\'avez pas les permissions nécessaires pour utiliser cette commande.',
				ephemeral: true,
			});
		}

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
			await interaction.reply({
				content: '❌ Une erreur est survenue lors de l\'exécution de la commande.',
				ephemeral: true,
			});
		}
	},

	async handleShow(interaction) {
		const embed = new EmbedBuilder()
			.setTitle('⚙️ Configuration actuelle')
			.setDescription('Paramètres de configuration du bot LUX Compta')
			.setColor('#0099ff')
			.setTimestamp()
			.setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

		// Bot settings
		embed.addFields(
			{ name: '🤖 Bot', value: `**Nom:** ${config.bot.name}\n**Version:** ${config.bot.version}\n**Préfixe:** ${config.bot.prefix}`, inline: true },
			{ name: '🌍 Serveur', value: `**Nom:** ${config.server.name}\n**Fuseau:** ${config.server.timezone}`, inline: true },
			{ name: '📊 Rapports', value: `**Formats:** ${config.reports.formats.join(', ')}\n**Auto-archivage:** ${config.reports.autoArchive ? '✅' : '❌'}`, inline: true },
		);

		// Alerts settings
		embed.addFields(
			{ name: '🚨 Alertes', value: `**Activées:** ${config.alerts.enabled ? '✅' : '❌'}\n**Seuil:** ${config.alerts.activityThreshold}%\n**Cooldown:** ${config.alerts.cooldown}h`, inline: true },
			{ name: '🔧 Git', value: `**Auto-commit:** ${config.git.autoCommit ? '✅' : '❌'}\n**Fréquence:** ${config.git.frequency}\n**Tags auto:** ${config.git.autoTag ? '✅' : '❌'}`, inline: true },
			{ name: '👥 Permissions', value: `**Admins:** ${config.permissions.adminRoles.join(', ')}\n**Stats:** ${config.permissions.statsAccess.join(', ')}`, inline: true },
		);

		const buttons = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('config_modify')
					.setLabel('Modifier')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('✏️'),
				new ButtonBuilder()
					.setCustomId('config_backup')
					.setLabel('Sauvegarder')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('💾'),
				new ButtonBuilder()
					.setCustomId('config_reset')
					.setLabel('Réinitialiser')
					.setStyle(ButtonStyle.Danger)
					.setEmoji('🔄'),
			);

		await interaction.reply({
			embeds: [embed],
			components: [buttons],
		});
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

			const embed = new EmbedBuilder()
				.setTitle('🔄 Configuration réinitialisée')
				.setDescription('La configuration a été réinitialisée aux valeurs par défaut.\nUne sauvegarde a été créée dans `config_backup.json`.')
				.setColor('#ff9900')
				.setTimestamp()
				.setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

			await interaction.editReply({ embeds: [embed] });

			// Redémarrer le bot pour appliquer les changements
			setTimeout(() => {
				process.exit(0);
			}, 3000);

		}
		catch (error) {
			console.error('Erreur lors de la réinitialisation:', error);
			await interaction.editReply({
				content: '❌ Erreur lors de la réinitialisation de la configuration.',
				ephemeral: true,
			});
		}
	},

	async handleBackup(interaction) {
		await interaction.deferReply();

		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const backupPath = path.join(__dirname, `../../../config_backup_${timestamp}.json`);

			await fs.writeFile(backupPath, JSON.stringify(config, null, 2));

			const embed = new EmbedBuilder()
				.setTitle('💾 Sauvegarde créée')
				.setDescription(`Configuration sauvegardée dans:\n\`config_backup_${timestamp}.json\``)
				.setColor('#00ff00')
				.setTimestamp()
				.setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

			await interaction.editReply({ embeds: [embed] });

		}
		catch (error) {
			console.error('Erreur lors de la sauvegarde:', error);
			await interaction.editReply({
				content: '❌ Erreur lors de la sauvegarde de la configuration.',
				ephemeral: true,
			});
		}
	},

	async handleLogsChannel(interaction) {
		const channel = interaction.options.getChannel('channel');

		try {
			// Vérifier que c'est un canal textuel
			if (channel.type !== 0) {
				return await interaction.reply({
					content: '❌ Le canal sélectionné doit être un canal textuel.',
					ephemeral: true,
				});
			}

			// Vérifier les permissions du bot dans ce canal
			const botPermissions = channel.permissionsFor(interaction.client.user);
			if (!botPermissions.has(['SendMessages', 'ViewChannel'])) {
				return await interaction.reply({
					content: '❌ Le bot n\'a pas les permissions nécessaires dans ce canal (Voir le canal, Envoyer des messages).',
					ephemeral: true,
				});
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
			const testEmbed = new EmbedBuilder()
				.setTitle('✅ Canal de logs configuré')
				.setDescription('Ce canal a été configuré pour recevoir les logs du bot LUX-Compta.')
				.setColor('#00ff00')
				.addFields([
					{
						name: '👤 Configuré par',
						value: `<@${interaction.user.id}>`,
						inline: true,
					},
					{
						name: '⏰ Date',
						value: new Date().toLocaleString('fr-FR'),
						inline: true,
					},
					{
						name: '📋 Types de logs',
						value: '• Erreurs système\n• Commandes importantes\n• Rapports automatiques\n• Alertes de sécurité',
						inline: false,
					},
				])
				.setTimestamp()
				.setFooter({
					text: 'LUX-Compta Logs',
					iconURL: interaction.client.user.displayAvatarURL(),
				});

			await channel.send({ embeds: [testEmbed] });

			// Répondre à l'utilisateur
			const successEmbed = new EmbedBuilder()
				.setTitle('✅ Canal de logs configuré avec succès')
				.setDescription(`Le canal ${channel} a été configuré pour recevoir les logs du bot.`)
				.setColor('#00ff00')
				.addFields([
					{
						name: '📝 Canal configuré',
						value: `${channel} (${channel.id})`,
						inline: true,
					},
					{
						name: '🔧 Configuration',
						value: 'Sauvegardée dans config.json',
						inline: true,
					},
					{
						name: '✅ Test',
						value: 'Message de test envoyé',
						inline: true,
					},
				])
				.setTimestamp();

			await interaction.reply({ embeds: [successEmbed], ephemeral: true });

			// Log dans la console
			console.log(`📝 Canal de logs configuré: ${channel.name} (${channel.id}) par ${interaction.user.tag}`);

		}
		catch (error) {
			console.error('❌ Erreur lors de la configuration du canal de logs:', error);

			const errorEmbed = new EmbedBuilder()
				.setTitle('❌ Erreur de configuration')
				.setDescription('Impossible de configurer le canal de logs.')
				.setColor('#ff0000')
				.addFields([
					{
						name: '🚫 Erreur',
						value: error.message || 'Erreur inconnue',
						inline: false,
					},
				])
				.setTimestamp();

			await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
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
			return config.permissions.adminRoles.join(',');
		default:
			return '';
		}
	},
};