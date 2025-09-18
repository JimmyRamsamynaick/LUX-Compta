const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function sendTestEmail() {
    try {
        console.log('📧 Initialisation du test d\'envoi d\'email...');
        
        // Configuration du transporteur
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Vérification de la connexion
        console.log('🔍 Vérification de la connexion SMTP...');
        await transporter.verify();
        console.log('✅ Connexion SMTP établie avec succès');

        // Lecture du template HTML
        const templatePath = path.join(__dirname, 'templates', 'email-night-theme.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf8');
        
        // Remplacement des variables dans le template
        const now = new Date();
        htmlContent = htmlContent
            .replace('{{serverName}}', 'La Lanterne Nocturne')
            .replace('{{reportType}}', 'Test Email')
            .replace('{{date}}', now.toLocaleDateString('fr-FR'))
            .replace('{{time}}', now.toLocaleTimeString('fr-FR'))
            .replace('{{totalMembers}}', '42')
            .replace('{{activeMembers}}', '28')
            .replace('{{totalMessages}}', '1,337')
            .replace('{{topChannel}}', '#général')
            .replace('{{topChannelMessages}}', '456')
            .replace('{{mostActiveUser}}', 'Jimmy')
            .replace('{{mostActiveUserMessages}}', '89');

        // Configuration de l'email
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM}" <${process.env.EMAIL_USER}>`,
            to: 'jimmyramsamynaick@gmail.com',
            subject: '🌙 Test Email - La Lanterne Nocturne',
            html: htmlContent,
            text: `Test d'envoi d'email depuis LUX Compta Bot\n\nCet email confirme que le système d'envoi fonctionne correctement.\n\nDate: ${now.toLocaleDateString('fr-FR')}\nHeure: ${now.toLocaleTimeString('fr-FR')}`
        };

        // Envoi de l'email
        console.log('📤 Envoi de l\'email de test...');
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email envoyé avec succès !');
        console.log(`📧 Message ID: ${info.messageId}`);
        console.log(`📬 Destinataire: jimmyramsamynaick@gmail.com`);
        console.log(`📋 Sujet: ${mailOptions.subject}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
        
        if (error.code === 'EAUTH') {
            console.error('🚫 Erreur d\'authentification. Vérifiez EMAIL_USER et EMAIL_PASS dans .env');
        } else if (error.code === 'ECONNECTION') {
            console.error('🚫 Erreur de connexion. Vérifiez EMAIL_HOST et EMAIL_PORT dans .env');
        } else if (error.code === 'ENOTFOUND') {
            console.error('🚫 Serveur SMTP introuvable. Vérifiez EMAIL_HOST dans .env');
        }
        
        return false;
    }
}

// Exécution du test
sendTestEmail()
    .then(success => {
        if (success) {
            console.log('🎉 Test d\'email terminé avec succès !');
            process.exit(0);
        } else {
            console.log('💥 Test d\'email échoué !');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('💥 Erreur inattendue:', error);
        process.exit(1);
    });