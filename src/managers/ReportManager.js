const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const ExcelJS = require('exceljs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const config = require('../../config.json');

class ReportManager {
	constructor(client) {
		this.client = client;
		this.reportsDir = path.join(process.cwd(), 'reports');
		this.archiveDir = path.join(process.cwd(), 'archives');
	}

	async initialize() {
		try {
			// Créer les dossiers nécessaires
			await fs.ensureDir(this.reportsDir);
			await fs.ensureDir(this.archiveDir);

			console.log('📄 ReportManager initialisé avec succès');
		}
		catch (error) {
			console.error('❌ Erreur lors de l\'initialisation du ReportManager:', error);
		}
	}

    async generateReport(period = 'daily') {
        try {
            // Générer le nom de fichier avec la date actuelle
            const now = new Date();
            const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
            const csvFilename = `rapport_${period}_${dateStr}.csv`;
            const xlsxFilename = `rapport_${period}_${dateStr}.xlsx`;
            const csvPath = path.join(this.reportsDir, csvFilename);
            const xlsxPath = path.join(this.reportsDir, xlsxFilename);

            // Obtenir les données statistiques
            const data = await this.client.statsManager.generateCSVData(period);
            // CSV
            await this.createCSVReport(csvPath, data, period);
            // Excel
            await this.createExcelReport(xlsxPath, data, period);

            console.log(`✅ Rapport ${period} généré: ${csvFilename}, ${xlsxFilename}`);

            // Archiver les anciens rapports si nécessaire
            if (this.client.archiveManager?.archiveOldReports) {
                await this.client.archiveManager.archiveOldReports();
            }

            // Envoyer par email si configuré
            if (this.client.emailManager?.sendReport) {
                try {
                    await this.client.emailManager.sendReport(
                        process.env.REPORT_EMAIL_TO || process.env.EMAIL_TO,
                        `[${config.bot.name}] Rapport ${this.getPeriodLabel(period)} (${dateStr})`,
                        xlsxPath,
                        'Rapport Excel en pièce jointe.'
                    );
                    console.log('📧 Rapport Excel envoyé par email');
                }
                catch (error) {
                    console.error('❌ Erreur lors de l\'envoi du rapport par email:', error.message);
                }
            }

            // Retourner les informations pour intégrations externes
            const totalEntries = (data.topMembers?.length || 0) + (data.topChannels?.length || 0) + 4; // 4 métriques générales
            return { filename: xlsxFilename, filepath: xlsxPath, xlsxPath, csvFilename, csvPath, totalEntries };
        }
        catch (error) {
            console.error(`❌ Erreur lors de la génération du rapport ${period}:`, error);
            return null;
        }
    }

    async createCSVReport(filePath, data, period) {
		// En-têtes pour les statistiques générales
		const generalHeaders = [
			{ id: 'metric', title: 'Métrique' },
			{ id: 'value', title: 'Valeur' },
			{ id: 'period', title: 'Période' },
			{ id: 'date', title: 'Date de génération' },
		];

		// En-têtes pour le top des membres
		const memberHeaders = [
			{ id: 'rank', title: 'Rang' },
			{ id: 'displayName', title: 'Nom d\'affichage' },
			{ id: 'username', title: 'Nom d\'utilisateur' },
			{ id: 'messages', title: 'Messages' },
			{ id: 'lastActive', title: 'Dernière activité' },
		];

		// En-têtes pour le top des canaux
		const channelHeaders = [
			{ id: 'rank', title: 'Rang' },
			{ id: 'name', title: 'Nom du canal' },
			{ id: 'messages', title: 'Messages' },
			{ id: 'type', title: 'Type' },
		];

		// Préparer les données générales
        const voiceHours = ((data.general.voiceMinutes || 0) / 60).toFixed(1);
        const stayed = (data.general.startMembers || 0) - (data.general.membersLeft || 0);
        const generalData = [
            {
                metric: 'Messages totaux',
                value: data.general.messages || 0,
                period: this.getPeriodLabel(period),
                date: moment().format('DD/MM/YYYY HH:mm:ss'),
            },
            {
                metric: 'Heures vocales (h)',
                value: voiceHours,
                period: this.getPeriodLabel(period),
                date: moment().format('DD/MM/YYYY HH:mm:ss'),
            },
            {
                metric: 'Nouveaux membres',
                value: data.general.membersJoined || 0,
                period: this.getPeriodLabel(period),
                date: moment().format('DD/MM/YYYY HH:mm:ss'),
            },
            {
                metric: 'Membres partis',
                value: data.general.membersLeft || 0,
                period: this.getPeriodLabel(period),
                date: moment().format('DD/MM/YYYY HH:mm:ss'),
            },
            {
                metric: 'Membres restés',
                value: stayed < 0 ? 0 : stayed,
                period: this.getPeriodLabel(period),
                date: moment().format('DD/MM/YYYY HH:mm:ss'),
            },
            {
                metric: 'Total fin de période',
                value: data.general.endMembers || data.general.totalMembers || 0,
                period: this.getPeriodLabel(period),
                date: moment().format('DD/MM/YYYY HH:mm:ss'),
            },
        ];

		// Préparer les données des membres
		const memberData = data.topMembers.map((member, index) => ({
			rank: index + 1,
			displayName: member.displayName,
			username: member.username,
			messages: member.messages,
			lastActive: member.lastActive,
		}));

		// Préparer les données des canaux
		const channelData = data.topChannels.map((channel, index) => ({
			rank: index + 1,
			name: channel.name,
			messages: channel.messages,
			type: this.getChannelTypeLabel(channel.type),
		}));

		// Créer le contenu CSV complet
		let csvContent = '';

		// Section statistiques générales
		csvContent += '=== STATISTIQUES GÉNÉRALES ===\n';
		csvContent += this.arrayToCSV(generalData, generalHeaders) + '\n\n';

		// Section top membres
		csvContent += '=== TOP MEMBRES ===\n';
		csvContent += this.arrayToCSV(memberData, memberHeaders) + '\n\n';

		// Section top canaux
		csvContent += '=== TOP CANAUX ===\n';
		csvContent += this.arrayToCSV(channelData, channelHeaders) + '\n\n';

		// Informations de génération
		csvContent += '=== INFORMATIONS ===\n';
		csvContent += `Généré le,${moment().format('DD/MM/YYYY HH:mm:ss')}\n`;
		csvContent += `Période,${this.getPeriodLabel(period)}\n`;
		csvContent += `Serveur,${config.server.name}\n`;
		csvContent += `Bot,${config.bot.name} v${config.bot.version}\n`;

		// Écrire le fichier
        await fs.writeFile(filePath, csvContent, 'utf8');
    }

    async createExcelReport(filePath, data, period) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = config.bot.name;
        workbook.created = new Date();

        // Feuille: Général
        const wsGeneral = workbook.addWorksheet('Général');
        wsGeneral.columns = [
            { header: 'Métrique', key: 'metric', width: 30 },
            { header: 'Valeur', key: 'value', width: 20 },
            { header: 'Période', key: 'period', width: 20 },
            { header: 'Date de génération', key: 'date', width: 24 },
        ];

        const general = data.general || {};
        const voiceHours = ((general.voiceMinutes || 0) / 60).toFixed(1);
        const stayed = (general.startMembers || 0) - (general.membersLeft || 0);
        const genRows = [
            { metric: 'Messages totaux', value: general.messages || 0 },
            { metric: 'Heures vocales (h)', value: voiceHours },
            { metric: 'Membres rejoints', value: general.membersJoined || 0 },
            { metric: 'Membres partis', value: general.membersLeft || 0 },
            { metric: 'Membres restés', value: stayed < 0 ? 0 : stayed },
            { metric: 'Total fin de période', value: general.endMembers || general.totalMembers || 0 },
            { metric: 'Période', value: this.getPeriodLabel(period) },
            { metric: 'Date de génération', value: moment().format('DD/MM/YYYY HH:mm:ss') },
        ];
        genRows.forEach(r => wsGeneral.addRow({ ...r, period: this.getPeriodLabel(period), date: moment().format('DD/MM/YYYY HH:mm:ss') }));
        wsGeneral.getRow(1).font = { bold: true };

        // Feuille: Top Membres
        const wsMembers = workbook.addWorksheet('Top Membres');
        wsMembers.columns = [
            { header: 'Rang', key: 'rank', width: 8 },
            { header: "Nom d'affichage", key: 'displayName', width: 24 },
            { header: "Nom d'utilisateur", key: 'username', width: 24 },
            { header: 'Messages', key: 'messages', width: 12 },
            { header: 'Dernière activité', key: 'lastActive', width: 18 },
            { header: 'Minutes vocales', key: 'voiceMinutes', width: 16 },
        ];
        (data.topMembers || []).forEach((m, i) => wsMembers.addRow({
            rank: i + 1,
            displayName: m.displayName,
            username: m.username,
            messages: m.messages,
            lastActive: m.lastActive,
            voiceMinutes: m.voiceMinutes || 0,
        }));
        wsMembers.getRow(1).font = { bold: true };

        // Feuille: Top Canaux
        const wsChannels = workbook.addWorksheet('Top Canaux');
        wsChannels.columns = [
            { header: 'Rang', key: 'rank', width: 8 },
            { header: 'Nom du canal', key: 'name', width: 24 },
            { header: 'Messages', key: 'messages', width: 12 },
            { header: 'Type', key: 'type', width: 12 },
            { header: 'Minutes vocales', key: 'voiceMinutes', width: 16 },
        ];
        (data.topChannels || []).forEach((c, i) => wsChannels.addRow({
            rank: i + 1,
            name: c.name,
            messages: c.messages,
            type: this.getChannelTypeLabel(c.type),
            voiceMinutes: c.voiceMinutes || 0,
        }));
        wsChannels.getRow(1).font = { bold: true };

        await workbook.xlsx.writeFile(filePath);
    }

	arrayToCSV(data, headers) {
		if (!data || data.length === 0) return '';

		// En-têtes
		const headerRow = headers.map(h => h.title).join(',');

		// Données
		const dataRows = data.map(row =>
			headers.map(h => {
				const value = row[h.id] || '';
				// Échapper les virgules et guillemets
				return typeof value === 'string' && (value.includes(',') || value.includes('"'))
					? `"${value.replace(/"/g, '""')}"`
					: value;
			}).join(','),
		);

		return [headerRow, ...dataRows].join('\n');
	}

	async generateDailyReport() {
		return await this.generateReport('daily');
	}

	async generateWeeklyReport() {
		return await this.generateReport('weekly');
	}

	async generateMonthlyReport() {
		return await this.generateReport('monthly');
	}

    async autoArchive() {
        try {
            const cutoffDate = moment().subtract(config.reports.auto_archive.after_days, 'days');
            const files = await fs.readdir(this.reportsDir);

            let archivedCount = 0;

            for (const file of files) {
                if (!file.endsWith('.csv')) continue;

                const filePath = path.join(this.reportsDir, file);
                const stats = await fs.stat(filePath);
                const fileDate = moment(stats.birthtime);

                if (fileDate.isBefore(cutoffDate)) {
                    // Créer le dossier d'archive par mois
                    const archiveMonth = fileDate.format('YYYY-MM');
                    const monthArchiveDir = path.join(this.archiveDir, archiveMonth);
                    await fs.ensureDir(monthArchiveDir);

                    // Déplacer le fichier
                    const newPath = path.join(monthArchiveDir, file);
                    await fs.move(filePath, newPath);

                    archivedCount++;
                    console.log(`📦 Archivé: ${file}`);
                }
            }

            if (archivedCount > 0) {
                console.log(`📦 ${archivedCount} rapport(s) archivé(s) avec succès`);
            }

            return archivedCount;
        }
        catch (error) {
            console.error('❌ Erreur lors de l\'archivage automatique:', error);
            return 0;
        }
    }

    async postReportToChannel(period, files = {}) {
        try {
            const { csvPath, xlsxPath, filepath } = files || {};
            const excelPath = xlsxPath || filepath; // compatibilité avec l'objet retourné
            const statsData = await this.client.statsManager.generateCSVData(period);

            // Déterminer le canal cible: prioriser ID des logs, fallback par nom reportChannel
            let targetChannel = null;
            if (config.logs && config.logs.channelId) {
                targetChannel = this.client.channels.cache.get(config.logs.channelId) || null;
            }
            if (!targetChannel && config.reportChannel) {
                const nameLower = config.reportChannel.toLowerCase();
                targetChannel = this.client.channels.cache.find(c => (c.name || '').toLowerCase() === nameLower) || null;
            }

            if (!targetChannel) {
                console.warn('⚠️ Aucun canal configuré pour publier les rapports (logs.channelId ou reportChannel).');
                return false;
            }

            const general = statsData.general || {};
            const voiceHours = ((general.voiceMinutes || 0) / 60).toFixed(1);
            const stayed = (general.startMembers || 0) - (general.membersLeft || 0);
            const embed = new EmbedBuilder()
                .setTitle(`📊 Rapport ${this.getPeriodLabel(period)} — ${config.server.name}`)
                .setColor(0x0099ff)
                .setTimestamp()
                .setDescription('Comptabilité automatique des statistiques du serveur')
                .addFields(
                    { name: '💬 Messages', value: `${general.messages || 0}`, inline: true },
                    { name: '🔊 Heures en vocal', value: `${voiceHours}`, inline: true },
                    { name: '👥 Rejoints', value: `${general.membersJoined || 0}`, inline: true },
                    { name: '🚪 Quittés', value: `${general.membersLeft || 0}`, inline: true },
                    { name: '✅ Restés', value: `${stayed < 0 ? 0 : stayed}`, inline: true },
                    { name: '👥 Total fin période', value: `${general.endMembers || general.totalMembers || 0}`, inline: true },
                );

            const filesToAttach = [];
            if (excelPath && await fs.pathExists(excelPath)) filesToAttach.push(new AttachmentBuilder(excelPath));
            if (csvPath && await fs.pathExists(csvPath)) filesToAttach.push(new AttachmentBuilder(csvPath));

            await targetChannel.send({
                content: `📎 Rapport ${this.getPeriodLabel(period)} prêt — ${moment().format('DD/MM/YYYY HH:mm')}`,
                embeds: [embed],
                files: filesToAttach,
            });

            console.log(`✅ Rapport ${period} publié sur #${targetChannel.name || targetChannel.id}`);
            return true;
        }
        catch (error) {
            console.error('❌ Erreur lors de la publication du rapport:', error);
            return false;
        }
    }

	async getReportsList(period = null) {
		try {
			const files = await fs.readdir(this.reportsDir);
			let reports = files
				.filter(file => file.endsWith('.csv'))
				.map(file => {
					const match = file.match(/rapport_(\w+)_(\d{2}-\d{2}-\d{4})\.csv/);
					if (match) {
						return {
							filename: file,
							period: match[1],
							timestamp: match[2],
							date: moment(match[2], 'DD-MM-YYYY').toDate(),
						};
					}
					return null;
				})
				.filter(report => report !== null)
				.sort((a, b) => b.date - a.date);

			if (period) {
				reports = reports.filter(report => report.period === period);
			}

			return reports;
		}
		catch (error) {
			console.error('❌ Erreur lors de la récupération de la liste des rapports:', error);
			return [];
		}
	}

	async deleteOldReports(daysToKeep = 30) {
		try {
			const cutoffDate = moment().subtract(daysToKeep, 'days');
			const files = await fs.readdir(this.reportsDir);

			let deletedCount = 0;

			for (const file of files) {
				if (!file.endsWith('.csv')) continue;

				const filePath = path.join(this.reportsDir, file);
				const stats = await fs.stat(filePath);
				const fileDate = moment(stats.birthtime);

				if (fileDate.isBefore(cutoffDate)) {
					await fs.remove(filePath);
					deletedCount++;
					console.log(`🗑️ Supprimé: ${file}`);
				}
			}

			return deletedCount;
		}
		catch (error) {
			console.error('❌ Erreur lors de la suppression des anciens rapports:', error);
			return 0;
		}
	}

	getPeriodLabel(period) {
		const labels = {
			daily: 'Quotidien',
			weekly: 'Hebdomadaire',
			monthly: 'Mensuel',
		};
		return labels[period] || 'Inconnu';
	}

	getChannelTypeLabel(type) {
		const types = {
			0: 'Texte',
			2: 'Vocal',
			4: 'Catégorie',
			5: 'Annonces',
			13: 'Stage',
			15: 'Forum',
		};
		return types[type] || 'Autre';
	}

	async createReportTemplate() {
		const templatePath = path.join(process.cwd(), 'report_template.csv');

		const templateContent = `=== MODÈLE DE RAPPORT LUX COMPTA ===

=== STATISTIQUES GÉNÉRALES ===
Métrique,Valeur,Période,Date de génération
Messages totaux,0,Quotidien,01/01/2024 00:00:00
Membres totaux,0,Quotidien,01/01/2024 00:00:00
Nouveaux membres,0,Quotidien,01/01/2024 00:00:00
Membres partis,0,Quotidien,01/01/2024 00:00:00

=== TOP MEMBRES ===
Rang,Nom d'affichage,Nom d'utilisateur,Messages,Dernière activité
1,Exemple Utilisateur,exemple_user,100,2024-01-01
2,Autre Utilisateur,autre_user,75,2024-01-01

=== TOP CANAUX ===
Rang,Nom du canal,Messages,Type
1,général,200,Texte
2,discussions,150,Texte

=== INFORMATIONS ===
Généré le,01/01/2024 00:00:00
Période,Quotidien
Serveur,La Lanterne Nocturne
Bot,LUX Compta v1.0.0`;

		await fs.writeFile(templatePath, templateContent, 'utf8');
		console.log('📄 Modèle de rapport créé: report_template.csv');

		return templatePath;
	}
}

module.exports = ReportManager;