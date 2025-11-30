import express, { Router } from 'express';
import { login, register, logout, getMe, createChild, getMyChildren, updateProfile } from '../controllers';
import { protect } from '../middleware';

const router: Router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/create-child', protect, createChild);
router.get('/my-children', protect, getMyChildren);

export default router;
