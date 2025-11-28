import express, { Router } from 'express';
import { uploadPassport, getPassports, updatePassport, deletePassport, getPassportImageToken, servePassportImage, getMyPassports } from '../controllers';
import { protect, authorize, upload } from '../middleware';

const router: Router = express.Router();

router.get('/serve/:token', servePassportImage);

router.use(protect);

router.post('/upload', upload.single('image'), uploadPassport);
router.get('/my-passports', protect, getMyPassports);
router.get('/image-token/:id', authorize('superadmin'), getPassportImageToken);

router.get('/', authorize('superadmin'), getPassports);
router.put('/:id', authorize('superadmin'), updatePassport);
router.delete('/:id', authorize('superadmin'), deletePassport);

export default router;
