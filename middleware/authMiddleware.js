import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const openPaths = ['/auth/login', '/auth/forgot-password','/reset-pin']; // add any other routes you want to exclude
  
  // Skip token check for open paths
  if (openPaths.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user info to request
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};
