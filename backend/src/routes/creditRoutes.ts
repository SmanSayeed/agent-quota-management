import express, { Router } from 'express';
import { requestCredit, getCreditRequests, approveCreditRequest, rejectCreditRequest } from '../controllers';
import { protect, authorize } from '../middleware';

const router: Router = express.Router();

router.use(protect);

router.post('/request', authorize('agent'), requestCredit);

router.get('/', authorize('superadmin'), getCreditRequests);
router.put('/:id/approve', authorize('superadmin'), approveCreditRequest);
router.put('/:id/reject', authorize('superadmin'), rejectCreditRequest);

export default router;
