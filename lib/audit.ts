import { prisma } from '@/lib/prisma';

export async function createAuditLog({
  companyId,
  actorId,
  actorRole,
  action,
  entityType,
  entityId,
  beforeState,
  afterState,
}: {
  companyId: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: any;
  afterState?: any;
}) {
  return prisma.auditLog.create({
    data: {
      companyId,
      actorId,
      actorRole,
      action,
      entityType,
      entityId,
      beforeState: beforeState ? JSON.stringify(beforeState) : null,
      afterState: afterState ? JSON.stringify(afterState) : null,
    },
  });
}
