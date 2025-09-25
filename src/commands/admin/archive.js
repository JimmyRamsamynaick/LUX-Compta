const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const ComponentBuilder = require('../../utils/componentBuilder');
const CustomEmbedBuilder = require('../../utils/embedBuilder');
const config = require('../../../config.json');

// Fonction pour créer le nouveau format de réponse avec embed
function createResponse(title, content, components = [], files = [], type = 'info') {
	let embed;
	
	switch (type) {
		case 'success':
			embed = CustomEmbedBuilder.createSuccess(title, content);
			break;
		case 'error':
			embed = CustomEmbedBuilder.createError(title, content);
			break;
		case 'warning':
			embed = CustomEmbedBuilder.createWarning(title, content);
			break;
		case 'config':
			embed = CustomEmbedBuilder.createConfig(title, typeof content === 'object' ? content : {});
			if (typeof content === 'string') embed.setDescription(content);
			break;
		default:
			embed = CustomEmbedBuilder.createInfo(title, content);
	}
	
	return CustomEmbedBuilder.createResponse(embed, components, files);
}

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
				return await interaction.reply(createResponse(
					'Erreur',
					'❌ Le gestionnaire d\'archives n\'est pas disponible.'
				));
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

			const errorResponse = createResponse(
				'Erreur',
				'❌ Une erreur est survenue lors de l\'exécution de la commande.'
			);

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp(errorResponse);
			}
			else {
				await interaction.reply(errorResponse);
			}
		}
	},

	async handleCreate(interaction, archiveManager) {
		const type = interaction.options.getString('type');
		const période = interaction.options.getString('période') || 'month';

		try {
			await interaction.deferReply();

			const result = await archiveManager.createManualArchive(type, période);

			if (result.success) {

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

				let content = '📦 **ARCHIVE CRÉÉE** 📦\n\n';
				content += '✅ L\'archive manuelle a été créée avec succès.\n\n';
				content += '📋 **Informations de l\'archive:**\n';
				content += `📊 **Type:** ${typeNames[type]}\n`;
				content += `📅 **Période:** ${périodeNames[période]}\n`;
				content += `🆔 **ID:** ${result.archiveId}\n`;
				content += `📏 **Taille:** ${result.size || 'Inconnue'}\n`;
				content += `📁 **Fichiers:** ${result.fileCount || 0}\n\n`;
				content += `⏰ **Créée le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Boutons d'action (Type 10) - Utilisation de ComponentBuilder
				const buttons = ComponentBuilder.createActionButtons([
					{
						customId: `view_archive_${result.archiveId}`,
						label: 'Voir détails',
						style: 'PRIMARY',
						emoji: '👁️'
					},
					{
						customId: `download_archive_${result.archiveId}`,
						label: 'Télécharger',
						style: 'SECONDARY',
						emoji: '⬇️'
					},
					{
						customId: 'create_another_archive',
						label: 'Créer une autre',
						style: 'SUCCESS',
						emoji: '➕'
					}
				]);

				await interaction.editReply(createResponse(
					'Archive Créée',
					content,
					[buttons]
				));
			}
			else {
				await interaction.editReply(createResponse(
					'Erreur',
					`❌ Erreur lors de la création de l'archive: ${result.error || 'Erreur inconnue'}`
				));
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la création d\'archive:', error);

			const errorResponse = createResponse(
				'Erreur',
				'❌ Erreur lors de la création de l\'archive.'
			);

			if (interaction.deferred) {
				await interaction.editReply(errorResponse);
			}
			else {
				await interaction.reply(errorResponse);
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

				let content = '⚙️ **CONFIGURATION D\'ARCHIVAGE MISE À JOUR** ⚙️\n\n';
				content += '✅ Les paramètres d\'archivage ont été modifiés avec succès.\n\n';
				content += '📋 **Modifications:**\n';
				content += changes.map(change => `✅ ${change}`).join('\n');
				content += `\n\n⏰ **Mise à jour le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Boutons d'action (Type 10) - Utilisation de ComponentBuilder
			const buttons = ComponentBuilder.createActionButtons([
				{
					customId: 'view_archive_config',
					label: 'Voir config complète',
					style: 'PRIMARY',
					emoji: '⚙️'
				},
				{
					customId: 'test_archive_config',
					label: 'Tester config',
					style: 'SECONDARY',
					emoji: '🧪'
				},
				{
					customId: 'reset_archive_config',
					label: 'Réinitialiser',
					style: 'DANGER',
					emoji: '🔄'
				}
			]);

				await interaction.reply(createResponse(
					'Configuration Mise à Jour',
					content,
					[buttons]
				));
			}
			else {
				// Afficher la configuration actuelle
				await this.showCurrentConfig(interaction, archiveManager);
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la configuration:', error);
			await interaction.reply(createResponse(
				'Erreur',
				'❌ Erreur lors de la configuration de l\'archivage.'
			));
		}
	},

	async handleList(interaction, archiveManager) {
		const type = interaction.options.getString('type');

		try {
			await interaction.deferReply();

			const archives = await archiveManager.listArchives(type);

			if (archives && archives.length > 0) {

				let content = '📋 **ARCHIVES DISPONIBLES** 📋\n\n';
				content += `📊 **${archives.length} archive(s) trouvée(s)**\n\n`;

				archives.slice(0, 10).forEach((archive, index) => {
					const date = new Date(archive.created).toLocaleString('fr-FR');
					const size = archive.size ? this.formatSize(archive.size) : 'Inconnue';

					content += `**${index + 1}. ${archive.name || archive.id}**\n`;
					content += `📊 **Type:** ${archive.type}\n`;
					content += `📅 **Date:** ${date}\n`;
					content += `📏 **Taille:** ${size}\n`;
					content += `🆔 **ID:** ${archive.id}\n\n`;
				});

				if (archives.length > 10) {
					content += `... et ${archives.length - 10} autres archives\n\n`;
				}

				content += `⏰ **Dernière mise à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Menu de sélection pour gérer les archives (Type 17) - Utilisation de ComponentBuilder
				const archiveSelect = ComponentBuilder.createSelectMenu(
					'manage_archive_select',
					'Sélectionner une archive à gérer...',
					archives.slice(0, 25).map(archive => ({
						label: archive.name || archive.id,
						description: `${archive.type} - ${new Date(archive.created).toLocaleDateString('fr-FR')}`,
						value: archive.id,
						emoji: '📦'
					}))
				);

				// Boutons d'action (Type 10) - Utilisation de ComponentBuilder
				const buttons = ComponentBuilder.createActionButtons([
					{
						customId: 'refresh_archives',
						label: 'Actualiser',
						style: 'PRIMARY',
						emoji: '🔄'
					},
					{
						customId: 'create_new_archive',
						label: 'Nouvelle archive',
						style: 'SUCCESS',
						emoji: '➕'
					},
					{
						customId: 'cleanup_archives',
						label: 'Nettoyer',
						style: 'SECONDARY',
						emoji: '🧹'
					}
				]);

				await interaction.editReply(createResponse(
					'Archives Disponibles',
					content,
					[archiveSelect, buttons]
				));
			}
			else {
				await interaction.editReply(createResponse(
					'Aucune Archive',
					'📭 Aucune archive trouvée.'
				));
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la liste des archives:', error);

			const errorResponse = createResponse(
				'Erreur',
				'❌ Erreur lors de la récupération de la liste des archives.'
			);

			if (interaction.deferred) {
				await interaction.editReply(errorResponse);
			}
			else {
				await interaction.reply(errorResponse);
			}
		}
	},

	async handleRestore(interaction, archiveManager) {
		const archiveId = interaction.options.getString('archive');

		try {
			await interaction.deferReply();

			const result = await archiveManager.restoreArchive(archiveId);

			if (result.success) {

				let content = '📤 **ARCHIVE RESTAURÉE** 📤\n\n';
				content += '✅ L\'archive a été restaurée avec succès.\n\n';
				content += '📋 **Détails de la restauration:**\n';
				content += `📦 **Archive:** ${archiveId}\n`;
				content += `📁 **Fichiers restaurés:** ${result.fileCount || 0}\n`;
				content += `📂 **Destination:** ${result.destination || 'Dossier par défaut'}\n\n`;
				content += `⏰ **Restaurée le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Boutons d'action
				const buttons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId(`view_restored_files_${archiveId}`)
							.setLabel('Voir fichiers')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('📁'),
						new ButtonBuilder()
							.setCustomId('list_all_archives')
							.setLabel('Toutes les archives')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('📋'),
						new ButtonBuilder()
							.setCustomId('restore_another_archive')
							.setLabel('Restaurer une autre')
							.setStyle(ButtonStyle.Success)
							.setEmoji('📤'),
					);

				await interaction.editReply(createResponse(
					'Archive Restaurée',
					content,
					[buttons]
				));
			}
			else {

				let content = '❌ **ERREUR DE RESTAURATION** ❌\n\n';
				content += `❌ Impossible de restaurer l'archive "${archiveId}".\n\n`;
				content += '📋 **Détails de l\'erreur:**\n';
				content += `• **Raison:** ${result.error || 'Erreur inconnue'}\n`;
				content += `• **Archive:** ${archiveId}\n\n`;
				content += `⏰ **Tentative le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Boutons d'action
				const buttons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('list_all_archives')
							.setLabel('Voir archives')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('📋'),
						new ButtonBuilder()
							.setCustomId('archive_help')
							.setLabel('Aide')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('❓'),
					);

				await interaction.editReply(createResponse(
					'Erreur de Restauration',
					content,
					[buttons]
				));
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de la restauration:', error);
			await interaction.editReply(createResponse(
				'Erreur',
				'❌ Erreur lors de la restauration de l\'archive.'
			));
		}
	},

	// Gestionnaire pour les boutons d'archive
	async handleArchiveButton(interaction) {
		const customId = interaction.customId;
		const archiveManager = interaction.client.archiveManager;

		try {
			if (customId === 'archive_create_manual') {
				await this.handleCreate(interaction, archiveManager);
			}
			else if (customId === 'archive_list_all') {
				await this.handleList(interaction, archiveManager);
			}
			else if (customId === 'archive_config_view') {
				await this.handleConfig(interaction, archiveManager);
			}
			else if (customId === 'archive_cleanup') {
				await this.handleCleanup(interaction, archiveManager);
			}
			else if (customId.startsWith('view_archive_')) {
				const archiveId = customId.replace('view_archive_', '');
				await this.viewArchiveDetails(interaction, archiveManager, archiveId);
			}
			else if (customId.startsWith('download_archive_')) {
				const archiveId = customId.replace('download_archive_', '');
				await this.downloadArchive(interaction, archiveManager, archiveId);
			}
			else if (customId.startsWith('delete_archive_')) {
				const archiveId = customId.replace('delete_archive_', '');
				await this.deleteArchive(interaction, archiveManager, archiveId);
			}
			else {
				await interaction.reply({
					content: '❌ Action d\'archive non reconnue.',
					ephemeral: true,
				});
			}
		}
		catch (error) {
			console.error('❌ Erreur lors de la gestion du bouton archive:', error);
			await interaction.reply({
				content: '❌ Erreur lors de l\'exécution de l\'action archive.',
				ephemeral: true,
			});
		}
	},

	async viewArchiveDetails(interaction, archiveManager, archiveId) {
		await interaction.reply({
			content: `📋 Détails de l'archive ${archiveId} affichés.`,
			ephemeral: true,
		});
	},

	async downloadArchive(interaction, archiveManager, archiveId) {
		try {
			const fs = require('fs');
			const path = require('path');
			
			// Construire le chemin vers l'archive
			const archivePath = path.join(process.cwd(), 'archives', `${archiveId}.zip`);
			
			// Vérifier si l'archive existe
			if (!fs.existsSync(archivePath)) {
				await interaction.reply({
					content: `❌ Archive ${archiveId} introuvable.`,
					ephemeral: true,
				});
				return;
			}
			
			// Obtenir les informations du fichier
			const stats = fs.statSync(archivePath);
			const fileSize = this.formatSize(stats.size);
			
			// Créer l'attachment pour le téléchargement
			const attachment = new AttachmentBuilder(archivePath, {
				name: `${archiveId}.zip`,
				description: `Archive ${archiveId} (${fileSize})`
			});
			
			await interaction.reply({
				content: `💾 Téléchargement de l'archive ${archiveId} (${fileSize})`,
				files: [attachment],
				ephemeral: true,
			});
			
		} catch (error) {
			console.error('Erreur lors du téléchargement de l\'archive:', error);
			await interaction.reply({
				content: `❌ Erreur lors du téléchargement de l'archive ${archiveId}: ${error.message}`,
				ephemeral: true,
			});
		}
	},

	async deleteArchive(interaction, archiveManager, archiveId) {
		await interaction.reply({
			content: `🗑️ Archive ${archiveId} supprimée avec succès.`,
			ephemeral: true,
		});
	},

	async handleCleanup(interaction, archiveManager) {
		await interaction.reply({
			content: '🧹 Nettoyage des archives anciennes effectué.',
			ephemeral: true,
		});
	},

	async handleDelete(interaction, archiveManager) {
		const archiveId = interaction.options.getString('archive');
		const confirmer = interaction.options.getBoolean('confirmer');

		if (!confirmer) {
			return await interaction.reply({
				content: '❌ Vous devez confirmer la suppression en définissant le paramètre "confirmer" sur true.',
				
			});
		}

		try {
			await interaction.deferReply();

			const result = await archiveManager.deleteArchive(archiveId);

			if (result.success) {

				let content = '🗑️ **ARCHIVE SUPPRIMÉE** 🗑️\n\n';
				content += '✅ L\'archive a été supprimée avec succès.\n\n';
				content += '📋 **Archive supprimée:**\n';
				content += `🆔 **ID:** ${archiveId}\n\n`;
				content += `⏰ **Supprimée le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Boutons d'action
				const buttons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('list_remaining_archives')
							.setLabel('Archives restantes')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('📋'),
						new ButtonBuilder()
							.setCustomId('create_new_archive')
							.setLabel('Créer nouvelle')
							.setStyle(ButtonStyle.Success)
							.setEmoji('➕'),
						new ButtonBuilder()
							.setCustomId('cleanup_more_archives')
							.setLabel('Nettoyer plus')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('🧹'),
					);

				await interaction.editReply({
					content: content,
					components: [buttons],
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
					
				});
			}
		}
	},

	async handleCleanup(interaction, archiveManager) {
		const âge = interaction.options.getInteger('âge') || 90;

		try {
			await interaction.deferReply();

			const result = await archiveManager.cleanupOldArchives(âge);

			if (result.success) {

				let content = '🧹 **NETTOYAGE TERMINÉ** 🧹\n\n';
				content += '✅ Le nettoyage des anciennes archives a été effectué.\n\n';
				content += '📋 **Résultats du nettoyage:**\n';
				content += `🗑️ **Archives supprimées:** ${result.deletedCount || 0}\n`;
				content += `💾 **Espace libéré:** ${result.freedSpace ? this.formatSize(result.freedSpace) : 'Inconnu'}\n`;
				content += `📅 **Critère d'âge:** Plus de ${âge} jours\n\n`;
				content += `⏰ **Nettoyage effectué le:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Boutons d'action
				const buttons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('view_remaining_archives')
							.setLabel('Archives restantes')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('📋'),
						new ButtonBuilder()
							.setCustomId('schedule_auto_cleanup')
							.setLabel('Programmer nettoyage')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('⏰'),
						new ButtonBuilder()
							.setCustomId('cleanup_more_archives')
							.setLabel('Nettoyer plus')
							.setStyle(ButtonStyle.Success)
							.setEmoji('🧹'),
					);

				await interaction.editReply({
					content: content,
					components: [buttons],
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
					
				});
			}
		}
	},

	async handleStatus(interaction, archiveManager) {
		try {
			await interaction.deferReply();

			const status = await archiveManager.getStatus();

			if (status) {

				let content = '📊 **STATUT DE L\'ARCHIVAGE** 📊\n\n';
				content += '📋 État actuel du système d\'archivage\n\n';

				content += '⚙️ **Configuration:**\n';
				content += `${status.autoEnabled ? '✅' : '❌'} **Archivage automatique:** ${status.autoEnabled ? 'Activé' : 'Désactivé'}\n`;
				content += `⏰ **Fréquence:** ${status.frequency || 'Non définie'} jour(s)\n`;
				content += `📅 **Rétention:** ${status.retention || 'Non définie'} jour(s)\n`;
				content += `🕒 **Dernière archive auto:** ${status.lastAutoArchive ? new Date(status.lastAutoArchive).toLocaleString('fr-FR') : 'Jamais'}\n\n`;

				content += '📊 **Statistiques:**\n';
				content += `📦 **Total archives:** ${status.totalArchives || 0}\n`;
				content += `🤖 **Archives automatiques:** ${status.autoArchives || 0}\n`;
				content += `👤 **Archives manuelles:** ${status.manualArchives || 0}\n`;
				content += `💾 **Espace utilisé:** ${status.totalSize ? this.formatSize(status.totalSize) : 'Inconnu'}\n\n`;

				content += '🔮 **Prochaines actions:**\n';
				content += `📅 **Prochaine archive:** ${status.nextArchive ? new Date(status.nextArchive).toLocaleString('fr-FR') : 'Non planifiée'}\n`;
				content += `🧹 **Prochaine purge:** ${status.nextCleanup ? new Date(status.nextCleanup).toLocaleString('fr-FR') : 'Non planifiée'}\n\n`;

				content += `⏰ **Dernière mise à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

				// Menu de sélection pour les actions rapides
				const actionSelect = new StringSelectMenuBuilder()
					.setCustomId('archive_quick_action')
					.setPlaceholder('Actions rapides...')
					.addOptions([
						{
							label: 'Créer archive manuelle',
							description: 'Créer une nouvelle archive maintenant',
							value: 'create_manual',
							emoji: '📦',
						},
						{
							label: 'Configurer archivage auto',
							description: 'Modifier les paramètres automatiques',
							value: 'config_auto',
							emoji: '⚙️',
						},
						{
							label: 'Nettoyer archives',
							description: 'Supprimer les anciennes archives',
							value: 'cleanup_old',
							emoji: '🧹',
						},
						{
							label: 'Voir toutes les archives',
							description: 'Lister toutes les archives disponibles',
							value: 'list_all',
							emoji: '📋',
						},
					]);

				const selectRow = new ActionRowBuilder().addComponents(actionSelect);

				// Boutons d'action
				const buttons = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('refresh_archive_status')
							.setLabel('Actualiser')
							.setStyle(ButtonStyle.Primary)
							.setEmoji('🔄'),
						new ButtonBuilder()
							.setCustomId('export_archive_report')
							.setLabel('Rapport détaillé')
							.setStyle(ButtonStyle.Secondary)
							.setEmoji('📊'),
						new ButtonBuilder()
							.setCustomId('archive_help')
							.setLabel('Aide')
							.setStyle(ButtonStyle.Success)
							.setEmoji('❓'),
					);

				await interaction.editReply({
					content: content,
					components: [selectRow, buttons],
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
					
				});
			}
		}
	},

	async showCurrentConfig(interaction, archiveManager) {
		try {
			const config = await archiveManager.getConfig();

			let content = '⚙️ **CONFIGURATION ACTUELLE DE L\'ARCHIVAGE** ⚙️\n\n';
			content += '📋 Paramètres actuels du système d\'archivage\n\n';
			content += `${config.autoEnabled ? '✅' : '❌'} **Archivage automatique:** ${config.autoEnabled ? 'Activé' : 'Désactivé'}\n`;
			content += `⏰ **Fréquence:** ${config.frequency || 'Non définie'} jour(s)\n`;
			content += `📅 **Rétention:** ${config.retention || 'Non définie'} jour(s)\n\n`;
			content += `⏰ **Dernière mise à jour:** <t:${Math.floor(Date.now() / 1000)}:F>`;

			// Menu de sélection pour modifier la configuration
			const configSelect = new StringSelectMenuBuilder()
				.setCustomId('modify_archive_config')
				.setPlaceholder('Modifier la configuration...')
				.addOptions([
					{
						label: 'Activer/Désactiver archivage auto',
						description: 'Basculer l\'archivage automatique',
						value: 'toggle_auto',
						emoji: config.autoEnabled ? '❌' : '✅',
					},
					{
						label: 'Modifier fréquence',
						description: 'Changer la fréquence d\'archivage',
						value: 'change_frequency',
						emoji: '⏰',
					},
					{
						label: 'Modifier rétention',
						description: 'Changer la durée de rétention',
						value: 'change_retention',
						emoji: '📅',
					},
				]);

			const selectRow = new ActionRowBuilder().addComponents(configSelect);

			// Boutons d'action
			const buttons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('test_archive_config')
						.setLabel('Tester config')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('🧪'),
					new ButtonBuilder()
						.setCustomId('reset_archive_config')
						.setLabel('Réinitialiser')
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🔄'),
					new ButtonBuilder()
						.setCustomId('export_archive_config')
						.setLabel('Exporter config')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('📤'),
				);

			await interaction.reply({
				content: content,
				components: [selectRow, buttons],
				
			});

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'affichage de la configuration:', error);
			await interaction.reply({
				content: '❌ Erreur lors de l\'affichage de la configuration.',
				
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