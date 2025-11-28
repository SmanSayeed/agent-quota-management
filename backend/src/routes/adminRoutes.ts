import express, { Router } from 'express';
import { getAgents, updateAgent, updatePool, getSettings, updateSettings, createSuperadmin } from '../controllers';
import { protect, authorize } from '../middleware';

const router: Router = express.Router();

router.use(protect);
router.use(authorize('superadmin'));

router.get('/agents', getAgents);
router.put('/agents/:id', updateAgent);
router.post('/create-superadmin', createSuperadmin);
// Removed GET /pool - use GET /quota/pool instead (available for all roles)
router.put('/pool', updatePool);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
