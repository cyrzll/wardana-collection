import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    console.log('Creating data directory...');
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'sqlite.db');
console.log('Connecting to:', dbPath);

try {
    const db = new Database(dbPath);
    console.log('Connected successfully');
    db.prepare('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)').run();
    console.log('Table created successfully');
    db.close();
    console.log('Closed successfully');
} catch (err) {
    console.error('Error:', err);
}
