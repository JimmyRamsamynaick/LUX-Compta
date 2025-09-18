const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

class AlertManager {
	constructor(client) {
		this.client = client;
		this.configPath = path.join(__dirname, '../../config.json');
		this.alertsPath = path.join(__dirname, '../../data/alerts.json');
		this.lastCheck = new Date();
		this.alertHistory = [];

		// Initialiser le système d'alertes
		this.initializeAlerts();
	}

	async initializeAlerts() {
		try {
			// Créer le fichier d'alertes s'il n'existe pas
			try {
				await fs.access(this.alertsPath);
			}
			catch {
				await fs.mkdir(path.dirname(this.alertsPath), { recursive: true });
				await fs.writeFile(this.alertsPath, JSON.stringify({
					history: [],
					lastActivityCheck: new Date().toISOString(),
					thresholds: {
						lowActivity: 10,
						noActivity: 0,
						memberDrop: 5,
					},
				}, null, 2));
			}

			// Charger l'historique des alertes
			const alertData = JSON.parse(await fs.readFile(this.alertsPath, 'utf8'));
			this.alertHistory = alertData.history || [];
			this.lastCheck = new Date(alertData.lastActivityCheck || new Date());

			console.log('✅ AlertManager initialisé');
		}
		catch (error) {
			console.error('❌ Erreur lors de l\'initialisation d\'AlertManager:', error);
		}
	}

	async checkActivityAlerts() {
		try {
			const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
			const statsManager = this.client.statsManager;

			if (!statsManager || !config.alerts.enabled) {
				return;
			}

			// Obtenir les statistiques actuelles
			const currentStats = await statsManager.getStats('daily');
			const previousStats = await statsManager.getStats('daily', -1); // Jour précédent

			// Vérifier les différents types d'alertes
			await this.checkLowActivityAlert(currentStats, previousStats, config);
			await this.checkMemberDropAlert(currentStats, previousStats, config);
			await this.checkNoActivityAlert(currentStats, config);

			// Mettre à jour la dernière vérification
			this.lastCheck = new Date();
			await this.saveAlertData();

		}
		catch (error) {
			console.error('❌ Erreur lors de la vérification des alertes:', error);
		}
	}

	async checkLowActivityAlert(current, previous, config) {
		if (!current || !previous) return;

		const currentActivity = current.messages?.total || 0;
		const previousActivity = previous.messages?.total || 0;
		const threshold = config.alerts.activityThreshold || 50;

		// Calculer la baisse d'activité en pourcentage
		const activityDrop = previousActivity > 0 ?
			((previousActivity - currentActivity) / previousActivity) * 100 : 0;

		if (activityDrop >= threshold) {
			await this.sendAlert('low_activity', {
				type: 'Baisse d\'activité détectée',
				description: `L'activité a chuté de ${activityDrop.toFixed(1)}% par rapport à hier`,
				current: currentActivity,
				previous: previousActivity,
				threshold: threshold,
				severity: activityDrop >= 75 ? 'high' : activityDrop >= 50 ? 'medium' : 'low',
			});
		}
	}

	async checkMemberDropAlert(current, previous, config) {
		if (!current || !previous) return;

		const currentMembers = current.members?.total || 0;
		const previousMembers = previous.members?.total || 0;
		const memberDrop = previousMembers - currentMembers;

		if (memberDrop >= 5) {
			await this.sendAlert('member_drop', {
				type: 'Perte de membres importante',
				description: `${memberDrop} membres ont quitté le serveur aujourd'hui`,
				current: currentMembers,
				previous: previousMembers,
				drop: memberDrop,
				severity: memberDrop >= 20 ? 'high' : memberDrop >= 10 ? 'medium' : 'low',
			});
		}
	}

	async checkNoActivityAlert(current, config) {
		if (!current) return;

		const currentActivity = current.messages?.total || 0;
		const hoursWithoutActivity = this.getHoursSinceLastActivity();

		if (currentActivity === 0 && hoursWithoutActivity >= 6) {
			await this.sendAlert('no_activity', {
				type: 'Aucune activité détectée',
				description: `Aucun message depuis ${hoursWithoutActivity} heures`,
				hours: hoursWithoutActivity,
				severity: hoursWithoutActivity >= 24 ? 'high' : hoursWithoutActivity >= 12 ? 'medium' : 'low',
			});
		}
	}

	async sendAlert(alertType, data) {
		try {
			const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
			const channelId = config.alerts.channelId;

			if (!channelId) {
				console.log('⚠️ Canal d\'alerte non configuré');
				return;
			}

			const channel = await this.client.channels.fetch(channelId);
			if (!channel) {
				console.log('⚠️ Canal d\'alerte introuvable');
				return;
			}

			// Vérifier si cette alerte a déjà été envoyée récemment
			const recentAlert = this.alertHistory.find(alert =>
				alert.type === alertType &&
                new Date() - new Date(alert.timestamp) < 3600000, // 1 heure
			);

			if (recentAlert) {
				console.log(`⏭️ Alerte ${alertType} déjà envoyée récemment`);
				return;
			}

			// Créer l'embed d'alerte
			const embed = this.createAlertEmbed(alertType, data);
			const components = this.createAlertComponents(alertType, data);

			await channel.send({
				embeds: [embed],
				components: components,
			});

			// Enregistrer l'alerte dans l'historique
			this.alertHistory.push({
				type: alertType,
				data: data,
				timestamp: new Date().toISOString(),
				resolved: false,
			});

			await this.saveAlertData();
			console.log(`🚨 Alerte ${alertType} envoyée`);

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'envoi d\'alerte:', error);
		}
	}

	createAlertEmbed(alertType, data) {
		const colors = {
			low: '#ffeb3b',
			medium: '#ff9800',
			high: '#f44336',
		};

		const icons = {
			low_activity: '📉',
			member_drop: '👥',
			no_activity: '💤',
		};

		// Générer une description par défaut si elle n'existe pas
		let description = data.description;
		if (!description) {
			switch (alertType) {
				case 'Baisse d\'activité':
					description = `L'activité du serveur a diminué de manière significative.`;
					break;
				case 'Aucune activité':
					description = `Aucune activité détectée depuis plusieurs heures.`;
					break;
				case 'Perte de membres':
					description = `Le serveur a perdu plusieurs membres récemment.`;
					break;
				default:
					description = `Alerte détectée sur le serveur.`;
			}
		}

		const embed = new EmbedBuilder()
			.setTitle(`${icons[alertType] || '⚠️'} ${data.type || alertType}`)
			.setDescription(description)
			.setColor(colors[data.severity] || colors.medium)
			.setTimestamp()
			.setFooter({ text: 'Système d\'alertes LUX Compta' });

		// Ajouter des champs spécifiques selon le type d'alerte
		switch (alertType) {
		case 'low_activity':
			embed.addFields(
				{ name: '📊 Activité actuelle', value: `${data.current} messages`, inline: true },
				{ name: '📈 Activité précédente', value: `${data.previous} messages`, inline: true },
				{ name: '📉 Baisse', value: `${((data.previous - data.current) / data.previous * 100).toFixed(1)}%`, inline: true },
			);
			break;

		case 'member_drop':
			embed.addFields(
				{ name: '👥 Membres actuels', value: `${data.current}`, inline: true },
				{ name: '👥 Membres précédents', value: `${data.previous}`, inline: true },
				{ name: '📉 Perte', value: `${data.drop} membres`, inline: true },
			);
			break;

		case 'no_activity':
			embed.addFields(
				{ name: '⏰ Durée', value: `${data.hours} heures`, inline: true },
				{ name: '📊 Messages', value: '0', inline: true },
				{ name: '🔍 Statut', value: 'Surveillance active', inline: true },
			);
			break;
		}

		return embed;
	}

	createAlertComponents(alertType, data) {
		const actionRow = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId(`alert_acknowledge_${alertType}`)
					.setLabel('Accusé de réception')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('✅'),
				new ButtonBuilder()
					.setCustomId(`alert_details_${alertType}`)
					.setLabel('Détails')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('📊'),
				new ButtonBuilder()
					.setCustomId(`alert_resolve_${alertType}`)
					.setLabel('Marquer comme résolu')
					.setStyle(ButtonStyle.Success)
					.setEmoji('🔧'),
			);

		return [actionRow];
	}

	async handleAlertButton(interaction, action, alertType) {
		try {
			switch (action) {
			case 'acknowledge':
				await this.acknowledgeAlert(interaction, alertType);
				break;
			case 'details':
				await this.showAlertDetails(interaction, alertType);
				break;
			case 'resolve':
				await this.resolveAlert(interaction, alertType);
				break;
			}
		}
		catch (error) {
			console.error('❌ Erreur lors de la gestion du bouton d\'alerte:', error);
			await interaction.reply({
				content: '❌ Erreur lors du traitement de l\'alerte.',
			});
		}
	}

	async acknowledgeAlert(interaction, alertType) {
		await interaction.reply({
			content: `✅ Alerte **${alertType}** accusée réception par ${interaction.user.tag}`,
		});

		// Mettre à jour l'historique
		const alert = this.alertHistory.find(a => a.type === alertType && !a.acknowledged);
		if (alert) {
			alert.acknowledged = true;
			alert.acknowledgedBy = interaction.user.id;
			alert.acknowledgedAt = new Date().toISOString();
			await this.saveAlertData();
		}
	}

	async showAlertDetails(interaction, alertType) {
		const statsManager = this.client.statsManager;
		const stats = await statsManager.getStats('daily');

		const embed = new EmbedBuilder()
			.setTitle(`📊 Détails de l'alerte: ${alertType}`)
			.setColor(0x3498DB)
			.setTimestamp();

		if (stats) {
			embed.addFields(
				{ name: '📈 Messages aujourd\'hui', value: `${stats.messages?.total || 0}`, inline: true },
				{ name: '👥 Membres total', value: `${stats.members?.total || 0}`, inline: true },
				{ name: '📊 Canaux actifs', value: `${stats.channels?.active || 0}`, inline: true },
			);
		}

		await interaction.reply({
			embeds: [embed],
		});
	}

	async resolveAlert(interaction, alertType) {
		// Marquer l'alerte comme résolue
		const alert = this.alertHistory.find(a => a.type === alertType && !a.resolved);
		if (alert) {
			alert.resolved = true;
			alert.resolvedBy = interaction.user.id;
			alert.resolvedAt = new Date().toISOString();
			await this.saveAlertData();
		}

		await interaction.reply({
			content: `🔧 Alerte **${alertType}** marquée comme résolue par ${interaction.user.tag}`,
		});
	}

	getHoursSinceLastActivity() {
		// Cette fonction devrait être implémentée pour calculer les heures depuis la dernière activité
		// Pour l'instant, on retourne une valeur par défaut
		return Math.floor((new Date() - this.lastCheck) / (1000 * 60 * 60));
	}

	async saveAlertData() {
		try {
			const alertData = {
				history: this.alertHistory,
				lastActivityCheck: this.lastCheck.toISOString(),
				thresholds: {
					lowActivity: 10,
					noActivity: 0,
					memberDrop: 5,
				},
			};

			await fs.writeFile(this.alertsPath, JSON.stringify(alertData, null, 2));
		}
		catch (error) {
			console.error('❌ Erreur lors de la sauvegarde des alertes:', error);
		}
	}

	async getAlertHistory(limit = 10) {
		return this.alertHistory
			.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
			.slice(0, limit);
	}

	async clearOldAlerts(days = 30) {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - days);

		this.alertHistory = this.alertHistory.filter(alert =>
			new Date(alert.timestamp) > cutoffDate,
		);

		await this.saveAlertData();
		console.log(`🧹 Alertes anciennes supprimées (> ${days} jours)`);
	}

	// Planifier les vérifications d'alertes
	startAlertScheduler() {
		// Vérifier les alertes toutes les heures
		setInterval(() => {
			this.checkActivityAlerts();
		}, 60 * 60 * 1000); // 1 heure

		// Nettoyer les anciennes alertes tous les jours
		setInterval(() => {
			this.clearOldAlerts();
		}, 24 * 60 * 60 * 1000); // 24 heures

		console.log('📅 Planificateur d\'alertes démarré');
	}

	async testAlert(type) {
		try {
			const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
			
			// Simuler des données de test selon le type d'alerte
			let testData = {};
			
			switch (type) {
				case 'Baisse d\'activité':
					testData = {
						currentActivity: 5,
						previousActivity: 15,
						threshold: 10,
						decline: 67
					};
					break;
				case 'Aucune activité':
					testData = {
						hoursSinceLastActivity: 25,
						threshold: 24
					};
					break;
				case 'Perte de membres':
					testData = {
						currentMembers: 95,
						previousMembers: 100,
						threshold: 5,
						loss: 5
					};
					break;
				default:
					testData = {
						currentActivity: 5,
						previousActivity: 15,
						threshold: 10,
						decline: 67
					};
					type = 'Baisse d\'activité';
			}

			// Envoyer l'alerte de test
			await this.sendAlert(type, testData);

			return {
				success: true,
				message: `Alerte de test "${type}" envoyée avec succès`,
				data: testData
			};
		} catch (error) {
			console.error('Erreur lors du test d\'alerte:', error);
			return {
				success: false,
				message: 'Erreur lors de l\'envoi de l\'alerte de test',
				error: error.message
			};
		}
	}

	// Méthodes de configuration des alertes
	async setAlertChannel(channelId) {
		try {
			const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
			
			if (!config.alerts) {
				config.alerts = {};
			}
			
			config.alerts.channelId = channelId;
			
			await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
			console.log(`✅ Canal d'alertes configuré: ${channelId}`);
			
			return true;
		} catch (error) {
			console.error('❌ Erreur lors de la configuration du canal d\'alertes:', error);
			return false;
		}
	}

	async setAlertsEnabled(enabled) {
		try {
			const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
			
			if (!config.alerts) {
				config.alerts = {};
			}
			
			config.alerts.enabled = enabled;
			
			await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
			console.log(`✅ Alertes ${enabled ? 'activées' : 'désactivées'}`);
			
			return true;
		} catch (error) {
			console.error('❌ Erreur lors de la configuration des alertes:', error);
			return false;
		}
	}

	async setThreshold(type, value) {
		try {
			const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
			
			if (!config.alerts) {
				config.alerts = {};
			}
			if (!config.alerts.thresholds) {
				config.alerts.thresholds = {};
			}
			
			const thresholdMap = {
				'activity_drop': 'activityThreshold',
				'member_loss': 'memberDropThreshold',
				'absence': 'noActivityThreshold'
			};
			
			const configKey = thresholdMap[type];
			if (configKey) {
				config.alerts.thresholds[configKey] = value;
				await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
				console.log(`✅ Seuil ${type} configuré: ${value}%`);
				return true;
			}
			
			return false;
		} catch (error) {
			console.error('❌ Erreur lors de la configuration du seuil:', error);
			return false;
		}
	}

	async getConfig() {
		try {
			const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
			
			return {
				enabled: config.alerts?.enabled || false,
				channel: config.alerts?.channelId || null,
				thresholds: {
					activity_drop: config.alerts?.thresholds?.activityThreshold || 50,
					member_loss: config.alerts?.thresholds?.memberDropThreshold || 10,
					absence: config.alerts?.thresholds?.noActivityThreshold || 24
				}
			};
		} catch (error) {
			console.error('❌ Erreur lors de la lecture de la configuration:', error);
			return {
				enabled: false,
				channel: null,
				thresholds: {
					activity_drop: 50,
					member_loss: 10,
					absence: 24
				}
			};
		}
	}
}

module.exports = AlertManager;