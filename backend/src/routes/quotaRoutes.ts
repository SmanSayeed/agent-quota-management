import express, { Router } from 'express';
import { 
  buyQuota, 
  transferToChild, 
 
  getPoolInfo, 
  getQuotaHistory,
  createListing,
  getMarketplace,
  getMyListings,
  cancelListing,
  purchaseFromMarketplace,
  getMarketplaceTotalQuota,
  recalculateStats
} from '../controllers';
import { protect, authorize } from '../middleware';

const router: Router = express.Router();

router.use(protect);

router.post('/buy', authorize('agent'), buyQuota);
router.post('/transfer-to-child', authorize('agent'), transferToChild);

// New route: agents (and superadmin) can read global pool info
router.get('/pool', authorize('agent', 'superadmin'), getPoolInfo);
router.get('/history', authorize('agent'), getQuotaHistory);

// Marketplace routes
router.get('/stats', authorize('agent', 'superadmin'), getMarketplaceTotalQuota);
router.post('/stats/recalculate', authorize('superadmin'), recalculateStats);
router.post('/listing', authorize('agent'), createListing);
router.get('/marketplace', authorize('agent', 'superadmin'), getMarketplace);
router.get('/my-listings', authorize('agent'), getMyListings);
router.delete('/listing/:id', authorize('agent'), cancelListing);
router.post('/purchase/:listingId', authorize('agent'), purchaseFromMarketplace);

export default router;
