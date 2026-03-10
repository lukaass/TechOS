import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'techos-super-secret-key';

// --- Database Configuration ---
// Forçando a leitura das variáveis que configuramos na Vercel
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const useSupabase = !!(supabaseUrl && supabaseKey);
export let supabase: any = null;
let db: any = null;

if (useSupabase) {
  console.log('Using Supabase as database');
  supabase = createClient(supabaseUrl || '', supabaseKey || '');
} else {
  console.log('Using SQLite as database (fallback)');
  db = new Database('techos.db');
  
  // Initialize SQLite Database
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'technician',
      specialty TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      type TEXT,
      brand TEXT,
      model TEXT,
      serial_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS service_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      equipment_id INTEGER,
      technician_id INTEGER,
      problem_description TEXT,
      diagnostic TEXT,
      status TEXT DEFAULT 'pending_diagnosis',
      start_time DATETIME,
      end_time DATETIME,
      total_worked_time INTEGER DEFAULT 0,
      signature TEXT,
      qr_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES clients(id),
      FOREIGN KEY(equipment_id) REFERENCES equipment(id),
      FOREIGN KEY(technician_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS os_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      os_id INTEGER,
      technician_id INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(os_id) REFERENCES service_orders(id),
      FOREIGN KEY(technician_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      quantity INTEGER DEFAULT 0,
      cost_price REAL,
      sale_price REAL,
      supplier TEXT,
      min_quantity INTEGER DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS os_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      os_id INTEGER,
      part_id INTEGER,
      quantity INTEGER,
      unit_price REAL,
      FOREIGN KEY(os_id) REFERENCES service_orders(id),
      FOREIGN KEY(part_id) REFERENCES inventory(id)
    );

    CREATE TABLE IF NOT EXISTS os_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      os_id INTEGER,
      description TEXT,
      price REAL,
      FOREIGN KEY(os_id) REFERENCES service_orders(id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_base (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      problem TEXT,
      solution TEXT,
      category TEXT,
      related_equipment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      date TEXT,
      time TEXT,
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS financial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT, -- 'income' or 'expense'
      category TEXT,
      description TEXT,
      amount REAL,
      date TEXT,
      os_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(os_id) REFERENCES service_orders(id)
    );
  `);

  // Seed admin user if not exists
  const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@techos.com');
  if (!admin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin', 'admin@techos.com', hashedPassword, 'admin');
  }

  // Seed Inventory if empty
  const inventoryCount = db.prepare('SELECT COUNT(*) as count FROM inventory').get().count;
  if (inventoryCount === 0) {
    db.prepare('INSERT INTO inventory (name, category, quantity, cost_price, sale_price, supplier) VALUES (?, ?, ?, ?, ?, ?)').run('SSD 240GB Kingston', 'Armazenamento', 10, 120.00, 250.00, 'Distribuidora X');
    db.prepare('INSERT INTO inventory (name, category, quantity, cost_price, sale_price, supplier) VALUES (?, ?, ?, ?, ?, ?)').run('Memória RAM 8GB DDR4', 'Memória', 5, 150.00, 320.00, 'Distribuidora Y');
    db.prepare('INSERT INTO inventory (name, category, quantity, cost_price, sale_price, supplier) VALUES (?, ?, ?, ?, ?, ?)').run('Pasta Térmica Arctic MX-4', 'Insumos', 2, 45.00, 85.00, 'Loja Z');
  }

  // Seed Knowledge Base if empty
  const knowledgeCount = db.prepare('SELECT COUNT(*) as count FROM knowledge_base').get().count;
  if (knowledgeCount === 0) {
    db.prepare('INSERT INTO knowledge_base (title, problem, solution, category) VALUES (?, ?, ?, ?)').run('Notebook não liga (Luz de power pisca)', 'Notebook Dell Inspiron pisca luz laranja 3x e branca 2x.', 'Falha na memória RAM. Limpar contatos ou substituir o pente.', 'Notebook');
    db.prepare('INSERT INTO knowledge_base (title, problem, solution, category) VALUES (?, ?, ?, ?)').run('PC reiniciando sozinho', 'Computador desliga ou reinicia após 10 minutos de uso.', 'Superaquecimento do processador. Verificar cooler e trocar pasta térmica.', 'Desktop');
  }
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(cors());
  app.use(express.json());

  // Teste de conexão simples
  app.get('/api/health', async (req, res) => {
    if (!useSupabase) {
      return res.json({ status: 'Online (SQLite Fallback)', data: { count: 'N/A' } });
    }
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) return res.status(500).json({ status: 'Erro no Banco', error });
    res.json({ status: 'Online e Conectado ao Supabase', data });
  });

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  app.use('/uploads', express.static(uploadsDir));

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // --- API ROUTES ---

  // Auth
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    let user: any;

    if (useSupabase) {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
      if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
      user = data;
    } else {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  });

  // Dashboard Stats
  app.get('/api/dashboard/stats', authenticate, async (req, res) => {
    if (useSupabase) {
      const { count: open } = await supabase.from('service_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_diagnosis');
      const { count: in_progress } = await supabase.from('service_orders').select('*', { count: 'exact', head: true }).eq('status', 'in_progress');
      const { count: waiting_approval } = await supabase.from('service_orders').select('*', { count: 'exact', head: true }).eq('status', 'waiting_approval');
      const { count: finished } = await supabase.from('service_orders').select('*', { count: 'exact', head: true }).eq('status', 'finished');
      
      const monthStr = new Date().toISOString().slice(0, 7);
      const { data: revenueData } = await supabase.from('financial')
        .select('amount')
        .eq('type', 'income')
        .like('date', `${monthStr}%`);
      
      const monthly_revenue = revenueData?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;

      res.json({ open, in_progress, waiting_approval, finished, monthly_revenue });
    } else {
      const stats = {
        open: db.prepare("SELECT COUNT(*) as count FROM service_orders WHERE status = 'pending_diagnosis'").get().count,
        in_progress: db.prepare("SELECT COUNT(*) as count FROM service_orders WHERE status = 'in_progress'").get().count,
        waiting_approval: db.prepare("SELECT COUNT(*) as count FROM service_orders WHERE status = 'waiting_approval'").get().count,
        finished: db.prepare("SELECT COUNT(*) as count FROM service_orders WHERE status = 'finished'").get().count,
        monthly_revenue: db.prepare("SELECT SUM(amount) as total FROM financial WHERE type = 'income' AND date LIKE ?").get(new Date().toISOString().slice(0, 7) + '%').total || 0,
      };
      res.json(stats);
    }
  });

  // Clients
  app.get('/api/clients', authenticate, async (req, res) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      res.json(data || []);
    } else {
      const clients = db.prepare('SELECT * FROM clients ORDER BY name').all();
      res.json(clients);
    }
  });

  app.post('/api/clients', authenticate, async (req, res) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('clients').insert(req.body).select().single();
      res.json({ id: data?.id });
    } else {
      const { name, cpf_cnpj, phone, whatsapp, email, address, city, state, zip, notes } = req.body;
      const result = db.prepare('INSERT INTO clients (name, cpf_cnpj, phone, whatsapp, email, address, city, state, zip, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(name, cpf_cnpj, phone, whatsapp, email, address, city, state, zip, notes);
      res.json({ id: result.lastInsertRowid });
    }
  });

  // Equipment
  app.get('/api/equipment/:clientId', authenticate, async (req, res) => {
    if (useSupabase) {
      const { data } = await supabase.from('equipment').select('*').eq('client_id', req.params.clientId);
      res.json(data || []);
    } else {
      const equipment = db.prepare('SELECT * FROM equipment WHERE client_id = ?').all(req.params.clientId);
      res.json(equipment);
    }
  });

  app.post('/api/equipment', authenticate, async (req, res) => {
    if (useSupabase) {
      const { data } = await supabase.from('equipment').insert(req.body).select().single();
      res.json({ id: data?.id });
    } else {
      const { client_id, type, brand, model, serial_number, notes } = req.body;
      const result = db.prepare('INSERT INTO equipment (client_id, type, brand, model, serial_number, notes) VALUES (?, ?, ?, ?, ?, ?)').run(client_id, type, brand, model, serial_number, notes);
      res.json({ id: result.lastInsertRowid });
    }
  });

  // Service Orders
  app.get('/api/os', authenticate, async (req, res) => {
    if (useSupabase) {
      const { data } = await supabase.from('service_orders')
        .select(`
          *,
          clients (name),
          equipment (model),
          users (name)
        `)
        .order('created_at', { ascending: false });
      
      // Flatten the response to match the frontend expectation
      const formatted = data?.map((os: any) => ({
        ...os,
        client_name: os.clients?.name,
        equipment_model: os.equipment?.model,
        technician_name: os.users?.name
      }));
      res.json(formatted || []);
    } else {
      const os = db.prepare(`
        SELECT os.*, c.name as client_name, e.model as equipment_model, u.name as technician_name
        FROM service_orders os
        JOIN clients c ON os.client_id = c.id
        JOIN equipment e ON os.equipment_id = e.id
        LEFT JOIN users u ON os.technician_id = u.id
        ORDER BY os.created_at DESC
      `).all();
      res.json(os);
    }
  });

  app.post('/api/os', authenticate, async (req, res) => {
    const { client_id, equipment_id, problem_description, technician_id } = req.body;
    let osId: any;

    if (useSupabase) {
      const { data } = await supabase.from('service_orders').insert({
        client_id, equipment_id, problem_description, technician_id
      }).select().single();
      osId = data?.id;
    } else {
      const result = db.prepare('INSERT INTO service_orders (client_id, equipment_id, problem_description, technician_id) VALUES (?, ?, ?, ?)').run(client_id, equipment_id, problem_description, technician_id);
      osId = result.lastInsertRowid;
    }
    
    // Generate QR Code
    const qrData = `${process.env.APP_URL}/os/track/${osId}`;
    QRCode.toDataURL(qrData, async (err, url) => {
      if (!err) {
        if (useSupabase) {
          await supabase.from('service_orders').update({ qr_code: url }).eq('id', osId);
        } else {
          db.prepare('UPDATE service_orders SET qr_code = ? WHERE id = ?').run(url, osId);
        }
      }
    });

    res.json({ id: osId });
  });

  app.get('/api/os/:id', authenticate, async (req, res) => {
    if (useSupabase) {
      const { data: os } = await supabase.from('service_orders')
        .select(`
          *,
          clients (name, phone, whatsapp),
          equipment (type, brand, model, serial_number),
          users (name)
        `)
        .eq('id', req.params.id)
        .single();
      
      const { data: parts } = await supabase.from('os_parts')
        .select('*, inventory (name)')
        .eq('os_id', req.params.id);
      
      const { data: services } = await supabase.from('os_services').select('*').eq('os_id', req.params.id);
      const { data: logs } = await supabase.from('os_logs').select('*').eq('os_id', req.params.id).order('created_at', { ascending: false });

      const formatted = {
        ...os,
        client_name: os.clients?.name,
        client_phone: os.clients?.phone,
        client_whatsapp: os.clients?.whatsapp,
        eq_type: os.equipment?.type,
        eq_brand: os.equipment?.brand,
        eq_model: os.equipment?.model,
        eq_serial: os.equipment?.serial_number,
        technician_name: os.users?.name,
        parts: parts?.map((p: any) => ({ ...p, name: p.inventory?.name })),
        services,
        logs
      };
      res.json(formatted);
    } else {
      const os = db.prepare(`
        SELECT os.*, c.name as client_name, c.phone as client_phone, c.whatsapp as client_whatsapp,
               e.type as eq_type, e.brand as eq_brand, e.model as eq_model, e.serial_number as eq_serial,
               u.name as technician_name
        FROM service_orders os
        JOIN clients c ON os.client_id = c.id
        JOIN equipment e ON os.equipment_id = e.id
        LEFT JOIN users u ON os.technician_id = u.id
        WHERE os.id = ?
      `).get(req.params.id);
      
      const parts = db.prepare(`
        SELECT op.*, i.name
        FROM os_parts op
        JOIN inventory i ON op.part_id = i.id
        WHERE op.os_id = ?
      `).all(req.params.id);

      const services = db.prepare('SELECT * FROM os_services WHERE os_id = ?').all(req.params.id);
      const logs = db.prepare('SELECT * FROM os_logs WHERE os_id = ? ORDER BY created_at DESC').all(req.params.id);

      res.json({ ...os, parts, services, logs });
    }
  });

  app.patch('/api/os/:id/status', authenticate, async (req, res) => {
    const { status, description } = req.body;
    if (useSupabase) {
      await supabase.from('service_orders').update({ status }).eq('id', req.params.id);
      if (description) {
        await supabase.from('os_logs').insert({
          os_id: req.params.id,
          technician_id: (req as any).user.id,
          description
        });
      }
    } else {
      db.prepare('UPDATE service_orders SET status = ? WHERE id = ?').run(status, req.params.id);
      if (description) {
        db.prepare('INSERT INTO os_logs (os_id, technician_id, description) VALUES (?, ?, ?)').run(req.params.id, (req as any).user.id, description);
      }
    }
    res.json({ success: true });
  });

  // Inventory
  app.get('/api/inventory', authenticate, async (req, res) => {
    if (useSupabase) {
      const { data } = await supabase.from('inventory').select('*');
      res.json(data || []);
    } else {
      const items = db.prepare('SELECT * FROM inventory').all();
      res.json(items);
    }
  });

  // Knowledge Base
  app.get('/api/knowledge', authenticate, async (req, res) => {
    if (useSupabase) {
      const { data } = await supabase.from('knowledge_base').select('*');
      res.json(data || []);
    } else {
      const items = db.prepare('SELECT * FROM knowledge_base').all();
      res.json(items);
    }
  });

  // PDF Generation
  app.get('/api/os/:id/pdf', authenticate, async (req, res) => {
    let os: any;
    if (useSupabase) {
      const { data } = await supabase.from('service_orders')
        .select('*, clients (name, address), equipment (brand, model)')
        .eq('id', req.params.id)
        .single();
      os = {
        ...data,
        client_name: data.clients?.name,
        client_address: data.clients?.address,
        eq_brand: data.equipment?.brand,
        eq_model: data.equipment?.model
      };
    } else {
      os = db.prepare(`
        SELECT os.*, c.name as client_name, c.address as client_address,
               e.brand as eq_brand, e.model as eq_model
        FROM service_orders os
        JOIN clients c ON os.client_id = c.id
        JOIN equipment e ON os.equipment_id = e.id
        WHERE os.id = ?
      `).get(req.params.id);
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=os-${os.id}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('TechOS - Ordem de Serviço', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`OS #: ${os.id}`);
    doc.text(`Cliente: ${os.client_name}`);
    doc.text(`Equipamento: ${os.eq_brand} ${os.eq_model}`);
    doc.text(`Status: ${os.status}`);
    doc.moveDown();
    doc.text('Descrição do Problema:');
    doc.text(os.problem_description);
    doc.moveDown();
    doc.text('Diagnóstico:');
    doc.text(os.diagnostic || 'Em análise');
    
    if (os.signature) {
      const base64Data = os.signature.replace(/^data:image\/png;base64,/, "");
      doc.moveDown();
      doc.text('Assinatura do Cliente:');
      doc.image(Buffer.from(base64Data, 'base64'), { width: 200 });
    }

    doc.end();
  });

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.join(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath);

  if (!isProd || !hasDist) {
    console.log('Starting Vite in middleware mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving static files from dist...');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
