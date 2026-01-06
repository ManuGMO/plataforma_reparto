import express from 'express';
import { register, login, logout, selectRole } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/select-role', authenticate, selectRole);

export default router;
