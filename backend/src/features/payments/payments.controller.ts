import { Request, Response } from 'express';
import { paymentsService } from './payments.service';
import { success, error as errorResponse } from '../../shared/utils/response.util';

export class PaymentsController {
  /**
   * GET /api/v1/admin/payments - Get payment queue
   */
  async getPaymentQueue(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await paymentsService.getPaymentQueue(page, limit);
      res.json(success(result, 'Payment queue retrieved'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * GET /api/v1/admin/payments/:id - Get payment details
   */
  async getPayment(req: Request, res: Response): Promise<void> {
    try {
      const payment = await paymentsService.getPaymentById(req.params.id);
      res.json(success(payment, 'Payment retrieved'));
    } catch (err: any) {
      res.status(404).json(errorResponse(err.message, 404));
    }
  }

  /**
   * POST /api/v1/admin/payments/:id/verify - Verify or reject payment
   */
  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json(errorResponse('Unauthorized', 401));
        return;
      }

      // Verify admin role would be done by middleware
      const verifyInput = {
        payment_id: req.params.id,
        verified: req.body.verified,
        rejection_reason: req.body.rejection_reason,
      };

      const payment = await paymentsService.verifyPayment(adminId, verifyInput);
      res.json(success(payment, 'Payment verified'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }
}

export const paymentsController = new PaymentsController();
