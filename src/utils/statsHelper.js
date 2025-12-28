const Message = require('../models/Message');
const VoiceSession = require('../models/VoiceSession');
const Member = require('../models/Member');

const StatsHelper = {
    getUserStats: async (userId, guildId) => {
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 29);

        // 1. Messages Stats
        const messageStats = await Message.aggregate([
            { $match: { user_id: userId, guild_id: guildId } },
            { 
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    count_1d: { 
                        $sum: { $cond: [{ $gte: ["$timestamp", today] }, 1, 0] } 
                    },
                    count_7d: { 
                        $sum: { $cond: [{ $gte: ["$timestamp", sevenDaysAgo] }, 1, 0] } 
                    },
                    count_30d: { 
                        $sum: { $cond: [{ $gte: ["$timestamp", thirtyDaysAgo] }, 1, 0] } 
                    }
                }
            }
        ]);

        const msgs = messageStats[0] || { total: 0, count_1d: 0, count_7d: 0, count_30d: 0 };

        // 2. Voice Stats
        // Fetch all sessions that overlap with the 30-day period
        // Condition: start_time < now AND (end_time IS NULL OR end_time > thirtyDaysAgo)
        const sessions = await VoiceSession.find({
            user_id: userId,
            guild_id: guildId,
            start_time: { $lt: now },
            $or: [
                { end_time: null },
                { end_time: { $gt: thirtyDaysAgo } }
            ]
        });

        let totalDuration = 0; // Total ever
        let duration1d = 0;
        let duration7d = 0;
        let duration30d = 0;

        // For total duration, we might need a separate aggregation if the history is huge,
        // but let's assume we can calculate total from the sessions query or a separate count.
        // Actually, for total duration, we should aggregate all closed sessions + current open.
        
        const totalAgg = await VoiceSession.aggregate([
            { $match: { user_id: userId, guild_id: guildId, duration: { $ne: null } } },
            { $group: { _id: null, total: { $sum: "$duration" } } }
        ]);
        totalDuration = (totalAgg[0]?.total || 0);

        // Process sessions for periods
        for (const session of sessions) {
            const start = session.start_time.getTime();
            const end = session.end_time ? session.end_time.getTime() : now.getTime();
            
            // Add open session duration to total
            if (!session.end_time) {
                totalDuration += (now.getTime() - start);
            }

            // Calculate Overlap
            const calculateOverlap = (periodStart) => {
                const pStart = periodStart.getTime();
                const overlapStart = Math.max(start, pStart);
                const overlapEnd = Math.min(end, now.getTime());
                return Math.max(0, overlapEnd - overlapStart);
            };

            duration1d += calculateOverlap(today);
            duration7d += calculateOverlap(sevenDaysAgo);
            duration30d += calculateOverlap(thirtyDaysAgo);
        }

        const score = msgs.total + Math.floor(totalDuration / 60000);

        return {
            messages: {
                count_total: msgs.total,
                count_1d: msgs.count_1d,
                count_7d: msgs.count_7d,
                count_30d: msgs.count_30d
            },
            voice: {
                total_duration: totalDuration,
                duration_1d: duration1d,
                duration_7d: duration7d,
                duration_30d: duration30d,
                hours: Math.floor(totalDuration / 3600000),
                minutes: Math.floor((totalDuration % 3600000) / 60000)
            },
            score: score
        };
    },

    getRank: async (userId, guildId, userScore) => {
         return "Top ?"; 
    },

    getTopChannels: async (userId, guildId) => {
        const topChannels = await Message.aggregate([
            { $match: { user_id: userId, guild_id: guildId } },
            { $group: { _id: "$channel_id", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        return topChannels.map(c => ({ channel_id: c._id, count: c.count }));
    },

    getActivityHistory: async (userId, guildId) => {
        const days = [];
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Prepare last 7 days buckets
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            days.push({
                date: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
                start: d.getTime(),
                end: d.getTime() + 24 * 60 * 60 * 1000
            });
        }

        const history = {
            labels: days.map(d => d.date),
            messages: [],
            voice: []
        };

        const sevenDaysAgoTimestamp = days[0].start;
        const sevenDaysAgoDate = new Date(sevenDaysAgoTimestamp);

        // Messages History
        const msgs = await Message.aggregate([
            { 
                $match: { 
                    user_id: userId, 
                    guild_id: guildId, 
                    timestamp: { $gte: sevenDaysAgoDate } 
                } 
            },
            {
                $group: {
                    _id: { 
                        $dateToString: { format: "%Y-%m-%d", date: "$timestamp", timezone: "Europe/Paris" } 
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Voice History (Overlap Logic)
        const sessions = await VoiceSession.find({
            user_id: userId,
            guild_id: guildId,
            start_time: { $lt: now },
            $or: [
                { end_time: null },
                { end_time: { $gt: sevenDaysAgoDate } }
            ]
        });

        // Fill Data
        for (const day of days) {
            // 1. Messages
            // We need to match the day date string. 
            // Note: $dateToString with timezone might shift things if not careful.
            // Simpler: filter the aggregate result in JS or just query count per day range (loop).
            // Looping query is cleaner for exact day boundaries.
            
            const dayStart = new Date(day.start);
            const dayEnd = new Date(day.end);

            const msgCount = await Message.countDocuments({
                user_id: userId,
                guild_id: guildId,
                timestamp: { $gte: dayStart, $lt: dayEnd }
            });
            history.messages.push(msgCount);

            // 2. Voice
            let dayVoiceDuration = 0;
            for (const session of sessions) {
                const sStart = session.start_time.getTime();
                const sEnd = session.end_time ? session.end_time.getTime() : now.getTime();
                
                const overlapStart = Math.max(sStart, day.start);
                const overlapEnd = Math.min(sEnd, day.end);
                
                if (overlapEnd > overlapStart) {
                    dayVoiceDuration += (overlapEnd - overlapStart);
                }
            }
            history.voice.push(Math.floor(dayVoiceDuration / 60000));
        }

        return history;
    },
    
    getServerStats: async (guildId) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // 1. Monthly Stats (Existing logic)
        const joinedMonth = await Member.countDocuments({ 
            guild_id: guildId, 
            joined_at: { $gte: startOfMonth } 
        });
        
        const leftMonth = await Member.countDocuments({ 
            guild_id: guildId, 
            left_at: { $gte: startOfMonth } 
        });

        const messagesMonth = await Message.countDocuments({
            guild_id: guildId,
            timestamp: { $gte: startOfMonth }
        });

        // Monthly Voice
        const sessionsMonth = await VoiceSession.find({
            guild_id: guildId,
            start_time: { $lt: now },
            $or: [
                { end_time: null },
                { end_time: { $gt: startOfMonth } }
            ]
        });

        let voiceDurationMonth = 0;
        for (const session of sessionsMonth) {
            const start = session.start_time.getTime();
            const end = session.end_time ? session.end_time.getTime() : now.getTime();
            const pStart = startOfMonth.getTime();
            const overlapStart = Math.max(start, pStart);
            const overlapEnd = Math.min(end, now.getTime());
            if (overlapEnd > overlapStart) voiceDurationMonth += (overlapEnd - overlapStart);
        }

        // 2. Weekly History (Last 7 Days) for Chart
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            days.push({
                date: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
                start: d.getTime(),
                end: d.getTime() + 24 * 60 * 60 * 1000
            });
        }

        const history = {
            labels: days.map(d => d.date),
            messages: [],
            voice: [],
            net_growth: [],
            activity_delta: {
                messages: [],
                voice: []
            }
        };

        const sevenDaysAgoDate = new Date(days[0].start);

        // Fetch all voice sessions for the last 7 days once
        const sessionsWeek = await VoiceSession.find({
            guild_id: guildId,
            start_time: { $lt: now },
            $or: [
                { end_time: null },
                { end_time: { $gt: sevenDaysAgoDate } }
            ]
        });

        // Pre-calculate Day 0 (8 days ago) for first delta calculation
        const dayZeroStart = new Date(days[0].start - 24 * 60 * 60 * 1000);
        const dayZeroEnd = new Date(days[0].start);
        
        let prevDayMsgCount = await Message.countDocuments({
            guild_id: guildId,
            timestamp: { $gte: dayZeroStart, $lt: dayZeroEnd }
        });

        let prevDayVoiceDuration = 0;
        // Optimization: we could fetch 8 days of sessions but re-querying once is fine
        const sessionsDayZero = await VoiceSession.find({
            guild_id: guildId,
            start_time: { $lt: dayZeroEnd },
            $or: [{ end_time: null }, { end_time: { $gt: dayZeroStart } }]
        });

        for (const session of sessionsDayZero) {
            const sStart = session.start_time.getTime();
            const sEnd = session.end_time ? session.end_time.getTime() : now.getTime();
            const overlapStart = Math.max(sStart, dayZeroStart.getTime());
            const overlapEnd = Math.min(sEnd, dayZeroEnd.getTime());
            if (overlapEnd > overlapStart) prevDayVoiceDuration += (overlapEnd - overlapStart);
        }
        prevDayVoiceDuration = Math.floor(prevDayVoiceDuration / 60000);


        for (const day of days) {
            const dayStart = new Date(day.start);
            const dayEnd = new Date(day.end);

            // 1. Daily Messages
            const msgCount = await Message.countDocuments({
                guild_id: guildId,
                timestamp: { $gte: dayStart, $lt: dayEnd }
            });
            history.messages.push(msgCount);
            
            // Delta Messages (Current - Previous Day)
            history.activity_delta.messages.push(msgCount - prevDayMsgCount);
            prevDayMsgCount = msgCount;

            // 2. Daily Voice
            let dayVoiceDuration = 0;
            for (const session of sessionsWeek) {
                const sStart = session.start_time.getTime();
                const sEnd = session.end_time ? session.end_time.getTime() : now.getTime();
                const overlapStart = Math.max(sStart, day.start);
                const overlapEnd = Math.min(sEnd, day.end);
                if (overlapEnd > overlapStart) dayVoiceDuration += (overlapEnd - overlapStart);
            }
            const voiceMins = Math.floor(dayVoiceDuration / 60000);
            history.voice.push(voiceMins);

            // Delta Voice
            history.activity_delta.voice.push(voiceMins - prevDayVoiceDuration);
            prevDayVoiceDuration = voiceMins;

            // 3. Daily Net Growth (Joined - Left)
            const joinedDay = await Member.countDocuments({ 
                guild_id: guildId, 
                joined_at: { $gte: dayStart, $lt: dayEnd } 
            });
            const leftDay = await Member.countDocuments({ 
                guild_id: guildId, 
                left_at: { $gte: dayStart, $lt: dayEnd } 
            });
            history.net_growth.push(joinedDay - leftDay);
        }

        // 3. Comparison (Last 7 days vs Previous 7 days)
        const previousWeekStart = new Date(sevenDaysAgoDate);
        previousWeekStart.setDate(previousWeekStart.getDate() - 7);
        
        // Current Week Totals
        const currentWeekMessages = history.messages.reduce((a, b) => a + b, 0);
        const currentWeekVoice = history.voice.reduce((a, b) => a + b, 0);

        // Previous Week Totals
        const prevWeekMessages = await Message.countDocuments({
            guild_id: guildId,
            timestamp: { $gte: previousWeekStart, $lt: sevenDaysAgoDate }
        });

        // Previous Week Voice
        const sessionsPrevWeek = await VoiceSession.find({
            guild_id: guildId,
            start_time: { $lt: sevenDaysAgoDate },
            $or: [
                { end_time: null },
                { end_time: { $gt: previousWeekStart } }
            ]
        });

        let prevWeekVoice = 0;
        for (const session of sessionsPrevWeek) {
            const start = session.start_time.getTime();
            const end = session.end_time ? session.end_time.getTime() : now.getTime(); // Should cap at 7daysAgoDate strictly speaking for comparison fairness?
            // Actually, for "previous week stats", we compare the closed period [T-14, T-7].
            // So we use strict window.
            const pStart = previousWeekStart.getTime();
            const pEnd = sevenDaysAgoDate.getTime();
            
            const overlapStart = Math.max(start, pStart);
            const overlapEnd = Math.min(end, pEnd);
            
            if (overlapEnd > overlapStart) prevWeekVoice += (overlapEnd - overlapStart);
        }
        prevWeekVoice = Math.floor(prevWeekVoice / 60000); // Minutes

        return {
            month: {
                joined: joinedMonth,
                left: leftMonth,
                messages: messagesMonth,
                voice_hours: Math.floor(voiceDurationMonth / 3600000),
                voice_minutes: Math.floor((voiceDurationMonth % 3600000) / 60000)
            },
            history: history,
            comparison: {
                messages: {
                    current: currentWeekMessages,
                    previous: prevWeekMessages,
                    diff: currentWeekMessages - prevWeekMessages,
                    percent: prevWeekMessages > 0 ? Math.round(((currentWeekMessages - prevWeekMessages) / prevWeekMessages) * 100) : 100
                },
                voice: {
                    current: currentWeekVoice,
                    previous: prevWeekVoice,
                    diff: currentWeekVoice - prevWeekVoice,
                    percent: prevWeekVoice > 0 ? Math.round(((currentWeekVoice - prevWeekVoice) / prevWeekVoice) * 100) : 100
                }
            }
        };
    }
};

module.exports = StatsHelper;
