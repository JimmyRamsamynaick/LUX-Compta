const { Events } = require('discord.js');

/**
 * Gestionnaire centralisé des interactions avec gestion automatique des defer
 */
class InteractionHandler {
	/**
	 * Gérer une interaction avec defer automatique si nécessaire
	 * @param {Interaction} interaction - L'interaction à traiter
	 * @param {Function} handler - La fonction de traitement
	 * @param {Object} options - Options de gestion
	 */
	static async handleWithDefer(interaction, handler, options = {}) {
		const {
			deferType = 'reply', // 'reply' ou 'update'
			ephemeral = false,
			timeout = 2500 // Temps avant defer automatique
		} = options;

		let isDeferred = false;
		let timeoutId;

		try {
			// Vérifier si l'interaction est encore valide
			if (!this.isInteractionValid(interaction)) {
				console.warn('Interaction expirée ou invalide, abandon du traitement');
				return;
			}

			// Programmer un defer automatique si l'interaction prend trop de temps
			timeoutId = setTimeout(async () => {
				if (!interaction.replied && !interaction.deferred && this.isInteractionValid(interaction)) {
					try {
						if (deferType === 'update' && (interaction.isButton() || interaction.isStringSelectMenu())) {
							await interaction.deferUpdate();
						} else {
							await interaction.deferReply({ ephemeral });
						}
						isDeferred = true;
					} catch (error) {
						console.error('Erreur lors du defer automatique:', error);
					}
				}
			}, timeout);

			// Exécuter le handler
			const result = await handler(interaction);

			// Annuler le timeout si l'interaction s'est terminée rapidement
			clearTimeout(timeoutId);

			return result;
		} catch (error) {
			clearTimeout(timeoutId);
			
			// Gérer l'erreur avec une réponse appropriée
			await this.handleError(interaction, error, isDeferred);
			throw error;
		}
	}

	/**
	 * Gérer les erreurs d'interaction
	 * @param {Interaction} interaction - L'interaction
	 * @param {Error} error - L'erreur
	 * @param {boolean} isDeferred - Si l'interaction a été différée
	 */
	static async handleError(interaction, error, isDeferred = false) {
		console.error('Erreur dans l\'interaction:', error);

		// Vérifier si l'interaction est encore valide avant de tenter une réponse
		if (!this.isInteractionValid(interaction)) {
			console.warn('Interaction expirée, impossible de répondre à l\'erreur');
			return;
		}

		const errorMessage = {
			content: '❌ Une erreur est survenue lors du traitement de votre demande.',
			ephemeral: true
		};

		try {
			if (interaction.replied) {
				await interaction.followUp(errorMessage);
			} else if (isDeferred || interaction.deferred) {
				await interaction.editReply(errorMessage);
			} else {
				await interaction.reply(errorMessage);
			}
		} catch (replyError) {
			console.error('Erreur lors de l\'envoi de la réponse d\'erreur:', replyError);
		}
	}

	/**
	 * Vérifier si une interaction est encore valide
	 * @param {Interaction} interaction - L'interaction à vérifier
	 * @returns {boolean}
	 */
	static isInteractionValid(interaction) {
		// Vérifier si l'interaction n'a pas expiré (15 minutes max)
		const now = Date.now();
		const interactionTime = interaction.createdTimestamp;
		const maxAge = 15 * 60 * 1000; // 15 minutes

		return (now - interactionTime) < maxAge;
	}

	/**
	 * Gérer les interactions de composants avec validation
	 * @param {Interaction} interaction - L'interaction
	 * @param {Object} handlers - Map des handlers par customId
	 */
	static async handleComponent(interaction, handlers) {
		if (!this.isInteractionValid(interaction)) {
			await interaction.reply({
				content: '❌ Cette interaction a expiré. Veuillez relancer la commande.',
				ephemeral: true
			});
			return;
		}

		const customId = interaction.customId;
		
		// Chercher un handler exact
		if (handlers[customId]) {
			return await this.handleWithDefer(interaction, handlers[customId], {
				deferType: 'update'
			});
		}

		// Chercher un handler par préfixe
		for (const [pattern, handler] of Object.entries(handlers)) {
			if (pattern.includes('*') && customId.startsWith(pattern.replace('*', ''))) {
				return await this.handleWithDefer(interaction, handler, {
					deferType: 'update'
				});
			}
		}

		// Aucun handler trouvé
		console.warn(`Aucun handler trouvé pour customId: ${customId}`);
		await interaction.reply({
			content: '❌ Action non reconnue.',
			ephemeral: true
		});
	}

	/**
	 * Créer un handler d'événement pour interactionCreate
	 * @param {Object} commandHandlers - Map des handlers de commandes
	 * @param {Object} componentHandlers - Map des handlers de composants
	 * @returns {Object}
	 */
	static createEventHandler(commandHandlers = {}, componentHandlers = {}) {
		return {
			name: Events.InteractionCreate,
			async execute(interaction) {
				try {
					// Gestion des commandes slash
					if (interaction.isChatInputCommand()) {
						const commandName = interaction.commandName;
						const handler = commandHandlers[commandName] || 
							interaction.client.commands?.get(commandName);

						if (!handler) {
							console.error(`Aucune commande correspondant à ${commandName} n'a été trouvée.`);
							return;
						}

						await InteractionHandler.handleWithDefer(
							interaction,
							async (int) => await handler.execute(int)
						);
					}
					// Gestion des composants
					else if (interaction.isButton() || interaction.isStringSelectMenu()) {
						await InteractionHandler.handleComponent(interaction, componentHandlers);
					}
					// Gestion des modals
					else if (interaction.isModalSubmit()) {
						const customId = interaction.customId;
						const handler = componentHandlers[customId] || componentHandlers[`${customId}*`];
						
						if (handler) {
							await InteractionHandler.handleWithDefer(interaction, handler);
						} else {
							console.warn(`Aucun handler trouvé pour modal: ${customId}`);
						}
					}
				} catch (error) {
					console.error('Erreur dans le gestionnaire d\'interactions:', error);
				}
			}
		};
	}

	/**
	 * Valider un customId pour éviter les doublons
	 * @param {string} customId - L'ID à valider
	 * @param {Set} existingIds - Set des IDs existants
	 * @returns {string} - L'ID validé (potentiellement modifié)
	 */
	static validateCustomId(customId, existingIds = new Set()) {
		let validId = customId;
		let counter = 1;

		while (existingIds.has(validId)) {
			validId = `${customId}_${counter}`;
			counter++;
		}

		existingIds.add(validId);
		return validId;
	}

	/**
	 * Créer un customId unique avec préfixe
	 * @param {string} prefix - Préfixe de l'ID
	 * @param {string} action - Action ou identifiant
	 * @param {string} suffix - Suffixe optionnel
	 * @returns {string}
	 */
	static createCustomId(prefix, action, suffix = '') {
		const parts = [prefix, action, suffix].filter(Boolean);
		return parts.join('_').toLowerCase().replace(/[^a-z0-9_]/g, '');
	}
}

module.exports = InteractionHandler;