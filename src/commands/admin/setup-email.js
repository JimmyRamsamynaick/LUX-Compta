const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ServerConfig = require('../../models/ServerConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-email')
        .setDescription('Gérer les adresses emails pour les rapports mensuels')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Ajouter une adresse email')
                .addStringOption(option =>
                    option.setName('email')
                        .setDescription('L\'adresse email à ajouter')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Supprimer une adresse email')
                .addStringOption(option =>
                    option.setName('email')
                        .setDescription('L\'adresse email à supprimer')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lister les adresses emails configurées'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            let config = await ServerConfig.findOne({ guild_id: guildId, key: 'report_email' });
            let emails = config ? config.value.split(',').filter(e => e) : [];

            if (subcommand === 'add') {
                const email = interaction.options.getString('email');
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                
                if (!emailRegex.test(email)) {
                    return interaction.editReply({ content: '❌ Adresse email invalide.' });
                }

                if (emails.includes(email)) {
                    return interaction.editReply({ content: '⚠️ Cette adresse email est déjà configurée.' });
                }

                emails.push(email);
                await ServerConfig.findOneAndUpdate(
                    { guild_id: guildId, key: 'report_email' },
                    { value: emails.join(',') },
                    { upsert: true, new: true }
                );

                // Auto-enable if it was disabled
                await ServerConfig.findOneAndUpdate(
                    { guild_id: guildId, key: 'report_email_active' },
                    { value: 'true' },
                    { upsert: true, new: true }
                );

                return interaction.editReply({ 
                    content: `✅ Email **${email}** ajouté avec succès !\nDestinataires actuels : ${emails.join(', ')}\n(Le système d'envoi est **activé**)` 
                });

            } else if (subcommand === 'remove') {
                const email = interaction.options.getString('email');

                if (!emails.includes(email)) {
                    return interaction.editReply({ content: '⚠️ Cette adresse email n\'est pas dans la liste.' });
                }

                emails = emails.filter(e => e !== email);
                
                if (emails.length === 0) {
                    await ServerConfig.deleteOne({ guild_id: guildId, key: 'report_email' });
                    return interaction.editReply({ content: `✅ Email **${email}** supprimé. Plus aucune adresse configurée.` });
                } else {
                    await ServerConfig.findOneAndUpdate(
                        { guild_id: guildId, key: 'report_email' },
                        { value: emails.join(',') },
                        { new: true }
                    );
                    return interaction.editReply({ 
                        content: `✅ Email **${email}** supprimé avec succès !\nDestinataires restants : ${emails.join(', ')}` 
                    });
                }

            } else if (subcommand === 'list') {
                if (emails.length === 0) {
                    return interaction.editReply({ content: 'ℹ️ Aucune adresse email configurée pour ce serveur.' });
                }
                return interaction.editReply({ 
                    content: `📧 **Emails configurés pour les rapports :**\n- ${emails.join('\n- ')}` 
                });
            }

        } catch (error) {
            console.error('Error in setup-email:', error);
            await interaction.editReply({ content: '❌ Une erreur est survenue lors de la configuration.' });
        }
    },
};
