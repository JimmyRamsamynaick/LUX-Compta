const { Events } = require('discord.js');
const cron = require('node-cron');
const VoiceSession = require('../models/VoiceSession');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`🚀 ${client.user.tag} is online!`);

        // Close any "stuck" voice sessions (where bot crashed while user was in voice)
        // We set end_time to now for any session that is still null
        // Note: Ideally we should check if they are actually in voice, but for simplicity we close them.
        try {
            const now = new Date();
            // Find open sessions
            // Note: Mongoose < 5.x or simple updateMany doesn't support aggregation pipeline in second argument directly without explicit option or if strictly typed?
            // Actually, updateMany with pipeline IS supported in recent MongoDB versions, but Mongoose might need [ ] syntax which we used.
            // The error "Cannot pass an array to query updates unless the `updatePipeline` option is set" suggests strict mode issue or version mismatch.
            // Let's use a simpler approach: fetch then update, or just use a standard update without referencing other fields if possible.
            // BUT we need `duration` = now - start_time.
            // Workaround: Loop through them (safe and simple for "stuck" sessions which shouldn't be millions).
            
            const stuckSessions = await VoiceSession.find({ end_time: null });
            
            if (stuckSessions.length > 0) {
                for (const session of stuckSessions) {
                    session.end_time = now;
                    session.duration = now - session.start_time;
                    await session.save();
                }
                console.log(`Closed ${stuckSessions.length} stuck voice sessions.`);
            }
        } catch (error) {
            console.error('Error closing stuck sessions:', error);
        }

        // Schedule Monthly Report (Last day of month at 23:59)
        // Checks on 28th, 29th, 30th, 31st
        cron.schedule('59 23 28-31 * *', async () => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            // Check if tomorrow is the 1st of the next month
            if (tomorrow.getDate() === 1) {
                console.log('📅 End of month detected. Generating monthly reports...');
                
                // Define period: First day of THIS month to First day of NEXT month
                // This covers the entire current month
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

                try {
                    const { generateMonthlyReport } = require('../utils/reportGenerator');
                    await generateMonthlyReport(client, startOfMonth, endOfMonth);
                } catch (error) {
                    console.error('Error generating monthly report:', error);
                }
            }
        }, {
            timezone: process.env.TIMEZONE || 'Europe/Luxembourg'
        });

        // Schedule Server Status Update (Every 10 minutes)
        cron.schedule('*/10 * * * *', async () => {
            console.log('🔄 Running scheduled server status update...');
            try {
                const { updateServerStatus } = require('../utils/serverStatus');
                await updateServerStatus(client);
            } catch (error) {
                console.error('Error updating server status:', error);
            }
        });

        // Run an immediate update 5 seconds after startup to refresh status
        setTimeout(async () => {
            console.log('🔄 Running initial server status update...');
            try {
                const { updateServerStatus } = require('../utils/serverStatus');
                await updateServerStatus(client);
            } catch (error) {
                console.error('Error running initial server status update:', error);
            }
        }, 5000);

        console.log('📅 Scheduled tasks initialized.');
    },
};
