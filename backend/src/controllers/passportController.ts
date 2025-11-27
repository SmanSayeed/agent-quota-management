import { Request, Response } from 'express';
import { Passport } from '../models/Passport';
import { AuthRequest } from '../middleware/authMiddleware';
import { getIO } from '../socket';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

export const uploadPassport = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const { ocrData } = req.body;
    const userId = req.user!._id;

    const passport = await Passport.create({
      userId,
      imagePath: req.file.filename,
      ocrData: typeof ocrData === 'string' ? JSON.parse(ocrData) : ocrData,
      status: 'pending',
    });

    getIO().to('admin-room').emit('new-passport', passport);

    res.status(201).json(passport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPassports = async (_req: Request, res: Response) => {
  try {
    const passports = await Passport.find().sort({ createdAt: -1 }).populate('userId', 'name phone role');
    res.json(passports);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePassport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, ocrData } = req.body;

    const passport = await Passport.findById(id);

    if (!passport) {
      res.status(404).json({ message: 'Passport not found' });
      return;
    }

    if (status) passport.status = status;
    if (ocrData) passport.ocrData = ocrData;
    
    // if (req.user) {
    //     passport.editedBy = req.user._id;
    // }

    await passport.save();

    getIO().to('admin-room').emit('passport-updated', passport);

    res.json(passport);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPassportImageToken = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const passport = await Passport.findById(id);
        
        if (!passport) {
            res.status(404).json({ message: 'Passport not found' });
            return;
        }

        const token = jwt.sign({ imagePath: passport.imagePath }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '10m'
        });

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const servePassportImage = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { imagePath: string };
        const imagePath = path.join(__dirname, '../../uploads/passports', decoded.imagePath);

        if (fs.existsSync(imagePath)) {
            res.sendFile(imagePath);
        } else {
            res.status(404).json({ message: 'Image not found' });
        }
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
