import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        pin_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        language TEXT DEFAULT 'fr',
        role TEXT DEFAULT 'user',
        premium_until TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS medications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        dosage TEXT,
        frequency TEXT NOT NULL,
        time TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        active INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS conversion_rates (
        id SERIAL PRIMARY KEY,
        from_currency TEXT NOT NULL,
        to_currency TEXT NOT NULL,
        official_rate REAL NOT NULL,
        parallel_rate REAL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS receipts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        from_name TEXT NOT NULL,
        to_name TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        description TEXT,
        location TEXT,
        signature_from TEXT,
        signature_to TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        unit TEXT DEFAULT 'pièce',
        stock INTEGER DEFAULT 0,
        tva REAL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        type TEXT CHECK(type IN ('client', 'fournisseur')) NOT NULL DEFAULT 'client',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        type TEXT CHECK(type IN ('devis', 'facture', 'avoir')) NOT NULL DEFAULT 'facture',
        number TEXT NOT NULL,
        date TEXT NOT NULL,
        due_date TEXT,
        total_ht REAL NOT NULL,
        total_ttc REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        description TEXT,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        tva REAL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  } finally {
    client.release();
  }
}

createTables().catch(console.error);
export default pool;
