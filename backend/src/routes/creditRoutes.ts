import express, { Router } from 'express';
import { requestCredit, getCreditRequests, approveCreditRequest, rejectCreditRequest } from '../controllers';
import { protect, authorize } from '../middleware';

const router: Router = express.Router();

router.use(protect);
// Routes
router.post('/request', authorize('agent', 'child'), requestCredit);

router.get('/', authorize('superadmin', 'agent'), getCreditRequests);
router.put('/:id/approve', authorize('superadmin', 'agent'), approveCreditRequest);
router.put('/:id/reject', authorize('superadmin', 'agent'), rejectCreditRequest);

export default router;
