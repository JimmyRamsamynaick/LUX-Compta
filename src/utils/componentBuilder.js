const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle } = require('discord.js');
const InteractionHandler = require('./interactionHandler');

/**
 * Constructeur de composants Discord avec ActionRowBuilder et validation
 */
class ComponentBuilder {
	constructor() {
		this.usedCustomIds = new Set();
	}

	/**
	 * Créer un menu de sélection avec ActionRowBuilder
	 * @param {string} customId - ID personnalisé du menu
	 * @param {string} placeholder - Texte d'espace réservé
	 * @param {Array} options - Options du menu
	 * @param {number} minValues - Nombre minimum de valeurs
	 * @param {number} maxValues - Nombre maximum de valeurs
	 * @returns {ActionRowBuilder}
	 */
	static createSelectMenu(customId, placeholder, options, minValues = 1, maxValues = 1) {
		// Valider et créer un customId unique
		const validCustomId = InteractionHandler.validateCustomId(customId, this.usedCustomIds || new Set());
		
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(validCustomId)
			.setPlaceholder(placeholder)
			.setMinValues(minValues)
			.setMaxValues(maxValues)
			.addOptions(options);

		return new ActionRowBuilder().addComponents(selectMenu);
	}

	/**
	 * Créer des boutons d'action avec ActionRowBuilder
	 * @param {Array} buttons - Configuration des boutons
	 * @returns {ActionRowBuilder}
	 */
	static createActionButtons(buttons) {
		const buttonComponents = buttons.map(button => {
			// Valider et créer un customId unique
			const validCustomId = InteractionHandler.validateCustomId(button.customId, this.usedCustomIds || new Set());
			
			const buttonBuilder = new ButtonBuilder()
				.setCustomId(validCustomId)
				.setLabel(button.label)
				.setStyle(this.getButtonStyle(button.style));

			if (button.emoji) {
				buttonBuilder.setEmoji(button.emoji);
			}

			if (button.disabled) {
				buttonBuilder.setDisabled(true);
			}

			return buttonBuilder;
		});

		return new ActionRowBuilder().addComponents(buttonComponents);
	}

	/**
	 * Créer plusieurs rangées de boutons
	 * @param {Array} buttonGroups - Groupes de boutons (max 5 boutons par groupe)
	 * @returns {Array<ActionRowBuilder>}
	 */
	static createButtonRows(buttonGroups) {
		return buttonGroups.map(group => this.createActionButtons(group));
	}

	/**
	 * Créer un bouton de lien
	 * @param {string} label - Texte du bouton
	 * @param {string} url - URL du lien
	 * @param {string} emoji - Emoji optionnel
	 * @returns {ActionRowBuilder}
	 */
	static createLinkButton(label, url, emoji = null) {
		const button = new ButtonBuilder()
			.setLabel(label)
			.setURL(url)
			.setStyle(ButtonStyle.Link);

		if (emoji) {
			button.setEmoji(emoji);
		}

		return new ActionRowBuilder().addComponents(button);
	}

	/**
	 * Créer un ensemble de composants mixtes (boutons + menus)
	 * @param {Object} config - Configuration des composants
	 * @returns {Array<ActionRowBuilder>}
	 */
	static createMixedComponents(config) {
		const components = [];

		// Ajouter les menus de sélection
		if (config.selectMenus) {
			config.selectMenus.forEach(menu => {
				components.push(this.createSelectMenu(
					menu.customId,
					menu.placeholder,
					menu.options,
					menu.minValues,
					menu.maxValues
				));
			});
		}

		// Ajouter les boutons
		if (config.buttons) {
			const buttonRows = this.createButtonRows(config.buttons);
			components.push(...buttonRows);
		}

		// Ajouter les boutons de lien
		if (config.linkButtons) {
			config.linkButtons.forEach(link => {
				components.push(this.createLinkButton(link.label, link.url, link.emoji));
			});
		}

		return components;
	}

	/**
	 * Créer des boutons de pagination
	 * @param {string} baseCustomId - ID de base pour les boutons
	 * @param {number} currentPage - Page actuelle
	 * @param {number} totalPages - Nombre total de pages
	 * @param {Object} options - Options supplémentaires
	 * @returns {ActionRowBuilder}
	 */
	static createPaginationButtons(baseCustomId, currentPage, totalPages, options = {}) {
		const buttons = [];

		// Bouton première page
		if (currentPage > 1) {
			buttons.push({
				customId: `${baseCustomId}_first`,
				label: options.firstLabel || '⏮️',
				style: 'Secondary',
				disabled: currentPage === 1
			});
		}

		// Bouton page précédente
		buttons.push({
			customId: `${baseCustomId}_prev`,
			label: options.prevLabel || '◀️',
			style: 'Secondary',
			disabled: currentPage === 1
		});

		// Indicateur de page
		if (options.showPageInfo !== false) {
			buttons.push({
				customId: `${baseCustomId}_info`,
				label: `${currentPage}/${totalPages}`,
				style: 'Secondary',
				disabled: true
			});
		}

		// Bouton page suivante
		buttons.push({
			customId: `${baseCustomId}_next`,
			label: options.nextLabel || '▶️',
			style: 'Secondary',
			disabled: currentPage === totalPages
		});

		// Bouton dernière page
		if (currentPage < totalPages) {
			buttons.push({
				customId: `${baseCustomId}_last`,
				label: options.lastLabel || '⏭️',
				style: 'Secondary',
				disabled: currentPage === totalPages
			});
		}

		return this.createActionButtons(buttons);
	}

	/**
	 * Créer des boutons de confirmation
	 * @param {string} baseCustomId - ID de base
	 * @param {Object} options - Options de personnalisation
	 * @returns {ActionRowBuilder}
	 */
	static createConfirmationButtons(baseCustomId, options = {}) {
		const buttons = [
			{
				customId: `${baseCustomId}_confirm`,
				label: options.confirmLabel || '✅ Confirmer',
				style: options.confirmStyle || 'Success'
			},
			{
				customId: `${baseCustomId}_cancel`,
				label: options.cancelLabel || '❌ Annuler',
				style: options.cancelStyle || 'Danger'
			}
		];

		return this.createActionButtons(buttons);
	}

	/**
	 * Obtenir le style de bouton Discord
	 * @param {string} style - Style en chaîne
	 * @returns {ButtonStyle}
	 */
	static getButtonStyle(style) {
		const styles = {
			'Primary': ButtonStyle.Primary,
			'Secondary': ButtonStyle.Secondary,
			'Success': ButtonStyle.Success,
			'Danger': ButtonStyle.Danger,
			'Link': ButtonStyle.Link
		};
		return styles[style] || ButtonStyle.Secondary;
	}

	/**
	 * Valider les composants avant envoi
	 * @param {Array} components - Composants à valider
	 * @returns {boolean}
	 */
	static validateComponents(components) {
		if (!Array.isArray(components)) return false;
		if (components.length > 5) return false; // Max 5 ActionRows

		for (const component of components) {
			if (!(component instanceof ActionRowBuilder)) return false;
			if (component.components.length > 5) return false; // Max 5 composants par row
		}

		return true;
	}

	/**
	 * Créer des composants avec validation automatique
	 * @param {Object} config - Configuration des composants
	 * @returns {Array<ActionRowBuilder>}
	 */
	static createValidatedComponents(config) {
		const components = this.createMixedComponents(config);
		
		if (!this.validateComponents(components)) {
			console.warn('Composants invalides détectés, utilisation de composants par défaut');
			return [];
		}

		return components;
	}

	/**
	 * Créer des composants complets à partir d'une configuration
	 * @param {Object} config - Configuration complète
	 * @returns {Array<ActionRowBuilder>}
	 */
	static createCompleteComponents(config) {
		const components = [];

		// Ajouter les menus de sélection
		if (config.selectMenus) {
			config.selectMenus.forEach(menu => {
				components.push(this.createSelectMenu(
					menu.customId,
					menu.placeholder,
					menu.options,
					menu.minValues || 1,
					menu.maxValues || 1
				));
			});
		}

		// Ajouter les groupes de boutons
		if (config.buttonGroups) {
			config.buttonGroups.forEach(group => {
				components.push(this.createActionButtons(group));
			});
		}

		// Ajouter les boutons de pagination si spécifiés
		if (config.pagination) {
			components.push(this.createPaginationButtons(
				config.pagination.baseCustomId,
				config.pagination.currentPage,
				config.pagination.totalPages,
				config.pagination.options
			));
		}

		// Ajouter les boutons de confirmation si spécifiés
		if (config.confirmation) {
			components.push(this.createConfirmationButtons(
				config.confirmation.baseCustomId,
				config.confirmation.options
			));
		}

		return this.validateComponents(components) ? components : [];
	}

	/**
	 * Réinitialiser le cache des customIds
	 */
	static resetCustomIdCache() {
		this.usedCustomIds = new Set();
	}
}

module.exports = ComponentBuilder;