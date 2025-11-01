import express from 'express';
import { 
  setupEmail2FA,
  verifyEmail2FA,
  sendEmailCode,
  validateEmailCode
} from '../controllers/emailController.js';

const router = express.Router();

router.post("/setup-email", setupEmail2FA);
router.post("/verify-email", verifyEmail2FA);
router.post("/send-email-code", sendEmailCode);
router.post("/validate-email", validateEmailCode);

export default router;