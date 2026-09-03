const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'econz_orbit_super_secret_jwt_key_2024', { expiresIn: '12h' });

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials or user not found' });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ message: 'This account has been deactivated. Please contact your administrator.' });
    }

    let valid = await user.comparePassword(password);

    // Repair users seeded with insertMany (plaintext passwords, no bcrypt hash)
    if (!valid && user.password === password) {
      user.password = password;
      await user.save();
      valid = true;
    }

    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ token: generateToken(user._id), user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/auth/google/config
router.get('/google/config', (req, res) => {
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID || '171082207472-qotdfg7ul94pmk94gshds12kcurs0lm1.apps.googleusercontent.com',
    scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/documents.readonly']
  });
});

// @route POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential, accessToken, code, redirectUri, profile } = req.body;
    let googleUser = null;

    // 1. If access token provided
    if (accessToken) {
      try {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (profileRes.ok) {
          const payload = await profileRes.json();
          googleUser = {
            id: payload.id,
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture
          };
        }
      } catch (e) {
        console.error('Failed to fetch userinfo from accessToken:', e);
      }
    }

    // 2. If Google ID token credential provided
    if (!googleUser && credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          googleUser = {
            id: payload.sub,
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture
          };
        }
      } catch (e) {
        console.error('Failed to verify tokeninfo:', e);
      }
    }

    // 3. If OAuth authorization code provided
    if (!googleUser && code) {
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            redirect_uri: redirectUri || 'postmessage',
            grant_type: 'authorization_code'
          })
        });
        if (tokenRes.ok) {
          const tokens = await tokenRes.json();
          if (tokens.access_token) {
            const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: `Bearer ${tokens.access_token}` }
            });
            if (profileRes.ok) {
              const payload = await profileRes.json();
              googleUser = {
                id: payload.id,
                email: payload.email,
                name: payload.name || payload.email.split('@')[0],
                picture: payload.picture
              };
            }
          }
        }
      } catch (e) {
        console.error('Failed code exchange:', e);
      }
    }

    // 4. Fallback if profile passed directly
    if (!googleUser && profile && profile.email) {
      googleUser = profile;
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({ message: 'Could not authenticate with Google' });
    }

    const email = googleUser.email.toLowerCase().trim();
    let user = await User.findOne({ email });

    // Strict Admin Provisioning: Only users created/provisioned by Admin can log in
    if (!user) {
      return res.status(403).json({
        message: `Account not found for ${email}. Please contact an administrator to create your account before signing in.`
      });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact your administrator.' });
    }

    if (!user.googleId && googleUser.id) user.googleId = googleUser.id;
    if (!user.avatar && googleUser.picture) user.avatar = googleUser.picture;
    if (accessToken) user.googleAccessToken = accessToken;
    user.authProvider = 'google';
    await user.save();

    res.json({
      token: generateToken(user._id),
      googleAccessToken: accessToken || user.googleAccessToken || '',
      user: user.toJSON()
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ message: err.message || 'Google authentication failed' });
  }
});

// @route POST /api/auth/admin/signup (Create/provision account and issue 12h session)
router.post('/admin/signup', async (req, res) => {
  try {
    const { name, email, role, entity, designation, reportingManagerId } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Full name and Google email are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      // If user already exists, issue token and log them in
      return res.json({
        success: true,
        message: `Welcome back, ${existing.name}!`,
        token: generateToken(existing._id),
        user: existing.toJSON()
      });
    }

    let reportingManagers = [];
    if (role === 'Sales' && reportingManagerId) {
      const mgr = await User.findById(reportingManagerId);
      if (mgr) {
        reportingManagers = [{
          id: String(mgr._id),
          name: mgr.name,
          email: mgr.email
        }];
      }
    }

    const newUser = new User({
      name: name.trim(),
      email: cleanEmail,
      role: role || 'Sales',
      entity: entity || 'India',
      designation: designation || (role === 'Manager' ? 'Cloud Solutions Delivery Lead' : (role === 'Admin' ? 'System Administrator' : 'Cloud Solutions Specialist')),
      status: 'Active',
      authProvider: 'google',
      reportingManagers,
      accessLevels: role === 'Admin' ? ['All'] : (role === 'Manager' ? ['Manager Team', 'Quotes', 'Customers'] : ['Sales Team', 'Quotes', 'Customers']),
      password: Math.random().toString(36).slice(-10) + 'A1!'
    });

    await newUser.save();
    
    // Auto-generate 12-hour login token
    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      message: `Account created successfully for ${newUser.name}!`,
      token,
      user: newUser.toJSON()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/auth/managers (Fetch active managers for assignment)
router.get('/managers', async (req, res) => {
  try {
    const managers = await User.find({ role: { $in: ['Manager', 'Admin'] }, status: 'Active' })
      .select('name email role entity designation')
      .sort({ name: 1 });
    res.json(managers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/auth/me
router.get('/me', protect, (req, res) => res.json(req.user));

// @route PUT /api/auth/profile (Update personal profile)
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name) user.name = req.body.name.trim();
    if (req.body.phone !== undefined) user.phone = req.body.phone.trim();
    if (req.body.emergencyContact !== undefined) user.emergencyContact = req.body.emergencyContact.trim();
    if (req.body.designation !== undefined) user.designation = req.body.designation.trim();
    if (req.body.entity !== undefined) user.entity = req.body.entity;
    if (req.body.avatar !== undefined) user.avatar = req.body.avatar;

    await user.save();
    res.json({ user: user.toJSON(), message: 'Profile updated successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
