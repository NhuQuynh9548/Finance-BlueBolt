import prisma from '../utils/prisma';

export interface AuditLogParams {
    tableName: string;
    recordId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'CANCEL' | 'LOGIN' | 'LOGOUT';
    userId: string;
    oldValues?: any;
    newValues?: any;
    changes?: any;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
}

export const auditService = {
    async log(params: AuditLogParams) {
        try {
            return await prisma.auditLog.create({
                data: {
                    tableName: params.tableName,
                    recordId: params.recordId,
                    action: params.action,
                    userId: params.userId,
                    oldValues: params.oldValues || null,
                    newValues: params.newValues || null,
                    changes: params.changes || null,
                    reason: params.reason,
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent
                }
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw error to avoid breaking main business logic
        }
    }
};
