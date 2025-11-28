import express, { Router } from 'express';
import { getSettings } from '../controllers';

const router: Router = express.Router();

// Public endpoint - no auth required, read-only
router.get('/', getSettings);

export default router;
