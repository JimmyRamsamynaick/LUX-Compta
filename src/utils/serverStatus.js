const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const StatsHelper = require('./statsHelper');
const ServerConfig = require('../models/ServerConfig');

async function generateServerStatusPayload(client, guild) {
    // Force fetch members to get accurate numbers
    let members;
    try {
        // Try to fetch members with a timeout
        members = await guild.members.fetch({ time: 5000 });
    } catch (error) {
        console.warn(`Failed to fetch all members for guild ${guild.name}:`, error.message);
        members = guild.members.cache;
    }

    const totalMembers = guild.memberCount;
    const onlineMembers = members.filter(m => m.presence?.status && m.presence.status !== 'offline').size;
    const voiceMembers = members.filter(m => m.voice.channel).size;
    
    // DB Stats
    const stats = await StatsHelper.getServerStats(guild.id);
    
    // Percentages & Trends
    const activePercent = totalMembers > 0 ? Math.round((onlineMembers / totalMembers) * 100) : 0;
    
    const msgTrend = stats.comparison.messages.diff >= 0 ? '📈' : '📉';
    const msgTrendSign = stats.comparison.messages.diff >= 0 ? '+' : '';
    
    const voiceTrend = stats.comparison.voice.diff >= 0 ? '📈' : '📉';
    const voiceTrendSign = stats.comparison.voice.diff >= 0 ? '+' : '';

    const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle(`📊 État du Serveur: ${guild.name}`)
        .setDescription(`> Dernière actualisation : <t:${Math.floor(Date.now() / 1000)}:R>`)
        .addFields(
            { 
                name: '👥 Population', 
                value: `>>> Total : **${totalMembers}**\nEn ligne : **${onlineMembers}** (${activePercent}%)\nVocal : **${voiceMembers}**`, 
                inline: true 
            },
            { 
                name: '📈 Tendance Hebdo (7j)', 
                value: `>>> Messages : **${stats.comparison.messages.current}** (${msgTrend} ${msgTrendSign}${stats.comparison.messages.percent}%)\nVocal : **${Math.floor(stats.comparison.voice.current / 60)}h** (${voiceTrend} ${voiceTrendSign}${stats.comparison.voice.percent}%)`, 
                inline: true 
            },
            { 
                name: '📅 Ce Mois-ci', 
                value: `>>> Arrivées : **+${stats.month.joined}**\nDéparts : **-${stats.month.left}**\nMessages : **${stats.month.messages}**`, 
                inline: true 
            }
        )
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setFooter({ text: `LUX Compta • Statistiques en temps réel` })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('refresh_status')
                .setLabel('Actualiser')
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Secondary)
        );

    return { embeds: [embed], components: [row] };
}

// Wrapper for backward compatibility if needed, though we should switch to payload
async function generateServerStatusEmbed(client, guild) {
    const payload = await generateServerStatusPayload(client, guild);
    return payload.embeds[0];
}

async function updateServerStatus(client, targetGuildId = null) {
    try {
        let query = { key: 'status_channel_id' };
        if (targetGuildId) {
            query.guild_id = targetGuildId;
        }

        const channelConfigs = await ServerConfig.find(query);

        for (const channelConfig of channelConfigs) {
            const guildId = channelConfig.guild_id;
            const channelId = channelConfig.value;

            const messageConfig = await ServerConfig.findOne({ guild_id: guildId, key: 'status_message_id' });
            if (!messageConfig) continue;

            const messageId = messageConfig.value;

            try {
                const channel = await client.channels.fetch(channelId);
                if (!channel) continue;

                const message = await channel.messages.fetch(messageId);
                if (!message) continue;

                const payload = await generateServerStatusPayload(client, channel.guild);
                await message.edit(payload);
            } catch (err) {
                console.error(`Failed to update status for guild ${guildId}:`, err.message);
            }
        }
        
    } catch (error) {
        console.error('Error updating server status:', error);
    }
}

module.exports = { generateServerStatusEmbed, generateServerStatusPayload, updateServerStatus };
