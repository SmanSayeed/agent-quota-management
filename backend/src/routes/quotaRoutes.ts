import express, { Router } from 'express';
import { buyQuota, transferToChild, liveToPool, getPoolInfo } from '../controllers';
import { protect, authorize } from '../middleware';

const router: Router = express.Router();

router.use(protect);

router.post('/buy', authorize('agent'), buyQuota);
router.post('/transfer-to-child', authorize('agent'), transferToChild);
router.post('/live-to-pool', authorize('agent'), liveToPool);
// New route: agents (and superadmin) can read global pool info
router.get('/pool', authorize('agent', 'superadmin'), getPoolInfo);

export default router;
