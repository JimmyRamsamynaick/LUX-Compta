# 🤖 LUX Compta - Bot Discord de Statistiques

Bot Discord avancé pour le serveur **La Lanterne Nocturne** qui suit et analyse les statistiques du serveur avec génération automatique de rapports.

## 📊 Fonctionnalités Principales

### Suivi des Statistiques
- **Membres** : Suivi des arrivées/départs avec tendances
- **Messages** : Comptage par canal et par utilisateur
- **Activité** : Analyse des pics et creux d'activité
- **Top Rankings** : Classements des membres et canaux les plus actifs

### Génération de Rapports
- **Formats** : CSV et visualisation Discord
- **Périodes** : Quotidien, hebdomadaire, mensuel
- **Actions** : Téléchargement, envoi par email, visualisation interactive
- **Archivage** : Sauvegarde automatique mensuelle

### Composants Interactifs
- **Type 17** : Menu de sélection de période (jour/semaine/mois)
- **Type 10** : Boutons d'action (télécharger/email/visualiser)
- **Navigation** : Interface intuitive avec embeds dynamiques

## 🚀 Installation

### Prérequis
- Node.js 16.9.0 ou supérieur
- Un bot Discord configuré
- Accès Git configuré

### Configuration
1. Clonez le repository :
```bash
git clone https://github.com/JimmyRamsamynaick/LUX-Compta.git
cd LUX-Compta
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez les variables d'environnement :
```bash
cp .env.example .env
# Éditez le fichier .env avec vos tokens
```

4. Lancez le bot :
```bash
npm start
```

## ⚙️ Configuration

### Variables d'environnement (.env)
```env
# Discord
DISCORD_TOKEN=votre_token_discord
DISCORD_CLIENT_ID=votre_client_id
DISCORD_GUILD_ID=votre_guild_id

# Email (optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app

# Git
GIT_AUTO_COMMIT=true
GIT_AUTO_PUSH=true
```

### Fichier de configuration (config.json)
Le bot génère automatiquement un fichier `config.json` avec les paramètres par défaut. Vous pouvez le modifier via la commande `/config` ou directement.

## 🎯 Commandes

### Commandes Administrateur
- `/rapport générer [période]` - Génère un rapport pour la période spécifiée
- `/rapport liste` - Affiche la liste des rapports disponibles
- `/rapport archiver` - Archive les anciens rapports
- `/stats [période] [type]` - Affiche les statistiques détaillées
- `/config afficher` - Affiche la configuration actuelle
- `/config modifier` - Modifie un paramètre de configuration
- `/config reset` - Remet la configuration par défaut
- `/config backup` - Crée une sauvegarde de la configuration

### Commandes Générales
- `/help [commande]` - Affiche l'aide générale ou spécifique

## 🔧 Architecture

```
src/
├── commands/           # Commandes slash
│   ├── admin/         # Commandes administrateur
│   └── general/       # Commandes générales
├── components/        # Composants interactifs
├── events/           # Gestionnaires d'événements
├── managers/         # Gestionnaires de fonctionnalités
└── utils/           # Utilitaires
```

### Gestionnaires Principaux
- **StatsManager** : Suivi et analyse des statistiques
- **ReportManager** : Génération et gestion des rapports
- **EmailManager** : Envoi d'emails automatisé
- **GitManager** : Automatisation Git

## 🔄 Automatisation Git

Le bot effectue automatiquement :
- **Commits** : Sauvegarde régulière des données
- **Push** : Synchronisation avec le repository distant
- **Tags** : Versioning automatique pour les versions majeures
- **Branches** : Gestion des branches de fonctionnalités

Configuration Git automatique :
- Utilisateur : `JimmyRamsamynaick <jimmyramsamynaick@gmail.com>`
- Fréquence : Configurable (par défaut : quotidienne)

## 📈 Fonctionnalités Bonus

### Alertes Intelligentes
- Détection automatique des baisses d'activité
- Notifications dans un canal dédié
- Seuils personnalisables

### Dashboard Visuel
- Graphiques ASCII intégrés
- Tendances et évolutions
- Comparaisons périodiques

### Archivage Automatique
- Sauvegarde mensuelle des rapports
- Nettoyage automatique des anciens fichiers
- Conservation des données importantes

## 🛠️ Développement

### Scripts disponibles
```bash
npm start          # Lance le bot
npm run dev        # Mode développement avec rechargement
npm test           # Lance les tests
npm run lint       # Vérification du code
```

### Structure des données
Les statistiques sont stockées dans `data/stats.json` avec la structure :
```json
{
  "daily": { "messages": {}, "members": {}, "channels": {} },
  "weekly": { "messages": {}, "members": {}, "channels": {} },
  "monthly": { "messages": {}, "members": {}, "channels": {} }
}
```

## 📝 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique des versions.

## 📄 Licence

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Contactez : jimmyramsamynaick@gmail.com

## 🏷️ Tags et Versions

- `v1.0.0` - Version initiale avec toutes les fonctionnalités de base
- `v1.1.0` - Ajout des fonctionnalités bonus
- `v1.2.0` - Améliorations de performance et nouvelles alertes

---

**Développé avec ❤️ pour La Lanterne Nocturne**