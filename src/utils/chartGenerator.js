const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

const width = 800;
const height = 600;
const chartCallback = (ChartJS) => {
    ChartJS.defaults.color = '#ffffff';
    ChartJS.defaults.font.family = 'sans-serif';
};

const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 700, height: 250, chartCallback });

// Helper to remove emojis from strings (fixes "tofu" boxes in canvas)
const removeEmojis = (str) => {
    if (!str) return '';
    return str
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

async function generateStatsImage(user, stats, history, topChannels) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#23272A';
    ctx.fillRect(0, 0, width, height);

    // Header Background
    ctx.fillStyle = '#2C2F33';
    ctx.fillRect(20, 20, width - 40, 100);

    // Avatar
    try {
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 128 });
        const avatar = await loadImage(avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(70, 70, 40, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 30, 30, 80, 80);
        ctx.restore();
    } catch (e) {
        // Fallback if avatar fails
        ctx.fillStyle = '#7289DA';
        ctx.beginPath();
        ctx.arc(70, 70, 40, 0, Math.PI * 2, true);
        ctx.fill();
    }

    // Username
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(user.username, 130, 60);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#99AAB5';
    ctx.fillText(`Score d'activité: ${stats.score}`, 130, 90);

    // Cards (Messages & Voice)
    const drawCard = (title, value, x, y, color) => {
        ctx.fillStyle = '#2C2F33';
        ctx.fillRect(x, y, 170, 80);
        ctx.fillStyle = color; // Accent bar
        ctx.fillRect(x, y, 5, 80);
        
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#99AAB5';
        ctx.fillText(title, x + 15, y + 25);
        
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(value, x + 15, y + 60);
    };

    drawCard('Auj.', stats.messages.count_1d, 20, 140, '#7289DA');
    drawCard('7 Jours', stats.messages.count_7d, 210, 140, '#7289DA');
    drawCard('30 Jours', stats.messages.count_30d, 400, 140, '#7289DA');
    drawCard('Temps Vocal', `${stats.voice.hours}h ${stats.voice.minutes}m`, 590, 140, '#43B581');

    // Chart
    const configuration = {
        type: 'line',
        data: {
            labels: history.labels,
            datasets: [
                {
                    label: 'Messages',
                    data: history.messages,
                    borderColor: '#7289DA',
                    backgroundColor: 'rgba(114, 137, 218, 0.2)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Vocal (min)',
                    data: history.voice,
                    borderColor: '#43B581',
                    backgroundColor: 'rgba(67, 181, 129, 0.2)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            plugins: {
                legend: { labels: { color: '#FFFFFF' } }
            },
            scales: {
                x: { ticks: { color: '#99AAB5' }, grid: { color: '#2C2F33' } },
                y: { 
                    beginAtZero: true,
                    suggestedMax: 5,
                    ticks: { color: '#99AAB5', stepSize: 1 }, 
                    grid: { color: '#2C2F33' } 
                }
            }
        }
    };

    const chartImage = await chartJSNodeCanvas.renderToBuffer(configuration);
    const chart = await loadImage(chartImage);
    ctx.drawImage(chart, 50, 240);

    // Top Channels
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Top Salons', 50, 520);
    
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#99AAB5';
    let yPos = 550;
    
    topChannels.forEach((channel, index) => {
        if (index < 3) { // Show top 3 horizontally
             ctx.fillText(`#${removeEmojis(channel.name).substring(0, 15)}: ${channel.count}`, 50 + (index * 200), 550);
        }
    });

    return canvas.toBuffer();
}

async function generateMessageStatsImage(user, stats, history, topChannels) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#23272A';
    ctx.fillRect(0, 0, width, height);

    // Header Background
    ctx.fillStyle = '#2C2F33';
    ctx.fillRect(20, 20, width - 40, 100);

    // Avatar
    try {
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 128 });
        const avatar = await loadImage(avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(70, 70, 40, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 30, 30, 80, 80);
        ctx.restore();
    } catch (e) {
        ctx.fillStyle = '#7289DA';
        ctx.beginPath();
        ctx.arc(70, 70, 40, 0, Math.PI * 2, true);
        ctx.fill();
    }

    // Username
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(user.username, 130, 60);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#99AAB5';
    ctx.fillText(`Message Stats`, 130, 90);

    // Cards
    const drawCard = (title, value, x, y, color) => {
        ctx.fillStyle = '#2C2F33';
        ctx.fillRect(x, y, 170, 80);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 5, 80);
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#99AAB5';
        ctx.fillText(title, x + 15, y + 25);
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(value, x + 15, y + 60);
    };

    drawCard('24h', stats.messages.count_1d, 20, 140, '#7289DA');
    drawCard('7d', stats.messages.count_7d, 210, 140, '#7289DA');
    drawCard('30d', stats.messages.count_30d, 400, 140, '#7289DA');
    drawCard('Total', stats.messages.count_total, 590, 140, '#7289DA');

    // Chart
    const configuration = {
        type: 'line',
        data: {
            labels: history.labels,
            datasets: [
                {
                    label: 'Messages',
                    data: history.messages,
                    borderColor: '#7289DA',
                    backgroundColor: 'rgba(114, 137, 218, 0.2)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            plugins: { legend: { labels: { color: '#FFFFFF' } } },
            scales: {
                x: { ticks: { color: '#99AAB5' }, grid: { color: '#2C2F33' } },
                y: { 
                    beginAtZero: true,
                    suggestedMax: 5,
                    ticks: { color: '#99AAB5', stepSize: 1 }, 
                    grid: { color: '#2C2F33' } 
                }
            }
        }
    };

    const chartImage = await chartJSNodeCanvas.renderToBuffer(configuration);
    const chart = await loadImage(chartImage);
    ctx.drawImage(chart, 50, 240);

    // Top Channels
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Top Channels', 50, 520);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#99AAB5';
    
    topChannels.forEach((channel, index) => {
        if (index < 3) {
            ctx.fillText(`#${removeEmojis(channel.name).substring(0, 15)}: ${channel.count}`, 50 + (index * 200), 550);
        }
    });

    return canvas.toBuffer();
}

async function generateVoiceStatsImage(user, stats, history) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#23272A';
    ctx.fillRect(0, 0, width, height);

    // Header Background
    ctx.fillStyle = '#2C2F33';
    ctx.fillRect(20, 20, width - 40, 100);

    // Avatar
    try {
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 128 });
        const avatar = await loadImage(avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(70, 70, 40, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 30, 30, 80, 80);
        ctx.restore();
    } catch (e) {
        ctx.fillStyle = '#7289DA';
        ctx.beginPath();
        ctx.arc(70, 70, 40, 0, Math.PI * 2, true);
        ctx.fill();
    }

    // Username
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(user.username, 130, 60);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#99AAB5';
    ctx.fillText(`Voice Stats`, 130, 90);

    // Cards
    const drawCard = (title, value, x, y, color) => {
        ctx.fillStyle = '#2C2F33';
        ctx.fillRect(x, y, 170, 80);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 5, 80);
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#99AAB5';
        ctx.fillText(title, x + 15, y + 25);
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(value, x + 15, y + 60);
    };

    // Helper to format duration
    const formatDuration = (ms) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };

    drawCard('Auj.', formatDuration(stats.voice.duration_1d), 20, 140, '#43B581');
    drawCard('7 Jours', formatDuration(stats.voice.duration_7d), 210, 140, '#43B581');
    drawCard('30 Jours', formatDuration(stats.voice.duration_30d), 400, 140, '#43B581');
    drawCard('Total', formatDuration(stats.voice.total_duration), 590, 140, '#43B581');

    // Chart
    const configuration = {
        type: 'line',
        data: {
            labels: history.labels,
            datasets: [
                {
                    label: 'Vocal (min)',
                    data: history.voice,
                    borderColor: '#43B581',
                    backgroundColor: 'rgba(67, 181, 129, 0.2)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            plugins: { legend: { labels: { color: '#FFFFFF' } } },
            scales: {
                x: { ticks: { color: '#99AAB5' }, grid: { color: '#2C2F33' } },
                y: { 
                    beginAtZero: true,
                    suggestedMax: 5,
                    ticks: { color: '#99AAB5', stepSize: 1 }, 
                    grid: { color: '#2C2F33' } 
                }
            }
        }
    };

    const chartImage = await chartJSNodeCanvas.renderToBuffer(configuration);
    const chart = await loadImage(chartImage);
    ctx.drawImage(chart, 50, 240);

    return canvas.toBuffer();
}

module.exports = { generateStatsImage, generateMessageStatsImage, generateVoiceStatsImage };
