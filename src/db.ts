import Dexie, { type Table } from 'dexie';
import bcrypt from 'bcryptjs';

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  specialty?: string;
  phone?: string;
  status: string;
  created_at: string;
}

export interface Client {
  id?: number;
  name: string;
  cpf_cnpj?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  created_at: string;
}

export interface Equipment {
  id?: number;
  client_id: number;
  type: string;
  brand: string;
  model: string;
  serial_number?: string;
  notes?: string;
  created_at: string;
}

export interface ServiceOrder {
  id?: number;
  client_id: number;
  equipment_id?: number;
  technician_id?: number;
  problem_description: string;
  diagnostic?: string;
  status: string;
  type: 'repair' | 'assembly';
  start_time?: string;
  end_time?: string;
  total_worked_time: number;
  signature?: string;
  qr_code?: string;
  created_at: string;
}

export interface OSLog {
  id?: number;
  os_id: number;
  technician_id: number;
  description: string;
  created_at: string;
}

export interface InventoryItem {
  id?: number;
  name: string;
  category: string;
  quantity: number;
  cost_price: number;
  sale_price: number;
  supplier?: string;
  min_quantity: number;
  created_at: string;
}

export interface OSPart {
  id?: number;
  os_id: number;
  part_id: number;
  quantity: number;
  unit_price: number;
}

export interface OSService {
  id?: number;
  os_id: number;
  description: string;
  price: number;
}

export interface KnowledgeItem {
  id?: number;
  title: string;
  problem?: string;
  solution?: string;
  category?: string;
  related_equipment?: string;
  created_at: string;
}

export interface ScheduleItem {
  id?: number;
  client_id: number;
  date: string;
  time: string;
  description: string;
  status: string;
  created_at: string;
}

export interface FinancialRecord {
  id?: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  os_id?: number;
  created_at: string;
}

export class TechOSDatabase extends Dexie {
  users!: Table<User>;
  clients!: Table<Client>;
  equipment!: Table<Equipment>;
  service_orders!: Table<ServiceOrder>;
  os_logs!: Table<OSLog>;
  inventory!: Table<InventoryItem>;
  os_parts!: Table<OSPart>;
  os_services!: Table<OSService>;
  knowledge_base!: Table<KnowledgeItem>;
  schedule!: Table<ScheduleItem>;
  financial!: Table<FinancialRecord>;

  constructor() {
    super('TechOSDatabase');
    this.version(3).stores({
      users: '++id, email, role, created_at',
      clients: '++id, name, email, created_at',
      equipment: '++id, client_id, model, created_at',
      service_orders: '++id, client_id, technician_id, status, type, created_at',
      os_logs: '++id, os_id, technician_id, created_at',
      inventory: '++id, name, category, created_at',
      os_parts: '++id, os_id, part_id',
      os_services: '++id, os_id',
      knowledge_base: '++id, title, category, created_at',
      schedule: '++id, client_id, date',
      financial: '++id, type, date, os_id, created_at'
    });
  }
}

export const db = new TechOSDatabase();

// Initial Seeding
db.on('populate', async () => {
  try {
    const hashedPassword = bcrypt.hashSync('admin', 10);
    
    await db.users.add({
      name: 'Administrador',
      email: 'admin@techos.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString()
    });

    // Sample Inventory
    await db.inventory.bulkAdd([
      { name: 'SSD 240GB Kingston', category: 'Armazenamento', quantity: 10, cost_price: 120.00, sale_price: 250.00, supplier: 'Distribuidora X', min_quantity: 5, created_at: new Date().toISOString() },
      { name: 'Memória RAM 8GB DDR4', category: 'Memória', quantity: 5, cost_price: 150.00, sale_price: 320.00, supplier: 'Distribuidora Y', min_quantity: 5, created_at: new Date().toISOString() },
      { name: 'Pasta Térmica Arctic MX-4', category: 'Insumos', quantity: 2, cost_price: 45.00, sale_price: 85.00, supplier: 'Loja Z', min_quantity: 5, created_at: new Date().toISOString() }
    ]);

    // Sample Client
    const clientId = await db.clients.add({
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '(11) 99999-9999',
      created_at: new Date().toISOString()
    });

    // Sample Equipment
    const equipmentId = await db.equipment.add({
      client_id: clientId as number,
      type: 'Notebook',
      brand: 'Dell',
      model: 'Inspiron 15',
      serial_number: 'ABC123XYZ',
      created_at: new Date().toISOString()
    });

    // Sample OS
    await db.service_orders.add({
      client_id: clientId as number,
      equipment_id: equipmentId as number,
      problem_description: 'Notebook não liga',
      status: 'pending_diagnosis',
      type: 'repair',
      total_worked_time: 0,
      created_at: new Date().toISOString(),
      qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=OS-1'
    });

    // Sample Knowledge Base
    await db.knowledge_base.bulkAdd([
      { title: 'Notebook não liga (Luz de power pisca)', problem: 'Notebook Dell Inspiron pisca luz laranja 3x e branca 2x.', solution: 'Falha na memória RAM. Limpar contatos ou substituir o pente.', category: 'Notebook', created_at: new Date().toISOString() },
      { title: 'PC reiniciando sozinho', problem: 'Computador desliga ou reinicia após 10 minutos de uso.', solution: 'Superaquecimento do processador. Verificar cooler e trocar pasta térmica.', category: 'Desktop', created_at: new Date().toISOString() }
    ]);
  } catch (err) {
    console.error('Failed to populate database:', err);
  }
});

// Explicitly open the database and handle errors
db.open().catch((err) => {
  console.error('Failed to open database:', err);
});
