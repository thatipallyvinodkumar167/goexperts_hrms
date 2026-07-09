import dotenv from "dotenv";
import mysqldump from "mysqldump";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createDbDump = async () => {
  try {
    console.log("🚀 Starting database dump...");

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error(
        "DATABASE_URL not found in .env file. Please make sure it is set."
      );
    }

    // Parse the DATABASE_URL
    // format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
    const url = new URL(dbUrl);
    const connectionConfig = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // remove leading '/'
      port: url.port || 3306,
    };

    const dumpFilePath = path.join(__dirname, "..", "dump.sql");

    await mysqldump({
      connection: connectionConfig,
      dumpToFile: dumpFilePath,
    });

    console.log(`✅ Database dump created successfully at: ${dumpFilePath}`);
  } catch (error) {
    console.error("❌ Error creating database dump:", error.message);
    process.exit(1);
  }
};

createDbDump();