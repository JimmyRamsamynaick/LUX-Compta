const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Utilitaire pour créer des components standardisés type 17 (SelectMenu) et type 10 (ActionRow avec boutons)
 */
class ComponentBuilder {
	/**
	 * Crée un SelectMenu (type 17) à partir d'une configuration
	 * @param {string} customId - ID personnalisé du menu
	 * @param {string} placeholder - Texte d'aide
	 * @param {Array} options - Options du menu [{label, value, description?, emoji?}]
	 * @param {number} minValues - Nombre minimum de sélections (défaut: 1)
	 * @param {number} maxValues - Nombre maximum de sélections (défaut: 1)
	 * @returns {ActionRowBuilder}
	 */
	static createSelectMenu(customId, placeholder, options, minValues = 1, maxValues = 1) {
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(customId)
			.setPlaceholder(placeholder)
			.setMinValues(minValues)
			.setMaxValues(maxValues);

		// Ajouter les options
		const formattedOptions = options.map(option => {
			const optionData = {
				label: option.label,
				value: option.value
			};
			
			if (option.description) optionData.description = option.description;
			if (option.emoji) optionData.emoji = option.emoji;
			
			return optionData;
		});

		selectMenu.addOptions(formattedOptions);

		return new ActionRowBuilder().addComponents(selectMenu);
	}

	/**
	 * Crée des boutons d'action (type 10) à partir d'une configuration
	 * @param {Array} buttons - Boutons [{label, customId, style, emoji?, disabled?}]
	 * @returns {ActionRowBuilder}
	 */
	static createActionButtons(buttons) {
		const buttonComponents = buttons.map(button => {
			const buttonBuilder = new ButtonBuilder()
				.setCustomId(button.customId)
				.setLabel(button.label)
				.setStyle(this.getButtonStyle(button.style));

			if (button.emoji) buttonBuilder.setEmoji(button.emoji);
			if (button.disabled) buttonBuilder.setDisabled(button.disabled);

			return buttonBuilder;
		});

		return new ActionRowBuilder().addComponents(...buttonComponents);
	}

	/**
	 * Convertit le style de bouton en constante Discord.js
	 * @param {string} style - Style du bouton
	 * @returns {ButtonStyle}
	 */
	static getButtonStyle(style) {
		const styles = {
			'PRIMARY': ButtonStyle.Primary,
			'SECONDARY': ButtonStyle.Secondary,
			'SUCCESS': ButtonStyle.Success,
			'DANGER': ButtonStyle.Danger,
			'LINK': ButtonStyle.Link
		};

		return styles[style] || ButtonStyle.Secondary;
	}

	/**
	 * Crée un ensemble complet de components (SelectMenu + Boutons)
	 * @param {Object} config - Configuration complète
	 * @returns {Array<ActionRowBuilder>}
	 */
	static createCompleteComponents(config) {
		const components = [];

		// Ajouter le SelectMenu si configuré
		if (config.selectMenu) {
			components.push(this.createSelectMenu(
				config.selectMenu.customId,
				config.selectMenu.placeholder,
				config.selectMenu.options,
				config.selectMenu.minValues,
				config.selectMenu.maxValues
			));
		}

		// Ajouter les boutons si configurés
		if (config.buttons) {
			components.push(this.createActionButtons(config.buttons));
		}

		return components;
	}

	/**
	 * Crée des components à partir de la configuration JSON
	 * @param {Object} componentConfig - Configuration depuis config.json
	 * @returns {Array<ActionRowBuilder>}
	 */
	static fromConfig(componentConfig) {
		const components = [];

		// Traiter les components de type 17 (SelectMenu)
		Object.entries(componentConfig).forEach(([key, config]) => {
			if (config.type === 17) {
				components.push(this.createSelectMenu(
					key,
					config.placeholder || 'Choisir une option...',
					config.options
				));
			}
			
			// Traiter les components de type 10 (ActionRow avec boutons)
			if (config.type === 10) {
				const buttons = config.buttons.map(button => ({
					...button,
					customId: `${key}_${button.label.toLowerCase().replace(/\s+/g, '_')}`
				}));
				components.push(this.createActionButtons(buttons));
			}
		});

		return components;
	}
}

module.exports = ComponentBuilder;