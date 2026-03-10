import Dexie, { type Table } from 'dexie';
import * as bcrypt from 'bcryptjs';

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  status: string;
  created_at: string;
}

export class TechOSDatabase extends Dexie {
  users!: Table<User>;
  clients!: Table<any>;
  equipment!: Table<any>;
  service_orders!: Table<any>;
  os_logs!: Table<any>;
  inventory!: Table<any>;
  os_parts!: Table<any>;
  os_services!: Table<any>;
  knowledge_base!: Table<any>;
  schedule!: Table<any>;
  financial!: Table<any>;

  constructor() {
    super('TechOSDatabase');
    this.version(1).stores({
      users: '++id, email, role',
      clients: '++id, name, email',
      equipment: '++id, client_id, model',
      service_orders: '++id, client_id, technician_id, status',
      os_logs: '++id, os_id, technician_id',
      inventory: '++id, name, category',
      os_parts: '++id, os_id, part_id',
      os_services: '++id, os_id',
      knowledge_base: '++id, title, category',
      schedule: '++id, client_id, date',
      financial: '++id, type, date, os_id'
    });
  }
}

export const db = new TechOSDatabase();

// Initial Seeding
db.on('populate', async () => {
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

  // Sample Knowledge Base
  await db.knowledge_base.bulkAdd([
    { title: 'Notebook não liga (Luz de power pisca)', problem: 'Notebook Dell Inspiron pisca luz laranja 3x e branca 2x.', solution: 'Falha na memória RAM. Limpar contatos ou substituir o pente.', category: 'Notebook', created_at: new Date().toISOString() },
    { title: 'PC reiniciando sozinho', problem: 'Computador desliga ou reinicia após 10 minutos de uso.', solution: 'Superaquecimento do processador. Verificar cooler e trocar pasta térmica.', category: 'Desktop', created_at: new Date().toISOString() }
  ]);
});
