const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const StatsHelper = require('./statsHelper');
const Member = require('../models/Member');
const ServerConfig = require('../models/ServerConfig');

async function generateMonthlyReport(client, customStartDate = null, customEndDate = null, customRecipient = null, targetGuildId = null) {
    const now = new Date();
    // Default: Previous month range
    let startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let endOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (customStartDate) startOfMonth = customStartDate;
    if (customEndDate) endOfMonth = customEndDate;

    console.log(`Generating monthly reports for period: ${startOfMonth.toISOString()} to ${endOfMonth.toISOString()}`);

    // Iterate over all guilds the bot is in
    for (const guild of client.guilds.cache.values()) {
        if (targetGuildId && guild.id !== targetGuildId) continue;

        try {
            // Check if email reporting is explicitly disabled
            const activeConfig = await ServerConfig.findOne({ guild_id: guild.id, key: 'report_email_active' });
            if (activeConfig && activeConfig.value === 'false' && !customRecipient) {
                console.log(`Email reports disabled for guild ${guild.name}. Skipping.`);
                continue;
            }

            // 1. Get Recipient Email for this Guild
            let recipient = customRecipient;
            
            if (!recipient) {
                const config = await ServerConfig.findOne({ guild_id: guild.id, key: 'report_email' });
                if (config) {
                    recipient = config.value;
                }
            }

            if (!recipient) {
                console.log(`No email configured for guild ${guild.name} (${guild.id}). Skipping.`);
                continue;
            }

            // 2. Fetch new members for THIS guild only
            const newMembers = await Member.find({
                guild_id: guild.id,
                joined_at: { $gte: startOfMonth, $lt: endOfMonth }
            });

            if (newMembers.length === 0) {
                console.log(`No new members for guild ${guild.name}.`);
                // Optional: Send empty report? For now, let's skip to avoid spam if empty.
                // Unless it's a manual test (customRecipient present)
                if (!customRecipient) continue;
            }

            // Fetch bans for status check
            let bannedUsers = new Set();
            try {
                const bans = await guild.bans.fetch();
                bans.forEach(ban => bannedUsers.add(ban.user.id));
            } catch (err) {
                console.log(`Could not fetch bans for guild ${guild.name}: ${err.message}`);
            }

            // 3. Prepare Data
            const records = [];
            for (const member of newMembers) {
                const stats = await StatsHelper.getUserStats(member.user_id, member.guild_id);
                
                let detailedStatus = 'Présent';
                if (member.status === 'left' || member.left_at) {
                    if (bannedUsers.has(member.user_id)) {
                        detailedStatus = 'Banni';
                    } else {
                        detailedStatus = 'Parti';
                    }
                }

                records.push({
                    id: member.user_id,
                    username: member.username || 'Unknown',
                    guild_name: guild.name,
                    joined_at: new Date(member.joined_at).toISOString(),
                    status: detailedStatus,
                    activity_score: stats.score,
                    messages: stats.messages.count_total,
                    voice_hours: stats.voice.hours
                });
            }

            // 4. Generate CSV
            const reportsDir = path.join(__dirname, '../../reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir);
            }

            const safeGuildName = guild.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const filename = `report_${safeGuildName}_${startOfMonth.toISOString().split('T')[0]}.csv`;
            const filePath = path.join(reportsDir, filename);

            const csvWriter = createCsvWriter({
                path: filePath,
                header: [
                    {id: 'id', title: 'User ID'},
                    {id: 'username', title: 'Username'},
                    {id: 'guild_name', title: 'Guild Name'},
                    {id: 'joined_at', title: 'Joined At'},
                    {id: 'status', title: 'Status'},
                    {id: 'activity_score', title: 'Activity Score'},
                    {id: 'messages', title: 'Total Messages'},
                    {id: 'voice_hours', title: 'Voice Hours'}
                ]
            });

            await csvWriter.writeRecords(records);
            console.log(`Report generated for ${guild.name}: ${filePath}`);

            // 5. Send Email
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                const transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    port: process.env.EMAIL_PORT,
                    secure: false, 
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || process.env.EMAIL_USER, // Use configured sender
                    to: process.env.EMAIL_USER, // Send to self (Bot email)
                    bcc: recipient, // Send to recipients as BCC (CCI)
                    subject: `📊 Rapport Mensuel - ${guild.name}`,
                    text: `Bonjour,\n\nVeuillez trouver ci-joint le rapport mensuel des nouveaux membres pour le serveur "${guild.name}" sur la période du ${startOfMonth.toLocaleDateString()} au ${endOfMonth.toLocaleDateString()}.\n\nNombre de nouveaux membres : ${newMembers.length}\n\nCordialement,\nLe Bot Lux Compta`,
                    attachments: [{ filename: filename, path: filePath }]
                });
                console.log(`Email sent successfully (BCC) to ${recipient} for guild ${guild.name}`);
            } else {
                console.log('SMTP configuration missing in .env');
            }

        } catch (error) {
            console.error(`Error processing report for guild ${guild.name}:`, error);
        }
    }
}

module.exports = { generateMonthlyReport };
