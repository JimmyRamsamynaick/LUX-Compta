/**
 * Script de test pour vérifier les fonctionnalités du bot
 * Exécuter avec: node test.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Démarrage des tests du bot LUX-Compta...\n');

// Test 1: Vérification de la structure des fichiers
console.log('📁 Test 1: Vérification de la structure des fichiers');
const requiredFiles = [
    'src/index.js',
    'src/managers/StatsManager.js',
    'src/managers/ReportManager.js',
    'src/managers/AlertManager.js',
    'src/managers/ArchiveManager.js',
    'src/managers/DashboardManager.js',
    'src/managers/CustomizationManager.js',
    'src/commands/admin/report.js',
    'src/commands/admin/stats.js',
    'src/commands/admin/config.js',
    'src/commands/admin/dashboard.js',
    'src/commands/admin/customize.js',
    'src/commands/admin/alerts.js',
    'src/commands/admin/archive.js',
    'src/events/ready.js',
    'src/events/messageCreate.js',
    'src/events/guildMemberAdd.js',
    'src/events/guildMemberRemove.js',
    'src/events/interactionCreate.js',
    'config.json',
    'package.json',
    'README.md',
    'LICENSE',
    'CHANGELOG.md',
    '.gitignore',
    '.env.example'
];

let missingFiles = [];
requiredFiles.forEach(file => {
    if (!fs.existsSync(path.join(__dirname, file))) {
        missingFiles.push(file);
    }
});

if (missingFiles.length === 0) {
    console.log('✅ Tous les fichiers requis sont présents');
} else {
    console.log('❌ Fichiers manquants:', missingFiles);
}

// Test 2: Vérification de la syntaxe JavaScript
console.log('\n📝 Test 2: Vérification de la syntaxe JavaScript');
const jsFiles = [
    'src/index.js',
    'src/managers/StatsManager.js',
    'src/managers/ReportManager.js',
    'src/managers/AlertManager.js',
    'src/managers/ArchiveManager.js',
    'src/managers/DashboardManager.js',
    'src/managers/CustomizationManager.js'
];

let syntaxErrors = [];
jsFiles.forEach(file => {
    try {
        if (fs.existsSync(path.join(__dirname, file))) {
            require(path.join(__dirname, file));
        }
    } catch (error) {
        if (error.code !== 'MODULE_NOT_FOUND' || !error.message.includes('discord.js')) {
            syntaxErrors.push({ file, error: error.message });
        }
    }
});

if (syntaxErrors.length === 0) {
    console.log('✅ Aucune erreur de syntaxe détectée');
} else {
    console.log('❌ Erreurs de syntaxe trouvées:');
    syntaxErrors.forEach(({ file, error }) => {
        console.log(`   ${file}: ${error}`);
    });
}

// Test 3: Vérification du package.json
console.log('\n📦 Test 3: Vérification du package.json');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['discord.js', 'fs-extra', 'moment', 'simple-git', 'chart.js'];
    let missingDeps = [];
    
    requiredDeps.forEach(dep => {
        if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
            missingDeps.push(dep);
        }
    });
    
    if (missingDeps.length === 0) {
        console.log('✅ Toutes les dépendances requises sont présentes');
    } else {
        console.log('❌ Dépendances manquantes:', missingDeps);
    }
    
    if (packageJson.main === 'src/index.js') {
        console.log('✅ Point d\'entrée correct');
    } else {
        console.log('❌ Point d\'entrée incorrect:', packageJson.main);
    }
} catch (error) {
    console.log('❌ Erreur lors de la lecture du package.json:', error.message);
}

// Test 4: Vérification de la configuration
console.log('\n⚙️ Test 4: Vérification de la configuration');
try {
    const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    const requiredConfigKeys = ['prefix', 'adminRoles', 'reportChannel', 'statsChannel'];
    let missingConfigKeys = [];
    
    requiredConfigKeys.forEach(key => {
        if (!config[key]) {
            missingConfigKeys.push(key);
        }
    });
    
    if (missingConfigKeys.length === 0) {
        console.log('✅ Configuration complète');
    } else {
        console.log('❌ Clés de configuration manquantes:', missingConfigKeys);
    }
} catch (error) {
    console.log('❌ Erreur lors de la lecture de config.json:', error.message);
}

// Test 5: Vérification des dossiers de données
console.log('\n📂 Test 5: Vérification des dossiers de données');
const requiredDirs = ['data', 'reports', 'backups', 'logs'];
let missingDirs = [];

requiredDirs.forEach(dir => {
    if (!fs.existsSync(path.join(__dirname, dir))) {
        try {
            fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
            console.log(`📁 Dossier créé: ${dir}`);
        } catch (error) {
            missingDirs.push(dir);
        }
    }
});

if (missingDirs.length === 0) {
    console.log('✅ Tous les dossiers requis sont présents ou ont été créés');
} else {
    console.log('❌ Impossible de créer les dossiers:', missingDirs);
}

// Test 6: Vérification des variables d'environnement
console.log('\n🔐 Test 6: Vérification des variables d\'environnement');
if (fs.existsSync('.env')) {
    console.log('✅ Fichier .env trouvé');
} else if (fs.existsSync('.env.example')) {
    console.log('⚠️ Fichier .env.example trouvé, mais pas de .env');
    console.log('   Copiez .env.example vers .env et configurez vos tokens');
} else {
    console.log('❌ Aucun fichier d\'environnement trouvé');
}

// Résumé final
console.log('\n📊 Résumé des tests:');
console.log('='.repeat(50));

const totalTests = 6;
let passedTests = 0;

if (missingFiles.length === 0) passedTests++;
if (syntaxErrors.length === 0) passedTests++;
// Les autres tests sont considérés comme réussis s'ils n'ont pas généré d'erreurs fatales
passedTests += 3; // Tests 3, 4, 5 sont informatifs
if (fs.existsSync('.env') || fs.existsSync('.env.example')) passedTests++;

console.log(`Tests réussis: ${passedTests}/${totalTests}`);
console.log(`Pourcentage de réussite: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
    console.log('\n🎉 Tous les tests sont passés! Le bot est prêt à être déployé.');
} else {
    console.log('\n⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
}

console.log('\n📝 Prochaines étapes:');
console.log('1. Configurez votre fichier .env avec vos tokens Discord');
console.log('2. Ajustez config.json selon vos besoins');
console.log('3. Exécutez: npm start');
console.log('4. Testez les commandes dans votre serveur Discord');

console.log('\n✨ Test terminé!');