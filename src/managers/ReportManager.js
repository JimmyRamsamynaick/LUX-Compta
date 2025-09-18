const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
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
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du ReportManager:', error);
        }
    }

    async generateReport(period = 'daily') {
        try {
            const timestamp = moment().format('DD-MM-YYYY');
            const filename = `rapport_${period}_${timestamp}.csv`;
            const filePath = path.join(this.reportsDir, filename);
            
            // Obtenir les données statistiques
            const data = await this.client.statsManager.generateCSVData(period);
            
            // Créer le rapport CSV
            await this.createCSVReport(filePath, data, period);
            
            console.log(`📊 Rapport ${period} généré: ${filename}`);
            
            return {
                filePath,
                filename,
                period,
                timestamp,
                data
            };
        } catch (error) {
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
            { id: 'date', title: 'Date de génération' }
        ];

        // En-têtes pour le top des membres
        const memberHeaders = [
            { id: 'rank', title: 'Rang' },
            { id: 'displayName', title: 'Nom d\'affichage' },
            { id: 'username', title: 'Nom d\'utilisateur' },
            { id: 'messages', title: 'Messages' },
            { id: 'lastActive', title: 'Dernière activité' }
        ];

        // En-têtes pour le top des canaux
        const channelHeaders = [
            { id: 'rank', title: 'Rang' },
            { id: 'name', title: 'Nom du canal' },
            { id: 'messages', title: 'Messages' },
            { id: 'type', title: 'Type' }
        ];

        // Préparer les données générales
        const generalData = [
            {
                metric: 'Messages totaux',
                value: data.general.messages || 0,
                period: this.getPeriodLabel(period),
                date: moment().format('DD/MM/YYYY HH:mm:ss')
            },
            {
                metric: 'Membres totaux',
                value: data.general.totalMembers || 0,
                period: this.getPeriodLabel(period),
                date: moment().format('DD/MM/YYYY HH:mm:ss')
            },
            {
                metric: 'Nouveaux membres',
                value: data.general.membersJoined || 0,
                period: this.getPeriodLabel(period),
                date: moment().format('DD/MM/YYYY HH:mm:ss')
            },
            {
                metric: 'Membres partis',
                value: data.general.membersLeft || 0,
                period: this.getPeriodLabel(period),
                date: moment().format('DD/MM/YYYY HH:mm:ss')
            }
        ];

        // Préparer les données des membres
        const memberData = data.topMembers.map((member, index) => ({
            rank: index + 1,
            displayName: member.displayName,
            username: member.username,
            messages: member.messages,
            lastActive: member.lastActive
        }));

        // Préparer les données des canaux
        const channelData = data.topChannels.map((channel, index) => ({
            rank: index + 1,
            name: channel.name,
            messages: channel.messages,
            type: this.getChannelTypeLabel(channel.type)
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
            }).join(',')
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
        } catch (error) {
            console.error('❌ Erreur lors de l\'archivage automatique:', error);
            return 0;
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
                            date: moment(match[2], 'DD-MM-YYYY').toDate()
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
        } catch (error) {
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
        } catch (error) {
            console.error('❌ Erreur lors de la suppression des anciens rapports:', error);
            return 0;
        }
    }

    getPeriodLabel(period) {
        const labels = {
            daily: 'Quotidien',
            weekly: 'Hebdomadaire',
            monthly: 'Mensuel'
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
            15: 'Forum'
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