const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { createCanvas, loadImage } = require('canvas');

const width = 800;
const height = 600;

const chartCallback = (ChartJS) => {
    ChartJS.defaults.color = '#ffffff';
    ChartJS.defaults.font.family = 'sans-serif';
};

const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 700, height: 300, chartCallback });

async function generateServerStatsImage(guild, stats, onlineCount) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#23272A';
    ctx.fillRect(0, 0, width, height);

    // Header Background
    ctx.fillStyle = '#2C2F33';
    ctx.fillRect(20, 20, width - 40, 100);

    // Guild Icon
    try {
        const iconURL = guild.iconURL({ extension: 'png', size: 128 });
        if (iconURL) {
            const icon = await loadImage(iconURL);
            ctx.save();
            ctx.beginPath();
            ctx.arc(70, 70, 40, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(icon, 30, 30, 80, 80);
            ctx.restore();
        } else {
             // Fallback
            ctx.fillStyle = '#7289DA';
            ctx.beginPath();
            ctx.arc(70, 70, 40, 0, Math.PI * 2, true);
            ctx.fill();
        }
    } catch (e) {
        console.error("Failed to load guild icon", e);
    }

    // Server Name
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(guild.name, 130, 60);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#99AAB5';
    ctx.fillText(`Rapport Hebdomadaire & Mensuel`, 130, 90);

    // Cards
    const drawCard = (title, value, subValue, x, y, color) => {
        ctx.fillStyle = '#2C2F33';
        ctx.fillRect(x, y, 170, 80);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 5, 80);
        
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#99AAB5';
        ctx.fillText(title, x + 15, y + 25);
        
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(value, x + 15, y + 55);

        if (subValue) {
             ctx.font = '14px sans-serif';
             ctx.fillStyle = subValue.includes('+') ? '#43B581' : (subValue.includes('-') ? '#F04747' : '#99AAB5');
             ctx.fillText(subValue, x + 15, y + 75);
        }
    };

    const msgTrend = stats.comparison.messages.diff >= 0 ? `+${stats.comparison.messages.percent}%` : `${stats.comparison.messages.percent}%`;
    const voiceTrend = stats.comparison.voice.diff >= 0 ? `+${stats.comparison.voice.percent}%` : `${stats.comparison.voice.percent}%`;

    drawCard('Messages (7j)', stats.comparison.messages.current, msgTrend, 20, 140, '#7289DA');
    drawCard('Vocal (7j)', `${Math.floor(stats.comparison.voice.current / 60)}h ${stats.comparison.voice.current % 60}m`, voiceTrend, 210, 140, '#43B581');
    drawCard('Nouveaux (Mois)', stats.month.joined, `Départs: ${stats.month.left}`, 400, 140, '#FAA61A');
    drawCard('Total Membres', guild.memberCount, `En ligne: ${onlineCount}`, 590, 140, '#F04747');

    // Calculate scale range to ensure negative axis is visible
    const allValues = [
        ...stats.history.messages,
        ...stats.history.voice,
        ...stats.history.net_growth
    ];
    const maxValue = Math.max(...allValues, 10);
    const suggestedMin = -(maxValue * 0.15); // Ensure at least 15% negative space

    // Chart
    const configuration = {
        type: 'line',
        data: {
            labels: stats.history.labels,
            datasets: [
                {
                    label: 'Messages',
                    data: stats.history.messages,
                    borderColor: '#7289DA',
                    backgroundColor: 'rgba(114, 137, 218, 0.2)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Vocal (min)',
                    data: stats.history.voice,
                    borderColor: '#43B581',
                    backgroundColor: 'rgba(67, 181, 129, 0.2)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Nouveaux Membres',
                    data: stats.history.net_growth,
                    borderColor: '#FAA61A',
                    backgroundColor: 'rgba(250, 166, 26, 0.2)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            plugins: {
                legend: { labels: { color: '#FFFFFF' } }
            },
            scales: {
                x: { ticks: { color: '#FFFFFF' }, grid: { color: '#2C2F33' } },
                y: { 
                    type: 'linear',
                    display: true,
                    position: 'left',
                    suggestedMin: suggestedMin,
                    ticks: { color: '#FFFFFF' }, 
                    grid: { 
                        color: (context) => context.tick.value === 0 ? 'rgba(255, 255, 255, 0.6)' : 'rgba(44, 47, 51, 1)',
                        lineWidth: (context) => context.tick.value === 0 ? 2 : 1
                    },
                    beginAtZero: false // Allow negative values to be shown naturally
                }
            }
        }
    };

    const image = await chartJSNodeCanvas.renderToBuffer(configuration);
    const chartImage = await loadImage(image);
    ctx.drawImage(chartImage, 50, 250, 700, 300); // Draw chart below cards

    return canvas.toBuffer();
}

module.exports = { generateServerStatsImage };
