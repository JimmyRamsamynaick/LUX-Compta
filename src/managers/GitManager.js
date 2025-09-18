const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const config = require('../../config.json');

class GitManager {
    constructor() {
        this.git = simpleGit();
        this.projectRoot = process.cwd();
    }

    async setupGitConfig() {
        try {
            // Configurer l'identité Git
            await this.git.addConfig('user.name', process.env.GIT_USER_NAME);
            await this.git.addConfig('user.email', process.env.GIT_USER_EMAIL);
            
            console.log(`🔧 Configuration Git mise à jour: ${process.env.GIT_USER_NAME} <${process.env.GIT_USER_EMAIL}>`);
            
            // Vérifier si c'est un dépôt Git
            const isRepo = await this.git.checkIsRepo();
            if (!isRepo) {
                console.log('⚠️ Ce n\'est pas un dépôt Git. Initialisation...');
                await this.git.init();
                console.log('✅ Dépôt Git initialisé');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la configuration Git:', error);
            return false;
        }
    }

    async autoCommit(message = null) {
        if (!config.git.auto_commit) {
            return false;
        }

        try {
            // Vérifier s'il y a des changements
            const status = await this.git.status();
            
            if (status.files.length === 0) {
                console.log('📝 Aucun changement à commiter');
                return false;
            }

            // Ajouter tous les fichiers
            await this.git.add('.');
            
            // Générer le message de commit
            const commitMessage = message || this.generateCommitMessage();
            
            // Effectuer le commit
            const commit = await this.git.commit(commitMessage);
            console.log(`✅ Commit effectué: ${commit.commit} - ${commitMessage}`);
            
            // Push automatique si configuré
            if (config.git.auto_push !== false) {
                await this.autoPush();
            }
            
            return true;
        } catch (error) {
            console.error('❌ Erreur lors du commit automatique:', error);
            return false;
        }
    }

    async autoPush() {
        try {
            // Vérifier s'il y a une remote configurée
            const remotes = await this.git.getRemotes(true);
            
            if (remotes.length === 0) {
                console.log('⚠️ Aucune remote configurée pour le push');
                return false;
            }

            // Obtenir la branche actuelle
            const currentBranch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
            
            // Push vers la remote
            await this.git.push('origin', currentBranch);
            console.log(`🚀 Push effectué vers origin/${currentBranch}`);
            
            return true;
        } catch (error) {
            console.error('❌ Erreur lors du push automatique:', error);
            return false;
        }
    }

    generateCommitMessage() {
        const template = config.git.commit_message_template || '📊 Mise à jour automatique des statistiques - {date}';
        const date = moment().format('DD/MM/YYYY HH:mm');
        
        return template.replace('{date}', date);
    }

    async createTag(version, message = null) {
        if (!config.git.create_tags) {
            return false;
        }

        try {
            const tagName = config.git.tag_pattern.replace('{version}', version);
            const tagMessage = message || `Version ${version} - ${moment().format('DD/MM/YYYY')}`;
            
            // Créer le tag
            await this.git.addAnnotatedTag(tagName, tagMessage);
            console.log(`🏷️ Tag créé: ${tagName}`);
            
            // Push le tag
            await this.git.pushTags('origin');
            console.log(`🚀 Tag poussé: ${tagName}`);
            
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la création du tag:', error);
            return false;
        }
    }

    async getCommitHistory(limit = 10) {
        try {
            const log = await this.git.log({ maxCount: limit });
            return log.all.map(commit => ({
                hash: commit.hash,
                date: commit.date,
                message: commit.message,
                author: commit.author_name,
                email: commit.author_email
            }));
        } catch (error) {
            console.error('❌ Erreur lors de la récupération de l\'historique:', error);
            return [];
        }
    }

    async getStatus() {
        try {
            const status = await this.git.status();
            return {
                current: status.current,
                tracking: status.tracking,
                ahead: status.ahead,
                behind: status.behind,
                staged: status.staged,
                modified: status.modified,
                not_added: status.not_added,
                deleted: status.deleted,
                renamed: status.renamed,
                files: status.files
            };
        } catch (error) {
            console.error('❌ Erreur lors de la récupération du statut Git:', error);
            return null;
        }
    }

    async createBranch(branchName) {
        try {
            await this.git.checkoutLocalBranch(branchName);
            console.log(`🌿 Branche créée et basculée: ${branchName}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la création de la branche:', error);
            return false;
        }
    }

    async switchBranch(branchName) {
        try {
            await this.git.checkout(branchName);
            console.log(`🔄 Basculé vers la branche: ${branchName}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur lors du changement de branche:', error);
            return false;
        }
    }

    async commitReports() {
        try {
            const reportsDir = path.join(this.projectRoot, 'reports');
            const dataDir = path.join(this.projectRoot, 'data');
            
            // Ajouter seulement les dossiers de rapports et données
            if (await fs.pathExists(reportsDir)) {
                await this.git.add(reportsDir);
            }
            
            if (await fs.pathExists(dataDir)) {
                await this.git.add(dataDir);
            }
            
            const message = `📊 Mise à jour des rapports et statistiques - ${moment().format('DD/MM/YYYY HH:mm')}`;
            const commit = await this.git.commit(message);
            
            console.log(`✅ Rapports commitées: ${commit.commit}`);
            
            // Push si configuré
            if (config.git.auto_push !== false) {
                await this.autoPush();
            }
            
            return true;
        } catch (error) {
            console.error('❌ Erreur lors du commit des rapports:', error);
            return false;
        }
    }

    async scheduleCommits() {
        const frequency = config.git.commit_frequency || 'daily';
        
        switch (frequency) {
            case 'hourly':
                // Déjà géré dans ready.js
                break;
            case 'daily':
                // Commit quotidien à minuit
                setTimeout(async () => {
                    await this.autoCommit('Commit quotidien automatique');
                    this.scheduleCommits(); // Reprogrammer
                }, this.getMillisecondsUntilMidnight());
                break;
            case 'weekly':
                // Commit hebdomadaire le dimanche
                setTimeout(async () => {
                    await this.autoCommit('Commit hebdomadaire automatique');
                    this.scheduleCommits(); // Reprogrammer
                }, this.getMillisecondsUntilSunday());
                break;
        }
    }

    getMillisecondsUntilMidnight() {
        const now = moment();
        const midnight = moment().add(1, 'day').startOf('day');
        return midnight.diff(now);
    }

    getMillisecondsUntilSunday() {
        const now = moment();
        const nextSunday = moment().day(7).startOf('day'); // Dimanche prochain
        if (nextSunday.isBefore(now)) {
            nextSunday.add(1, 'week');
        }
        return nextSunday.diff(now);
    }

    async backupToGit() {
        try {
            // Créer une branche de sauvegarde
            const backupBranch = `backup-${moment().format('YYYY-MM-DD-HH-mm')}`;
            await this.createBranch(backupBranch);
            
            // Commiter tous les fichiers
            await this.git.add('.');
            const commit = await this.git.commit(`Sauvegarde automatique - ${moment().format('DD/MM/YYYY HH:mm')}`);
            
            console.log(`💾 Sauvegarde créée sur la branche: ${backupBranch}`);
            
            // Retourner à la branche principale
            await this.switchBranch('main');
            
            return backupBranch;
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde Git:', error);
            return null;
        }
    }

    async getRepositoryInfo() {
        try {
            const remotes = await this.git.getRemotes(true);
            const branches = await this.git.branch();
            const tags = await this.git.tags();
            const status = await this.getStatus();
            
            return {
                remotes: remotes.map(r => ({ name: r.name, url: r.refs.fetch })),
                currentBranch: branches.current,
                allBranches: branches.all,
                tags: tags.all,
                status
            };
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des infos du dépôt:', error);
            return null;
        }
    }
}

module.exports = GitManager;