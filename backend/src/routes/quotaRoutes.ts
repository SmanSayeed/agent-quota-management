import express, { Router } from 'express';
import { buyNormalQuota, buyExtraQuota, transferToChild, liveToPool } from '../controllers';
import { protect, authorize } from '../middleware';

const router: Router = express.Router();

router.use(protect);

router.post('/buy-normal', authorize('agent'), buyNormalQuota);
router.post('/buy-extra', authorize('agent'), buyExtraQuota);
router.post('/transfer-to-child', authorize('agent'), transferToChild);
router.post('/live-to-pool', authorize('agent'), liveToPool);

export default router;
