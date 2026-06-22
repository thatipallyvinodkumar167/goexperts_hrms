import fs from 'fs';
import mysql from 'mysql2/promise';

async function restoreDatabase() {
  console.log("Starting restoration to new database...");
  try {
    const connection = await mysql.createConnection({
      host: 'reseau.proxy.rlwy.net',
      port: 23270,
      user: 'root',
      password: 'hAqZEeGuqRtaTCacMZHvbbcCqAAsyTtQ',
      database: 'railway',
      multipleStatements: true
    });

    console.log("Reading dump file...");
    const sql = fs.readFileSync('./database_dump_new.sql', 'utf8');
    
    console.log("Executing SQL dump... This may take a minute.");
    await connection.query(sql);
    
    console.log("Restoration successful!");
    await connection.end();
  } catch (error) {
    console.error("Restoration failed:", error);
  }
}

restoreDatabase();
