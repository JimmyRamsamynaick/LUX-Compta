const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const config = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Gérer la configuration du bot')
        .addSubcommand(subcommand =>
            subcommand
                .setName('afficher')
                .setDescription('Afficher la configuration actuelle')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('modifier')
                .setDescription('Modifier un paramètre de configuration')
                .addStringOption(option =>
                    option.setName('parametre')
                        .setDescription('Paramètre à modifier')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Seuil d\'alerte activité', value: 'alert_threshold' },
                            { name: 'Canal d\'alertes', value: 'alert_channel' },
                            { name: 'Fréquence des commits Git', value: 'git_frequency' },
                            { name: 'Auto-archivage', value: 'auto_archive' },
                            { name: 'Rôles admin', value: 'admin_roles' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Réinitialiser la configuration par défaut')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('backup')
                .setDescription('Sauvegarder la configuration actuelle')
        ),

    async execute(interaction) {
        // Vérifier les permissions admin
        if (!interaction.member.roles.cache.some(role => config.permissions.adminRoles.includes(role.name))) {
            return interaction.reply({
                content: '❌ Vous n\'avez pas les permissions nécessaires pour utiliser cette commande.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'afficher':
                    await this.handleShow(interaction);
                    break;
                case 'modifier':
                    await this.handleModify(interaction);
                    break;
                case 'reset':
                    await this.handleReset(interaction);
                    break;
                case 'backup':
                    await this.handleBackup(interaction);
                    break;
            }
        } catch (error) {
            console.error('Erreur dans la commande config:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'exécution de la commande.',
                ephemeral: true
            });
        }
    },

    async handleShow(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('⚙️ Configuration actuelle')
            .setDescription('Paramètres de configuration du bot LUX Compta')
            .setColor('#0099ff')
            .setTimestamp()
            .setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

        // Bot settings
        embed.addFields(
            { name: '🤖 Bot', value: `**Nom:** ${config.bot.name}\n**Version:** ${config.bot.version}\n**Préfixe:** ${config.bot.prefix}`, inline: true },
            { name: '🌍 Serveur', value: `**Nom:** ${config.server.name}\n**Fuseau:** ${config.server.timezone}`, inline: true },
            { name: '📊 Rapports', value: `**Formats:** ${config.reports.formats.join(', ')}\n**Auto-archivage:** ${config.reports.autoArchive ? '✅' : '❌'}`, inline: true }
        );

        // Alerts settings
        embed.addFields(
            { name: '🚨 Alertes', value: `**Activées:** ${config.alerts.enabled ? '✅' : '❌'}\n**Seuil:** ${config.alerts.activityThreshold}%\n**Cooldown:** ${config.alerts.cooldown}h`, inline: true },
            { name: '🔧 Git', value: `**Auto-commit:** ${config.git.autoCommit ? '✅' : '❌'}\n**Fréquence:** ${config.git.frequency}\n**Tags auto:** ${config.git.autoTag ? '✅' : '❌'}`, inline: true },
            { name: '👥 Permissions', value: `**Admins:** ${config.permissions.adminRoles.join(', ')}\n**Stats:** ${config.permissions.statsAccess.join(', ')}`, inline: true }
        );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_modify')
                    .setLabel('Modifier')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✏️'),
                new ButtonBuilder()
                    .setCustomId('config_backup')
                    .setLabel('Sauvegarder')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💾'),
                new ButtonBuilder()
                    .setCustomId('config_reset')
                    .setLabel('Réinitialiser')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔄')
            );

        await interaction.reply({
            embeds: [embed],
            components: [buttons]
        });
    },

    async handleModify(interaction) {
        const parametre = interaction.options.getString('parametre');
        
        // Créer un modal pour la modification
        const modal = new ModalBuilder()
            .setCustomId(`config_modal_${parametre}`)
            .setTitle(`Modifier: ${this.getParameterLabel(parametre)}`);

        const input = new TextInputBuilder()
            .setCustomId('config_value')
            .setLabel('Nouvelle valeur')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(this.getParameterPlaceholder(parametre))
            .setValue(this.getCurrentValue(parametre).toString())
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(input);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    },

    async handleReset(interaction) {
        await interaction.deferReply();

        try {
            // Créer une sauvegarde avant reset
            const backupPath = path.join(__dirname, '../../../config_backup.json');
            await fs.writeFile(backupPath, JSON.stringify(config, null, 2));

            // Charger la configuration par défaut
            const defaultConfig = require('../../../config.default.json');
            const configPath = path.join(__dirname, '../../../config.json');
            await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));

            const embed = new EmbedBuilder()
                .setTitle('🔄 Configuration réinitialisée')
                .setDescription('La configuration a été réinitialisée aux valeurs par défaut.\nUne sauvegarde a été créée dans `config_backup.json`.')
                .setColor('#ff9900')
                .setTimestamp()
                .setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [embed] });

            // Redémarrer le bot pour appliquer les changements
            setTimeout(() => {
                process.exit(0);
            }, 3000);

        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
            await interaction.editReply({
                content: '❌ Erreur lors de la réinitialisation de la configuration.',
                ephemeral: true
            });
        }
    },

    async handleBackup(interaction) {
        await interaction.deferReply();

        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(__dirname, `../../../config_backup_${timestamp}.json`);
            
            await fs.writeFile(backupPath, JSON.stringify(config, null, 2));

            const embed = new EmbedBuilder()
                .setTitle('💾 Sauvegarde créée')
                .setDescription(`Configuration sauvegardée dans:\n\`config_backup_${timestamp}.json\``)
                .setColor('#00ff00')
                .setTimestamp()
                .setFooter({ text: 'LUX Compta', iconURL: interaction.client.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            await interaction.editReply({
                content: '❌ Erreur lors de la sauvegarde de la configuration.',
                ephemeral: true
            });
        }
    },

    getParameterLabel(param) {
        const labels = {
            'alert_threshold': 'Seuil d\'alerte activité (%)',
            'alert_channel': 'Canal d\'alertes (ID)',
            'git_frequency': 'Fréquence des commits Git',
            'auto_archive': 'Auto-archivage (true/false)',
            'admin_roles': 'Rôles admin (séparés par des virgules)'
        };
        return labels[param] || param;
    },

    getParameterPlaceholder(param) {
        const placeholders = {
            'alert_threshold': '20',
            'alert_channel': '123456789012345678',
            'git_frequency': '0 */6 * * *',
            'auto_archive': 'true',
            'admin_roles': 'Admin,Modérateur'
        };
        return placeholders[param] || '';
    },

    getCurrentValue(param) {
        switch (param) {
            case 'alert_threshold':
                return config.alerts.activityThreshold;
            case 'alert_channel':
                return config.alerts.channelId;
            case 'git_frequency':
                return config.git.frequency;
            case 'auto_archive':
                return config.reports.autoArchive;
            case 'admin_roles':
                return config.permissions.adminRoles.join(',');
            default:
                return '';
        }
    }
};