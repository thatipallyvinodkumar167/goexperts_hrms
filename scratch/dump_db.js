import mysqldump from 'mysqldump';

async function exportDatabase() {
  console.log("Starting export from old database...");
  try {
    await mysqldump({
      connection: {
        host: 'yamabiko.proxy.rlwy.net',
        port: 47888,
        user: 'root',
        password: 'IQtEkruofFKDlmUeAVUelBvkDELGDPFQ',
        database: 'railway',
      },
      dumpToFile: './database_dump_new.sql',
    });
    console.log("Export successful! Saved to database_dump_new.sql");
  } catch (error) {
    console.error("Export failed:", error);
  }
}

exportDatabase();
