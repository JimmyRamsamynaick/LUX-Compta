const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const config = require('../../config.json');

class EmailManager {
    constructor() {
        this.transporter = null;
    }

    async initialize() {
        try {
            // Configurer le transporteur de mail
            this.transporter = nodemailer.createTransporter({
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT),
                secure: false, // true pour 465, false pour les autres ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Vérifier la connexion
            await this.transporter.verify();
            console.log('📧 EmailManager initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de l\'EmailManager:', error);
            this.transporter = null;
        }
    }

    async sendReport(to, subject, reportPath, additionalText = '') {
        if (!this.transporter) {
            console.error('❌ EmailManager non initialisé');
            return false;
        }

        try {
            // Vérifier que le fichier existe
            if (!await fs.pathExists(reportPath)) {
                console.error('❌ Fichier de rapport non trouvé:', reportPath);
                return false;
            }

            const filename = path.basename(reportPath);
            const reportDate = moment().format('DD/MM/YYYY à HH:mm');
            
            // Contenu HTML de l'email
            const htmlContent = this.generateEmailHTML(filename, reportDate, additionalText);
            
            // Configuration de l'email
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: to,
                subject: subject,
                html: htmlContent,
                attachments: [
                    {
                        filename: filename,
                        path: reportPath,
                        contentType: 'text/csv'
                    }
                ]
            };

            // Envoyer l'email
            const info = await this.transporter.sendMail(mailOptions);
            console.log('📧 Email envoyé avec succès:', info.messageId);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
            return false;
        }
    }

    generateEmailHTML(filename, reportDate, additionalText = '') {
        return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Rapport ${config.bot.name}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #0099ff;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #0099ff;
                    margin: 0;
                    font-size: 28px;
                }
                .header p {
                    color: #666;
                    margin: 10px 0 0 0;
                    font-size: 16px;
                }
                .content {
                    margin-bottom: 30px;
                }
                .info-box {
                    background-color: #f8f9fa;
                    border-left: 4px solid #0099ff;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 0 5px 5px 0;
                }
                .attachment-info {
                    background-color: #e8f4fd;
                    border: 1px solid #0099ff;
                    padding: 15px;
                    border-radius: 5px;
                    text-align: center;
                    margin: 20px 0;
                }
                .attachment-info .icon {
                    font-size: 24px;
                    margin-bottom: 10px;
                }
                .footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                    font-size: 14px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }
                .stat-card {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    text-align: center;
                    border: 1px solid #dee2e6;
                }
                .stat-card .number {
                    font-size: 24px;
                    font-weight: bold;
                    color: #0099ff;
                }
                .stat-card .label {
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 ${config.bot.name}</h1>
                    <p>Rapport automatique pour ${config.server.name}</p>
                </div>
                
                <div class="content">
                    <h2>🎯 Rapport généré avec succès</h2>
                    <p>Bonjour,</p>
                    <p>Votre rapport de statistiques a été généré automatiquement le <strong>${reportDate}</strong>.</p>
                    
                    ${additionalText ? `<div class="info-box"><p>${additionalText}</p></div>` : ''}
                    
                    <div class="attachment-info">
                        <div class="icon">📎</div>
                        <h3>Fichier joint</h3>
                        <p><strong>${filename}</strong></p>
                        <p>Format: CSV (Compatible Excel, Google Sheets, etc.)</p>
                    </div>
                    
                    <h3>📋 Contenu du rapport</h3>
                    <ul>
                        <li><strong>Statistiques générales</strong> - Messages, membres, activité</li>
                        <li><strong>Top membres</strong> - Classement par activité</li>
                        <li><strong>Top canaux</strong> - Canaux les plus actifs</li>
                        <li><strong>Mouvements</strong> - Arrivées et départs de membres</li>
                    </ul>
                    
                    <div class="info-box">
                        <p><strong>💡 Conseil:</strong> Ouvrez le fichier CSV avec Excel ou Google Sheets pour une meilleure visualisation des données.</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Ce rapport a été généré automatiquement par <strong>${config.bot.name}</strong></p>
                    <p>Serveur: ${config.server.name} | Version: ${config.bot.version}</p>
                    <p style="margin-top: 15px; font-size: 12px;">
                        Si vous ne souhaitez plus recevoir ces rapports, contactez un administrateur du serveur.
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    async sendAlert(to, alertType, alertData) {
        if (!this.transporter) {
            console.error('❌ EmailManager non initialisé');
            return false;
        }

        try {
            const subject = `🚨 Alerte ${config.bot.name} - ${this.getAlertTitle(alertType)}`;
            const htmlContent = this.generateAlertHTML(alertType, alertData);
            
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: to,
                subject: subject,
                html: htmlContent
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('🚨 Alerte envoyée par email:', info.messageId);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de l\'alerte:', error);
            return false;
        }
    }

    generateAlertHTML(alertType, alertData) {
        const alertTitles = {
            message_decrease: 'Baisse d\'activité des messages',
            member_decrease: 'Baisse du nombre de membres',
            activity_decrease: 'Baisse d\'activité générale'
        };

        const alertIcons = {
            message_decrease: '💬',
            member_decrease: '👥',
            activity_decrease: '📉'
        };

        return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Alerte ${config.bot.name}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .alert-header {
                    text-align: center;
                    border-bottom: 3px solid #dc3545;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                    background-color: #f8d7da;
                    margin: -30px -30px 30px -30px;
                    padding: 30px;
                    border-radius: 10px 10px 0 0;
                }
                .alert-header h1 {
                    color: #dc3545;
                    margin: 0;
                    font-size: 28px;
                }
                .alert-box {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="alert-header">
                    <h1>🚨 Alerte détectée</h1>
                    <p>${config.server.name}</p>
                </div>
                
                <div class="content">
                    <h2>${alertIcons[alertType]} ${alertTitles[alertType]}</h2>
                    
                    <div class="alert-box">
                        <h3>Détails de l'alerte</h3>
                        <p><strong>Type:</strong> ${alertTitles[alertType]}</p>
                        <p><strong>Valeur détectée:</strong> ${alertData.value}${alertType.includes('decrease') ? '%' : ''}</p>
                        <p><strong>Seuil configuré:</strong> ${alertData.threshold}${alertType.includes('decrease') ? '%' : ''}</p>
                        <p><strong>Date:</strong> ${moment().format('DD/MM/YYYY à HH:mm:ss')}</p>
                    </div>
                    
                    <h3>🔍 Actions recommandées</h3>
                    <ul>
                        <li>Vérifier l'activité récente du serveur</li>
                        <li>Analyser les causes potentielles de la baisse</li>
                        <li>Considérer des actions pour stimuler l'engagement</li>
                        <li>Surveiller l'évolution dans les prochains jours</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p>Cette alerte a été générée automatiquement par <strong>${config.bot.name}</strong></p>
                    <p>Serveur: ${config.server.name}</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    getAlertTitle(alertType) {
        const titles = {
            message_decrease: 'Baisse d\'activité des messages',
            member_decrease: 'Baisse du nombre de membres',
            activity_decrease: 'Baisse d\'activité générale'
        };
        return titles[alertType] || 'Alerte inconnue';
    }

    async testConnection() {
        if (!this.transporter) {
            await this.initialize();
        }

        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('❌ Test de connexion email échoué:', error);
            return false;
        }
    }
}

module.exports = EmailManager;