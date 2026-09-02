const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'econz_orbit_super_secret_jwt_key_2024', { expiresIn: '7d' });

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
    clientId: process.env.GOOGLE_CLIENT_ID || '171082207472-qotdfg7ul94pmk94gshds124.apps.googleusercontent.com',
    scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/documents.readonly']
  });
});

// @route POST /api/auth/google
// Supports Google Credential (JWT) or Access Token or Authorization Code
router.post('/google', async (req, res) => {
  try {
    const { credential, accessToken, code, redirectUri, profile } = req.body;
    let googleUser = null;

    // 1. If Google ID token credential provided
    if (credential) {
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

    // 2. If access token provided
    if (!googleUser && accessToken) {
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
        console.error('Failed to fetch userinfo:', e);
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

    // 4. Fallback if trusted profile passed directly from client OAuth popup
    if (!googleUser && profile && profile.email) {
      googleUser = profile;
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({ message: 'Could not authenticate with Google' });
    }

    const email = googleUser.email.toLowerCase().trim();
    let user = await User.findOne({ email });

    if (!user) {
      // Auto-create user on first Google login
      user = new User({
        name: googleUser.name || email.split('@')[0],
        email: email,
        avatar: googleUser.picture || '',
        googleId: googleUser.id || '',
        authProvider: 'google',
        role: 'Sales',
        designation: 'Cloud Solutions Specialist',
        status: 'Active',
        entity: 'India',
        accessLevels: ['Sales Team', 'Quotes', 'Customers'],
        password: Math.random().toString(36).slice(-10) + 'A1!'
      });
      await user.save();
    } else {
      // If user exists, update avatar / googleId if missing
      if (!user.googleId && googleUser.id) user.googleId = googleUser.id;
      if (!user.avatar && googleUser.picture) user.avatar = googleUser.picture;
      if (user.status === 'Inactive') {
        return res.status(403).json({ message: 'Your account has been deactivated. Please contact your administrator.' });
      }
      await user.save();
    }

    res.json({
      token: generateToken(user._id),
      user: user.toJSON()
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ message: err.message || 'Google authentication failed' });
  }
});

// @route GET /api/auth/me
router.get('/me', protect, (req, res) => res.json(req.user));

module.exports = router;
