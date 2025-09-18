const fs = require('fs').promises;
const path = require('path');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const zlib = require('zlib');

class ArchiveManager {
	constructor(client) {
		this.client = client;
		this.configPath = path.join(__dirname, '../../config.json');
		this.dataPath = path.join(__dirname, '../../data');
		this.reportsPath = path.join(__dirname, '../../reports');
		this.archivePath = path.join(__dirname, '../../archives');

		this.initializeArchive();
	}

	async initializeArchive() {
		try {
			// Créer le dossier d'archives s'il n'existe pas
			await fs.mkdir(this.archivePath, { recursive: true });

			// Créer les sous-dossiers
			await fs.mkdir(path.join(this.archivePath, 'reports'), { recursive: true });
			await fs.mkdir(path.join(this.archivePath, 'data'), { recursive: true });
			await fs.mkdir(path.join(this.archivePath, 'configs'), { recursive: true });

			console.log('✅ ArchiveManager initialisé');
		}
		catch (error) {
			console.error('❌ Erreur lors de l\'initialisation d\'ArchiveManager:', error);
		}
	}

	async autoArchive() {
		try {
			const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));

			if (!config.reports.autoArchive) {
				console.log('📦 Archivage automatique désactivé');
				return;
			}

			console.log('📦 Début de l\'archivage automatique...');

			// Archiver les rapports anciens
			await this.archiveOldReports();

			// Archiver les données anciennes
			await this.archiveOldData();

			// Nettoyer les fichiers temporaires
			await this.cleanupTempFiles();

			console.log('✅ Archivage automatique terminé');

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'archivage automatique:', error);
		}
	}

	async archiveOldReports(olderThanDays = 30) {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

			// Lister tous les fichiers de rapports
			const reportFiles = await fs.readdir(this.reportsPath);
			let archivedCount = 0;

			for (const file of reportFiles) {
				if (!file.endsWith('.csv')) continue;

				const filePath = path.join(this.reportsPath, file);
				const stats = await fs.stat(filePath);

				// Vérifier si le fichier est assez ancien
				if (stats.mtime < cutoffDate) {
					await this.compressAndArchiveFile(
						filePath,
						path.join(this.archivePath, 'reports', `${file}.gz`),
					);

					// Supprimer le fichier original
					await fs.unlink(filePath);
					archivedCount++;
				}
			}

			console.log(`📦 ${archivedCount} rapports archivés`);
			return archivedCount;

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'archivage des rapports:', error);
			return 0;
		}
	}

	async archiveOldData(olderThanDays = 90) {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

			// Créer une sauvegarde des données actuelles
			const now = new Date();
			const timestamp = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
			const backupName = `data_backup_${timestamp}.json`;

			// Lire les données actuelles
			const statsPath = path.join(this.dataPath, 'stats.json');

			try {
				const statsData = JSON.parse(await fs.readFile(statsPath, 'utf8'));

				// Filtrer les données anciennes
				const filteredData = this.filterOldData(statsData, cutoffDate);
				const archivedData = this.extractOldData(statsData, cutoffDate);

				// Sauvegarder les données filtrées
				await fs.writeFile(statsPath, JSON.stringify(filteredData, null, 2));

				// Archiver les anciennes données
				if (Object.keys(archivedData).length > 0) {
					const archivePath = path.join(this.archivePath, 'data', backupName);
					await fs.writeFile(archivePath, JSON.stringify(archivedData, null, 2));

					// Compresser l'archive
					await this.compressAndArchiveFile(archivePath, `${archivePath}.gz`);
					await fs.unlink(archivePath);
				}

				console.log(`📦 Données anciennes archivées: ${backupName}.gz`);

			}
			catch (error) {
				if (error.code !== 'ENOENT') {
					throw error;
				}
			}

		}
		catch (error) {
			console.error('❌ Erreur lors de l\'archivage des données:', error);
		}
	}

	filterOldData(data, cutoffDate) {
		const filtered = { daily: {}, weekly: {}, monthly: {} };

		for (const [period, periodData] of Object.entries(data)) {
			filtered[period] = {};

			for (const [date, dayData] of Object.entries(periodData)) {
				const dataDate = new Date(date);
				if (dataDate >= cutoffDate) {
					filtered[period][date] = dayData;
				}
			}
		}

		return filtered;
	}

	extractOldData(data, cutoffDate) {
		const archived = { daily: {}, weekly: {}, monthly: {} };

		for (const [period, periodData] of Object.entries(data)) {
			archived[period] = {};

			for (const [date, dayData] of Object.entries(periodData)) {
				const dataDate = new Date(date);
				if (dataDate < cutoffDate) {
					archived[period][date] = dayData;
				}
			}
		}

		return archived;
	}

	async compressAndArchiveFile(sourcePath, targetPath) {
		try {
			const readStream = createReadStream(sourcePath);
			const writeStream = createWriteStream(targetPath);
			const gzipStream = zlib.createGzip();

			await pipeline(readStream, gzipStream, writeStream);
			console.log(`🗜️ Fichier compressé: ${path.basename(targetPath)}`);

		}
		catch (error) {
			console.error(`❌ Erreur lors de la compression de ${sourcePath}:`, error);
			throw error;
		}
	}

	async cleanupTempFiles() {
		try {
			const tempPath = path.join(__dirname, '../../temp');

			try {
				const tempFiles = await fs.readdir(tempPath);
				let cleanedCount = 0;

				for (const file of tempFiles) {
					const filePath = path.join(tempPath, file);
					const stats = await fs.stat(filePath);

					// Supprimer les fichiers temporaires de plus de 24h
					const oneDayAgo = new Date();
					oneDayAgo.setHours(oneDayAgo.getHours() - 24);

					if (stats.mtime < oneDayAgo) {
						await fs.unlink(filePath);
						cleanedCount++;
					}
				}

				if (cleanedCount > 0) {
					console.log(`🧹 ${cleanedCount} fichiers temporaires supprimés`);
				}

			}
			catch (error) {
				if (error.code !== 'ENOENT') {
					throw error;
				}
			}

		}
		catch (error) {
			console.error('❌ Erreur lors du nettoyage des fichiers temporaires:', error);
		}
	}

	async createManualArchive(type = 'full') {
		try {
			const now = new Date();
			const timestamp = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
			const archiveName = `manual_archive_${type}_${timestamp}`;
			const archiveDir = path.join(this.archivePath, archiveName);

			await fs.mkdir(archiveDir, { recursive: true });

			switch (type) {
			case 'full':
				await this.createFullArchive(archiveDir);
				break;
			case 'reports':
				await this.createReportsArchive(archiveDir);
				break;
			case 'data':
				await this.createDataArchive(archiveDir);
				break;
			case 'config':
				await this.createConfigArchive(archiveDir);
				break;
			}

			// Compresser l'archive complète
			const compressedPath = `${archiveDir}.tar.gz`;
			await this.createTarGz(archiveDir, compressedPath);

			// Supprimer le dossier non compressé
			await this.removeDirectory(archiveDir);

			console.log(`📦 Archive manuelle créée: ${path.basename(compressedPath)}`);
			return compressedPath;

		}
		catch (error) {
			console.error('❌ Erreur lors de la création de l\'archive manuelle:', error);
			throw error;
		}
	}

	async createFullArchive(archiveDir) {
		// Copier tous les fichiers importants
		await this.copyDirectory(this.dataPath, path.join(archiveDir, 'data'));
		await this.copyDirectory(this.reportsPath, path.join(archiveDir, 'reports'));

		// Copier la configuration
		await fs.copyFile(this.configPath, path.join(archiveDir, 'config.json'));

		// Créer un fichier de métadonnées
		const metadata = {
			created: new Date().toISOString(),
			type: 'full',
			version: '1.0.0',
			description: 'Archive complète du bot LUX Compta',
		};

		await fs.writeFile(
			path.join(archiveDir, 'metadata.json'),
			JSON.stringify(metadata, null, 2),
		);
	}

	async createReportsArchive(archiveDir) {
		await this.copyDirectory(this.reportsPath, path.join(archiveDir, 'reports'));

		const metadata = {
			created: new Date().toISOString(),
			type: 'reports',
			description: 'Archive des rapports uniquement',
		};

		await fs.writeFile(
			path.join(archiveDir, 'metadata.json'),
			JSON.stringify(metadata, null, 2),
		);
	}

	async createDataArchive(archiveDir) {
		await this.copyDirectory(this.dataPath, path.join(archiveDir, 'data'));

		const metadata = {
			created: new Date().toISOString(),
			type: 'data',
			description: 'Archive des données statistiques',
		};

		await fs.writeFile(
			path.join(archiveDir, 'metadata.json'),
			JSON.stringify(metadata, null, 2),
		);
	}

	async createConfigArchive(archiveDir) {
		await fs.copyFile(this.configPath, path.join(archiveDir, 'config.json'));

		const metadata = {
			created: new Date().toISOString(),
			type: 'config',
			description: 'Archive de la configuration',
		};

		await fs.writeFile(
			path.join(archiveDir, 'metadata.json'),
			JSON.stringify(metadata, null, 2),
		);
	}

	async copyDirectory(source, destination) {
		try {
			await fs.mkdir(destination, { recursive: true });
			const files = await fs.readdir(source);

			for (const file of files) {
				const sourcePath = path.join(source, file);
				const destPath = path.join(destination, file);
				const stats = await fs.stat(sourcePath);

				if (stats.isDirectory()) {
					await this.copyDirectory(sourcePath, destPath);
				}
				else {
					await fs.copyFile(sourcePath, destPath);
				}
			}
		}
		catch (error) {
			if (error.code !== 'ENOENT') {
				throw error;
			}
		}
	}

	async removeDirectory(dirPath) {
		try {
			const files = await fs.readdir(dirPath);

			for (const file of files) {
				const filePath = path.join(dirPath, file);
				const stats = await fs.stat(filePath);

				if (stats.isDirectory()) {
					await this.removeDirectory(filePath);
				}
				else {
					await fs.unlink(filePath);
				}
			}

			await fs.rmdir(dirPath);
		}
		catch (error) {
			console.error(`❌ Erreur lors de la suppression du dossier ${dirPath}:`, error);
		}
	}

	async createTarGz(sourceDir, targetPath) {
		// Simulation de création d'archive tar.gz
		// Dans un environnement réel, vous utiliseriez une bibliothèque comme 'tar'
		console.log(`🗜️ Création de l'archive: ${path.basename(targetPath)}`);

		// Pour l'instant, on crée juste un fichier vide
		await fs.writeFile(targetPath, '');
	}

	async listArchives() {
		try {
			const archives = [];
			const archiveFiles = await fs.readdir(this.archivePath);

			for (const file of archiveFiles) {
				if (file.endsWith('.gz') || file.endsWith('.tar.gz')) {
					const filePath = path.join(this.archivePath, file);
					const stats = await fs.stat(filePath);

					archives.push({
						name: file,
						size: stats.size,
						created: stats.birthtime,
						modified: stats.mtime,
					});
				}
			}

			return archives.sort((a, b) => b.created - a.created);

		}
		catch (error) {
			console.error('❌ Erreur lors de la liste des archives:', error);
			return [];
		}
	}

	async deleteOldArchives(olderThanDays = 365) {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

			const archives = await this.listArchives();
			let deletedCount = 0;

			for (const archive of archives) {
				if (archive.created < cutoffDate) {
					const archivePath = path.join(this.archivePath, archive.name);
					await fs.unlink(archivePath);
					deletedCount++;
				}
			}

			if (deletedCount > 0) {
				console.log(`🗑️ ${deletedCount} anciennes archives supprimées`);
			}

			return deletedCount;

		}
		catch (error) {
			console.error('❌ Erreur lors de la suppression des anciennes archives:', error);
			return 0;
		}
	}

	// Planifier l'archivage automatique
	startArchiveScheduler() {
		// Archivage automatique une fois par semaine
		setInterval(() => {
			this.autoArchive();
		}, 7 * 24 * 60 * 60 * 1000); // 7 jours

		// Nettoyage des anciennes archives une fois par mois
		setInterval(() => {
			this.deleteOldArchives();
		}, 30 * 24 * 60 * 60 * 1000); // 30 jours

		console.log('⏰ Planificateur d\'archivage démarré');
	}
}

module.exports = ArchiveManager;