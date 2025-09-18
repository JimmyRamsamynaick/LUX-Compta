const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('alerts')
        .setDescription('Gérer les alertes automatiques du serveur')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('Configurer les alertes')
                .addChannelOption(option =>
                    option
                        .setName('canal')
                        .setDescription('Canal où envoyer les alertes')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName('activé')
                        .setDescription('Activer ou désactiver les alertes')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('seuils')
                .setDescription('Configurer les seuils d\'alerte')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type d\'alerte à configurer')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Baisse d\'activité', value: 'activity_drop' },
                            { name: 'Perte de membres', value: 'member_loss' },
                            { name: 'Absence prolongée', value: 'absence' }
                        )
                )
                .addIntegerOption(option =>
                    option
                        .setName('seuil')
                        .setDescription('Seuil pour déclencher l\'alerte (en %)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Tester les alertes')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type d\'alerte à tester')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Baisse d\'activité', value: 'activity_drop' },
                            { name: 'Perte de membres', value: 'member_loss' },
                            { name: 'Absence prolongée', value: 'absence' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('historique')
                .setDescription('Voir l\'historique des alertes')
                .addIntegerOption(option =>
                    option
                        .setName('limite')
                        .setDescription('Nombre d\'alertes à afficher')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(50)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Voir le statut des alertes')
        ),

    async execute(interaction) {
        try {
            // Vérifier les permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: '❌ Vous devez être administrateur pour utiliser cette commande.',
                    ephemeral: true
                });
            }

            const subcommand = interaction.options.getSubcommand();
            const alertManager = interaction.client.alertManager;

            if (!alertManager) {
                return await interaction.reply({
                    content: '❌ Le gestionnaire d\'alertes n\'est pas disponible.',
                    ephemeral: true
                });
            }

            switch (subcommand) {
                case 'config':
                    await this.handleConfig(interaction, alertManager);
                    break;
                case 'seuils':
                    await this.handleThresholds(interaction, alertManager);
                    break;
                case 'test':
                    await this.handleTest(interaction, alertManager);
                    break;
                case 'historique':
                    await this.handleHistory(interaction, alertManager);
                    break;
                case 'status':
                    await this.handleStatus(interaction, alertManager);
                    break;
            }

        } catch (error) {
            console.error('❌ Erreur dans la commande alerts:', error);
            
            const errorMessage = '❌ Une erreur est survenue lors de l\'exécution de la commande.';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },

    async handleConfig(interaction, alertManager) {
        const canal = interaction.options.getChannel('canal');
        const activé = interaction.options.getBoolean('activé');

        try {
            let updated = false;
            let changes = [];

            if (canal) {
                await alertManager.setAlertChannel(canal.id);
                changes.push(`Canal d'alertes: ${canal}`);
                updated = true;
            }

            if (activé !== null) {
                await alertManager.setAlertsEnabled(activé);
                changes.push(`Alertes: ${activé ? 'Activées' : 'Désactivées'}`);
                updated = true;
            }

            if (updated) {
                const { EmbedBuilder } = require('discord.js');
                
                const embed = new EmbedBuilder()
                    .setTitle('⚙️ Configuration des alertes mise à jour')
                    .setDescription('Les paramètres d\'alertes ont été modifiés avec succès.')
                    .setColor('#00ff00')
                    .addFields([
                        {
                            name: 'Modifications',
                            value: changes.join('\n'),
                            inline: false
                        }
                    ])
                    .setTimestamp();

                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            } else {
                // Afficher la configuration actuelle
                await this.showCurrentConfig(interaction, alertManager);
            }

        } catch (error) {
            console.error('❌ Erreur lors de la configuration:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la configuration des alertes.',
                ephemeral: true
            });
        }
    },

    async handleThresholds(interaction, alertManager) {
        const type = interaction.options.getString('type');
        const seuil = interaction.options.getInteger('seuil');

        try {
            const success = await alertManager.setThreshold(type, seuil);

            if (success) {
                const { EmbedBuilder } = require('discord.js');
                
                const typeNames = {
                    'activity_drop': 'Baisse d\'activité',
                    'member_loss': 'Perte de membres',
                    'absence': 'Absence prolongée'
                };

                const embed = new EmbedBuilder()
                    .setTitle('🎯 Seuil d\'alerte mis à jour')
                    .setDescription(`Le seuil pour "${typeNames[type]}" a été configuré.`)
                    .setColor('#00ff00')
                    .addFields([
                        {
                            name: 'Configuration',
                            value: `**Type:** ${typeNames[type]}\n**Nouveau seuil:** ${seuil}%`,
                            inline: false
                        }
                    ])
                    .setTimestamp();

                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ Erreur lors de la configuration du seuil.',
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('❌ Erreur lors de la configuration du seuil:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la configuration du seuil d\'alerte.',
                ephemeral: true
            });
        }
    },

    async handleTest(interaction, alertManager) {
        const type = interaction.options.getString('type');

        try {
            await interaction.deferReply({ ephemeral: true });

            const testResult = await alertManager.testAlert(type);

            if (testResult.success) {
                const { EmbedBuilder } = require('discord.js');
                
                const typeNames = {
                    'activity_drop': 'Baisse d\'activité',
                    'member_loss': 'Perte de membres',
                    'absence': 'Absence prolongée'
                };

                const embed = new EmbedBuilder()
                    .setTitle('🧪 Test d\'alerte')
                    .setDescription(`Test de l'alerte "${typeNames[type]}" effectué avec succès.`)
                    .setColor('#00ff00')
                    .addFields([
                        {
                            name: 'Résultat',
                            value: testResult.message || 'Alerte de test envoyée',
                            inline: false
                        }
                    ])
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [embed]
                });
            } else {
                await interaction.editReply({
                    content: `❌ Erreur lors du test: ${testResult.error || 'Erreur inconnue'}`
                });
            }

        } catch (error) {
            console.error('❌ Erreur lors du test d\'alerte:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Erreur lors du test de l\'alerte.'
                });
            } else {
                await interaction.reply({
                    content: '❌ Erreur lors du test de l\'alerte.',
                    ephemeral: true
                });
            }
        }
    },

    async handleHistory(interaction, alertManager) {
        const limite = interaction.options.getInteger('limite') || 10;

        try {
            await interaction.deferReply({ ephemeral: true });

            const history = await alertManager.getAlertHistory(limite);

            if (history && history.length > 0) {
                const { EmbedBuilder } = require('discord.js');
                
                const typeNames = {
                    'activity_drop': 'Baisse d\'activité',
                    'member_loss': 'Perte de membres',
                    'absence': 'Absence prolongée'
                };

                const embed = new EmbedBuilder()
                    .setTitle('📋 Historique des alertes')
                    .setDescription(`Les ${history.length} dernières alertes:`)
                    .setColor('#3498db');

                history.forEach((alert, index) => {
                    const date = new Date(alert.timestamp).toLocaleString('fr-FR');
                    const typeName = typeNames[alert.type] || alert.type;
                    
                    embed.addFields([
                        {
                            name: `${index + 1}. ${typeName}`,
                            value: `**Date:** ${date}\n**Message:** ${alert.message || 'Aucun message'}`,
                            inline: false
                        }
                    ]);
                });

                embed.setTimestamp();

                await interaction.editReply({
                    embeds: [embed]
                });
            } else {
                await interaction.editReply({
                    content: '📭 Aucune alerte dans l\'historique.'
                });
            }

        } catch (error) {
            console.error('❌ Erreur lors de la récupération de l\'historique:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Erreur lors de la récupération de l\'historique des alertes.'
                });
            } else {
                await interaction.reply({
                    content: '❌ Erreur lors de la récupération de l\'historique des alertes.',
                    ephemeral: true
                });
            }
        }
    },

    async handleStatus(interaction, alertManager) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const status = await alertManager.getStatus();

            if (status) {
                const { EmbedBuilder } = require('discord.js');
                
                const embed = new EmbedBuilder()
                    .setTitle('📊 Statut des alertes')
                    .setDescription('État actuel du système d\'alertes')
                    .setColor(status.enabled ? '#00ff00' : '#ff0000')
                    .addFields([
                        {
                            name: 'Configuration générale',
                            value: [
                                `**État:** ${status.enabled ? '✅ Activé' : '❌ Désactivé'}`,
                                `**Canal:** ${status.channel ? `<#${status.channel}>` : '❌ Non configuré'}`,
                                `**Dernière vérification:** ${status.lastCheck ? new Date(status.lastCheck).toLocaleString('fr-FR') : 'Jamais'}`
                            ].join('\n'),
                            inline: false
                        },
                        {
                            name: 'Seuils configurés',
                            value: [
                                `**Baisse d'activité:** ${status.thresholds?.activity_drop || 'Non défini'}%`,
                                `**Perte de membres:** ${status.thresholds?.member_loss || 'Non défini'}%`,
                                `**Absence prolongée:** ${status.thresholds?.absence || 'Non défini'}%`
                            ].join('\n'),
                            inline: false
                        },
                        {
                            name: 'Statistiques',
                            value: [
                                `**Alertes envoyées:** ${status.stats?.totalAlerts || 0}`,
                                `**Alertes aujourd'hui:** ${status.stats?.todayAlerts || 0}`,
                                `**Dernière alerte:** ${status.stats?.lastAlert ? new Date(status.stats.lastAlert).toLocaleString('fr-FR') : 'Aucune'}`
                            ].join('\n'),
                            inline: false
                        }
                    ])
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [embed]
                });
            } else {
                await interaction.editReply({
                    content: '❌ Impossible de récupérer le statut des alertes.'
                });
            }

        } catch (error) {
            console.error('❌ Erreur lors de la récupération du statut:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Erreur lors de la récupération du statut des alertes.'
                });
            } else {
                await interaction.reply({
                    content: '❌ Erreur lors de la récupération du statut des alertes.',
                    ephemeral: true
                });
            }
        }
    },

    async showCurrentConfig(interaction, alertManager) {
        try {
            const config = await alertManager.getConfig();
            const { EmbedBuilder } = require('discord.js');
            
            const embed = new EmbedBuilder()
                .setTitle('⚙️ Configuration actuelle des alertes')
                .setDescription('Paramètres actuels du système d\'alertes')
                .setColor('#3498db')
                .addFields([
                    {
                        name: 'État',
                        value: config.enabled ? '✅ Activé' : '❌ Désactivé',
                        inline: true
                    },
                    {
                        name: 'Canal d\'alertes',
                        value: config.channel ? `<#${config.channel}>` : '❌ Non configuré',
                        inline: true
                    },
                    {
                        name: 'Seuils',
                        value: [
                            `**Baisse d'activité:** ${config.thresholds?.activity_drop || 'Non défini'}%`,
                            `**Perte de membres:** ${config.thresholds?.member_loss || 'Non défini'}%`,
                            `**Absence prolongée:** ${config.thresholds?.absence || 'Non défini'}%`
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });

        } catch (error) {
            console.error('❌ Erreur lors de l\'affichage de la configuration:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'affichage de la configuration.',
                ephemeral: true
            });
        }
    }
};