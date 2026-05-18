import { db } from '@/db';
import { auditLogs } from '@/db/schema';

export async function logAction(userId: string | null, action: string, targetType?: string, targetId?: string, metadata?: any) {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      targetType,
      targetId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
}
