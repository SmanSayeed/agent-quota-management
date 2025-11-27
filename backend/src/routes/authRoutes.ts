import express, { Router } from 'express';
import { login, register, logout, getMe } from '../controllers';
import { protect } from '../middleware';

const router: Router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;
