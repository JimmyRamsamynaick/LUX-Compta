const { EmbedBuilder, ActionRowBuilder } = require('discord.js');

/**
 * Utilitaire pour créer des embeds standardisés avec une présentation cohérente
 */
class CustomEmbedBuilder {
	/**
	 * Créer un embed de base avec le style du bot
	 * @param {string} title - Titre de l'embed
	 * @param {string} description - Description de l'embed
	 * @param {string} color - Couleur de l'embed (hex ou nom)
	 * @returns {EmbedBuilder}
	 */
	static createBase(title, description, color = '#0099ff') {
		return new EmbedBuilder()
			.setTitle(title)
			.setDescription(description)
			.setColor(color)
			.setTimestamp()
			.setFooter({ 
				text: 'LUX Compta Bot', 
				iconURL: 'https://cdn.discordapp.com/attachments/1234567890/logo.png' 
			});
	}

	/**
	 * Créer un embed de succès
	 * @param {string} title - Titre
	 * @param {string} description - Description
	 * @returns {EmbedBuilder}
	 */
	static createSuccess(title, description) {
		return this.createBase(title, description, '#00ff00')
			.setThumbnail('https://cdn.discordapp.com/emojis/✅.png');
	}

	/**
	 * Créer un embed d'erreur
	 * @param {string} title - Titre
	 * @param {string} description - Description
	 * @returns {EmbedBuilder}
	 */
	static createError(title, description) {
		return this.createBase(title, description, '#ff0000')
			.setThumbnail('https://cdn.discordapp.com/emojis/❌.png');
	}

	/**
	 * Créer un embed d'information
	 * @param {string} title - Titre
	 * @param {string} description - Description
	 * @returns {EmbedBuilder}
	 */
	static createInfo(title, description) {
		return this.createBase(title, description, '#0099ff')
			.setThumbnail('https://cdn.discordapp.com/emojis/ℹ️.png');
	}

	/**
	 * Créer un embed d'avertissement
	 * @param {string} title - Titre
	 * @param {string} description - Description
	 * @returns {EmbedBuilder}
	 */
	static createWarning(title, description) {
		return this.createBase(title, description, '#ffaa00')
			.setThumbnail('https://cdn.discordapp.com/emojis/⚠️.png');
	}

	/**
	 * Créer un embed de configuration
	 * @param {string} title - Titre
	 * @param {Object} config - Configuration à afficher
	 * @returns {EmbedBuilder}
	 */
	static createConfig(title, config) {
		const embed = this.createBase(title, '', '#9932cc');
		
		// Ajouter les champs de configuration
		Object.entries(config).forEach(([key, value]) => {
			embed.addFields({
				name: this.formatConfigKey(key),
				value: this.formatConfigValue(value),
				inline: true
			});
		});

		return embed;
	}

	/**
	 * Créer un embed de statistiques
	 * @param {string} title - Titre
	 * @param {Object} stats - Statistiques à afficher
	 * @returns {EmbedBuilder}
	 */
	static createStats(title, stats) {
		const embed = this.createBase(title, '', '#ff6b6b');
		
		// Ajouter les champs de statistiques
		Object.entries(stats).forEach(([key, value]) => {
			embed.addFields({
				name: this.formatStatsKey(key),
				value: this.formatStatsValue(value),
				inline: true
			});
		});

		return embed;
	}

	/**
	 * Créer une réponse complète avec embed et composants
	 * @param {EmbedBuilder} embed - L'embed à envoyer
	 * @param {Array<ActionRowBuilder>} components - Les composants à ajouter
	 * @param {Array} files - Les fichiers à joindre
	 * @param {boolean} ephemeral - Si la réponse doit être éphémère
	 * @returns {Object}
	 */
	static createResponse(embed, components = [], files = [], ephemeral = false) {
		return {
			embeds: [embed],
			components: components,
			files: files,
			ephemeral: ephemeral
		};
	}

	/**
	 * Formater une clé de configuration pour l'affichage
	 * @param {string} key - Clé à formater
	 * @returns {string}
	 */
	static formatConfigKey(key) {
		return key.replace(/_/g, ' ')
			.replace(/\b\w/g, l => l.toUpperCase());
	}

	/**
	 * Formater une valeur de configuration pour l'affichage
	 * @param {any} value - Valeur à formater
	 * @returns {string}
	 */
	static formatConfigValue(value) {
		if (typeof value === 'boolean') {
			return value ? '✅ Activé' : '❌ Désactivé';
		}
		if (typeof value === 'number') {
			return value.toLocaleString('fr-FR');
		}
		if (Array.isArray(value)) {
			return value.length > 0 ? value.join(', ') : 'Aucun';
		}
		return String(value) || 'Non défini';
	}

	/**
	 * Formater une clé de statistique pour l'affichage
	 * @param {string} key - Clé à formater
	 * @returns {string}
	 */
	static formatStatsKey(key) {
		const keyMap = {
			'total_commands': '📊 Total Commandes',
			'active_users': '👥 Utilisateurs Actifs',
			'alerts_sent': '🚨 Alertes Envoyées',
			'reports_generated': '📄 Rapports Générés',
			'uptime': '⏱️ Temps de Fonctionnement',
			'memory_usage': '💾 Utilisation Mémoire'
		};
		return keyMap[key] || this.formatConfigKey(key);
	}

	/**
	 * Formater une valeur de statistique pour l'affichage
	 * @param {any} value - Valeur à formater
	 * @returns {string}
	 */
	static formatStatsValue(value) {
		if (typeof value === 'number') {
			return value.toLocaleString('fr-FR');
		}
		return this.formatConfigValue(value);
	}

	/**
	 * Créer un embed de liste paginée
	 * @param {string} title - Titre
	 * @param {Array} items - Éléments à lister
	 * @param {number} page - Page actuelle (0-indexée)
	 * @param {number} itemsPerPage - Éléments par page
	 * @returns {EmbedBuilder}
	 */
	static createPaginatedList(title, items, page = 0, itemsPerPage = 10) {
		const startIndex = page * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		const pageItems = items.slice(startIndex, endIndex);
		const totalPages = Math.ceil(items.length / itemsPerPage);

		const embed = this.createBase(
			`${title} (Page ${page + 1}/${totalPages})`,
			pageItems.length > 0 ? pageItems.join('\n') : 'Aucun élément à afficher'
		);

		if (items.length > itemsPerPage) {
			embed.setFooter({ 
				text: `LUX Compta Bot • ${items.length} éléments au total • Page ${page + 1}/${totalPages}` 
			});
		}

		return embed;
	}
}

module.exports = CustomEmbedBuilder;