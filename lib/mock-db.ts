// In-memory Prisma mock for testing environments without live database connection
import { UserRole, LeadStatus } from '@prisma/client';

type MockCompany = {
  id: string;
  name: string;
  gstNumber?: string | null;
  currency: string;
  logoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MockUser = {
  id: string;
  supabaseUid: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type MockLead = {
  id: string;
  companyId: string;
  name: string;
  email: string | null;
  phone: string;
  destination: string;
  paxCount: number;
  status: LeadStatus;
  quotedPrice: number;
  currency: string;
  source: string;
  assignedAgentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MockLeadNote = {
  id: string;
  leadId: string;
  userId: string;
  companyId: string;
  content: string;
  createdAt: Date;
};

type MockItinerary = {
  id: string;
  companyId: string;
  leadId: string;
  title: string;
  destination: string;
  startDate: Date | null;
  endDate: Date | null;
  markup: number;
  totalCost: number;
  finalPrice: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

type MockItineraryDay = {
  id: string;
  itineraryId: string;
  dayNumber: number;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MockItineraryLineItem = {
  id: string;
  dayId: string;
  category: any;
  description: string;
  cost: number;
  createdAt: Date;
  updatedAt: Date;
};

type MockBooking = {
  id: string;
  companyId: string;
  leadId: string;
  itineraryId: string;
  bookingNumber: string;
  status: any;
  totalAmount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

type MockEmployee = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: Date;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  panNumber: string | null;
  status: string;
  commissionRate: number;
  createdAt: Date;
  updatedAt: Date;
};

type MockSalaryPayment = {
  id: string;
  employeeId: string;
  companyId: string;
  month: string;
  baseAmount: number;
  bonusAmount: number;
  deductions: number;
  netPaid: number;
  paymentDate: Date;
  paymentMode: string;
  paymentStatus: string;
  transactionRef: string | null;
  notes: string | null;
  createdAt: Date;
};

type MockCustomPackage = {
  id: string;
  companyId: string;
  title: string;
  slug: string;
  destination: string;
  country: string;
  duration: string;
  daysCount: number;
  priceFrom: string | null;
  category: string;
  highlights: string;
  description: string;
  itinerary: string | null;
  inclusions: string | null;
  exclusions: string | null;
  createdAt: Date;
  updatedAt: Date;
};

class MockDatabase {
  companies: MockCompany[] = [];
  users: MockUser[] = [];
  leads: MockLead[] = [];
  leadNotes: MockLeadNote[] = [];
  itineraries: MockItinerary[] = [];
  itineraryDays: MockItineraryDay[] = [];
  itineraryLineItems: MockItineraryLineItem[] = [];
  bookings: MockBooking[] = [];
  employees: MockEmployee[] = [];
  salaryPayments: MockSalaryPayment[] = [];
  customPackages: MockCustomPackage[] = [];

  private idCounter = 1;
  private nextId(prefix: string) {
    return `${prefix}_${Date.now()}_${this.idCounter++}`;
  }

  company = {
    create: async ({ data }: { data: any }) => {
      const item: MockCompany = {
        id: this.nextId('comp'),
        name: data.name || 'Shanvi Hospitality',
        gstNumber: data.gstNumber || '09AEKFS1932F1ZX',
        currency: data.currency || 'INR',
        logoUrl: data.logoUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.companies.push(item);
      return { ...item };
    },
    findUnique: async ({ where }: { where: any }) => {
      const item = this.companies.find((c) => c.id === where.id);
      return item ? { ...item } : null;
    },
    update: async ({ where, data, select }: { where: any; data: any; select?: any }) => {
      const idx = this.companies.findIndex((c) => c.id === where.id);
      if (idx === -1) throw new Error('Company not found');
      this.companies[idx] = {
        ...this.companies[idx],
        ...data,
        updatedAt: new Date(),
      };
      const updated = { ...this.companies[idx] };
      if (!select) return updated;
      const res: any = {};
      for (const k of Object.keys(select)) {
        if (select[k]) res[k] = (updated as any)[k];
      }
      return res;
    },
    deleteMany: async ({ where }: { where?: any }) => {
      if (where?.id?.in) {
        this.companies = this.companies.filter((c) => !where.id.in.includes(c.id));
      } else {
        this.companies = [];
      }
      return { count: 1 };
    },
  };

  user = {
    create: async ({ data, select }: { data: any; select?: any }) => {
      const item: MockUser = {
        id: this.nextId('user'),
        supabaseUid: data.supabaseUid,
        companyId: data.companyId,
        name: data.name,
        email: data.email,
        role: data.role,
        active: data.active !== undefined ? data.active : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.push(item);
      return this.formatUser(item, select);
    },
    findUnique: async ({ where, include }: { where: any; include?: any }) => {
      const item = this.users.find(
        (u) =>
          (where.id && u.id === where.id) ||
          (where.supabaseUid && u.supabaseUid === where.supabaseUid)
      );
      if (!item) return null;
      const res: any = { ...item };
      if (include?.company) {
        res.company = this.companies.find((c) => c.id === item.companyId);
      }
      return res;
    },
    findFirst: async ({ where }: { where: any }) => {
      const item = this.users.find((u) => {
        if (where.id && u.id !== where.id) return false;
        if (where.email && u.email !== where.email) return false;
        if (where.companyId && u.companyId !== where.companyId) return false;
        if (where.active !== undefined && u.active !== where.active) return false;
        return true;
      });
      return item ? { ...item } : null;
    },
    findMany: async ({ where, select }: { where: any; select?: any }) => {
      let list = this.users.filter((u) => u.companyId === where.companyId);
      return list.map((u) => {
        const userFormatted = this.formatUser(u, select);
        if (select?._count?.select?.assignedLeads) {
          const leadCount = this.leads.filter((l) => l.assignedAgentId === u.id).length;
          userFormatted._count = { assignedLeads: leadCount };
        }
        return userFormatted;
      });
    },
    update: async ({ where, data, select }: { where: any; data: any; select?: any }) => {
      const idx = this.users.findIndex((u) => u.id === where.id);
      if (idx === -1) throw new Error('User not found');
      this.users[idx] = {
        ...this.users[idx],
        ...data,
        updatedAt: new Date(),
      };
      return this.formatUser(this.users[idx], select);
    },
    deleteMany: async ({ where }: { where?: any }) => {
      if (where?.companyId?.in) {
        this.users = this.users.filter((u) => !where.companyId.in.includes(u.companyId));
      } else {
        this.users = [];
      }
      return { count: 1 };
    },
  };

  lead = {
    create: async ({ data, include }: { data: any; include?: any }) => {
      const item: MockLead = {
        id: this.nextId('lead'),
        companyId: data.companyId,
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        destination: data.destination,
        paxCount: data.paxCount || 1,
        status: data.status || 'ENQUIRY',
        quotedPrice: data.quotedPrice || 0,
        currency: data.currency || 'INR',
        source: data.source || 'manual',
        assignedAgentId: data.assignedAgentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.leads.push(item);
      return this.formatLead(item, include);
    },
    findUnique: async ({ where, include }: { where: any; include?: any }) => {
      const item = this.leads.find((l) => {
        if (where.id) return l.id === where.id;
        return false;
      });
      if (!item) return null;
      return this.formatLead(item, include);
    },
    findFirst: async ({ where, include }: { where: any; include?: any }) => {
      const item = this.leads.find((l) => {
        if (where.id && l.id !== where.id) return false;
        if (where.companyId && l.companyId !== where.companyId) return false;
        return true;
      });
      if (!item) return null;
      return this.formatLead(item, include);
    },
    findMany: async ({ where, include }: { where: any; include?: any }) => {
      let list = this.leads.filter((l) => {
        if (where.companyId && l.companyId !== where.companyId) return false;
        if (where.assignedAgentId && l.assignedAgentId !== where.assignedAgentId) return false;
        if (where.status && l.status !== where.status) return false;
        if (where.OR && Array.isArray(where.OR)) {
          const match = where.OR.some((cond: any) => {
            if (cond.name?.contains) {
              return l.name.toLowerCase().includes(cond.name.contains.toLowerCase());
            }
            if (cond.destination?.contains) {
              return l.destination.toLowerCase().includes(cond.destination.contains.toLowerCase());
            }
            if (cond.phone?.contains) {
              return l.phone.toLowerCase().includes(cond.phone.contains.toLowerCase());
            }
            if (cond.email?.contains && l.email) {
              return l.email.toLowerCase().includes(cond.email.contains.toLowerCase());
            }
            return false;
          });
          if (!match) return false;
        }
        return true;
      });

      return list.map((l) => this.formatLead(l, include));
    },
    update: async ({ where, data, include }: { where: any; data: any; include?: any }) => {
      const idx = this.leads.findIndex((l) => l.id === where.id);
      if (idx === -1) throw new Error('Lead not found');
      this.leads[idx] = {
        ...this.leads[idx],
        ...data,
        updatedAt: new Date(),
      };
      return this.formatLead(this.leads[idx], include);
    },
    deleteMany: async ({ where }: { where?: any }) => {
      if (where?.companyId?.in) {
        this.leads = this.leads.filter((l) => !where.companyId.in.includes(l.companyId));
      } else {
        this.leads = [];
      }
      return { count: 1 };
    },
  };

  leadNote = {
    create: async ({ data, include }: { data: any; include?: any }) => {
      const item: MockLeadNote = {
        id: this.nextId('note'),
        leadId: data.leadId,
        userId: data.userId,
        companyId: data.companyId,
        content: data.content,
        createdAt: new Date(),
      };
      this.leadNotes.push(item);
      const res: any = { ...item };
      if (include?.user) {
        const user = this.users.find((u) => u.id === item.userId);
        res.user = user ? { id: user.id, name: user.name, role: user.role } : null;
      }
      return res;
    },
    findMany: async ({ where, include, orderBy }: { where?: any; include?: any; orderBy?: any } = {}) => {
      let list = [...this.leadNotes];
      if (where?.leadId) list = list.filter((n) => n.leadId === where.leadId);
      if (where?.companyId) list = list.filter((n) => n.companyId === where.companyId);
      return list.map((n) => {
        const res: any = { ...n };
        if (include?.user) {
          const user = this.users.find((u) => u.id === n.userId);
          res.user = user ? { id: user.id, name: user.name, role: user.role } : null;
        }
        return res;
      });
    },
    deleteMany: async ({ where }: { where?: any }) => {
      if (where?.companyId?.in) {
        this.leadNotes = this.leadNotes.filter((n) => !where.companyId.in.includes(n.companyId));
      } else {
        this.leadNotes = [];
      }
      return { count: 1 };
    },
  };

  itinerary = {
    create: async ({ data, include }: { data: any; include?: any }) => {
      const item: MockItinerary = {
        id: this.nextId('itin'),
        companyId: data.companyId,
        leadId: data.leadId,
        title: data.title,
        destination: data.destination,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        markup: data.markup || 0,
        totalCost: data.totalCost || 0,
        finalPrice: data.finalPrice || 0,
        currency: data.currency || 'INR',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.itineraries.push(item);

      // If nested days are provided in create
      if (data.days?.create && Array.isArray(data.days.create)) {
        for (const d of data.days.create) {
          const dayItem: MockItineraryDay = {
            id: this.nextId('day'),
            itineraryId: item.id,
            dayNumber: d.dayNumber,
            title: d.title,
            description: d.description || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.itineraryDays.push(dayItem);

          if (d.lineItems?.create && Array.isArray(d.lineItems.create)) {
            for (const li of d.lineItems.create) {
              this.itineraryLineItems.push({
                id: this.nextId('item'),
                dayId: dayItem.id,
                category: li.category,
                description: li.description,
                cost: li.cost || 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }
        }
      }

      return this.formatItinerary(item, include);
    },
    findUnique: async ({ where, include }: { where: any; include?: any }) => {
      const item = this.itineraries.find(
        (it) =>
          (where.id && it.id === where.id) ||
          (where.leadId && it.leadId === where.leadId)
      );
      if (!item) return null;
      return this.formatItinerary(item, include);
    },
    findFirst: async ({ where, include }: { where: any; include?: any }) => {
      const item = this.itineraries.find((it) => {
        if (where.id && it.id !== where.id) return false;
        if (where.leadId && it.leadId !== where.leadId) return false;
        if (where.companyId && it.companyId !== where.companyId) return false;
        return true;
      });
      if (!item) return null;
      return this.formatItinerary(item, include);
    },
    update: async ({ where, data, include }: { where: any; data: any; include?: any }) => {
      const idx = this.itineraries.findIndex((it) => it.id === where.id);
      if (idx === -1) throw new Error('Itinerary not found');
      this.itineraries[idx] = {
        ...this.itineraries[idx],
        ...data,
        updatedAt: new Date(),
      };
      return this.formatItinerary(this.itineraries[idx], include);
    },
    deleteMany: async ({ where }: { where?: any }) => {
      if (where?.companyId?.in) {
        const itinIds = this.itineraries
          .filter((i) => where.companyId.in.includes(i.companyId))
          .map((i) => i.id);
        const dayIds = this.itineraryDays
          .filter((d) => itinIds.includes(d.itineraryId))
          .map((d) => d.id);
        this.itineraryLineItems = this.itineraryLineItems.filter((li) => !dayIds.includes(li.dayId));
        this.itineraryDays = this.itineraryDays.filter((d) => !itinIds.includes(d.itineraryId));
        this.itineraries = this.itineraries.filter((i) => !where.companyId.in.includes(i.companyId));
      } else {
        this.itineraryLineItems = [];
        this.itineraryDays = [];
        this.itineraries = [];
      }
      return { count: 1 };
    },
  };

  itineraryDay = {
    create: async ({ data, include }: { data: any; include?: any }) => {
      const item: MockItineraryDay = {
        id: this.nextId('day'),
        itineraryId: data.itineraryId,
        dayNumber: data.dayNumber,
        title: data.title,
        description: data.description || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.itineraryDays.push(item);
      const res: any = { ...item };
      if (include?.lineItems && data.lineItems?.create) {
        res.lineItems = [];
        for (const li of data.lineItems.create) {
          const liItem = {
            id: this.nextId('item'),
            dayId: item.id,
            category: li.category,
            description: li.description,
            cost: li.cost || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.itineraryLineItems.push(liItem);
          res.lineItems.push(liItem);
        }
      }
      return res;
    },
    deleteMany: async ({ where }: { where?: any }) => {
      if (where?.itineraryId) {
        const dayIds = this.itineraryDays
          .filter((d) => d.itineraryId === where.itineraryId)
          .map((d) => d.id);
        this.itineraryLineItems = this.itineraryLineItems.filter((li) => !dayIds.includes(li.dayId));
        this.itineraryDays = this.itineraryDays.filter((d) => d.itineraryId !== where.itineraryId);
      }
      return { count: 1 };
    },
  };

  itineraryLineItem = {
    create: async ({ data }: { data: any }) => {
      const item: MockItineraryLineItem = {
        id: this.nextId('item'),
        dayId: data.dayId,
        category: data.category,
        description: data.description,
        cost: data.cost || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.itineraryLineItems.push(item);
      return { ...item };
    },
    deleteMany: async ({ where }: { where?: any }) => {
      if (where?.dayId) {
        this.itineraryLineItems = this.itineraryLineItems.filter((li) => li.dayId !== where.dayId);
      }
      return { count: 1 };
    },
  };

  booking = {
    create: async ({ data, include }: { data: any; include?: any }) => {
      const item: MockBooking = {
        id: this.nextId('book'),
        companyId: data.companyId,
        leadId: data.leadId,
        itineraryId: data.itineraryId,
        bookingNumber: data.bookingNumber,
        status: data.status || 'CONFIRMED',
        totalAmount: data.totalAmount || 0,
        currency: data.currency || 'INR',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.bookings.push(item);
      const res: any = { ...item };
      if (include?.lead) {
        const lead = this.leads.find((l) => l.id === item.leadId);
        res.lead = lead ? { ...lead } : null;
      }
      if (include?.company) {
        const comp = this.companies.find((c) => c.id === item.companyId);
        res.company = comp ? { ...comp } : null;
      }
      if (include?.itinerary) {
        const itin = this.itineraries.find((i) => i.id === item.itineraryId);
        res.itinerary = itin ? this.formatItinerary(itin, include.itinerary.include) : null;
      }
      return res;
    },
    findUnique: async ({ where, include }: { where: any; include?: any }) => {
      const item = this.bookings.find(
        (b) =>
          (where.id && b.id === where.id) ||
          (where.leadId && b.leadId === where.leadId) ||
          (where.itineraryId && b.itineraryId === where.itineraryId) ||
          (where.bookingNumber && b.bookingNumber === where.bookingNumber)
      );
      if (!item) return null;
      const res: any = { ...item };
      if (include?.lead) {
        const lead = this.leads.find((l) => l.id === item.leadId);
        res.lead = lead ? { ...lead } : null;
      }
      if (include?.company) {
        const comp = this.companies.find((c) => c.id === item.companyId);
        res.company = comp ? { ...comp } : null;
      }
      if (include?.itinerary) {
        const itin = this.itineraries.find((i) => i.id === item.itineraryId);
        res.itinerary = itin ? this.formatItinerary(itin, include.itinerary.include) : null;
      }
      return res;
    },
    findFirst: async ({ where, include }: { where: any; include?: any }) => {
      const item = this.bookings.find((b) => {
        if (where.id && b.id !== where.id) return false;
        if (where.leadId && b.leadId !== where.leadId) return false;
        if (where.companyId && b.companyId !== where.companyId) return false;
        return true;
      });
      if (!item) return null;
      return { ...item };
    },
    findMany: async ({ where }: { where: any }) => {
      return this.bookings.filter((b) => b.companyId === where.companyId);
    },
    deleteMany: async ({ where }: { where?: any }) => {
      if (where?.companyId?.in) {
        this.bookings = this.bookings.filter((b) => !where.companyId.in.includes(b.companyId));
      } else {
        this.bookings = [];
      }
      return { count: 1 };
    },
  };

  employee = {
    create: async ({ data }: { data: any }) => {
      const baseSalary = data.baseSalary || 0;
      const allowances = data.allowances || 0;
      const deductions = data.deductions || 0;
      const netSalary = data.netSalary || (baseSalary + allowances - deductions);
      const item: MockEmployee = {
        id: this.nextId('emp'),
        companyId: data.companyId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department || 'Operations',
        designation: data.designation || 'Tour Specialist',
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
        baseSalary,
        allowances,
        deductions,
        netSalary,
        bankName: data.bankName || null,
        accountNumber: data.accountNumber || null,
        ifscCode: data.ifscCode || null,
        panNumber: data.panNumber || null,
        status: data.status || 'ACTIVE',
        commissionRate: data.commissionRate || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.employees.push(item);
      return { ...item };
    },
    findMany: async ({ where, include, orderBy }: { where?: any; include?: any; orderBy?: any } = {}) => {
      this.ensureEmployeesSeeded(where?.companyId);
      let list = [...this.employees];
      if (where?.companyId) list = list.filter((e) => e.companyId === where.companyId);
      if (where?.department) list = list.filter((e) => e.department === where.department);
      if (where?.status) list = list.filter((e) => e.status === where.status);
      return list.map((e) => this.formatEmployee(e, include));
    },
    findUnique: async ({ where, include }: { where: any; include?: any }) => {
      this.ensureEmployeesSeeded(where?.companyId);
      const item = this.employees.find((e) => e.id === where.id);
      return item ? this.formatEmployee(item, include) : null;
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      const index = this.employees.findIndex((e) => e.id === where.id);
      if (index === -1) return null;
      const existing = this.employees[index];
      const baseSalary = data.baseSalary !== undefined ? data.baseSalary : existing.baseSalary;
      const allowances = data.allowances !== undefined ? data.allowances : existing.allowances;
      const deductions = data.deductions !== undefined ? data.deductions : existing.deductions;
      const netSalary = data.netSalary !== undefined ? data.netSalary : (baseSalary + allowances - deductions);
      const updated: MockEmployee = {
        ...existing,
        ...data,
        baseSalary,
        allowances,
        deductions,
        netSalary,
        updatedAt: new Date(),
      };
      this.employees[index] = updated;
      return { ...updated };
    },
    delete: async ({ where }: { where: any }) => {
      const index = this.employees.findIndex((e) => e.id === where.id);
      if (index === -1) return null;
      const [removed] = this.employees.splice(index, 1);
      return { ...removed };
    },
  };

  salaryPayment = {
    create: async ({ data }: { data: any }) => {
      const item: MockSalaryPayment = {
        id: this.nextId('pay'),
        employeeId: data.employeeId,
        companyId: data.companyId,
        month: data.month,
        baseAmount: data.baseAmount,
        bonusAmount: data.bonusAmount || 0,
        deductions: data.deductions || 0,
        netPaid: data.netPaid || (data.baseAmount + (data.bonusAmount || 0) - (data.deductions || 0)),
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        paymentMode: data.paymentMode || 'NEFT',
        paymentStatus: data.paymentStatus || 'PAID',
        transactionRef: data.transactionRef || `SHV-NEFT-${Date.now().toString().slice(-6)}`,
        notes: data.notes || null,
        createdAt: new Date(),
      };
      this.salaryPayments.push(item);
      return { ...item };
    },
    findMany: async ({ where, include, orderBy }: { where?: any; include?: any; orderBy?: any } = {}) => {
      let list = [...this.salaryPayments];
      if (where?.companyId) list = list.filter((p) => p.companyId === where.companyId);
      if (where?.employeeId) list = list.filter((p) => p.employeeId === where.employeeId);
      if (where?.month) list = list.filter((p) => p.month === where.month);
      return list.map((p) => {
        const res: any = { ...p };
        if (include?.employee) {
          const emp = this.employees.find((e) => e.id === p.employeeId);
          res.employee = emp ? { ...emp } : null;
        }
        return res;
      });
    },
    findUnique: async ({ where, include }: { where: any; include?: any }) => {
      const item = this.salaryPayments.find((p) => p.id === where.id);
      if (!item) return null;
      const res: any = { ...item };
      if (include?.employee) {
        const emp = this.employees.find((e) => e.id === item.employeeId);
        res.employee = emp ? { ...emp } : null;
      }
      return res;
    },
  };

  customPackage = {
    create: async ({ data }: { data: any }) => {
      const item: MockCustomPackage = {
        id: this.nextId('cpkg'),
        companyId: data.companyId,
        title: data.title,
        slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        destination: data.destination,
        country: data.country || 'India',
        duration: data.duration,
        daysCount: data.daysCount || 1,
        priceFrom: data.priceFrom || null,
        category: typeof data.category === 'string' ? data.category : JSON.stringify(data.category || []),
        highlights: typeof data.highlights === 'string' ? data.highlights : JSON.stringify(data.highlights || []),
        description: data.description,
        itinerary: typeof data.itinerary === 'string' ? data.itinerary : JSON.stringify(data.itinerary || []),
        inclusions: typeof data.inclusions === 'string' ? data.inclusions : JSON.stringify(data.inclusions || []),
        exclusions: typeof data.exclusions === 'string' ? data.exclusions : JSON.stringify(data.exclusions || []),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.customPackages.push(item);
      return { ...item };
    },
    findMany: async ({ where, orderBy }: { where?: any; orderBy?: any } = {}) => {
      let list = [...this.customPackages];
      if (where?.companyId) list = list.filter((p) => p.companyId === where.companyId);
      return list.map((p) => ({ ...p }));
    },
    findUnique: async ({ where }: { where: any }) => {
      const item = this.customPackages.find((p) => p.id === where.id);
      return item ? { ...item } : null;
    },
    delete: async ({ where }: { where: any }) => {
      const index = this.customPackages.findIndex((p) => p.id === where.id);
      if (index === -1) return null;
      const [removed] = this.customPackages.splice(index, 1);
      return { ...removed };
    },
  };

  private ensureEmployeesSeeded(companyId?: string) {
    if (this.employees.length > 0) return;
    const cid = companyId || 'default-company-id';
    const seeds: MockEmployee[] = [
      {
        id: 'emp_001',
        companyId: cid,
        name: "Himani Sharma",
        email: "himani@shanvihospitality.in",
        phone: "+91 9999885087",
        department: "Tour Planning",
        designation: "Key Tour Planner & Lead Consultant",
        joiningDate: new Date('2022-05-01'),
        baseSalary: 65000,
        allowances: 15000,
        deductions: 3500,
        netSalary: 76500,
        bankName: "HDFC Bank",
        accountNumber: "50100492819283",
        ifscCode: "HDFC0000288",
        panNumber: "AFKPS9281M",
        status: "ACTIVE",
        commissionRate: 3.5,
        createdAt: new Date('2022-05-01'),
        updatedAt: new Date(),
      },
      {
        id: 'emp_002',
        companyId: cid,
        name: "Rajesh Kumar",
        email: "rajesh@shanvihospitality.in",
        phone: "+91 9355141058",
        department: "Sales",
        designation: "Senior B2B & Corporate Sales Lead",
        joiningDate: new Date('2022-08-15'),
        baseSalary: 55000,
        allowances: 10000,
        deductions: 3000,
        netSalary: 62000,
        bankName: "ICICI Bank",
        accountNumber: "002101569482",
        ifscCode: "ICIC0000021",
        panNumber: "BKMPK4719L",
        status: "ACTIVE",
        commissionRate: 2.5,
        createdAt: new Date('2022-08-15'),
        updatedAt: new Date(),
      },
      {
        id: 'emp_003',
        companyId: cid,
        name: "Priya Verma",
        email: "accounts@shanvihospitality.in",
        phone: "+91 9811234891",
        department: "Accounts",
        designation: "Finance & GST Compliance Specialist",
        joiningDate: new Date('2023-01-10'),
        baseSalary: 48000,
        allowances: 8000,
        deductions: 2800,
        netSalary: 53200,
        bankName: "State Bank of India",
        accountNumber: "38920194821",
        ifscCode: "SBIN0001234",
        panNumber: "CPLPV8193N",
        status: "ACTIVE",
        commissionRate: 0,
        createdAt: new Date('2023-01-10'),
        updatedAt: new Date(),
      },
      {
        id: 'emp_004',
        companyId: cid,
        name: "Vikram Singh",
        email: "operations@shanvihospitality.in",
        phone: "+91 9718892341",
        department: "Operations",
        designation: "Ground Fleet & Dispatch Lead",
        joiningDate: new Date('2023-03-20'),
        baseSalary: 42000,
        allowances: 10000,
        deductions: 2400,
        netSalary: 49600,
        bankName: "Punjab National Bank",
        accountNumber: "192800210004928",
        ifscCode: "PUNB0192800",
        panNumber: "DZKPS4819R",
        status: "ACTIVE",
        commissionRate: 1.5,
        createdAt: new Date('2023-03-20'),
        updatedAt: new Date(),
      }
    ];
    this.employees.push(...seeds);

    // Seed sample salary payment for current month
    const curMonth = "September 2026";
    for (const e of seeds) {
      this.salaryPayments.push({
        id: this.nextId('pay'),
        employeeId: e.id,
        companyId: cid,
        month: curMonth,
        baseAmount: e.baseSalary,
        bonusAmount: e.allowances,
        deductions: e.deductions,
        netPaid: e.netSalary,
        paymentDate: new Date('2026-09-05'),
        paymentMode: "NEFT",
        paymentStatus: "PAID",
        transactionRef: `HDFC-SAL-${Date.now().toString().slice(-6)}`,
        notes: `Salary for ${curMonth}`,
        createdAt: new Date('2026-09-05'),
      });
    }
  }

  private formatEmployee(e: MockEmployee, include?: any) {
    const res: any = { ...e };
    if (include?.salaryPayments) {
      res.salaryPayments = this.salaryPayments.filter((p) => p.employeeId === e.id);
    }
    return res;
  }

  private formatItinerary(it: MockItinerary, include?: any) {
    const res: any = { ...it };
    if (include?.days) {
      const days = this.itineraryDays
        .filter((d) => d.itineraryId === it.id)
        .sort((a, b) => a.dayNumber - b.dayNumber)
        .map((d) => {
          const dayRes: any = { ...d };
          if (include.days.include?.lineItems) {
            dayRes.lineItems = this.itineraryLineItems.filter((li) => li.dayId === d.id);
          }
          return dayRes;
        });
      res.days = days;
    }
    if (include?.lead) {
      const lead = this.leads.find((l) => l.id === it.leadId);
      res.lead = lead ? this.formatLead(lead, include.lead.include) : null;
    }
    if (include?.booking) {
      const booking = this.bookings.find((b) => b.itineraryId === it.id);
      res.booking = booking ? { ...booking } : null;
    }
    if (include?.company) {
      const company = this.companies.find((c) => c.id === it.companyId);
      res.company = company ? { ...company } : null;
    }
    return res;
  }


  private formatUser(u: MockUser, select?: any) {
    if (!select) return { ...u };
    const res: any = {};
    for (const key of Object.keys(select)) {
      if (key === '_count') continue;
      if (select[key]) res[key] = (u as any)[key];
    }
    return res;
  }

  private formatLead(l: MockLead, include?: any) {
    const res: any = { ...l };
    if (include?.assignedAgent) {
      const agent = this.users.find((u) => u.id === l.assignedAgentId);
      res.assignedAgent = agent
        ? { id: agent.id, name: agent.name, email: agent.email, role: agent.role }
        : null;
    }
    if (include?.notes) {
      const notes = this.leadNotes
        .filter((n) => n.leadId === l.id)
        .map((n) => {
          const user = this.users.find((u) => u.id === n.userId);
          return {
            ...n,
            user: user ? { id: user.id, name: user.name, role: user.role } : null,
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      res.notes = notes;
    }
    if (include?.bookings) {
      res.bookings = this.bookings
        .filter((b) => b.leadId === l.id)
        .map((b) => ({
          id: b.id,
          bookingNumber: b.bookingNumber,
          totalAmount: b.totalAmount,
          status: b.status,
        }));
    }
    if (include?._count?.select?.notes) {
      res._count = {
        notes: this.leadNotes.filter((n) => n.leadId === l.id).length,
      };
    }
    return res;
  }
}

export const mockDb = new MockDatabase();
