export const seedClients = [
  {
    id: "CLI-001",
    name: "Eduardo Reyes",
    address: "Brgy. Masagana, Atimonan, Quezon",
    plan: 500,
    phone: "09171234567",
    installDate: "2025-02-10",
    dueDate: "2026-08-10",
    status: "active",
    password: "reyes123",
    payments: [
      {
        id: "P1783925486125",
        month: "July 2026",
        date: "2026-07-13",
        amount: 500,
        method: "Cash",
      },
      {
        id: "P001",
        month: "June 2026",
        date: "2026-06-10",
        amount: 500,
        method: "GCash",
      },
    ],
  },
  {
    id: "CLI-002",
    name: "Maria Santos",
    address: "Sitio Pulo, Brgy. Cawayan, Quezon",
    plan: 500,
    phone: "09189876543",
    installDate: "2025-03-15",
    dueDate: "2026-07-13",
    status: "active",
    password: "santos123",
    payments: [
      {
        id: "P002",
        month: "June 2026",
        date: "2026-06-12",
        amount: 500,
        method: "Cash",
      },
    ],
  },
];
