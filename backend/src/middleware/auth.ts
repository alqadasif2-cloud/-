import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
    deviceId?: string;
  };
}

export const authenticateJwt = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'لم يتم توفير رمز التحقق (Authorization: Bearer token مطلوب)'
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'personal_cloud_backup_jwt_default_secret_key_2026';

  try {
    const decoded = jwt.verify(token, secret) as { username: string; deviceId?: string };
    req.user = {
      username: decoded.username.toLowerCase(),
      deviceId: decoded.deviceId
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'رمز التحقق JWT غير صالح أو منتهي الصلاحية'
    });
  }
};
