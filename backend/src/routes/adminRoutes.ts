import express, { Router } from 'express';
import { getAgents, updateAgent, getPool, updatePool } from '../controllers';
import { protect, authorize } from '../middleware';

const router: Router = express.Router();

router.use(protect);
router.use(authorize('superadmin'));

router.get('/agents', getAgents);
router.put('/agents/:id', updateAgent);
router.get('/pool', getPool);
router.put('/pool', updatePool);

export default router;
