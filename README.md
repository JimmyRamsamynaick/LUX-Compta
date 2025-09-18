# 🤖 LUX Compta - Bot Discord de Statistiques

[![Version](https://img.shields.io/github/v/tag/JimmyRamsamynaick/LUX-Compta?label=version&color=blue)](https://github.com/JimmyRamsamynaick/LUX-Compta/tags)
[![License](https://img.shields.io/github/license/JimmyRamsamynaick/LUX-Compta?color=green)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-16.9.0+-brightgreen)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/discord.js-14.x-blue)](https://discord.js.org/)

Bot Discord avancé pour le serveur **La Lanterne Nocturne** qui suit et analyse les statistiques du serveur avec génération automatique de rapports.

## 🎯 Table des Matières

- [✨ Fonctionnalités](#-fonctionnalités)
- [🚀 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🎮 Commandes](#-commandes)
- [🔧 Architecture](#-architecture)
- [📊 Système de Rapports](#-système-de-rapports)
- [🔄 Automatisation Git](#-automatisation-git)
- [🛠️ Développement](#️-développement)
- [📈 Fonctionnalités Avancées](#-fonctionnalités-avancées)
- [🤝 Contribution](#-contribution)

## ✨ Fonctionnalités

### 📊 Suivi des Statistiques
- **👥 Membres** : Suivi en temps réel des arrivées/départs avec calcul des tendances
- **💬 Messages** : Comptage détaillé par canal et par utilisateur avec historique
- **⚡ Activité** : Analyse des pics et creux d'activité avec patterns horaires
- **🏆 Top Rankings** : Classements dynamiques des membres et canaux les plus actifs
- **📈 Tendances** : Calcul automatique des évolutions et pourcentages de croissance

### 📋 Génération de Rapports
- **📄 Formats** : CSV détaillé et visualisation Discord interactive
- **📅 Périodes** : Quotidien, hebdomadaire, mensuel avec données historiques
- **🎯 Actions** : Téléchargement direct, envoi par email, visualisation en temps réel
- **📦 Archivage** : Sauvegarde automatique mensuelle avec compression
- **📧 Email** : Envoi automatique des rapports avec pièces jointes

### 🎮 Composants Interactifs
- **🔽 Type 17** : Menu de sélection de période (jour/semaine/mois)
- **🔘 Type 10** : Boutons d'action (télécharger/email/visualiser/archiver)
- **🧭 Navigation** : Interface intuitive avec embeds dynamiques et pagination
- **⚡ Temps réel** : Mise à jour automatique des données affichées

## 🚀 Installation

### 📋 Prérequis
- **Node.js** 16.9.0 ou supérieur
- **npm** ou **yarn** pour la gestion des packages
- **Git** configuré avec accès au repository
- **Bot Discord** créé sur le Discord Developer Portal
- **Serveur Discord** avec permissions administrateur

### 🔧 Installation Rapide

1. **Clonez le repository** :
```bash
git clone https://github.com/JimmyRamsamynaick/LUX-Compta.git
cd LUX-Compta
```

2. **Installez les dépendances** :
```bash
npm install
```

3. **Configurez l'environnement** :
```bash
cp .env.example .env
# Éditez le fichier .env avec vos tokens (voir section Configuration)
```

4. **Lancez le bot** :
```bash
npm start
```

### 🔗 Invitation du Bot

Utilisez ce lien pour inviter le bot sur votre serveur (remplacez `YOUR_CLIENT_ID`) :
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

## ⚙️ Configuration

### 🔐 Variables d'environnement (.env)
```env
# 🤖 Configuration Discord
DISCORD_TOKEN=votre_token_discord_bot
DISCORD_CLIENT_ID=votre_client_id
DISCORD_GUILD_ID=votre_guild_id
ALERT_CHANNEL_ID=id_canal_alertes

# 📧 Configuration Email (optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app

# 🔄 Configuration Git
GIT_AUTO_COMMIT=true
GIT_AUTO_PUSH=true
GIT_USER_NAME=Votre Nom
GIT_USER_EMAIL=votre@email.com
```

### 📁 Fichier de configuration (config.json)
Le bot génère automatiquement un fichier `config.json` avec les paramètres par défaut :
```json
{
  "reportSettings": {
    "autoGenerate": true,
    "emailEnabled": true,
    "archiveAfterDays": 30
  },
  "alertSettings": {
    "enabled": true,
    "thresholds": {
      "memberDecrease": 5,
      "activityDecrease": 20
    }
  }
}
```

## 🎮 Commandes

### 👑 Commandes Administrateur

#### 📊 `/rapport`
- **`générer [période]`** - Génère un rapport pour la période spécifiée
  - Périodes : `daily`, `weekly`, `monthly`
  - Génère automatiquement le fichier CSV
  - Envoie par email si configuré
- **`liste`** - Affiche la liste des rapports disponibles avec dates
- **`archiver`** - Archive les anciens rapports (>30 jours)
- **`télécharger [nom]`** - Télécharge un rapport spécifique

#### 📈 `/stats`
- **`[période] [type]`** - Affiche les statistiques détaillées
  - Types : `membres`, `messages`, `activité`, `canaux`
  - Interface interactive avec boutons de navigation
  - Graphiques ASCII intégrés

#### ⚙️ `/config`
- **`afficher`** - Affiche la configuration actuelle
- **`modifier [paramètre] [valeur]`** - Modifie un paramètre
- **`reset`** - Remet la configuration par défaut
- **`backup`** - Crée une sauvegarde de la configuration
- **`restore [fichier]`** - Restaure une sauvegarde

### 🌟 Commandes Générales
- **`/help [commande]`** - Affiche l'aide générale ou spécifique à une commande
- **`/status`** - Affiche le statut du bot et les statistiques système
- **`/ping`** - Teste la latence du bot

## 🔧 Architecture

```
📁 LUX-Compta/
├── 📁 src/
│   ├── 📁 commands/           # 🎮 Commandes slash
│   │   ├── 📁 admin/         # 👑 Commandes administrateur
│   │   │   ├── rapport.js    # 📊 Gestion des rapports
│   │   │   ├── stats.js      # 📈 Statistiques détaillées
│   │   │   └── config.js     # ⚙️ Configuration
│   │   └── 📁 general/       # 🌟 Commandes générales
│   │       ├── help.js       # ❓ Système d'aide
│   │       └── ping.js       # 🏓 Test de latence
│   ├── 📁 components/        # 🎮 Composants interactifs
│   │   ├── buttons.js        # 🔘 Gestionnaire de boutons
│   │   └── menus.js          # 🔽 Gestionnaire de menus
│   ├── 📁 events/           # 🎯 Gestionnaires d'événements
│   │   ├── ready.js         # ✅ Bot prêt
│   │   ├── messageCreate.js # 💬 Nouveaux messages
│   │   └── guildMember.js   # 👥 Membres (arrivée/départ)
│   ├── 📁 managers/         # 🔧 Gestionnaires de fonctionnalités
│   │   ├── StatsManager.js  # 📊 Gestion des statistiques
│   │   ├── ReportManager.js # 📋 Gestion des rapports
│   │   ├── EmailManager.js  # 📧 Envoi d'emails
│   │   ├── GitManager.js    # 🔄 Automatisation Git
│   │   └── ArchiveManager.js# 📦 Archivage des données
│   └── 📁 utils/           # 🛠️ Utilitaires
│       ├── logger.js       # 📝 Système de logs
│       └── helpers.js      # 🔧 Fonctions utilitaires
├── 📁 data/                # 💾 Données persistantes
│   ├── stats.json         # 📊 Statistiques
│   ├── config.json        # ⚙️ Configuration
│   └── 📁 reports/        # 📋 Rapports générés
├── 📁 archives/           # 📦 Archives des rapports
├── 📁 tests/              # 🧪 Tests unitaires
└── 📄 README.md           # 📖 Documentation
```

## 📊 Système de Rapports

### 📋 Format CSV
Les rapports sont générés au format CSV avec les colonnes suivantes :
```csv
Type,Nom,Valeur,Pourcentage,Évolution,Période,Date
Statistique_Générale,Membres_Total,1250,100%,+5.2%,daily,2025-01-01T00:00:00.000Z
Top_Membre,Utilisateur#1234,156,12.5%,+2.1%,daily,2025-01-01T00:00:00.000Z
```

### 📧 Envoi par Email
- **Format** : HTML avec pièce jointe CSV
- **Fréquence** : Configurable (quotidien/hebdomadaire/mensuel)
- **Destinataires** : Liste configurable dans le fichier de configuration

### 📦 Archivage Automatique
- **Fréquence** : Mensuelle (configurable)
- **Compression** : ZIP avec horodatage
- **Rétention** : 12 mois par défaut
- **Nettoyage** : Suppression automatique des anciens fichiers

## 🔄 Automatisation Git

Le bot effectue automatiquement :

### 📝 Commits Automatiques
- **Fréquence** : Quotidienne ou après chaque génération de rapport
- **Message** : Format standardisé avec détails des modifications
- **Fichiers** : Données, rapports, configuration

### 🚀 Push Automatique
- **Synchronisation** : Avec le repository distant
- **Branches** : Gestion automatique des branches de fonctionnalités
- **Conflits** : Résolution automatique avec stratégie de merge

### 🏷️ Tags et Versioning
- **Versioning** : Sémantique (MAJOR.MINOR.PATCH)
- **Tags** : Création automatique pour les versions majeures
- **Releases** : Génération automatique des notes de version

### ⚙️ Configuration Git
```bash
# Configuration automatique lors du premier lancement
git config user.name "LUX-Compta Bot"
git config user.email "bot@luxcompta.local"
git config push.default simple
```

## 🛠️ Développement

### 📜 Scripts Disponibles
```bash
npm start          # 🚀 Lance le bot en production
npm run dev        # 🔧 Mode développement avec rechargement automatique
npm test           # 🧪 Lance les tests unitaires
npm run test:watch # 👀 Tests en mode watch
npm run lint       # 🔍 Vérification du code avec ESLint
npm run lint:fix   # 🔧 Correction automatique des erreurs de lint
npm run docs       # 📚 Génère la documentation
```

### 🗃️ Structure des Données
Les statistiques sont stockées dans `data/stats.json` :
```json
{
  "daily": {
    "messages": {
      "channelId": { "count": 150, "users": {"userId": 25} },
      "total": 1500,
      "trend": "+5.2%"
    },
    "members": {
      "joined": 12,
      "left": 3,
      "total": 1250,
      "trend": "+0.7%"
    },
    "activity": {
      "peak": "20:00",
      "low": "06:00",
      "score": 85.5
    }
  }
}
```

### 🧪 Tests
Le projet inclut une suite de tests complète :
- **Tests unitaires** : Chaque manager et utilitaire
- **Tests d'intégration** : Commandes et événements
- **Tests de performance** : Charge et stress
- **Couverture** : >90% du code

## 📈 Fonctionnalités Avancées

### 🚨 Alertes Intelligentes
- **Détection automatique** des baisses d'activité significatives
- **Notifications** dans un canal dédié avec mentions des administrateurs
- **Seuils personnalisables** pour chaque type d'alerte
- **Historique** des alertes avec résolution automatique

### 📊 Dashboard Visuel
- **Graphiques ASCII** intégrés dans Discord
- **Tendances** et évolutions avec calculs statistiques
- **Comparaisons** périodiques (jour/semaine/mois)
- **Prédictions** basées sur les données historiques

### 🔄 Sauvegarde et Récupération
- **Sauvegarde automatique** de toutes les données
- **Points de restauration** quotidiens
- **Récupération d'urgence** en cas de perte de données
- **Migration** facilitée vers de nouveaux serveurs

### 🎨 Personnalisation
- **Thèmes** pour les embeds Discord
- **Formats** de rapport personnalisables
- **Langues** multiples (FR/EN)
- **Permissions** granulaires par rôle

## 📝 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique complet des versions.

### 🏷️ Versions Récentes
- **v2025.1.0** - Mise à jour complète vers 2025
- **v1.0.2** - Format de noms de fichiers DD-MM-YYYY
- **v1.0.1** - Fonctionnalités bonus et améliorations
- **v1.0.0** - Version initiale avec toutes les fonctionnalités

## 📄 Licence

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. **🍴 Fork** le projet
2. **🌿 Créer** une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **💾 Commiter** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **🚀 Pousser** vers la branche (`git push origin feature/AmazingFeature`)
5. **📝 Ouvrir** une Pull Request

### 📋 Guidelines de Contribution
- Suivez les conventions de code existantes
- Ajoutez des tests pour les nouvelles fonctionnalités
- Mettez à jour la documentation si nécessaire
- Respectez le format des messages de commit

## 📞 Support et Contact

### 🆘 Support Technique
- **Issues GitHub** : [Ouvrir une issue](https://github.com/JimmyRamsamynaick/LUX-Compta/issues)
- **Discussions** : [GitHub Discussions](https://github.com/JimmyRamsamynaick/LUX-Compta/discussions)
- **Email** : jimmyramsamynaick@gmail.com

### 📚 Documentation
- **Wiki** : [GitHub Wiki](https://github.com/JimmyRamsamynaick/LUX-Compta/wiki)
- **API Docs** : Documentation générée automatiquement
- **Tutoriels** : Guides pas à pas pour l'installation et l'utilisation

### 🌐 Communauté
- **Discord** : Serveur de support (lien sur demande)

---

<div align="center">

**🌟 Développé avec ❤️ pour La Lanterne Nocturne 🌟**

[![GitHub stars](https://img.shields.io/github/stars/JimmyRamsamynaick/LUX-Compta?style=social)](https://github.com/JimmyRamsamynaick/LUX-Compta/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/JimmyRamsamynaick/LUX-Compta?style=social)](https://github.com/JimmyRamsamynaick/LUX-Compta/network/members)

</div>