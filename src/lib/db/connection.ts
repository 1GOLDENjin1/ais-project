import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join } from 'path';

// Create database directory if it doesn't exist
const dbPath = join(process.cwd(), 'database', 'healthcare.db');

// Create SQLite database connection
const sqlite = new Database(dbPath);

// Enable foreign key constraints
sqlite.pragma('foreign_keys = ON');

// Initialize Drizzle ORM
export const db = drizzle(sqlite);

// Export the raw SQLite connection for direct queries if needed
export const rawDb = sqlite;

// Database initialization function
export const initializeDatabase = () => {
  console.log('Database initialized at:', dbPath);
  
  // Enable WAL mode for better concurrent access
  sqlite.pragma('journal_mode = WAL');
  
  // Set timeout for database operations
  sqlite.timeout(30000);
  
  return db;
};

// Close database connection
export const closeDatabase = () => {
  sqlite.close();
};