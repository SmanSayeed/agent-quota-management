import express, { Router } from 'express';
import { 
  getAgents, 
  updateAgent, 
  updatePool, 
  getSettings, 
  updateSettings, 
  createSuperadmin, 
  getSuperAdmins, 
  updateSuperAdmin, 
  deleteSuperAdmin,
  getPendingPurchases,
  approvePurchase,
  rejectPurchase,
  resetDailyQuotas
} from '../controllers';
import { protect, authorize } from '../middleware';

const router: Router = express.Router();

router.use(protect);
router.use(authorize('superadmin'));

router.get('/agents', getAgents);
router.put('/agents/:id', updateAgent);

// Super Admin Management
router.get('/super-admins', getSuperAdmins);
router.post('/create-superadmin', createSuperadmin);
router.put('/super-admins/:id', updateSuperAdmin);
router.delete('/super-admins/:id', deleteSuperAdmin);

// Removed GET /pool - use GET /quota/pool instead (available for all roles)
router.put('/pool', updatePool);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Marketplace admin routes
router.get('/purchases/pending', getPendingPurchases);
router.post('/purchases/:id/approve', approvePurchase);
router.post('/purchases/:id/reject', rejectPurchase);
router.post('/quota/reset-daily', resetDailyQuotas);

export default router;

