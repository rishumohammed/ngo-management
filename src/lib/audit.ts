import { prisma } from './prisma'

type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'STAGE_CHANGE'
  | 'STATUS_CHANGE'
  | 'SUSPEND'
  | 'REACTIVATE'
  | 'EMAIL_SENT'
  | 'PDF_GENERATED'
  | 'INVITE_SENT'

interface AuditParams {
  userId?: string
  userName?: string
  action: AuditAction
  entity: string
  entityId?: string
  entityName?: string
  diff?: { before?: Record<string, unknown>; after?: Record<string, unknown> }
  ipAddress?: string
  userAgent?: string
}

export async function logAudit(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        entityName: params.entityName,
        diff: params.diff as object,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    })
  } catch (err) {
    // Audit logging should never crash the main operation
    console.error('[AuditLog] Failed to write audit entry:', err)
  }
}
