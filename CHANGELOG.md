# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/spec/v2.0.0.html).

## [Non publié]

### En cours de développement
- Nouvelles fonctionnalités à venir
- Améliorations de performance
- Corrections de bugs mineurs

## [v2025.1.0] - 2025-01-25

### Ajouté
- Mise à jour complète vers l'année 2025
- Documentation README.md complètement réécrite et améliorée
- Badges de statut et table des matières dans le README
- Sections détaillées sur l'architecture et les fonctionnalités
- Guide de contribution et support utilisateur
- Documentation des fonctionnalités avancées

### Modifié
- Toutes les références de dates de 2024 vers 2025
- Template de rapport avec nouvelles dates 2025
- Licence mise à jour pour 2025
- Amélioration du système de génération de rapports
- Simplification des intents Discord pour éviter les erreurs
- Optimisation de la configuration du bot

### Corrigé
- Erreur "Used disallowed intents" dans Discord.js
- Suppression des événements guildMemberAdd et guildMemberRemove
- Problèmes de démarrage du bot Discord
- Correction des patterns de dates dans node-cron

### Supprimé
- Événements Discord nécessitant des intents non autorisés
- Dépendances obsolètes dans le système de membres

## [1.0.2] - 2025-01-01

### Modifié
- Mise à jour du format des noms de fichiers vers DD-MM-YYYY
- Amélioration de la cohérence du système de nommage
- Optimisation des patterns de matching des dates

### Corrigé
- Correction des problèmes de format de date dans ReportManager
- Résolution des erreurs de parsing dans ArchiveManager
- Amélioration de la gestion des dates dans GitManager

## [1.0.1] - 2025-01-01

### Ajouté
- Système de gestion des archives automatique
- Fonctionnalité de rapport par email
- Interface de configuration des paramètres

### Modifié
- Amélioration des performances de génération de rapports
- Optimisation de la gestion des fichiers temporaires
- Mise à jour de la documentation utilisateur

### Corrigé
- Correction des erreurs de validation des données
- Résolution des problèmes de permissions de fichiers
- Amélioration de la gestion des erreurs réseau

## [1.0.0] - 2025-01-01

### Ajouté
- Version initiale du système LUX-Compta
- Bot Discord avec commandes de base
- Système de génération de rapports automatiques
- Gestion des statistiques de serveur Discord
- Fonctionnalité d'archivage des données
- Système de sauvegarde Git automatique
- Configuration par variables d'environnement
- Tests unitaires complets
- Documentation complète du projet

### Fonctionnalités principales
- **StatsManager** : Collecte et analyse des statistiques Discord
- **ReportManager** : Génération de rapports CSV et envoi par email
- **ArchiveManager** : Archivage automatique des anciens rapports
- **GitManager** : Sauvegarde automatique avec versioning Git
- **EmailManager** : Envoi automatique de rapports par email
- **Commandes Discord** : Interface utilisateur complète

### Architecture
- Structure modulaire avec managers spécialisés
- Gestion d'erreurs robuste
- Logging détaillé pour le debugging
- Configuration flexible via .env
- Tests automatisés avec Jest

---

## Types de changements
- `Ajouté` pour les nouvelles fonctionnalités
- `Modifié` pour les changements dans les fonctionnalités existantes
- `Déprécié` pour les fonctionnalités qui seront supprimées prochainement
- `Supprimé` pour les fonctionnalités supprimées
- `Corrigé` pour les corrections de bugs
- `Sécurité` en cas de vulnérabilités