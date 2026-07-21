const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET env var must be at least 32 characters');
}
const EFFECTIVE_SECRET = JWT_SECRET;

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    const decoded = jwt.verify(token, EFFECTIVE_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    EFFECTIVE_SECRET,
    { expiresIn: '24h' }
  );
}

module.exports = auth;
module.exports.auth = auth;
module.exports.signToken = signToken;
module.exports.JWT_SECRET = EFFECTIVE_SECRET;
