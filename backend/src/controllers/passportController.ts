import { Request, Response } from 'express';
import { Passport } from '../models/Passport';
import { AuthRequest } from '../middleware/authMiddleware';
// import { getIO } from '../socket';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { sendSuccess, sendError, sendPaginatedSuccess } from '../utils';

export const uploadPassport = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      sendError(res, 'No file uploaded', 400, 'NO_FILE');
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

    // getIO().to('admin-room').emit('new-passport', passport);

    sendSuccess(res, passport, 'Passport uploaded successfully', 201);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const getPassports = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const passportNumber = req.query.passportNumber as string;
    const givenNames = req.query.givenNames as string;
    const surname = req.query.surname as string;

    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (passportNumber) {
      query['ocrData.passportNumber'] = { $regex: passportNumber, $options: 'i' };
    }
    if (givenNames) {
      query['ocrData.givenNames'] = { $regex: givenNames, $options: 'i' };
    }
    if (surname) {
      query['ocrData.surname'] = { $regex: surname, $options: 'i' };
    }

    if (search) {
      // This is a bit complex because we need to search in populated fields or ocrData
      // For simplicity, let's search in ocrData
      query.$or = [
        { 'ocrData.passportNumber': { $regex: search, $options: 'i' } },
        { 'ocrData.givenNames': { $regex: search, $options: 'i' } },
        { 'ocrData.surname': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [passports, total] = await Promise.all([
      Passport.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name phone role'),
      Passport.countDocuments(query),
    ]);

    sendPaginatedSuccess(res, passports, total, page, limit);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const getMyPassports = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const query: any = { userId };

    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [passports, total] = await Promise.all([
      Passport.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Passport.countDocuments(query),
    ]);

    sendPaginatedSuccess(res, passports, total, page, limit);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const updatePassport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, ocrData } = req.body;

    const passport = await Passport.findById(id);

    if (!passport) {
      sendError(res, 'Passport not found', 404, 'PASSPORT_NOT_FOUND');
      return;
    }

    if (status) passport.status = status;
    if (ocrData) passport.ocrData = ocrData;
    
    // if (req.user) {
    //     passport.editedBy = req.user._id;
    // }

    await passport.save();

    // getIO().to('admin-room').emit('passport-updated', passport);

    sendSuccess(res, passport);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const deletePassport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const passport = await Passport.findById(id);

    if (!passport) {
      sendError(res, 'Passport not found', 404, 'PASSPORT_NOT_FOUND');
      return;
    }

    // Delete image file
    const imagePath = path.join(__dirname, '../../uploads/passports', passport.imagePath);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await passport.deleteOne();
    sendSuccess(res, null, 'Passport deleted successfully');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const getPassportImageToken = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const passport = await Passport.findById(id);
        
        if (!passport) {
            sendError(res, 'Passport not found', 404, 'PASSPORT_NOT_FOUND');
            return;
        }

        const token = jwt.sign({ imagePath: passport.imagePath }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '10m'
        });

        sendSuccess(res, { token });
    } catch (error) {
        sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
    }
};

export const servePassportImage = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { imagePath: string };
        const imagePath = path.join(__dirname, '../../uploads/passports', decoded.imagePath);

        if (fs.existsSync(imagePath)) {
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.sendFile(imagePath);
        } else {
            sendError(res, 'Image not found', 404, 'IMAGE_NOT_FOUND');
        }
    } catch (error) {
        sendError(res, 'Invalid or expired token', 401, 'INVALID_TOKEN');
    }
};
