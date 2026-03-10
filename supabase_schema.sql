-- TechOS Supabase Schema
-- Copy and paste this into the Supabase SQL Editor

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'technician',
  specialty TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients Table
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cpf_cnpj TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Table
CREATE TABLE equipment (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  type TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Orders Table
CREATE TABLE service_orders (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  equipment_id INTEGER REFERENCES equipment(id),
  technician_id INTEGER REFERENCES users(id),
  problem_description TEXT,
  diagnostic TEXT,
  status TEXT DEFAULT 'pending_diagnosis',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  total_worked_time INTEGER DEFAULT 0,
  signature TEXT,
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OS Logs Table
CREATE TABLE os_logs (
  id SERIAL PRIMARY KEY,
  os_id INTEGER REFERENCES service_orders(id),
  technician_id INTEGER REFERENCES users(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Table
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  cost_price DECIMAL,
  sale_price DECIMAL,
  supplier TEXT,
  min_quantity INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OS Parts Table
CREATE TABLE os_parts (
  id SERIAL PRIMARY KEY,
  os_id INTEGER REFERENCES service_orders(id),
  part_id INTEGER REFERENCES inventory(id),
  quantity INTEGER,
  unit_price DECIMAL
);

-- OS Services Table
CREATE TABLE os_services (
  id SERIAL PRIMARY KEY,
  os_id INTEGER REFERENCES service_orders(id),
  description TEXT,
  price DECIMAL
);

-- Knowledge Base Table
CREATE TABLE knowledge_base (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  problem TEXT,
  solution TEXT,
  category TEXT,
  related_equipment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule Table
CREATE TABLE schedule (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  date TEXT,
  time TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Table
CREATE TABLE financial (
  id SERIAL PRIMARY KEY,
  type TEXT, -- 'income' or 'expense'
  category TEXT,
  description TEXT,
  amount DECIMAL,
  date TEXT,
  os_id INTEGER REFERENCES service_orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (Optional, but recommended for production)
-- For now, we assume the server uses the SERVICE_ROLE_KEY which bypasses RLS.
