import { Router, Request, Response } from 'express';
import { cronEndpoints } from '../../shared/cron/jobs';
import { success, error as errorResponse } from '../../shared/utils/response.util';

const router = Router();

/**
 * POST /api/v1/cron/publish-scheduled - Publish scheduled ads
 * In production, protect with X-CRON-SECRET header
 */
router.post('/publish-scheduled', async (req: Request, res: Response) => {
  try {
    const result = await cronEndpoints.publishScheduled();
    res.json(success(result, 'Scheduled ads published'));
  } catch (err: any) {
    res.status(500).json(errorResponse(err.message, 500));
  }
});

/**
 * POST /api/v1/cron/expire-ads - Expire old ads
 */
router.post('/expire-ads', async (req: Request, res: Response) => {
  try {
    const result = await cronEndpoints.expireAds();
    res.json(success(result, 'Ads expired'));
  } catch (err: any) {
    res.status(500).json(errorResponse(err.message, 500));
  }
});

/**
 * POST /api/v1/cron/send-notifications - Send expiring soon notifications
 */
router.post('/send-notifications', async (req: Request, res: Response) => {
  try {
    const result = await cronEndpoints.sendNotifications();
    res.json(success(result, 'Notifications sent'));
  } catch (err: any) {
    res.status(500).json(errorResponse(err.message, 500));
  }
});

/**
 * GET /api/v1/cron/health - Database heart beat
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const result = await cronEndpoints.healthCheck();
    res.json(success(result, 'Health check passed'));
  } catch (err: any) {
    res.status(500).json(errorResponse(err.message, 500));
  }
});

export default router;
