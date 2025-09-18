# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Non publié]

### À venir
- Dashboard web interactif
- API REST pour les statistiques
- Intégration avec d'autres bots
- Système de plugins

## [1.2.0] - 2024-01-XX

### Ajouté
- Fonctionnalités bonus complètes
- Alertes intelligentes de baisse d'activité
- Archivage automatique mensuel
- Dashboard visuel avec graphiques ASCII
- Personnalisation avancée des seuils
- Système de sauvegarde de configuration
- Gestion des erreurs améliorée

### Modifié
- Interface utilisateur plus intuitive
- Performance optimisée pour les gros serveurs
- Meilleure gestion de la mémoire
- Logs plus détaillés

### Corrigé
- Problème de synchronisation Git
- Erreurs de calcul des tendances
- Fuites mémoire lors de la génération de rapports

## [1.1.0] - 2024-01-XX

### Ajouté
- Composants interactifs complets (Type 17 et Type 10)
- Système de navigation avancé
- Gestion des modals pour la configuration
- Boutons d'actualisation en temps réel
- Sélecteurs de période dynamiques
- Visualisation détaillée des statistiques

### Modifié
- Architecture des composants refactorisée
- Gestion des interactions améliorée
- Interface plus responsive

### Corrigé
- Problèmes de timeout des interactions
- Erreurs lors de la sélection multiple
- Affichage incorrect des embeds

## [1.0.0] - 2024-01-XX

### Ajouté
- **Fonctionnalités principales**
  - Suivi complet des statistiques du serveur
  - Génération de rapports CSV (quotidien, hebdomadaire, mensuel)
  - Système de commandes administrateur
  - Commandes générales pour tous les utilisateurs

- **Suivi des statistiques**
  - Comptage des messages par canal et utilisateur
  - Suivi des arrivées/départs de membres
  - Analyse de l'activité du serveur
  - Top rankings des membres et canaux actifs
  - Calcul des tendances et évolutions

- **Génération de rapports**
  - Export CSV avec données détaillées
  - Rapports périodiques automatisés
  - Archivage des anciens rapports
  - Modèles de rapport personnalisables

- **Commandes administrateur**
  - `/rapport` - Gestion complète des rapports
    - `générer` - Génération de rapport pour une période
    - `liste` - Liste des rapports disponibles
    - `archiver` - Archivage des anciens rapports
  - `/stats` - Affichage des statistiques détaillées
  - `/config` - Configuration du bot
    - `afficher` - Affichage de la configuration
    - `modifier` - Modification des paramètres
    - `reset` - Remise à zéro
    - `backup` - Sauvegarde de configuration

- **Commandes générales**
  - `/help` - Système d'aide complet et interactif

- **Automatisation Git**
  - Configuration automatique de l'identité Git
  - Commits automatiques et fréquents
  - Push automatique vers le repository
  - Création de tags pour les versions
  - Sauvegarde automatique des données

- **Gestionnaires**
  - `StatsManager` - Gestion des statistiques
  - `ReportManager` - Génération et gestion des rapports
  - `EmailManager` - Envoi d'emails automatisé
  - `GitManager` - Automatisation Git complète

- **Système d'événements**
  - Gestion des interactions (commandes, boutons, menus)
  - Suivi des messages en temps réel
  - Détection des arrivées/départs de membres
  - Gestion des erreurs robuste

- **Configuration**
  - Fichier de configuration JSON
  - Variables d'environnement sécurisées
  - Paramètres personnalisables
  - Système de permissions par rôles

### Sécurité
- Vérification des permissions administrateur
- Gestion sécurisée des tokens et mots de passe
- Validation des entrées utilisateur
- Logs de sécurité

### Documentation
- README complet avec guide d'installation
- Documentation des commandes
- Exemples de configuration
- Guide de contribution

---

## Types de changements
- `Ajouté` pour les nouvelles fonctionnalités
- `Modifié` pour les changements dans les fonctionnalités existantes
- `Déprécié` pour les fonctionnalités qui seront supprimées prochainement
- `Supprimé` pour les fonctionnalités supprimées
- `Corrigé` pour les corrections de bugs
- `Sécurité` en cas de vulnérabilités