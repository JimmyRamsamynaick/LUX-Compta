const { EmbedBuilder } = require('discord.js');
const StatsHelper = require('./statsHelper');
const ServerConfig = require('../models/ServerConfig');

async function generateServerStatusEmbed(client, guild) {
    // Force fetch members to get accurate numbers
    const members = await guild.members.fetch();
    const totalMembers = members.size;
    
    const onlineMembers = members.filter(m => m.presence?.status && m.presence.status !== 'offline').size;
    const voiceMembers = members.filter(m => m.voice.channel).size;
    const streamingMembers = members.filter(m => m.voice.streaming).size;
    const mutedMembers = members.filter(m => m.voice.selfMute || m.voice.serverMute).size;

    // DB Stats
    const stats = await StatsHelper.getServerStats(guild.id);
    
    // Percentages
    const activePercent = totalMembers > 0 ? Math.round((onlineMembers / totalMembers) * 100) : 0;
    
    const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle(`📊 État du Serveur: ${guild.name}`)
        .addFields(
            { 
                name: '👥 Membres', 
                value: `Total: **${totalMembers}**\nEn ligne: **${onlineMembers}**\nEn vocal: **${voiceMembers}**`, 
                inline: true 
            },
            { 
                name: '📅 Statistiques du Mois', 
                value: `Messages: **${stats.activity.messages}**\nVocal: **${stats.activity.voice_hours}h ${stats.activity.voice_minutes}m**\nRejoint: **${stats.retention.joined}**\nQuitté: **${stats.retention.left}**`, 
                inline: true 
            },
            { 
                name: '🔴 Activité Live', 
                value: `Actifs: **${activePercent}%**\nStream: **${streamingMembers}**\nMute: **${mutedMembers}**`, 
                inline: true 
            }
        )
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setFooter({ text: `Dernière mise à jour` })
        .setTimestamp();

    return embed;
}

async function updateServerStatus(client, targetGuildId = null) {
    try {
        // If a specific guild ID is provided, update only that guild
        let query = { key: 'status_channel_id' };
        if (targetGuildId) {
            query.guild_id = targetGuildId;
        }

        const channelConfigs = await ServerConfig.find(query);

        for (const channelConfig of channelConfigs) {
            const guildId = channelConfig.guild_id;
            const channelId = channelConfig.value;

            // Find corresponding message ID
            const messageConfig = await ServerConfig.findOne({ guild_id: guildId, key: 'status_message_id' });
            if (!messageConfig) continue;

            const messageId = messageConfig.value;

            try {
                const channel = await client.channels.fetch(channelId);
                if (!channel) continue;

                const message = await channel.messages.fetch(messageId);
                if (!message) continue;

                const embed = await generateServerStatusEmbed(client, channel.guild);
                await message.edit({ embeds: [embed] });
                // console.log(`Updated server status for guild ${guildId}`);
            } catch (err) {
                console.error(`Failed to update status for guild ${guildId}:`, err.message);
            }
        }
        
    } catch (error) {
        console.error('Error updating server status:', error);
    }
}

module.exports = { generateServerStatusEmbed, updateServerStatus };
