import Database from 'better-sqlite3'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'

let _db: ReturnType<typeof Database> | null = null

export function getDb() {
  if (_db) return _db

  const dataDir = join(process.cwd(), 'data')
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = join(dataDir, 'sqlite.db')
  _db = new Database(dbPath)

  // Initialize tables
  _db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'user',
      profile_image TEXT,
      status TEXT DEFAULT 'active'
    )
  `).run()

  _db.prepare(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `).run()

  _db.prepare(`
    CREATE TABLE IF NOT EXISTS genders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `).run()

  _db.prepare(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      images TEXT,
      category_id INTEGER,
      gender_id INTEGER,
      options TEXT,
      sizes TEXT,
      cost_price REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories (id),
      FOREIGN KEY (gender_id) REFERENCES genders (id)
    )
  `).run()

  // Ensure columns exist for existing databases
  try { _db.prepare('ALTER TABLE products ADD COLUMN options TEXT').run() } catch (e) {}
  try { _db.prepare('ALTER TABLE products ADD COLUMN sizes TEXT').run() } catch (e) {}
  try { _db.prepare('ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0').run() } catch (e) {}
  try { _db.prepare('ALTER TABLE products ADD COLUMN selling_price REAL DEFAULT 0').run() } catch (e) {}
  try { _db.prepare('ALTER TABLE products ADD COLUMN discount REAL DEFAULT 0').run() } catch (e) {}
  try { _db.prepare('ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0').run() } catch (e) {}
  try { _db.prepare('ALTER TABLE products ADD COLUMN gender_id INTEGER').run() } catch (e) {}
  try { _db.prepare('ALTER TABLE users ADD COLUMN profile_image TEXT').run() } catch (e) {}
  try { _db.prepare('ALTER TABLE users ADD COLUMN status TEXT DEFAULT "active"').run() } catch (e) {}

  // Seed default genders
  const genderCount = _db.prepare('SELECT COUNT(*) as count FROM genders').get() as { count: number }
  if (genderCount.count === 0) {
    const seedGenders = ['Male', 'Female', 'Unisex']
    const stmt = _db.prepare('INSERT INTO genders (name) VALUES (?)')
    seedGenders.forEach(g => stmt.run(g))
  }

  // Seed admin user if not exists
  const adminExists = _db.prepare('SELECT * FROM users WHERE email = ?').get('admin@mail.com')
  if (!adminExists) {
    _db.prepare('INSERT INTO users (username, email, password, level, profile_image) VALUES (?, ?, ?, ?, ?)').run(
      'admin', 'admin@mail.com', 'admin123', 'admin', '/images/profile/default-profile.jpeg'
    )
  }

  return _db
}

export default getDb
