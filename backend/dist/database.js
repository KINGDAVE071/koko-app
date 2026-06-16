"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTables = createTables;
const pg_1 = require("pg");
const pool = new pg_1.Pool({
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
        logo TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS medications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        dosage TEXT,
        frequency TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        active INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS medication_times (
        id SERIAL PRIMARY KEY,
        medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
        time TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS medication_logs (
        id SERIAL PRIMARY KEY,
        medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        taken BOOLEAN DEFAULT false,
        UNIQUE(medication_id, date, time)
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
        hash TEXT,
        deleted BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        price REAL NOT NULL DEFAULT 0,
        cost_price REAL DEFAULT 0,
        stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 0,
        tva REAL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        receipt_id INTEGER NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        cost_price REAL NOT NULL DEFAULT 0
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
        client_name TEXT,
        type TEXT CHECK(type IN ('devis', 'facture', 'avoir')) NOT NULL DEFAULT 'facture',
        number TEXT NOT NULL,
        date TEXT NOT NULL,
        due_date TEXT,
        total_ht REAL NOT NULL,
        total_ttc REAL NOT NULL,
        discount REAL DEFAULT 0,
        notes TEXT,
        payment_terms TEXT,
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
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id INTEGER,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
        // Colonnes ajoutées plus tard
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS logo TEXT`);
        await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_name TEXT`);
        await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date TEXT`);
        await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount REAL DEFAULT 0`);
        await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT`);
        await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT`);
        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price REAL DEFAULT 0`);
        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0`);
        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS tva REAL DEFAULT 0`);
        await client.query(`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false`);
    }
    finally {
        client.release();
    }
}
exports.default = pool;
//# sourceMappingURL=database.js.map