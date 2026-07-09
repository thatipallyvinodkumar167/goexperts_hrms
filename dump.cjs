const mysqldump = require('mysqldump');

const dbConfig = {
    host: 'reseau.proxy.rlwy.net',
    port: 23270,
    user: 'root',
    password: 'hAqZEeGuqRtaTCacMZHvbbcCqAAsyTtQ',
    database: 'railway',
};

async function dumpDatabase() {
    console.log('Starting database dump...');
    try {
        await mysqldump({
            connection: dbConfig,
            dumpToFile: './database_dump.sql',
        });
        console.log('Database dump successful! Saved to database_dump.sql');
    } catch (error) {
        console.error('Error during database dump:', error);
    }
}

dumpDatabase();
