const { Events } = require('discord.js');
const cron = require('node-cron');
const config = require('../../config.json');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`🚀 ${client.user.tag} est maintenant en ligne!`);

		// Programmer les tâches automatiques
		await scheduleAutomaticTasks(client);

		// Initialiser Git si configuré
		if (config.git.auto_commit) {
			await client.gitManager.setupGitConfig();
		}

		console.log('⚙️ Configuration terminée avec succès!');
	},
};

async function scheduleAutomaticTasks(client) {
	// Rapport quotidien
	if (config.reports.periods.daily.enabled) {
		const dailyTime = config.reports.periods.daily.time.split(':');
		cron.schedule(`${dailyTime[1]} ${dailyTime[0]} * * *`, async () => {
			console.log('📊 Génération du rapport quotidien...');
			await client.reportManager.generateDailyReport();

			if (config.git.auto_commit) {
				await client.gitManager.autoCommit('Rapport quotidien généré');
			}
		}, {
			timezone: config.server.timezone,
		});
		console.log(`⏰ Rapport quotidien programmé à ${config.reports.periods.daily.time}`);
	}

	// Rapport hebdomadaire
	if (config.reports.periods.weekly.enabled) {
		const weeklyTime = config.reports.periods.weekly.time.split(':');
		const weekDay = getWeekDay(config.reports.periods.weekly.day);
		cron.schedule(`${weeklyTime[1]} ${weeklyTime[0]} * * ${weekDay}`, async () => {
			console.log('📊 Génération du rapport hebdomadaire...');
			await client.reportManager.generateWeeklyReport();

			if (config.git.auto_commit) {
				await client.gitManager.autoCommit('Rapport hebdomadaire généré');
			}
		}, {
			timezone: config.server.timezone,
		});
		console.log(`⏰ Rapport hebdomadaire programmé le ${config.reports.periods.weekly.day} à ${config.reports.periods.weekly.time}`);
	}

	// Rapport mensuel
	if (config.reports.periods.monthly.enabled) {
		const monthlyTime = config.reports.periods.monthly.time.split(':');
		const monthDay = config.reports.periods.monthly.day === 'last' ? '28-31' : config.reports.periods.monthly.day;

		// Pour le dernier jour du mois, on utilise une approche différente
		if (config.reports.periods.monthly.day === 'last') {
			// Vérifier tous les jours à 23:59 si c'est le dernier jour du mois
			cron.schedule(`${monthlyTime[1]} ${monthlyTime[0]} 28-31 * *`, async () => {
				const today = new Date();
				const tomorrow = new Date(today);
				tomorrow.setDate(today.getDate() + 1);

				// Si demain est le 1er du mois, alors aujourd'hui est le dernier jour
				if (tomorrow.getDate() === 1) {
					console.log('📊 Génération du rapport mensuel...');
					await client.reportManager.generateMonthlyReport();

					if (config.git.auto_commit) {
						await client.gitManager.autoCommit('Rapport mensuel généré');
					}
				}
			}, {
				timezone: config.server.timezone,
			});
		}
		else {
			cron.schedule(`${monthlyTime[1]} ${monthlyTime[0]} ${monthDay} * *`, async () => {
				console.log('📊 Génération du rapport mensuel...');
				await client.reportManager.generateMonthlyReport();

				if (config.git.auto_commit) {
					await client.gitManager.autoCommit('Rapport mensuel généré');
				}
			}, {
				timezone: config.server.timezone,
			});
		}
		console.log(`⏰ Rapport mensuel programmé le ${config.reports.periods.monthly.day} à ${config.reports.periods.monthly.time}`);
	}

	// Archivage automatique
	if (config.reports.auto_archive.enabled) {
		cron.schedule('0 2 * * *', async () => {
			console.log('🗄️ Archivage automatique des anciens rapports...');
			await client.reportManager.autoArchive();
		}, {
			timezone: config.server.timezone,
		});
		console.log('⏰ Archivage automatique programmé à 02:00');
	}

	// Commit Git automatique (si différent des rapports)
	if (config.git.auto_commit && config.git.commit_frequency === 'hourly') {
		cron.schedule('0 * * * *', async () => {
			await client.gitManager.autoCommit('Mise à jour automatique');
		});
		console.log('⏰ Commits Git automatiques programmés toutes les heures');
	}
}

function getWeekDay(day) {
	const days = {
		'sunday': 0,
		'monday': 1,
		'tuesday': 2,
		'wednesday': 3,
		'thursday': 4,
		'friday': 5,
		'saturday': 6,
	};
	return days[day.toLowerCase()] || 0;
}