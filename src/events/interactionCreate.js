const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle Chat Input Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`);
                console.error(error);
                try {
                    const errorPayload = { content: 'Une erreur est survenue lors de l\'exécution de cette commande!', ephemeral: true };
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(errorPayload);
                    } else {
                        await interaction.reply(errorPayload);
                    }
                } catch (handlerError) {
                    console.error('Error sending error message to user:', handlerError);
                }
            }
        } 
        // Handle Buttons
        else if (interaction.isButton()) {
            if (interaction.customId === 'refresh_status') {
                const { updateServerStatus } = require('../utils/serverStatus');
                try {
                    await interaction.deferUpdate();
                    await updateServerStatus(interaction.client, interaction.guild.id);
                    // Optional: Send a fleeting confirmation or just let the update happen
                } catch (error) {
                    console.error('Error refreshing status:', error);
                }
            }
        }
    },
};
