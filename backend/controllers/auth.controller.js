const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'mms_super_secret_jwt_key_2026_academic_mvp';

// In-memory mock OTP store for demonstration
const mockOtpStore = {};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Identifier (Roll Number / URN / Email) and password are required.'
      });
    }

    const cleanIdentifier = identifier.trim();

    // 1. Find user by identifier (users.identifier OR students.roll_no OR users.email)
    let users = await db.query(
      'SELECT * FROM users WHERE identifier = ? OR email = ? LIMIT 1',
      [cleanIdentifier, cleanIdentifier]
    );

    // If not found in users.identifier, check if it's a student roll_no
    if (users.length === 0) {
      const studentMatch = await db.query(
        'SELECT user_id FROM students WHERE roll_no = ? LIMIT 1',
        [cleanIdentifier]
      );
      if (studentMatch.length > 0) {
        users = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [studentMatch[0].user_id]);
      }
    }

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Roll Number / URN / Email or Password.'
      });
    }

    const user = users[0];

    // 2. Check active status
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact system administrator.'
      });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Roll Number / URN / Email or Password.'
      });
    }

    // 4. Retrieve role-specific IDs
    let roleSpecificId = null;
    let batchId = null;

    if (user.role === 'ADMIN') {
      const admins = await db.query('SELECT id FROM admins WHERE user_id = ? LIMIT 1', [user.id]);
      if (admins.length > 0) roleSpecificId = admins[0].id;
    } else if (user.role === 'MENTOR') {
      const mentors = await db.query('SELECT id FROM mentors WHERE user_id = ? LIMIT 1', [user.id]);
      if (mentors.length > 0) roleSpecificId = mentors[0].id;
    } else if (user.role === 'STUDENT') {
      const students = await db.query('SELECT id, batch_id FROM students WHERE user_id = ? LIMIT 1', [user.id]);
      if (students.length > 0) {
        roleSpecificId = students[0].id;
        batchId = students[0].batch_id;
      }
    }

    // 5. Generate JWT token
    const tokenPayload = {
      id: user.id,
      role: user.role,
      identifier: user.identifier,
      name: user.name,
      email: user.email,
      roleSpecificId,
      adminId: user.role === 'ADMIN' ? roleSpecificId : null,
      mentorId: user.role === 'MENTOR' ? roleSpecificId : null,
      studentId: user.role === 'STUDENT' ? roleSpecificId : null,
      batchId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    logger.info(`User logged in successfully: ${user.identifier} (${user.role})`);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        identifier: user.identifier,
        roleSpecificId
      }
    });

  } catch (err) {
    logger.error('Error during authentication login:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

// Forgot Password Step 1: Send OTP
const forgotPassword = async (req, res) => {
  try {
    const { contact } = req.body; // email, mobile, or roll number
    if (!contact) {
      return res.status(400).json({ success: false, message: 'Please provide Email, Mobile, or Roll Number.' });
    }

    const clean = contact.trim();
    let users = await db.query('SELECT * FROM users WHERE email = ? OR identifier = ? LIMIT 1', [clean, clean]);
    
    if (users.length === 0) {
      const studentMatch = await db.query('SELECT user_id FROM students WHERE roll_no = ? OR phone = ? LIMIT 1', [clean, clean]);
      if (studentMatch.length > 0) {
        users = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [studentMatch[0].user_id]);
      }
    }

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No registered student record found for given contact.' });
    }

    const user = users[0];
    const otp = '123456'; // Mock 6-digit OTP for viva demo
    mockOtpStore[user.id] = otp;

    logger.info(`OTP generated for user ID ${user.id}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to registered contact (${user.email}).`,
      demoOtp: otp
    });
  } catch (err) {
    logger.error('Error in forgotPassword:', err);
    return res.status(500).json({ success: false, message: 'Server error generating OTP.' });
  }
};

// Forgot Password Step 2: Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { contact, otp } = req.body;
    if (!contact || !otp) {
      return res.status(400).json({ success: false, message: 'Contact and OTP are required.' });
    }

    if (otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please enter 123456.' });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error verifying OTP.' });
  }
};

// Forgot Password Step 3: Reset Password
const resetPassword = async (req, res) => {
  try {
    const { contact, newPassword } = req.body;
    if (!contact || !newPassword) {
      return res.status(400).json({ success: false, message: 'Contact and new password are required.' });
    }

    const clean = contact.trim();
    let users = await db.query('SELECT id FROM users WHERE email = ? OR identifier = ? LIMIT 1', [clean, clean]);
    if (users.length === 0) {
      const studentMatch = await db.query('SELECT user_id FROM students WHERE roll_no = ? OR phone = ? LIMIT 1', [clean, clean]);
      if (studentMatch.length > 0) {
        users = [{ id: studentMatch[0].user_id }];
      }
    }

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userId = users[0].id;
    const password_hash = await bcrypt.hash(newPassword, 10);

    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, userId]);

    logger.info(`Password updated for user ID ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.'
    });
  } catch (err) {
    logger.error('Error resetting password:', err);
    return res.status(500).json({ success: false, message: 'Server error updating password.' });
  }
};

module.exports = {
  login,
  forgotPassword,
  verifyOtp,
  resetPassword
};
