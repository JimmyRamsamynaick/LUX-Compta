const mongoose = require('mongoose');
const ServerConfig = require('../src/models/ServerConfig');
require('dotenv').config();

const cleanIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const collection = mongoose.connection.collection('serverconfigs');
        
        // List existing indexes
        const indexes = await collection.indexes();
        console.log('🔍 Current Indexes:', indexes.map(i => i.name));

        // Drop the problematic index (usually named key_1)
        const oldIndexName = 'key_1';
        if (indexes.find(i => i.name === oldIndexName)) {
            await collection.dropIndex(oldIndexName);
            console.log(`🗑️ Dropped old index: ${oldIndexName}`);
        } else {
            console.log(`ℹ️ Index ${oldIndexName} not found (already clean?).`);
        }

        console.log('✅ Index cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning indexes:', error);
        process.exit(1);
    }
};

cleanIndexes();
