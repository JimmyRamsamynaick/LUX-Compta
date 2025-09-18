const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

class StatsManager {
    constructor(client) {
        this.client = client;
        this.dataDir = path.join(process.cwd(), 'data');
        this.statsFile = path.join(this.dataDir, 'stats.json');
        this.stats = {
            daily: {},
            weekly: {},
            monthly: {},
            members: {},
            channels: {},
            messages: {},
            activity: {}
        };
    }

    async initialize() {
        try {
            // Créer le dossier data s'il n'existe pas
            await fs.ensureDir(this.dataDir);
            
            // Charger les statistiques existantes
            await this.loadStats();
            
            console.log('📊 StatsManager initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du StatsManager:', error);
        }
    }

    async loadStats() {
        try {
            if (await fs.pathExists(this.statsFile)) {
                const data = await fs.readJson(this.statsFile);
                this.stats = { ...this.stats, ...data };
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement des statistiques:', error);
        }
    }

    async saveStats() {
        try {
            await fs.writeJson(this.statsFile, this.stats, { spaces: 2 });
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde des statistiques:', error);
        }
    }

    async recordMessage(message) {
        const today = moment().format('YYYY-MM-DD');
        const thisWeek = moment().startOf('week').format('YYYY-MM-DD');
        const thisMonth = moment().format('YYYY-MM');
        
        // Initialiser les structures si nécessaire
        this.initializePeriodStats(today, 'daily');
        this.initializePeriodStats(thisWeek, 'weekly');
        this.initializePeriodStats(thisMonth, 'monthly');
        
        // Enregistrer le message
        this.stats.daily[today].messages++;
        this.stats.weekly[thisWeek].messages++;
        this.stats.monthly[thisMonth].messages++;
        
        // Statistiques par utilisateur
        const userId = message.author.id;
        if (!this.stats.members[userId]) {
            this.stats.members[userId] = {
                username: message.author.username,
                displayName: message.member?.displayName || message.author.username,
                messages: 0,
                firstSeen: today,
                lastActive: today
            };
        }
        
        this.stats.members[userId].messages++;
        this.stats.members[userId].lastActive = today;
        this.stats.members[userId].username = message.author.username;
        this.stats.members[userId].displayName = message.member?.displayName || message.author.username;
        
        // Statistiques par canal
        const channelId = message.channel.id;
        if (!this.stats.channels[channelId]) {
            this.stats.channels[channelId] = {
                name: message.channel.name,
                messages: 0,
                type: message.channel.type
            };
        }
        
        this.stats.channels[channelId].messages++;
        this.stats.channels[channelId].name = message.channel.name;
        
        // Sauvegarder
        await this.saveStats();
    }

    async recordMemberJoin(member) {
        const today = moment().format('YYYY-MM-DD');
        const thisWeek = moment().startOf('week').format('YYYY-MM-DD');
        const thisMonth = moment().format('YYYY-MM');
        
        // Initialiser les structures si nécessaire
        this.initializePeriodStats(today, 'daily');
        this.initializePeriodStats(thisWeek, 'weekly');
        this.initializePeriodStats(thisMonth, 'monthly');
        
        // Enregistrer l'arrivée
        this.stats.daily[today].membersJoined++;
        this.stats.weekly[thisWeek].membersJoined++;
        this.stats.monthly[thisMonth].membersJoined++;
        
        // Mettre à jour le total des membres
        const guild = member.guild;
        this.stats.daily[today].totalMembers = guild.memberCount;
        this.stats.weekly[thisWeek].totalMembers = guild.memberCount;
        this.stats.monthly[thisMonth].totalMembers = guild.memberCount;
        
        // Enregistrer les informations du membre
        const userId = member.id;
        if (!this.stats.members[userId]) {
            this.stats.members[userId] = {
                username: member.user.username,
                displayName: member.displayName,
                messages: 0,
                firstSeen: today,
                lastActive: today,
                joinedAt: today
            };
        }
        
        await this.saveStats();
    }

    async recordMemberLeave(member) {
        const today = moment().format('YYYY-MM-DD');
        const thisWeek = moment().startOf('week').format('YYYY-MM-DD');
        const thisMonth = moment().format('YYYY-MM');
        
        // Initialiser les structures si nécessaire
        this.initializePeriodStats(today, 'daily');
        this.initializePeriodStats(thisWeek, 'weekly');
        this.initializePeriodStats(thisMonth, 'monthly');
        
        // Enregistrer le départ
        this.stats.daily[today].membersLeft++;
        this.stats.weekly[thisWeek].membersLeft++;
        this.stats.monthly[thisMonth].membersLeft++;
        
        // Mettre à jour le total des membres
        const guild = member.guild;
        this.stats.daily[today].totalMembers = guild.memberCount;
        this.stats.weekly[thisWeek].totalMembers = guild.memberCount;
        this.stats.monthly[thisMonth].totalMembers = guild.memberCount;
        
        await this.saveStats();
    }

    initializePeriodStats(period, type) {
        if (!this.stats[type][period]) {
            this.stats[type][period] = {
                messages: 0,
                membersJoined: 0,
                membersLeft: 0,
                totalMembers: 0,
                voiceMinutes: 0,
                reactions: 0
            };
        }
    }

    async getStats(period = 'daily') {
        let periodKey;
        
        switch (period) {
            case 'daily':
                periodKey = moment().format('YYYY-MM-DD');
                break;
            case 'weekly':
                periodKey = moment().startOf('week').format('YYYY-MM-DD');
                break;
            case 'monthly':
                periodKey = moment().format('YYYY-MM');
                break;
            default:
                periodKey = moment().format('YYYY-MM-DD');
        }
        
        return this.stats[period][periodKey] || this.initializePeriodStats(periodKey, period);
    }

    async getTopMembers(limit = 10) {
        const members = Object.entries(this.stats.members)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.messages - a.messages)
            .slice(0, limit);
        
        return members;
    }

    async getTopChannels(limit = 5) {
        const channels = Object.entries(this.stats.channels)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.messages - a.messages)
            .slice(0, limit);
        
        return channels;
    }

    async createStatsEmbed(stats, period = 'daily') {
        const embed = new EmbedBuilder()
            .setTitle(`📊 Statistiques ${this.getPeriodLabel(period)}`)
            .setColor('#0099ff')
            .setTimestamp();
        
        // Statistiques générales
        embed.addFields(
            {
                name: '💬 Messages',
                value: stats.messages?.toString() || '0',
                inline: true
            },
            {
                name: '👥 Membres totaux',
                value: stats.totalMembers?.toString() || '0',
                inline: true
            },
            {
                name: '📈 Activité',
                value: this.calculateActivityTrend(period),
                inline: true
            }
        );
        
        // Mouvements de membres
        if (stats.membersJoined > 0 || stats.membersLeft > 0) {
            embed.addFields({
                name: '🚪 Mouvements',
                value: `+${stats.membersJoined} / -${stats.membersLeft}`,
                inline: true
            });
        }
        
        // Top membres
        const topMembers = await this.getTopMembers(5);
        if (topMembers.length > 0) {
            const membersList = topMembers
                .map((member, index) => `${index + 1}. ${member.displayName}: ${member.messages} messages`)
                .join('\n');
            
            embed.addFields({
                name: '🏆 Top Membres',
                value: membersList,
                inline: false
            });
        }
        
        // Top canaux
        const topChannels = await this.getTopChannels(3);
        if (topChannels.length > 0) {
            const channelsList = topChannels
                .map((channel, index) => `${index + 1}. #${channel.name}: ${channel.messages} messages`)
                .join('\n');
            
            embed.addFields({
                name: '📺 Top Canaux',
                value: channelsList,
                inline: false
            });
        }
        
        return embed;
    }

    getPeriodLabel(period) {
        const labels = {
            daily: 'du jour',
            weekly: 'de la semaine',
            monthly: 'du mois'
        };
        return labels[period] || 'du jour';
    }

    calculateActivityTrend(period) {
        // Calculer la tendance d'activité (simplifié)
        const current = this.getStats(period);
        // Logique de comparaison avec la période précédente
        return '📈 En hausse'; // Placeholder
    }

    async generateCSVData(period = 'daily') {
        const stats = await this.getStats(period);
        const topMembers = await this.getTopMembers(10);
        const topChannels = await this.getTopChannels(5);
        
        return {
            general: stats,
            topMembers,
            topChannels,
            period,
            generatedAt: moment().toISOString()
        };
    }

    async checkActivityAlerts() {
        if (!config.alerts.enabled) return;
        
        const today = moment().format('YYYY-MM-DD');
        const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
        
        const todayStats = this.stats.daily[today];
        const yesterdayStats = this.stats.daily[yesterday];
        
        if (!todayStats || !yesterdayStats) return;
        
        const alerts = [];
        
        // Vérifier la baisse d'activité des messages
        const messageDecrease = ((yesterdayStats.messages - todayStats.messages) / yesterdayStats.messages) * 100;
        if (messageDecrease > config.alerts.thresholds.message_decrease) {
            alerts.push({
                type: 'message_decrease',
                value: messageDecrease.toFixed(1),
                threshold: config.alerts.thresholds.message_decrease
            });
        }
        
        // Vérifier la baisse de membres
        const memberDecrease = yesterdayStats.totalMembers - todayStats.totalMembers;
        if (memberDecrease > config.alerts.thresholds.member_decrease) {
            alerts.push({
                type: 'member_decrease',
                value: memberDecrease,
                threshold: config.alerts.thresholds.member_decrease
            });
        }
        
        return alerts;
    }
}

module.exports = StatsManager;