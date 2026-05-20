import mysqldump from 'mysqldump';

mysqldump({
    connection: {
        host: 'yamabiko.proxy.rlwy.net',
        port: 47888,
        user: 'root',
        password: 'IQtEkruofFKDlmUeAVUelBvkDELGDPFQ',
        database: 'railway',
    },
    dumpToFile: './railway_database_dump.sql',
}).then(() => {
    console.log('Successfully created railway_database_dump.sql');
}).catch(err => {
    console.error('Error:', err);
});
