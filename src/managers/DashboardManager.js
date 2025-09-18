const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

class DashboardManager {
    constructor(client) {
        this.client = client;
        this.configPath = path.join(__dirname, '../../config.json');
        this.dataPath = path.join(__dirname, '../../data');
        this.dashboards = new Map(); // Cache des dashboards actifs
        
        this.initializeDashboard();
    }

    async initializeDashboard() {
        try {
            console.log('📊 DashboardManager initialisé');
            
            // Démarrer la mise à jour automatique des dashboards
            this.startDashboardUpdater();
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du DashboardManager:', error);
        }
    }

    async createMainDashboard(interaction) {
        try {
            const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
            const statsData = await this.loadStatsData();
            
            // Créer l'embed principal
            const embed = new EmbedBuilder()
                .setTitle('📊 Dashboard LUX Compta')
                .setDescription('Tableau de bord en temps réel des statistiques du serveur')
                .setColor(config.embedColor || '#00ff00')
                .setTimestamp();

            // Ajouter les statistiques principales
            const todayStats = this.getTodayStats(statsData);
            const weekStats = this.getWeekStats(statsData);
            const monthStats = this.getMonthStats(statsData);

            embed.addFields([
                {
                    name: '📈 Aujourd\'hui',
                    value: this.formatStatsField(todayStats),
                    inline: true
                },
                {
                    name: '📅 Cette semaine',
                    value: this.formatStatsField(weekStats),
                    inline: true
                },
                {
                    name: '🗓️ Ce mois',
                    value: this.formatStatsField(monthStats),
                    inline: true
                }
            ]);

            // Ajouter les tendances
            const trends = await this.calculateTrends(statsData);
            embed.addFields([
                {
                    name: '📊 Tendances',
                    value: this.formatTrendsField(trends),
                    inline: false
                }
            ]);

            // Créer les composants interactifs
            const components = this.createDashboardComponents();

            // Envoyer ou mettre à jour le dashboard
            const response = await interaction.reply({
                embeds: [embed],
                components: components,
                ephemeral: false
            });

            // Sauvegarder le dashboard dans le cache
            this.dashboards.set(interaction.channelId, {
                messageId: response.id,
                channelId: interaction.channelId,
                userId: interaction.user.id,
                lastUpdate: new Date(),
                autoUpdate: true
            });

            return response;

        } catch (error) {
            console.error('❌ Erreur lors de la création du dashboard:', error);
            throw error;
        }
    }

    async createDetailedDashboard(interaction, type) {
        try {
            const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
            const statsData = await this.loadStatsData();

            let embed;
            let components;

            switch (type) {
                case 'members':
                    embed = await this.createMembersDashboard(statsData, config);
                    break;
                case 'channels':
                    embed = await this.createChannelsDashboard(statsData, config);
                    break;
                case 'activity':
                    embed = await this.createActivityDashboard(statsData, config);
                    break;
                case 'trends':
                    embed = await this.createTrendsDashboard(statsData, config);
                    break;
                default:
                    throw new Error('Type de dashboard non reconnu');
            }

            components = this.createDetailedComponents(type);

            await interaction.reply({
                embeds: [embed],
                components: components,
                ephemeral: true
            });

        } catch (error) {
            console.error('❌ Erreur lors de la création du dashboard détaillé:', error);
            throw error;
        }
    }

    async createMembersDashboard(statsData, config) {
        const embed = new EmbedBuilder()
            .setTitle('👥 Dashboard Membres')
            .setColor(config.embedColor || '#00ff00')
            .setTimestamp();

        // Statistiques des membres
        const memberStats = this.calculateMemberStats(statsData);
        
        embed.addFields([
            {
                name: '📊 Statistiques générales',
                value: [
                    `👥 **Total membres:** ${memberStats.total}`,
                    `🟢 **En ligne:** ${memberStats.online}`,
                    `🔴 **Hors ligne:** ${memberStats.offline}`,
                    `🤖 **Bots:** ${memberStats.bots}`
                ].join('\n'),
                inline: true
            },
            {
                name: '📈 Évolution',
                value: [
                    `📅 **Aujourd'hui:** ${this.formatEvolution(memberStats.todayChange)}`,
                    `📆 **Cette semaine:** ${this.formatEvolution(memberStats.weekChange)}`,
                    `🗓️ **Ce mois:** ${this.formatEvolution(memberStats.monthChange)}`
                ].join('\n'),
                inline: true
            },
            {
                name: '🏆 Top membres actifs',
                value: this.formatTopMembers(memberStats.topActive),
                inline: false
            }
        ]);

        return embed;
    }

    async createChannelsDashboard(statsData, config) {
        const embed = new EmbedBuilder()
            .setTitle('📺 Dashboard Canaux')
            .setColor(config.embedColor || '#00ff00')
            .setTimestamp();

        const channelStats = this.calculateChannelStats(statsData);
        
        embed.addFields([
            {
                name: '📊 Statistiques générales',
                value: [
                    `📺 **Total canaux:** ${channelStats.total}`,
                    `💬 **Texte:** ${channelStats.text}`,
                    `🔊 **Vocal:** ${channelStats.voice}`,
                    `📁 **Catégories:** ${channelStats.categories}`
                ].join('\n'),
                inline: true
            },
            {
                name: '🔥 Canaux les plus actifs',
                value: this.formatTopChannels(channelStats.topActive),
                inline: true
            },
            {
                name: '📈 Activité par heure',
                value: this.formatHourlyActivity(channelStats.hourlyActivity),
                inline: false
            }
        ]);

        return embed;
    }

    async createActivityDashboard(statsData, config) {
        const embed = new EmbedBuilder()
            .setTitle('⚡ Dashboard Activité')
            .setColor(config.embedColor || '#00ff00')
            .setTimestamp();

        const activityStats = this.calculateActivityStats(statsData);
        
        embed.addFields([
            {
                name: '💬 Messages',
                value: [
                    `📝 **Aujourd'hui:** ${activityStats.messages.today}`,
                    `📅 **Cette semaine:** ${activityStats.messages.week}`,
                    `🗓️ **Ce mois:** ${activityStats.messages.month}`
                ].join('\n'),
                inline: true
            },
            {
                name: '🔊 Activité vocale',
                value: [
                    `⏱️ **Temps total:** ${this.formatDuration(activityStats.voice.totalTime)}`,
                    `👥 **Participants uniques:** ${activityStats.voice.uniqueUsers}`,
                    `📊 **Moyenne/jour:** ${this.formatDuration(activityStats.voice.averageDaily)}`
                ].join('\n'),
                inline: true
            },
            {
                name: '📊 Graphique d\'activité',
                value: this.createSimpleChart(activityStats.dailyActivity),
                inline: false
            }
        ]);

        return embed;
    }

    async createTrendsDashboard(statsData, config) {
        const embed = new EmbedBuilder()
            .setTitle('📈 Dashboard Tendances')
            .setColor(config.embedColor || '#00ff00')
            .setTimestamp();

        const trends = await this.calculateTrends(statsData);
        
        embed.addFields([
            {
                name: '📊 Tendances générales',
                value: this.formatTrendsField(trends),
                inline: false
            },
            {
                name: '🔮 Prédictions',
                value: this.formatPredictions(trends),
                inline: false
            },
            {
                name: '⚠️ Alertes',
                value: this.formatAlerts(trends),
                inline: false
            }
        ]);

        return embed;
    }

    createDashboardComponents() {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('dashboard_select')
            .setPlaceholder('Sélectionner une vue détaillée')
            .addOptions([
                {
                    label: 'Membres',
                    description: 'Statistiques détaillées des membres',
                    value: 'members',
                    emoji: '👥'
                },
                {
                    label: 'Canaux',
                    description: 'Activité des canaux',
                    value: 'channels',
                    emoji: '📺'
                },
                {
                    label: 'Activité',
                    description: 'Graphiques d\'activité',
                    value: 'activity',
                    emoji: '⚡'
                },
                {
                    label: 'Tendances',
                    description: 'Analyses et prédictions',
                    value: 'trends',
                    emoji: '📈'
                }
            ]);

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('dashboard_refresh')
                    .setLabel('Actualiser')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔄'),
                new ButtonBuilder()
                    .setCustomId('dashboard_export')
                    .setLabel('Exporter')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊'),
                new ButtonBuilder()
                    .setCustomId('dashboard_settings')
                    .setLabel('Paramètres')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⚙️'),
                new ButtonBuilder()
                    .setCustomId('dashboard_alerts')
                    .setLabel('Alertes')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🚨')
            );

        return [
            new ActionRowBuilder().addComponents(selectMenu),
            buttons
        ];
    }

    createDetailedComponents(type) {
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`dashboard_${type}_refresh`)
                    .setLabel('Actualiser')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔄'),
                new ButtonBuilder()
                    .setCustomId(`dashboard_${type}_export`)
                    .setLabel('Exporter')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊'),
                new ButtonBuilder()
                    .setCustomId('dashboard_back')
                    .setLabel('Retour')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⬅️')
            );

        return [buttons];
    }

    async updateDashboard(channelId) {
        try {
            const dashboard = this.dashboards.get(channelId);
            if (!dashboard || !dashboard.autoUpdate) return;

            const channel = await this.client.channels.fetch(channelId);
            const message = await channel.messages.fetch(dashboard.messageId);

            const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
            const statsData = await this.loadStatsData();

            // Recréer l'embed avec les nouvelles données
            const embed = new EmbedBuilder()
                .setTitle('📊 Dashboard LUX Compta')
                .setDescription('Tableau de bord en temps réel des statistiques du serveur')
                .setColor(config.embedColor || '#00ff00')
                .setTimestamp();

            const todayStats = this.getTodayStats(statsData);
            const weekStats = this.getWeekStats(statsData);
            const monthStats = this.getMonthStats(statsData);

            embed.addFields([
                {
                    name: '📈 Aujourd\'hui',
                    value: this.formatStatsField(todayStats),
                    inline: true
                },
                {
                    name: '📅 Cette semaine',
                    value: this.formatStatsField(weekStats),
                    inline: true
                },
                {
                    name: '🗓️ Ce mois',
                    value: this.formatStatsField(monthStats),
                    inline: true
                }
            ]);

            const trends = await this.calculateTrends(statsData);
            embed.addFields([
                {
                    name: '📊 Tendances',
                    value: this.formatTrendsField(trends),
                    inline: false
                }
            ]);

            // Mettre à jour le message
            await message.edit({
                embeds: [embed],
                components: this.createDashboardComponents()
            });

            // Mettre à jour le cache
            dashboard.lastUpdate = new Date();

        } catch (error) {
            console.error(`❌ Erreur lors de la mise à jour du dashboard ${channelId}:`, error);
        }
    }

    async loadStatsData() {
        try {
            const statsPath = path.join(this.dataPath, 'stats.json');
            const data = await fs.readFile(statsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return { daily: {}, weekly: {}, monthly: {} };
        }
    }

    getTodayStats(statsData) {
        const today = new Date().toISOString().split('T')[0];
        return statsData.daily?.[today] || {};
    }

    getWeekStats(statsData) {
        // Calculer les stats de la semaine
        const weekData = {};
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayData = statsData.daily?.[dateStr] || {};
            for (const [key, value] of Object.entries(dayData)) {
                weekData[key] = (weekData[key] || 0) + (value || 0);
            }
        }
        
        return weekData;
    }

    getMonthStats(statsData) {
        // Calculer les stats du mois
        const monthData = {};
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayData = statsData.daily?.[dateStr] || {};
            for (const [key, value] of Object.entries(dayData)) {
                monthData[key] = (monthData[key] || 0) + (value || 0);
            }
        }
        
        return monthData;
    }

    formatStatsField(stats) {
        return [
            `💬 **Messages:** ${stats.messages || 0}`,
            `👥 **Membres actifs:** ${stats.activeMembers || 0}`,
            `🔊 **Temps vocal:** ${this.formatDuration(stats.voiceTime || 0)}`,
            `⚡ **Interactions:** ${stats.interactions || 0}`
        ].join('\n');
    }

    formatTrendsField(trends) {
        return [
            `📈 **Messages:** ${this.formatTrend(trends.messages)}`,
            `👥 **Membres:** ${this.formatTrend(trends.members)}`,
            `🔊 **Activité vocale:** ${this.formatTrend(trends.voice)}`,
            `⚡ **Engagement:** ${this.formatTrend(trends.engagement)}`
        ].join('\n');
    }

    formatTrend(trend) {
        const arrow = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
        const sign = trend > 0 ? '+' : '';
        return `${arrow} ${sign}${trend.toFixed(1)}%`;
    }

    formatEvolution(change) {
        const sign = change > 0 ? '+' : '';
        const emoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
        return `${emoji} ${sign}${change}`;
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    createSimpleChart(data) {
        // Créer un graphique ASCII simple
        const values = Object.values(data).slice(-7);
        const max = Math.max(...values);
        const bars = values.map(val => {
            const height = Math.round((val / max) * 8);
            return '█'.repeat(height) || '▁';
        });
        
        return `\`\`\`\n${bars.join(' ')}\n\`\`\``;
    }

    async calculateTrends(statsData) {
        // Calculer les tendances sur 7 jours
        const trends = {
            messages: 0,
            members: 0,
            voice: 0,
            engagement: 0
        };

        // Logique de calcul des tendances
        // (Implémentation simplifiée)
        
        return trends;
    }

    calculateMemberStats(statsData) {
        return {
            total: 0,
            online: 0,
            offline: 0,
            bots: 0,
            todayChange: 0,
            weekChange: 0,
            monthChange: 0,
            topActive: []
        };
    }

    calculateChannelStats(statsData) {
        return {
            total: 0,
            text: 0,
            voice: 0,
            categories: 0,
            topActive: [],
            hourlyActivity: {}
        };
    }

    calculateActivityStats(statsData) {
        return {
            messages: {
                today: 0,
                week: 0,
                month: 0
            },
            voice: {
                totalTime: 0,
                uniqueUsers: 0,
                averageDaily: 0
            },
            dailyActivity: {}
        };
    }

    formatTopMembers(members) {
        return members.slice(0, 5).map((member, index) => 
            `${index + 1}. ${member.name} (${member.activity})`
        ).join('\n') || 'Aucune donnée';
    }

    formatTopChannels(channels) {
        return channels.slice(0, 5).map((channel, index) => 
            `${index + 1}. ${channel.name} (${channel.messages} messages)`
        ).join('\n') || 'Aucune donnée';
    }

    formatHourlyActivity(activity) {
        const hours = Object.keys(activity).slice(0, 6);
        return hours.map(hour => 
            `${hour}h: ${activity[hour]} messages`
        ).join('\n') || 'Aucune donnée';
    }

    formatPredictions(trends) {
        return [
            '🔮 **Prédictions pour la semaine prochaine:**',
            `📈 Croissance estimée: ${trends.messages > 0 ? '+' : ''}${(trends.messages * 1.2).toFixed(1)}%`,
            `👥 Nouveaux membres: ~${Math.round(trends.members * 0.1)}`,
            `⚡ Activité prévue: ${trends.engagement > 0 ? 'En hausse' : 'Stable'}`
        ].join('\n');
    }

    formatAlerts(trends) {
        const alerts = [];
        
        if (trends.messages < -10) {
            alerts.push('⚠️ Baisse significative des messages');
        }
        if (trends.members < -5) {
            alerts.push('⚠️ Perte de membres');
        }
        if (trends.engagement < -15) {
            alerts.push('⚠️ Engagement en baisse');
        }
        
        return alerts.length > 0 ? alerts.join('\n') : '✅ Aucune alerte';
    }

    startDashboardUpdater() {
        // Mettre à jour tous les dashboards actifs toutes les 5 minutes
        setInterval(async () => {
            for (const [channelId, dashboard] of this.dashboards) {
                if (dashboard.autoUpdate) {
                    await this.updateDashboard(channelId);
                }
            }
        }, 5 * 60 * 1000); // 5 minutes

        console.log('⏰ Mise à jour automatique des dashboards activée');
    }

    async toggleAutoUpdate(channelId, enabled) {
        const dashboard = this.dashboards.get(channelId);
        if (dashboard) {
            dashboard.autoUpdate = enabled;
            return true;
        }
        return false;
    }

    async removeDashboard(channelId) {
        return this.dashboards.delete(channelId);
    }

    getDashboardInfo(channelId) {
        return this.dashboards.get(channelId);
    }

    getAllDashboards() {
        return Array.from(this.dashboards.values());
    }
}

module.exports = DashboardManager;