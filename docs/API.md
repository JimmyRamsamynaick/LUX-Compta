# 🔌 Documentation API - LUX-Compta

## 📋 Vue d'ensemble

Cette documentation décrit l'API interne de LUX-Compta, permettant aux développeurs d'étendre et personnaliser le bot selon leurs besoins.

## 🏗️ Architecture API

### Structure des Managers

Chaque manager expose une API cohérente avec les méthodes suivantes :

```javascript
class BaseManager {
    constructor(client) {
        this.client = client;
        this.initialized = false;
    }
    
    async initialize() {
        // Initialisation du manager
    }
    
    async destroy() {
        // Nettoyage des ressources
    }
}
```

## 📊 StatsManager API

### Méthodes Principales

#### `recordMemberJoin(member)`
Enregistre l'arrivée d'un nouveau membre.

**Paramètres :**
- `member` (GuildMember) : L'objet membre Discord

**Retour :**
- `Promise<void>`

**Exemple :**
```javascript
await client.statsManager.recordMemberJoin(member);
```

#### `recordMemberLeave(member)`
Enregistre le départ d'un membre.

**Paramètres :**
- `member` (GuildMember) : L'objet membre Discord

**Retour :**
- `Promise<void>`

#### `recordMessage(message)`
Comptabilise un nouveau message.

**Paramètres :**
- `message` (Message) : L'objet message Discord

**Retour :**
- `Promise<void>`

#### `getServerStats(guildId)`
Récupère les statistiques complètes du serveur.

**Paramètres :**
- `guildId` (string) : ID du serveur Discord

**Retour :**
- `Promise<ServerStats>`

**Structure ServerStats :**
```javascript
{
    totalMembers: number,
    activeMembers: number,
    messagesThisWeek: number,
    messagesThisMonth: number,
    topChannels: Array<{channelId: string, messageCount: number}>,
    memberGrowth: Array<{date: string, count: number}>
}
```

#### `getUserActivity(userId, guildId)`
Analyse l'activité d'un utilisateur spécifique.

**Paramètres :**
- `userId` (string) : ID de l'utilisateur
- `guildId` (string) : ID du serveur

**Retour :**
- `Promise<UserActivity>`

**Structure UserActivity :**
```javascript
{
    messageCount: number,
    lastActivity: Date,
    favoriteChannels: Array<string>,
    activityRank: number,
    joinDate: Date
}
```

## 📄 ReportManager API

### Méthodes Principales

#### `generateReport(type, options)`
Génère un rapport selon le type spécifié.

**Paramètres :**
- `type` (string) : 'daily', 'weekly', 'monthly', 'custom'
- `options` (ReportOptions) : Options de génération

**Structure ReportOptions :**
```javascript
{
    guildId?: string,
    startDate?: Date,
    endDate?: Date,
    format?: 'csv' | 'json' | 'pdf',
    includeCharts?: boolean,
    emailRecipients?: Array<string>
}
```

**Retour :**
- `Promise<ReportResult>`

**Structure ReportResult :**
```javascript
{
    success: boolean,
    filePath?: string,
    emailSent?: boolean,
    error?: string,
    metadata: {
        generatedAt: Date,
        recordCount: number,
        fileSize: number
    }
}
```

#### `scheduleReport(type, cronExpression, options)`
Programme un rapport automatique.

**Paramètres :**
- `type` (string) : Type de rapport
- `cronExpression` (string) : Expression cron
- `options` (ReportOptions) : Options de génération

**Retour :**
- `Promise<string>` : ID du job programmé

#### `cancelScheduledReport(jobId)`
Annule un rapport programmé.

**Paramètres :**
- `jobId` (string) : ID du job à annuler

**Retour :**
- `Promise<boolean>`

## 🗄️ ArchiveManager API

### Méthodes Principales

#### `archiveOldReports(olderThanDays)`
Archive les rapports anciens.

**Paramètres :**
- `olderThanDays` (number) : Nombre de jours (défaut: 30)

**Retour :**
- `Promise<ArchiveResult>`

**Structure ArchiveResult :**
```javascript
{
    archivedCount: number,
    totalSize: number,
    archivePath: string,
    compressionRatio: number
}
```

#### `restoreFromArchive(archiveId)`
Restaure des données depuis une archive.

**Paramètres :**
- `archiveId` (string) : ID de l'archive

**Retour :**
- `Promise<RestoreResult>`

#### `listArchives()`
Liste toutes les archives disponibles.

**Retour :**
- `Promise<Array<ArchiveInfo>>`

**Structure ArchiveInfo :**
```javascript
{
    id: string,
    createdAt: Date,
    size: number,
    fileCount: number,
    description: string
}
```

## 🔔 AlertManager API

### Méthodes Principales

#### `createAlert(type, message, severity, metadata)`
Crée une nouvelle alerte.

**Paramètres :**
- `type` (string) : Type d'alerte
- `message` (string) : Message d'alerte
- `severity` (string) : 'low', 'medium', 'high', 'critical'
- `metadata` (object) : Données supplémentaires

**Retour :**
- `Promise<string>` : ID de l'alerte

#### `setThreshold(metric, value, comparison)`
Définit un seuil d'alerte.

**Paramètres :**
- `metric` (string) : Nom de la métrique
- `value` (number) : Valeur seuil
- `comparison` (string) : 'gt', 'lt', 'eq', 'gte', 'lte'

**Exemple :**
```javascript
// Alerte si moins de 10 membres actifs
await client.alertManager.setThreshold('activeMembers', 10, 'lt');
```

#### `getActiveAlerts()`
Récupère toutes les alertes actives.

**Retour :**
- `Promise<Array<Alert>>`

## 🎨 CustomizationManager API

### Méthodes Principales

#### `setTheme(guildId, themeName)`
Applique un thème à un serveur.

**Paramètres :**
- `guildId` (string) : ID du serveur
- `themeName` (string) : Nom du thème

**Retour :**
- `Promise<boolean>`

#### `createCustomTheme(name, config)`
Crée un thème personnalisé.

**Paramètres :**
- `name` (string) : Nom du thème
- `config` (ThemeConfig) : Configuration du thème

**Structure ThemeConfig :**
```javascript
{
    colors: {
        primary: string,
        secondary: string,
        success: string,
        warning: string,
        error: string
    },
    fonts: {
        primary: string,
        secondary: string
    },
    layout: {
        cardStyle: string,
        spacing: number
    }
}
```

#### `getUserPreferences(userId)`
Récupère les préférences d'un utilisateur.

**Retour :**
- `Promise<UserPreferences>`

## 📊 DashboardManager API

### Méthodes Principales

#### `createDashboard(name, config)`
Crée un nouveau tableau de bord.

**Paramètres :**
- `name` (string) : Nom du dashboard
- `config` (DashboardConfig) : Configuration

**Structure DashboardConfig :**
```javascript
{
    widgets: Array<WidgetConfig>,
    layout: LayoutConfig,
    refreshInterval: number,
    permissions: Array<string>
}
```

#### `updateWidget(dashboardId, widgetId, data)`
Met à jour un widget spécifique.

**Paramètres :**
- `dashboardId` (string) : ID du dashboard
- `widgetId` (string) : ID du widget
- `data` (object) : Nouvelles données

#### `getDashboardData(dashboardId)`
Récupère les données d'un dashboard.

**Retour :**
- `Promise<DashboardData>`

## 📧 EmailManager API

### Méthodes Principales

#### `sendEmail(to, subject, content, options)`
Envoie un email.

**Paramètres :**
- `to` (string|Array<string>) : Destinataire(s)
- `subject` (string) : Sujet
- `content` (string) : Contenu HTML/texte
- `options` (EmailOptions) : Options supplémentaires

**Structure EmailOptions :**
```javascript
{
    attachments?: Array<{filename: string, path: string}>,
    template?: string,
    templateData?: object,
    priority?: 'low' | 'normal' | 'high'
}
```

#### `createTemplate(name, htmlContent, textContent)`
Crée un template d'email.

**Paramètres :**
- `name` (string) : Nom du template
- `htmlContent` (string) : Contenu HTML
- `textContent` (string) : Contenu texte

#### `getEmailStats()`
Récupère les statistiques d'envoi.

**Retour :**
- `Promise<EmailStats>`

## 🔄 GitManager API

### Méthodes Principales

#### `commitChanges(message, files)`
Effectue un commit.

**Paramètres :**
- `message` (string) : Message de commit
- `files` (Array<string>) : Fichiers à commiter

**Retour :**
- `Promise<CommitResult>`

#### `createTag(tagName, message)`
Crée un tag Git.

**Paramètres :**
- `tagName` (string) : Nom du tag
- `message` (string) : Message du tag

#### `pushChanges(branch, includeTags)`
Pousse les changements vers le remote.

**Paramètres :**
- `branch` (string) : Branche cible (défaut: 'main')
- `includeTags` (boolean) : Inclure les tags (défaut: false)

## 🔌 Événements API

### Événements du Bot

Le bot émet plusieurs événements que vous pouvez écouter :

```javascript
// Nouveau rapport généré
client.on('reportGenerated', (report) => {
    console.log(`Rapport généré: ${report.type}`);
});

// Alerte déclenchée
client.on('alertTriggered', (alert) => {
    console.log(`Alerte: ${alert.message}`);
});

// Statistiques mises à jour
client.on('statsUpdated', (stats) => {
    console.log(`Stats mises à jour pour ${stats.guildId}`);
});

// Archive créée
client.on('archiveCreated', (archive) => {
    console.log(`Archive créée: ${archive.id}`);
});
```

## 🛠️ Utilitaires API

### Validation des Données

```javascript
const { validateEmail, validateCronExpression, validateThemeConfig } = require('./utils/validators');

// Validation d'email
if (!validateEmail('test@example.com')) {
    throw new Error('Email invalide');
}

// Validation d'expression cron
if (!validateCronExpression('0 0 * * *')) {
    throw new Error('Expression cron invalide');
}
```

### Formatage des Données

```javascript
const { formatFileSize, formatDate, formatNumber } = require('./utils/formatters');

const size = formatFileSize(1024); // "1 KB"
const date = formatDate(new Date(), 'DD/MM/YYYY'); // "25/01/2025"
const number = formatNumber(1234.56, 2); // "1,234.56"
```

### Gestion des Erreurs

```javascript
const { APIError, ValidationError, NotFoundError } = require('./utils/errors');

// Erreur API personnalisée
throw new APIError('Erreur lors de la génération du rapport', 500);

// Erreur de validation
throw new ValidationError('Email requis');

// Erreur de ressource non trouvée
throw new NotFoundError('Utilisateur non trouvé');
```

## 📝 Exemples d'Utilisation

### Création d'un Plugin Personnalisé

```javascript
class CustomPlugin {
    constructor(client) {
        this.client = client;
    }
    
    async initialize() {
        // Écouter les nouveaux membres
        this.client.on('guildMemberAdd', async (member) => {
            await this.welcomeNewMember(member);
        });
        
        // Programmer un rapport personnalisé
        await this.client.reportManager.scheduleReport(
            'custom',
            '0 9 * * 1', // Chaque lundi à 9h
            {
                guildId: member.guild.id,
                format: 'pdf',
                emailRecipients: ['admin@example.com']
            }
        );
    }
    
    async welcomeNewMember(member) {
        // Enregistrer les stats
        await this.client.statsManager.recordMemberJoin(member);
        
        // Créer une alerte si croissance rapide
        const stats = await this.client.statsManager.getServerStats(member.guild.id);
        if (stats.memberGrowth.length > 0) {
            const growth = stats.memberGrowth[stats.memberGrowth.length - 1].count;
            if (growth > 10) {
                await this.client.alertManager.createAlert(
                    'member_growth',
                    `Croissance rapide détectée: +${growth} membres`,
                    'medium',
                    { guildId: member.guild.id, growth }
                );
            }
        }
    }
}

// Utilisation
const plugin = new CustomPlugin(client);
await plugin.initialize();
```

### Intégration avec une API Externe

```javascript
class ExternalAPIIntegration {
    constructor(client, apiKey) {
        this.client = client;
        this.apiKey = apiKey;
    }
    
    async syncDataWithExternalAPI() {
        try {
            // Récupérer les stats locales
            const stats = await this.client.statsManager.getServerStats(guildId);
            
            // Envoyer vers l'API externe
            const response = await fetch('https://api.example.com/stats', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(stats)
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            // Créer une alerte de succès
            await this.client.alertManager.createAlert(
                'api_sync',
                'Synchronisation API réussie',
                'low',
                { timestamp: new Date(), recordCount: stats.totalMembers }
            );
            
        } catch (error) {
            // Créer une alerte d'erreur
            await this.client.alertManager.createAlert(
                'api_sync_error',
                `Erreur de synchronisation: ${error.message}`,
                'high',
                { error: error.message, timestamp: new Date() }
            );
        }
    }
}
```

## 🔒 Sécurité API

### Authentification

```javascript
// Vérification des permissions
const hasPermission = (member, permission) => {
    return member.permissions.has(permission) || member.roles.cache.some(role => 
        role.permissions.has(permission)
    );
};

// Middleware de sécurité
const requireAdmin = (interaction) => {
    if (!hasPermission(interaction.member, 'ADMINISTRATOR')) {
        throw new Error('Permissions insuffisantes');
    }
};
```

### Rate Limiting

```javascript
const rateLimit = new Map();

const checkRateLimit = (userId, limit = 10, window = 60000) => {
    const now = Date.now();
    const userRequests = rateLimit.get(userId) || [];
    
    // Nettoyer les anciennes requêtes
    const validRequests = userRequests.filter(time => now - time < window);
    
    if (validRequests.length >= limit) {
        throw new Error('Rate limit dépassé');
    }
    
    validRequests.push(now);
    rateLimit.set(userId, validRequests);
};
```

---

*Cette documentation API est maintenue à jour avec chaque version. Pour plus d'informations, consultez le code source et les exemples dans le repository.*