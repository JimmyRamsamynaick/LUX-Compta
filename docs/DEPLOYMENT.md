# 🚀 Guide de Déploiement - LUX-Compta

## 📋 Vue d'ensemble

Ce guide détaille les différentes méthodes de déploiement de LUX-Compta, des environnements de développement aux déploiements en production.

## 🔧 Prérequis

### Système Requis

- **Node.js** : Version 18.0.0 ou supérieure
- **npm** : Version 8.0.0 ou supérieure
- **Git** : Pour le clonage et la gestion des versions
- **Mémoire RAM** : Minimum 512 MB, recommandé 1 GB
- **Espace disque** : Minimum 1 GB pour les logs et archives

### Comptes et Services

- **Discord Developer Portal** : Pour créer l'application bot
- **Serveur SMTP** : Pour l'envoi d'emails (optionnel)
- **Service de monitoring** : Pour la surveillance en production (optionnel)

## 🏠 Déploiement Local (Développement)

### 1. Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/LUX-Compta.git
cd LUX-Compta

# Installer les dépendances
npm install

# Copier le fichier de configuration
cp .env.example .env
```

### 2. Configuration

Éditez le fichier `.env` :

```env
# Configuration Discord
DISCORD_TOKEN=votre_token_discord_bot
DISCORD_CLIENT_ID=votre_client_id

# Configuration Email (optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app

# Configuration Développement
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
```

### 3. Lancement

```bash
# Mode développement avec rechargement automatique
npm run dev

# Mode production local
npm start
```

### 4. Vérification

- Vérifiez que le bot apparaît en ligne sur Discord
- Testez une commande simple comme `/ping`
- Consultez les logs dans `logs/app.log`

## ☁️ Déploiement Cloud

### Heroku

#### 1. Préparation

```bash
# Installer Heroku CLI
npm install -g heroku

# Se connecter à Heroku
heroku login

# Créer une nouvelle application
heroku create votre-app-name
```

#### 2. Configuration

```bash
# Définir les variables d'environnement
heroku config:set DISCORD_TOKEN=votre_token
heroku config:set DISCORD_CLIENT_ID=votre_client_id
heroku config:set NODE_ENV=production

# Optionnel : Configuration email
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_USER=votre_email@gmail.com
heroku config:set EMAIL_PASS=votre_mot_de_passe
```

#### 3. Déploiement

```bash
# Ajouter le remote Heroku
git remote add heroku https://git.heroku.com/votre-app-name.git

# Déployer
git push heroku main

# Vérifier les logs
heroku logs --tail
```

#### 4. Configuration Heroku spécifique

Créez un fichier `Procfile` :

```
web: node src/index.js
```

Ajoutez dans `package.json` :

```json
{
  "engines": {
    "node": "18.x",
    "npm": "8.x"
  }
}
```

### Railway

#### 1. Configuration

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Initialiser le projet
railway init
```

#### 2. Variables d'environnement

Dans le dashboard Railway, ajoutez :

```
DISCORD_TOKEN=votre_token
DISCORD_CLIENT_ID=votre_client_id
NODE_ENV=production
PORT=3000
```

#### 3. Déploiement

```bash
# Déployer
railway up

# Suivre les logs
railway logs
```

### Render

#### 1. Configuration

1. Connectez votre repository GitHub à Render
2. Créez un nouveau "Web Service"
3. Configurez les paramètres :

```
Build Command: npm install
Start Command: npm start
```

#### 2. Variables d'environnement

Dans les paramètres Render :

```
DISCORD_TOKEN=votre_token
DISCORD_CLIENT_ID=votre_client_id
NODE_ENV=production
```

### DigitalOcean App Platform

#### 1. Configuration

Créez un fichier `.do/app.yaml` :

```yaml
name: lux-compta
services:
- name: bot
  source_dir: /
  github:
    repo: votre-username/LUX-Compta
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: DISCORD_TOKEN
    value: votre_token
    type: SECRET
  - key: DISCORD_CLIENT_ID
    value: votre_client_id
  - key: NODE_ENV
    value: production
```

## 🐳 Déploiement Docker

### 1. Dockerfile

Créez un `Dockerfile` :

```dockerfile
FROM node:18-alpine

# Créer le répertoire de l'application
WORKDIR /usr/src/app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Changer la propriété des fichiers
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
```

### 2. Docker Compose

Créez un `docker-compose.yml` :

```yaml
version: '3.8'

services:
  lux-compta:
    build: .
    container_name: lux-compta-bot
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}
      - EMAIL_HOST=${EMAIL_HOST}
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASS=${EMAIL_PASS}
    volumes:
      - ./logs:/usr/src/app/logs
      - ./archives:/usr/src/app/archives
      - ./reports:/usr/src/app/reports
    networks:
      - lux-network

networks:
  lux-network:
    driver: bridge
```

### 3. Commandes Docker

```bash
# Construire l'image
docker build -t lux-compta .

# Lancer avec Docker Compose
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

## 🖥️ Déploiement VPS (Ubuntu/Debian)

### 1. Préparation du serveur

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation de PM2
sudo npm install -g pm2

# Installation de Git
sudo apt install git -y
```

### 2. Déploiement de l'application

```bash
# Cloner le repository
git clone https://github.com/votre-username/LUX-Compta.git
cd LUX-Compta

# Installer les dépendances
npm install --production

# Configurer l'environnement
cp .env.example .env
nano .env  # Éditer avec vos valeurs
```

### 3. Configuration PM2

Créez un fichier `ecosystem.config.js` :

```javascript
module.exports = {
  apps: [{
    name: 'lux-compta',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 4. Lancement avec PM2

```bash
# Démarrer l'application
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Configurer le démarrage automatique
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Vérifier le statut
pm2 status
pm2 logs lux-compta
```

### 5. Configuration Nginx (optionnel)

Si vous voulez exposer un dashboard web :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔄 Déploiement Automatisé (CI/CD)

### GitHub Actions

Créez `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "votre-app-name"
        heroku_email: "votre-email@example.com"
    
    - name: Deploy to VPS
      if: startsWith(github.ref, 'refs/tags/')
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USER }}
        key: ${{ secrets.VPS_SSH_KEY }}
        script: |
          cd /path/to/LUX-Compta
          git pull origin main
          npm install --production
          pm2 restart lux-compta
```

### GitLab CI/CD

Créez `.gitlab-ci.yml` :

```yaml
stages:
  - test
  - deploy

variables:
  NODE_VERSION: "18"

test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm test
  only:
    - merge_requests
    - main

deploy_production:
  stage: deploy
  image: node:$NODE_VERSION
  script:
    - npm ci --production
    - echo "Deploying to production..."
    # Ajoutez vos commandes de déploiement ici
  only:
    - main
  environment:
    name: production
```

## 📊 Monitoring et Maintenance

### 1. Monitoring avec PM2

```bash
# Installer PM2 Plus pour le monitoring
pm2 install pm2-server-monit

# Configurer les alertes
pm2 set pm2-server-monit:conf '{"actions":["restart"],"max_memory":1000}'
```

### 2. Logs et Rotation

```bash
# Configuration de la rotation des logs
pm2 install pm2-logrotate

# Configuration
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 3. Sauvegarde Automatique

Créez un script `backup.sh` :

```bash
#!/bin/bash

# Variables
BACKUP_DIR="/backup/lux-compta"
APP_DIR="/path/to/LUX-Compta"
DATE=$(date +%Y%m%d_%H%M%S)

# Créer le répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarder les logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz $APP_DIR/logs/

# Sauvegarder les rapports
tar -czf $BACKUP_DIR/reports_$DATE.tar.gz $APP_DIR/reports/

# Sauvegarder les archives
tar -czf $BACKUP_DIR/archives_$DATE.tar.gz $APP_DIR/archives/

# Nettoyer les anciennes sauvegardes (garder 7 jours)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Sauvegarde terminée: $DATE"
```

Ajoutez au crontab :

```bash
# Sauvegarde quotidienne à 2h du matin
0 2 * * * /path/to/backup.sh
```

### 4. Mise à jour Automatique

Créez un script `update.sh` :

```bash
#!/bin/bash

cd /path/to/LUX-Compta

# Sauvegarder avant mise à jour
./backup.sh

# Récupérer les dernières modifications
git fetch origin

# Vérifier s'il y a des mises à jour
if [ $(git rev-list HEAD...origin/main --count) -gt 0 ]; then
    echo "Mise à jour disponible, déploiement..."
    
    # Arrêter l'application
    pm2 stop lux-compta
    
    # Mettre à jour le code
    git pull origin main
    
    # Installer les nouvelles dépendances
    npm install --production
    
    # Redémarrer l'application
    pm2 start lux-compta
    
    echo "Mise à jour terminée"
else
    echo "Aucune mise à jour disponible"
fi
```

## 🔒 Sécurité en Production

### 1. Variables d'Environnement

- Utilisez des services de gestion de secrets (AWS Secrets Manager, HashiCorp Vault)
- Ne jamais commiter les fichiers `.env`
- Utilisez des tokens avec permissions minimales

### 2. Réseau et Firewall

```bash
# Configuration UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. SSL/TLS

```bash
# Installation Certbot pour Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

### 4. Monitoring de Sécurité

```bash
# Installation de Fail2Ban
sudo apt install fail2ban

# Configuration pour SSH
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 🚨 Dépannage

### Problèmes Courants

#### Bot ne se connecte pas

```bash
# Vérifier les logs
pm2 logs lux-compta

# Vérifier la configuration
cat .env | grep DISCORD_TOKEN

# Tester la connectivité
curl -H "Authorization: Bot VOTRE_TOKEN" https://discord.com/api/v10/users/@me
```

#### Erreurs de mémoire

```bash
# Augmenter la limite mémoire PM2
pm2 restart lux-compta --max-memory-restart 2G

# Vérifier l'utilisation mémoire
pm2 monit
```

#### Problèmes de permissions

```bash
# Vérifier les permissions des fichiers
ls -la logs/ reports/ archives/

# Corriger les permissions
chmod 755 logs/ reports/ archives/
chown -R nodejs:nodejs /path/to/app
```

### Commandes de Diagnostic

```bash
# Statut général
pm2 status
pm2 info lux-compta

# Logs en temps réel
pm2 logs lux-compta --lines 100

# Redémarrage complet
pm2 restart lux-compta

# Rechargement sans interruption
pm2 reload lux-compta
```

## 📞 Support

Pour obtenir de l'aide :

1. Consultez les logs d'application
2. Vérifiez la documentation Discord.js
3. Ouvrez une issue sur GitHub
4. Contactez l'équipe de support

---

*Ce guide de déploiement est maintenu à jour avec les meilleures pratiques. N'hésitez pas à contribuer avec vos améliorations !*