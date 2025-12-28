# 🤖 LUX Compta - Bot Discord de Statistiques

[![Version](https://img.shields.io/github/v/tag/JimmyRamsamynaick/LUX-Compta?label=version&color=blue)](https://github.com/JimmyRamsamynaick/LUX-Compta/tags)
[![License](https://img.shields.io/github/license/JimmyRamsamynaick/LUX-Compta?color=green)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18.0.0+-brightgreen)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/discord.js-14.x-blue)](https://discord.js.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com/)

Bot Discord avancé pour le serveur **La Lanterne Nocturne** qui suit et analyse les statistiques du serveur avec génération automatique de rapports, graphiques visuels et archivage.

## 🎯 Table des Matières

- [✨ Fonctionnalités](#-fonctionnalités)
- [🚀 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🎮 Commandes](#-commandes)
- [🔧 Architecture](#-architecture)
- [📊 Système de Rapports](#-système-de-rapports)
- [🛠️ Développement](#️-développement)
- [🤝 Contribution](#-contribution)

## ✨ Fonctionnalités

### 📊 Suivi des Statistiques
- **👥 Membres** : Suivi en temps réel des arrivées/départs avec calcul de la croissance nette.
- **💬 Messages** : Comptage détaillé par canal et par utilisateur.
- **🎙️ Vocal** : Suivi du temps passé en vocal par les membres.
- **📈 Graphiques Visuels** : Génération de graphiques (Chart.js) pour l'activité et la croissance (axe négatif supporté).
- **🏆 Top Rankings** : Classements dynamiques des membres et canaux les plus actifs.

### 📋 Rapports Automatisés
- **📧 Email** : Envoi automatique des rapports mensuels par email (CSV en pièce jointe).
- **📅 Planification** : Envoi le dernier jour du mois (28/29/30/31) à 23h59.
- **📄 Format CSV** : Rapports détaillés incluant le statut des membres (Présent/Parti/Banni).
- **👥 Multi-destinataires** : Supporte plusieurs adresses email de réception.

### 🛠️ Administration
- **⚙️ Configuration** : Gestion dynamique des emails via commandes.
- **🔄 Automatisation** : Arrêt automatique des emails si le bot quitte le serveur.
- **⏯️ Contrôle** : Commandes pour activer/désactiver temporairement les rapports.

## 🚀 Installation

### 📋 Prérequis
- **Node.js** 18.0.0 ou supérieur
- **MongoDB** (Base de données)
- **Bot Discord** avec les intents privilégiés (Members, Message Content, Presences)

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
```

4. **Lancez le bot** :
```bash
npm start
```

## ⚙️ Configuration

### 🔐 Variables d'environnement (.env)
```env
# 🤖 Configuration Discord
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=votre_client_id
GUILD_ID=votre_guild_id

# 🗄️ Base de Données
MONGODB_URI=mongodb://localhost:27017/lux-compta

# 📧 Configuration Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app
EMAIL_FROM="LUX Compta"
TIMEZONE=Europe/Paris
```

## 🎮 Commandes

### 📊 Statistiques
- **`/server-stats`** : Affiche un graphique complet de l'activité du serveur (Messages & Croissance Nette).
- **`/stats [user]`** : Affiche les statistiques détaillées d'un utilisateur (Messages, Vocal).
- **`/server-status`** : Affiche l'état actuel du serveur et du bot.
- **`/messages`** : Affiche le classement des membres par nombre de messages.
- **`/voice`** : Affiche le classement des membres par temps vocal.

### 📧 Gestion des Emails (Admin)
- **`/setup-email`** : Gère les destinataires des rapports.
  - `add [email]` : Ajoute une adresse email.
  - `remove [email]` : Retire une adresse email.
  - `list` : Affiche la liste des destinataires.
- **`/disable-email`** : Désactive temporairement l'envoi des rapports (conserve la config).
- **`/enable-email`** : Réactive l'envoi des rapports.
- **`/test-email`** : Envoie un email de test immédiat pour vérifier la configuration.

## 🔧 Architecture

Le projet est structuré de manière modulaire :

```
📁 LUX-Compta/
├── 📁 src/
│   ├── 📁 commands/        # Commandes Slash
│   │   ├── 📁 admin/       # Commandes de configuration (Email)
│   │   └── ...             # Commandes stats (server-stats, etc.)
│   ├── 📁 database/        # Connexion MongoDB
│   ├── 📁 events/          # Gestionnaires d'événements (ready, messageCreate...)
│   ├── 📁 models/          # Modèles Mongoose (Member, ServerConfig...)
│   ├── 📁 utils/           # Utilitaires (Génération graphiques, Rapports CSV...)
│   └── index.js            # Point d'entrée
├── 📁 templates/           # Templates HTML pour les emails
└── 📄 package.json         # Dépendances
```

## 📊 Système de Rapports

### Format du Rapport (CSV)
Les rapports mensuels contiennent les informations suivantes pour chaque membre :
- **User ID** & **Username**
- **Date d'arrivée** & **Date de départ**
- **Statut** : Présent, Parti ou Banni
- **Temps Vocal** (Total)
- **Messages** (Total)

### Graphiques
Le bot utilise `chartjs-node-canvas` pour générer des images PNG directement dans Discord :
- **Axe Gauche** : Nombre de messages (Ligne).
- **Axe Droit** : Croissance nette (Barres Vertes/Rouges).
- **Légende** : Nouveaux membres (Ligne Jaune).

## 🛠️ Développement

### Scripts Disponibles
```bash
npm start          # 🚀 Lance le bot
npm run dev        # 🔧 Mode développement (nodemon)
npm test           # 🧪 Lance les tests (Jest)
npm run lint       # 🔍 Vérification du code
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une Issue ou une Pull Request.

---

<div align="center">
  <strong>🌟 Développé pour La Lanterne Nocturne 🌟</strong>
</div>
