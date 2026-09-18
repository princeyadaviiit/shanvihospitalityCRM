// In-memory Prisma mock for testing environments without live database connection
import { UserRole, LeadStatus } from '@prisma/client';

type MockCompany = {
  id: string;
  name: string;
  currency: string;
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

class MockDatabase {
  companies: MockCompany[] = [];
  users: MockUser[] = [];
  leads: MockLead[] = [];
  leadNotes: MockLeadNote[] = [];

  private idCounter = 1;
  private nextId(prefix: string) {
    return `${prefix}_${Date.now()}_${this.idCounter++}`;
  }

  company = {
    create: async ({ data }: { data: any }) => {
      const item: MockCompany = {
        id: this.nextId('comp'),
        name: data.name,
        currency: data.currency || 'INR',
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
    deleteMany: async ({ where }: { where?: any }) => {
      if (where?.companyId?.in) {
        this.leadNotes = this.leadNotes.filter((n) => !where.companyId.in.includes(n.companyId));
      } else {
        this.leadNotes = [];
      }
      return { count: 1 };
    },
  };

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
    if (include?._count?.select?.notes) {
      res._count = {
        notes: this.leadNotes.filter((n) => n.leadId === l.id).length,
      };
    }
    return res;
  }
}

export const mockDb = new MockDatabase();
