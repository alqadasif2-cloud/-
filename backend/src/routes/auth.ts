import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { adminFirestore } from '../firebase';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'personal_cloud_backup_jwt_default_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '60d';

/**
 * تسجيل حساب جديد
 * POST /api/register
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, deviceId } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'اسم المستخدم غير صالح (يجب أن يحتوي على 3 أحرف على الأقل)'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'كلمة المرور غير صالحة (يجب أن تحتوي على 4 خانات على الأقل)'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const accountRef = adminFirestore.collection('app_accounts').doc(cleanUsername);
    const existingDoc = await accountRef.get();

    if (existingDoc.exists) {
      return res.status(400).json({
        success: false,
        error: 'اسم المستخدم مسجل مسبقاً، يرجى تسجيل الدخول أو اختيار اسم آخر'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newAccountData = {
      username: cleanUsername,
      passwordHash,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      deviceId: deviceId || 'UNKNOWN',
      isActive: true
    };

    await accountRef.set(newAccountData);

    const token = jwt.sign(
      { username: cleanUsername, deviceId: deviceId || 'UNKNOWN' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      token,
      username: cleanUsername
    });
  } catch (error: any) {
    console.error('Error in /api/register:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في الخادم أثناء إنشاء الحساب: ' + error.message
    });
  }
});

/**
 * تسجيل الدخول
 * POST /api/login
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password, deviceId } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'اسم المستخدم وكلمة المرور مطلوبان'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const accountRef = adminFirestore.collection('app_accounts').doc(cleanUsername);
    const docSnap = await accountRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        success: false,
        error: 'الحساب غير موجود، يرجى التسجيل أولاً'
      });
    }

    const account = docSnap.data();
    if (!account?.isActive) {
      return res.status(403).json({
        success: false,
        error: 'هذا الحساب معطل حالياً'
      });
    }

    const isMatch = await bcrypt.compare(password, account.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'كلمة المرور غير صحيحة'
      });
    }

    // تحديث تاريخ آخر دخول ومعرف الجهاز
    await accountRef.update({
      lastLogin: Date.now(),
      deviceId: deviceId || account.deviceId || 'UNKNOWN'
    });

    const token = jwt.sign(
      { username: cleanUsername, deviceId: deviceId || account.deviceId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token,
      username: cleanUsername
    });
  } catch (error: any) {
    console.error('Error in /api/login:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في الخادم أثناء تسجيل الدخول: ' + error.message
    });
  }
});
