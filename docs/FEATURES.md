# 📋 Documentation des Fonctionnalités - LUX-Compta

## 🎯 Vue d'ensemble

LUX-Compta est un bot Discord avancé conçu pour la gestion comptable et statistique des serveurs Discord. Il offre un ensemble complet d'outils pour le suivi, la génération de rapports et l'automatisation des tâches administratives.

## 🏗️ Architecture du Système

### Managers Principaux

#### 📊 StatsManager
**Responsabilité** : Collecte et analyse des statistiques du serveur Discord

**Fonctionnalités** :
- Suivi des membres actifs/inactifs
- Analyse des messages par canal
- Statistiques de participation aux événements
- Métriques de croissance du serveur
- Données d'engagement utilisateur

**Méthodes principales** :
```javascript
- recordMemberJoin(member)     // Enregistre l'arrivée d'un membre
- recordMemberLeave(member)    // Enregistre le départ d'un membre
- recordMessage(message)       // Comptabilise les messages
- getServerStats()             // Récupère les statistiques globales
- getUserActivity(userId)      // Analyse l'activité d'un utilisateur
```

#### 📄 ReportManager
**Responsabilité** : Génération et gestion des rapports automatiques

**Fonctionnalités** :
- Génération de rapports CSV quotidiens/hebdomadaires
- Formatage automatique des données
- Archivage des anciens rapports
- Envoi automatique par email
- Templates personnalisables

**Types de rapports** :
- **Rapport quotidien** : Activité journalière, nouveaux membres, messages
- **Rapport hebdomadaire** : Synthèse hebdomadaire, tendances, comparaisons
- **Rapport mensuel** : Analyse approfondie, métriques de performance
- **Rapport personnalisé** : Données spécifiques selon les besoins

**Configuration** :
```javascript
// Programmation automatique
- Quotidien : 23:59 chaque jour
- Hebdomadaire : Dimanche 23:59
- Mensuel : Dernier jour du mois 23:59
```

#### 🗄️ ArchiveManager
**Responsabilité** : Gestion des archives et sauvegarde des données

**Fonctionnalités** :
- Archivage automatique des anciens rapports
- Compression des fichiers volumineux
- Rotation des logs
- Nettoyage automatique des fichiers temporaires
- Sauvegarde incrémentale

**Politique d'archivage** :
- Rapports > 30 jours : Archivage automatique
- Logs > 7 jours : Compression
- Fichiers temporaires > 24h : Suppression
- Sauvegarde complète : Hebdomadaire

#### 🔔 AlertManager
**Responsabilité** : Système d'alertes et notifications

**Fonctionnalités** :
- Alertes en temps réel
- Notifications par email/Discord
- Seuils personnalisables
- Escalade automatique
- Historique des alertes

**Types d'alertes** :
- **Seuils de membres** : Alerte si croissance/décroissance anormale
- **Activité faible** : Notification si baisse d'activité significative
- **Erreurs système** : Alertes techniques et de performance
- **Rapports manqués** : Notification si échec de génération

#### 🎨 CustomizationManager
**Responsabilité** : Personnalisation de l'interface et des thèmes

**Fonctionnalités** :
- Thèmes visuels personnalisables
- Configuration des couleurs
- Templates de messages
- Layouts adaptatifs
- Préférences utilisateur

**Thèmes disponibles** :
- **Default** : Thème standard avec couleurs neutres
- **Dark** : Mode sombre pour une utilisation nocturne
- **Light** : Mode clair et lumineux
- **Corporate** : Thème professionnel pour entreprises

#### 📊 DashboardManager
**Responsabilité** : Gestion des tableaux de bord interactifs

**Fonctionnalités** :
- Dashboards en temps réel
- Graphiques interactifs
- Métriques personnalisables
- Mise à jour automatique
- Export des données

**Types de dashboards** :
- **Vue d'ensemble** : Métriques principales du serveur
- **Activité** : Graphiques d'activité en temps réel
- **Membres** : Statistiques détaillées des utilisateurs
- **Performance** : Métriques de performance du bot

#### 📧 EmailManager
**Responsabilité** : Gestion des communications par email

**Fonctionnalités** :
- Envoi automatique de rapports
- Templates d'emails personnalisables
- Gestion des listes de diffusion
- Authentification sécurisée
- Logs d'envoi

**Configuration SMTP** :
```javascript
// Variables d'environnement requises
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app
```

#### 🔄 GitManager
**Responsabilité** : Automatisation Git et versioning

**Fonctionnalités** :
- Commits automatiques des rapports
- Sauvegarde versionnée
- Tags de release automatiques
- Synchronisation avec GitHub
- Historique des modifications

**Workflow automatique** :
1. Génération de rapport
2. Commit automatique avec message descriptif
3. Push vers le repository
4. Création de tags pour les versions importantes

## 🎮 Commandes Discord

### Commandes Administrateur

#### `/generate-report [type]`
**Description** : Génère un rapport immédiatement
**Paramètres** :
- `type` : daily, weekly, monthly, custom
**Permissions** : Administrateur uniquement
**Exemple** : `/generate-report weekly`

#### `/server-stats`
**Description** : Affiche les statistiques complètes du serveur
**Permissions** : Administrateur uniquement
**Informations affichées** :
- Nombre total de membres
- Membres actifs/inactifs
- Messages par jour/semaine
- Canaux les plus actifs

#### `/archive-data [days]`
**Description** : Archive les données antérieures à X jours
**Paramètres** :
- `days` : Nombre de jours (défaut: 30)
**Permissions** : Administrateur uniquement

#### `/config-alerts`
**Description** : Configure les seuils d'alerte
**Permissions** : Administrateur uniquement
**Options configurables** :
- Seuil de membres minimum/maximum
- Seuil d'activité minimum
- Fréquence des notifications

### Commandes Générales

#### `/help`
**Description** : Affiche l'aide complète
**Permissions** : Tous les utilisateurs
**Contenu** :
- Liste des commandes disponibles
- Guide d'utilisation
- Liens vers la documentation

#### `/status`
**Description** : Affiche le statut du bot
**Permissions** : Tous les utilisateurs
**Informations** :
- Uptime du bot
- Version actuelle
- Statut des services
- Dernière mise à jour

#### `/my-stats`
**Description** : Affiche les statistiques personnelles de l'utilisateur
**Permissions** : Tous les utilisateurs
**Données affichées** :
- Messages envoyés
- Activité par canal
- Temps de présence
- Rang d'activité

## 🔧 Configuration Avancée

### Variables d'Environnement

```bash
# Discord
DISCORD_TOKEN=votre-token-discord
DISCORD_CLIENT_ID=id-de-votre-application

# Base de données
DATABASE_URL=chemin-vers-votre-base-de-donnees

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app

# Git
GIT_AUTO_COMMIT=true
GIT_AUTO_PUSH=true
GIT_BRANCH=main

# Rapports
REPORT_SCHEDULE_DAILY=59 23 * * *
REPORT_SCHEDULE_WEEKLY=59 23 * * 0
REPORT_AUTO_EMAIL=true

# Alertes
ALERT_MEMBER_THRESHOLD=10
ALERT_ACTIVITY_THRESHOLD=50
ALERT_EMAIL_ENABLED=true
```

### Fichier config.json

```json
{
  "bot": {
    "prefix": "!",
    "status": "online",
    "activity": "Gestion comptable"
  },
  "reports": {
    "format": "csv",
    "timezone": "Europe/Paris",
    "archiveAfterDays": 30
  },
  "alerts": {
    "memberThreshold": 10,
    "activityThreshold": 50,
    "emailNotifications": true
  },
  "themes": {
    "default": "corporate",
    "allowUserCustomization": true
  }
}
```

## 📈 Métriques et KPIs

### Métriques de Serveur
- **Croissance des membres** : Nouveaux membres par jour/semaine/mois
- **Taux de rétention** : Pourcentage de membres restant actifs
- **Engagement** : Messages par membre actif
- **Activité par canal** : Distribution des messages par canal

### Métriques de Performance
- **Temps de réponse** : Latence des commandes
- **Uptime** : Disponibilité du bot
- **Erreurs** : Taux d'erreur et types d'erreurs
- **Ressources** : Utilisation CPU/RAM

### Métriques Business
- **ROI** : Retour sur investissement du bot
- **Productivité** : Temps économisé par l'automatisation
- **Satisfaction** : Feedback des utilisateurs
- **Adoption** : Utilisation des fonctionnalités

## 🔒 Sécurité et Permissions

### Niveaux de Permission
1. **Propriétaire** : Accès complet à toutes les fonctionnalités
2. **Administrateur** : Gestion des rapports et statistiques
3. **Modérateur** : Consultation des données
4. **Utilisateur** : Accès aux statistiques personnelles

### Sécurité des Données
- **Chiffrement** : Toutes les données sensibles sont chiffrées
- **Authentification** : Tokens sécurisés pour les APIs
- **Logs** : Traçabilité complète des actions
- **Sauvegarde** : Sauvegardes chiffrées et versionnées

## 🚀 Déploiement et Maintenance

### Prérequis Système
- Node.js 18+ 
- NPM 8+
- Git 2.30+
- 512MB RAM minimum
- 1GB espace disque

### Installation Production
```bash
# Clone du repository
git clone https://github.com/JimmyRamsamynaick/LUX-Compta.git
cd LUX-Compta

# Installation des dépendances
npm ci --production

# Configuration
cp .env.example .env
# Éditer .env avec vos paramètres

# Démarrage
npm start
```

### Maintenance
- **Mises à jour** : Vérification hebdomadaire des dépendances
- **Sauvegardes** : Sauvegarde quotidienne automatique
- **Monitoring** : Surveillance continue des performances
- **Logs** : Rotation automatique des logs

## 📞 Support et Dépannage

### Problèmes Courants

#### Bot ne démarre pas
1. Vérifier le token Discord
2. Contrôler les permissions
3. Vérifier les dépendances
4. Consulter les logs d'erreur

#### Rapports non générés
1. Vérifier la configuration cron
2. Contrôler les permissions de fichiers
3. Vérifier l'espace disque
4. Consulter les logs du ReportManager

#### Emails non envoyés
1. Vérifier la configuration SMTP
2. Contrôler les credentials
3. Vérifier les paramètres de sécurité Gmail
4. Tester la connectivité réseau

### Contacts Support
- **Issues GitHub** : [Signaler un problème](https://github.com/JimmyRamsamynaick/LUX-Compta/issues)
- **Email** : jimmyramsamynaick@gmail.com
- **Documentation** : README.md du projet

---

*Cette documentation est maintenue à jour avec chaque version du projet. Dernière mise à jour : v2025.1.1*