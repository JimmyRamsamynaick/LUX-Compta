const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('archive')
		.setDescription('Gérer l\'archivage des données et rapports')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand(subcommand =>
			subcommand
				.setName('créer')
				.setDescription('Créer une archive manuelle')
				.addStringOption(option =>
					option
						.setName('type')
						.setDescription('Type de données à archiver')
						.setRequired(true)
						.addChoices(
							{ name: 'Rapports', value: 'reports' },
							{ name: 'Statistiques', value: 'stats' },
							{ name: 'Logs', value: 'logs' },
							{ name: 'Tout', value: 'all' },
						),
				)
				.addStringOption(option =>
					option
						.setName('période')
						.setDescription('Période à archiver')
						.setRequired(false)
						.addChoices(
							{ name: 'Dernière semaine', value: 'week' },
							{ name: 'Dernier mois', value: 'month' },
							{ name: 'Derniers 3 mois', value: '3months' },
							{ name: 'Dernière année', value: 'year' },
						),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('config')
				.setDescription('Configurer l\'archivage automatique')
				.addBooleanOption(option =>
					option
						.setName('activé')
						.setDescription('Activer l\'archivage automatique')
						.setRequired(false),
				)
				.addIntegerOption(option =>
					option
						.setName('fréquence')
						.setDescription('Fréquence d\'archivage (en jours)')
						.setRequired(false)
						.setMinValue(1)
						.setMaxValue(365),
				)
				.addIntegerOption(option =>
					option
						.setName('rétention')
						.setDescription('Durée de rétention des archives (en jours)')
						.setRequired(false)
						.setMinValue(30)
						.setMaxValue(3650),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('liste')
				.setDescription('Lister les archives disponibles')
				.addStringOption(option =>
					option
						.setName('type')
						.setDescription('Filtrer par type d\'archive')
						.setRequired(false)
						.addChoices(
							{ name: 'Rapports', value: 'reports' },
							{ name: 'Statistiques', value: 'stats' },
							{ name: 'Logs', value: 'logs' },
							{ name: 'Automatiques', value: 'auto' },
							{ name: 'Manuelles', value: 'manual' },
						),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('restaurer')
				.setDescription('Restaurer une archive')
				.addStringOption(option =>
					option
						.setName('archive')
						.setDescription('ID ou nom de l\'archive à restaurer')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('supprimer')
				.setDescription('Supprimer une archive')
				.addStringOption(option =>
					option
						.setName('archive')
						.setDescription('ID ou nom de l\'archive à supprimer')
						.setRequired(true),
				)
				.addBooleanOption(option =>
					option
						.setName('confirmer')
						.setDescription('Confirmer la suppression')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('nettoyer')
				.setDescription('Nettoyer les anciennes archives')
				.addIntegerOption(option =>
					option
						.setName('âge')
						.setDescription('Supprimer les archives plus anciennes que X jours')
						.setRequired(false)
						.setMinValue(30)
						.setMaxValue(3650),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('status')
				.setDescription('Voir le statut de l\'archivage'),
		),

	async execute(interaction) {
		try {
			// Le bot peut toujours exécuter ses propres commandes admin
			// Pas de vérification de permissions utilisateur nécessaire

			const subcommand = interaction.options.getSubcommand();
			const archiveManager = interaction.client.archiveManager;

			if (!archiveManager) {
				return await interaction.reply({
					content: '❌ Le gestionnaire d\'archives n\'est pas disponible.',
					ephemeral: true,
				});
			}

			switch (subcommand) {
			case 'créer':
				await this.handleCreate(interaction, archiveManager);
				break;
			case 'config':
				await this.handleConfig(interaction, archiveManager);
				break;
			case 'liste':
				await this.handleList(interaction, archiveManager);
				break;
			case 'restaurer':
				await this.handleRestore(interaction, archiveManager);
				break;
			case 'supprimer':
				await this.handleDelete(interaction, archiveManager);
				break;
			case 'nettoyer':
				await this.handleCleanup(interaction, archiveManager);
				break;
			case 'status':
				await this.handleStatus(interaction, archiveManager);
				break;
			}

		}
		catch (error) {
			console.error('❌ Erreur dans la commande archive:', error);

			const errorMessage = '❌ Une erreur est survenue lors de l\'exécution de la commande.';

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: errorMessage, ephemeral: true });
			}
			else {
				await interaction.reply({ content: errorMessage, ephemeral: true });
			}
		}
	},

	async handleCreate(interaction, archiveManager) {
		const type = interaction.options.getString('type');
		const période = interaction.options.getString('période') || 'month';

		try {
			await interaction.deferReply({ ephemeral: true });

			const result = await archiveManager.createManualArchive(type, période);

			if (result.success) {
				const { EmbedBuilder } = require('discord.js');

				const typeNames = {
					'reports': 'Rapports',
					'stats': 'Statistiques',
					'logs': 'Logs',
					'all': 'Toutes les données',
				};

				const périodeNames = {
					'week': 'Dernière semaine',
					'month': 'Dernier mois',
					'3months': 'Derniers 3 mois',
					'year': 'Dernière année',
				};

				const embed = new EmbedBuilder()
					.setTitle('📦 Archive créée')
					.setDescription('L\'archive manuelle a été créée avec succès.')
					.setColor('#00ff00')
					.addFields([
						{
							name: 'Informations de l\'archive',
							value: [
								`**Type:** ${typeNames[type]}`,
								`**Période:** ${périodeNames[période]}`,
								`**ID:** ${result.archiveId}`,
								`**Taille:** ${result.size || 'Inconnue'}`,
								`**Fichiers:** ${result.fileCount || 0}`,
							].join('\n'),
							inline: false,
						},
					])
					.setTimestamp();

				await interaction.editReply({
					embeds: [embed],
				});
			}
			else {
				await interaction.editReply({
					content: `❌ Erreur lors de la création de l'archive: ${result.error || 'Erreur inconnue'}`,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la création d\'archive:', error);

			if (interaction.deferred) {
				await interaction.editReply({
					content: '❌ Erreur lors de la création de l\'archive.',
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la création de l\'archive.',
					ephemeral: true,
				});
			}
		}
	},

	async handleConfig(interaction, archiveManager) {
		const activé = interaction.options.getBoolean('activé');
		const fréquence = interaction.options.getInteger('fréquence');
		const rétention = interaction.options.getInteger('rétention');

		try {
			let updated = false;
			const changes = [];

			if (activé !== null) {
				await archiveManager.setAutoArchiveEnabled(activé);
				changes.push(`Archivage automatique: ${activé ? 'Activé' : 'Désactivé'}`);
				updated = true;
			}

			if (fréquence) {
				await archiveManager.setArchiveFrequency(fréquence);
				changes.push(`Fréquence: ${fréquence} jour(s)`);
				updated = true;
			}

			if (rétention) {
				await archiveManager.setRetentionPeriod(rétention);
				changes.push(`Rétention: ${rétention} jour(s)`);
				updated = true;
			}

			if (updated) {
				const { EmbedBuilder } = require('discord.js');

				const embed = new EmbedBuilder()
					.setTitle('⚙️ Configuration d\'archivage mise à jour')
					.setDescription('Les paramètres d\'archivage ont été modifiés avec succès.')
					.setColor('#00ff00')
					.addFields([
						{
							name: 'Modifications',
							value: changes.join('\n'),
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
				// Afficher la configuration actuelle
				await this.showCurrentConfig(interaction, archiveManager);
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la configuration:', error);
			await interaction.reply({
				content: '❌ Erreur lors de la configuration de l\'archivage.',
				ephemeral: true,
			});
		}
	},

	async handleList(interaction, archiveManager) {
		const type = interaction.options.getString('type');

		try {
			await interaction.deferReply({ ephemeral: true });

			const archives = await archiveManager.listArchives(type);

			if (archives && archives.length > 0) {
				const { EmbedBuilder } = require('discord.js');

				const embed = new EmbedBuilder()
					.setTitle('📋 Archives disponibles')
					.setDescription(`${archives.length} archive(s) trouvée(s)`)
					.setColor('#3498db');

				archives.slice(0, 10).forEach((archive, index) => {
					const date = new Date(archive.created).toLocaleString('fr-FR');
					const size = archive.size ? this.formatSize(archive.size) : 'Inconnue';

					embed.addFields([
						{
							name: `${index + 1}. ${archive.name || archive.id}`,
							value: [
								`**Type:** ${archive.type}`,
								`**Date:** ${date}`,
								`**Taille:** ${size}`,
								`**ID:** ${archive.id}`,
							].join('\n'),
							inline: true,
						},
					]);
				});

				if (archives.length > 10) {
					embed.setFooter({ text: `... et ${archives.length - 10} autres archives` });
				}

				embed.setTimestamp();

				await interaction.editReply({
					embeds: [embed],
				});
			}
			else {
				await interaction.editReply({
					content: '📭 Aucune archive trouvée.',
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la liste des archives:', error);

			if (interaction.deferred) {
				await interaction.editReply({
					content: '❌ Erreur lors de la récupération de la liste des archives.',
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la récupération de la liste des archives.',
					ephemeral: true,
				});
			}
		}
	},

	async handleRestore(interaction, archiveManager) {
		const archiveId = interaction.options.getString('archive');

		try {
			await interaction.deferReply({ ephemeral: true });

			const result = await archiveManager.restoreArchive(archiveId);

			if (result.success) {
				const { EmbedBuilder } = require('discord.js');

				const embed = new EmbedBuilder()
					.setTitle('📤 Archive restaurée')
					.setDescription('L\'archive a été restaurée avec succès.')
					.setColor('#00ff00')
					.addFields([
						{
							name: 'Détails de la restauration',
							value: [
								`**Archive:** ${archiveId}`,
								`**Fichiers restaurés:** ${result.fileCount || 0}`,
								`**Destination:** ${result.destination || 'Dossier par défaut'}`,
							].join('\n'),
							inline: false,
						},
					])
					.setTimestamp();

				await interaction.editReply({
					embeds: [embed],
				});
			}
			else {
				await interaction.editReply({
					content: `❌ Erreur lors de la restauration: ${result.error || 'Archive introuvable'}`,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la restauration:', error);

			if (interaction.deferred) {
				await interaction.editReply({
					content: '❌ Erreur lors de la restauration de l\'archive.',
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la restauration de l\'archive.',
					ephemeral: true,
				});
			}
		}
	},

	async handleDelete(interaction, archiveManager) {
		const archiveId = interaction.options.getString('archive');
		const confirmer = interaction.options.getBoolean('confirmer');

		if (!confirmer) {
			return await interaction.reply({
				content: '❌ Vous devez confirmer la suppression en définissant le paramètre "confirmer" sur true.',
				ephemeral: true,
			});
		}

		try {
			await interaction.deferReply({ ephemeral: true });

			const result = await archiveManager.deleteArchive(archiveId);

			if (result.success) {
				const { EmbedBuilder } = require('discord.js');

				const embed = new EmbedBuilder()
					.setTitle('🗑️ Archive supprimée')
					.setDescription('L\'archive a été supprimée avec succès.')
					.setColor('#ff6b6b')
					.addFields([
						{
							name: 'Archive supprimée',
							value: `**ID:** ${archiveId}`,
							inline: false,
						},
					])
					.setTimestamp();

				await interaction.editReply({
					embeds: [embed],
				});
			}
			else {
				await interaction.editReply({
					content: `❌ Erreur lors de la suppression: ${result.error || 'Archive introuvable'}`,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la suppression:', error);

			if (interaction.deferred) {
				await interaction.editReply({
					content: '❌ Erreur lors de la suppression de l\'archive.',
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la suppression de l\'archive.',
					ephemeral: true,
				});
			}
		}
	},

	async handleCleanup(interaction, archiveManager) {
		const âge = interaction.options.getInteger('âge') || 90;

		try {
			await interaction.deferReply({ ephemeral: true });

			const result = await archiveManager.cleanupOldArchives(âge);

			if (result.success) {
				const { EmbedBuilder } = require('discord.js');

				const embed = new EmbedBuilder()
					.setTitle('🧹 Nettoyage terminé')
					.setDescription('Le nettoyage des anciennes archives a été effectué.')
					.setColor('#00ff00')
					.addFields([
						{
							name: 'Résultats du nettoyage',
							value: [
								`**Archives supprimées:** ${result.deletedCount || 0}`,
								`**Espace libéré:** ${result.freedSpace ? this.formatSize(result.freedSpace) : 'Inconnu'}`,
								`**Critère d'âge:** Plus de ${âge} jours`,
							].join('\n'),
							inline: false,
						},
					])
					.setTimestamp();

				await interaction.editReply({
					embeds: [embed],
				});
			}
			else {
				await interaction.editReply({
					content: `❌ Erreur lors du nettoyage: ${result.error || 'Erreur inconnue'}`,
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors du nettoyage:', error);

			if (interaction.deferred) {
				await interaction.editReply({
					content: '❌ Erreur lors du nettoyage des archives.',
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors du nettoyage des archives.',
					ephemeral: true,
				});
			}
		}
	},

	async handleStatus(interaction, archiveManager) {
		try {
			await interaction.deferReply({ ephemeral: true });

			const status = await archiveManager.getStatus();

			if (status) {
				const { EmbedBuilder } = require('discord.js');

				const embed = new EmbedBuilder()
					.setTitle('📊 Statut de l\'archivage')
					.setDescription('État actuel du système d\'archivage')
					.setColor(status.autoEnabled ? '#00ff00' : '#ff6b6b')
					.addFields([
						{
							name: 'Configuration',
							value: [
								`**Archivage automatique:** ${status.autoEnabled ? '✅ Activé' : '❌ Désactivé'}`,
								`**Fréquence:** ${status.frequency || 'Non définie'} jour(s)`,
								`**Rétention:** ${status.retention || 'Non définie'} jour(s)`,
								`**Dernière archive auto:** ${status.lastAutoArchive ? new Date(status.lastAutoArchive).toLocaleString('fr-FR') : 'Jamais'}`,
							].join('\n'),
							inline: false,
						},
						{
							name: 'Statistiques',
							value: [
								`**Total archives:** ${status.totalArchives || 0}`,
								`**Archives automatiques:** ${status.autoArchives || 0}`,
								`**Archives manuelles:** ${status.manualArchives || 0}`,
								`**Espace utilisé:** ${status.totalSize ? this.formatSize(status.totalSize) : 'Inconnu'}`,
							].join('\n'),
							inline: false,
						},
						{
							name: 'Prochaines actions',
							value: [
								`**Prochaine archive:** ${status.nextArchive ? new Date(status.nextArchive).toLocaleString('fr-FR') : 'Non planifiée'}`,
								`**Prochaine purge:** ${status.nextCleanup ? new Date(status.nextCleanup).toLocaleString('fr-FR') : 'Non planifiée'}`,
							].join('\n'),
							inline: false,
						},
					])
					.setTimestamp();

				await interaction.editReply({
					embeds: [embed],
				});
			}
			else {
				await interaction.editReply({
					content: '❌ Impossible de récupérer le statut de l\'archivage.',
				});
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la récupération du statut:', error);

			if (interaction.deferred) {
				await interaction.editReply({
					content: '❌ Erreur lors de la récupération du statut de l\'archivage.',
				});
			}
			else {
				await interaction.reply({
					content: '❌ Erreur lors de la récupération du statut de l\'archivage.',
					ephemeral: true,
				});
			}
		}
	},

	async showCurrentConfig(interaction, archiveManager) {
		try {
			const config = await archiveManager.getConfig();
			const { EmbedBuilder } = require('discord.js');

			const embed = new EmbedBuilder()
				.setTitle('⚙️ Configuration actuelle de l\'archivage')
				.setDescription('Paramètres actuels du système d\'archivage')
				.setColor('#3498db')
				.addFields([
					{
						name: 'Archivage automatique',
						value: config.autoEnabled ? '✅ Activé' : '❌ Désactivé',
						inline: true,
					},
					{
						name: 'Fréquence',
						value: `${config.frequency || 'Non définie'} jour(s)`,
						inline: true,
					},
					{
						name: 'Rétention',
						value: `${config.retention || 'Non définie'} jour(s)`,
						inline: true,
					},
				])
				.setTimestamp();

			await interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'affichage de la configuration:', error);
			await interaction.reply({
				content: '❌ Erreur lors de l\'affichage de la configuration.',
				ephemeral: true,
			});
		}
	},

	formatSize(bytes) {
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		if (bytes === 0) return '0 Bytes';
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
	},
};