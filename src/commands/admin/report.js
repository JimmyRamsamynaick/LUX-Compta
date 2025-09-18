const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('📊 Générer et gérer les rapports')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('generate')
                .setDescription('Générer un nouveau rapport')
                .addStringOption(option =>
                    option
                        .setName('period')
                        .setDescription('Période du rapport')
                        .setRequired(true)
                        .addChoices(
                            { name: '📅 Quotidien', value: 'daily' },
                            { name: '📆 Hebdomadaire', value: 'weekly' },
                            { name: '🗓️ Mensuel', value: 'monthly' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lister les rapports disponibles')
                .addStringOption(option =>
                    option
                        .setName('period')
                        .setDescription('Filtrer par période')
                        .setRequired(false)
                        .addChoices(
                            { name: '📅 Quotidien', value: 'daily' },
                            { name: '📆 Hebdomadaire', value: 'weekly' },
                            { name: '🗓️ Mensuel', value: 'monthly' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('Envoyer un rapport par email')
                .addStringOption(option =>
                    option
                        .setName('filename')
                        .setDescription('Nom du fichier de rapport')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('email')
                        .setDescription('Adresse email de destination')
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        const reportManager = interaction.client.managers.report;
        const emailManager = interaction.client.managers.email;
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'generate':
                    await this.handleGenerate(interaction, reportManager);
                    break;
                case 'list':
                    await this.handleList(interaction, reportManager);
                    break;
                case 'send':
                    await this.handleSend(interaction, reportManager, emailManager);
                    break;
            }
        } catch (error) {
            console.error('❌ Erreur dans la commande report:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de l\'exécution de la commande.')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleGenerate(interaction, reportManager) {
        await interaction.deferReply();

        const period = interaction.options.getString('period');
        
        const embed = new EmbedBuilder()
            .setColor('#ffa500')
            .setTitle('⏳ Génération du rapport en cours...')
            .setDescription(`Génération du rapport ${this.getPeriodLabel(period)} en cours...`)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        try {
            const result = await reportManager.generateReport(period);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Rapport généré avec succès')
                .setDescription(`Le rapport ${this.getPeriodLabel(period)} a été généré avec succès.`)
                .addFields(
                    { name: '📄 Fichier', value: result.filename, inline: true },
                    { name: '📊 Entrées', value: result.totalEntries.toString(), inline: true },
                    { name: '📅 Période', value: this.getPeriodLabel(period), inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Erreur de génération')
                .setDescription('Impossible de générer le rapport.')
                .addFields(
                    { name: '🔍 Détails', value: error.message }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleList(interaction, reportManager) {
        await interaction.deferReply();

        const period = interaction.options.getString('period');
        
        try {
            const reports = await reportManager.getReportsList(period);
            
            if (reports.length === 0) {
                const noReportsEmbed = new EmbedBuilder()
                    .setColor('#ffa500')
                    .setTitle('📋 Aucun rapport trouvé')
                    .setDescription(period ? 
                        `Aucun rapport ${this.getPeriodLabel(period)} trouvé.` : 
                        'Aucun rapport disponible.'
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [noReportsEmbed] });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📋 Liste des rapports')
                .setDescription(`${reports.length} rapport(s) trouvé(s)`)
                .setTimestamp();

            // Limiter à 10 rapports pour éviter de dépasser la limite des fields
            const displayReports = reports.slice(0, 10);
            
            displayReports.forEach((report, index) => {
                embed.addFields({
                    name: `${index + 1}. ${report.filename}`,
                    value: `📅 ${this.getPeriodLabel(report.period)} - ${report.date.toLocaleDateString('fr-FR')}`,
                    inline: false
                });
            });

            if (reports.length > 10) {
                embed.setFooter({ text: `... et ${reports.length - 10} autre(s) rapport(s)` });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Erreur')
                .setDescription('Impossible de récupérer la liste des rapports.')
                .addFields(
                    { name: '🔍 Détails', value: error.message }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleSend(interaction, reportManager, emailManager) {
        await interaction.deferReply();

        const filename = interaction.options.getString('filename');
        const email = interaction.options.getString('email');
        
        const embed = new EmbedBuilder()
            .setColor('#ffa500')
            .setTitle('📧 Envoi du rapport en cours...')
            .setDescription(`Envoi du rapport "${filename}" par email...`)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        try {
            const result = await emailManager.sendReport(filename, email);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Rapport envoyé avec succès')
                .setDescription(`Le rapport "${filename}" a été envoyé par email.`)
                .addFields(
                    { name: '📧 Destinataire', value: result.recipient, inline: true },
                    { name: '📄 Fichier', value: filename, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Erreur d\'envoi')
                .setDescription('Impossible d\'envoyer le rapport par email.')
                .addFields(
                    { name: '🔍 Détails', value: error.message }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    getPeriodLabel(period) {
        const labels = {
            'daily': 'Quotidien',
            'weekly': 'Hebdomadaire',
            'monthly': 'Mensuel'
        };
        return labels[period] || period;
    }
};