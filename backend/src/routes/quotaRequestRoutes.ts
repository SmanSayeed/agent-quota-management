import express, { Router } from 'express';
import { requestQuota, getQuotaRequests, approveQuotaRequest, rejectQuotaRequest, getMyQuotaRequests } from '../controllers';
import { protect, authorize } from '../middleware';

const router: Router = express.Router();

router.use(protect);

// Child requests quota from parent
router.post('/request', authorize('child'), requestQuota);
router.get('/my-requests', authorize('child'), getMyQuotaRequests);

// Parent gets their quota requests
router.get('/', authorize('agent'), getQuotaRequests);

// Parent approves/rejects quota requests
router.put('/approve/:id', authorize('agent'), approveQuotaRequest);
router.put('/reject/:id', authorize('agent'), rejectQuotaRequest);

export default router;
