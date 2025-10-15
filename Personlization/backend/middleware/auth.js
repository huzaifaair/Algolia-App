// Simple authentication middleware for Algolia Personalization
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'algolia-personalization-secret';

// Generate JWT token for user
export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

// Verify JWT token middleware
export const verifyToken = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
    
  } catch (error) {
    res.status(400).json({ 
      error: 'Invalid token' 
    });
  }
};

// Optional authentication - agar token hai toh verify karo, nahi toh anonymous user
export const optionalAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
    } else {
      // Anonymous user ke liye unique ID generate karo
      req.userId = 'anonymous-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    next();
    
  } catch (error) {
    // Agar token invalid hai toh anonymous user banao
    req.userId = 'anonymous-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    next();
  }
};

// Admin authentication (agar aapko admin routes chahiye)
export const adminAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is admin (yahan aap apna logic daal sakte hain)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied. Admin rights required.' 
      });
    }
    
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
    
  } catch (error) {
    res.status(400).json({ 
      error: 'Invalid token' 
    });
  }
};

// Rate limiting middleware
const rateLimitMap = new Map();

export const rateLimit = (windowMs = 60000, maxRequests = 100) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Purane requests clean karo
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, []);
    }

    const requests = rateLimitMap.get(ip).filter(time => time > windowStart);
    rateLimitMap.set(ip, requests);

    // Check rate limit
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((requests[0] + windowMs - now) / 1000)
      });
    }

    // New request add karo
    requests.push(now);
    next();
  };
};

// CORS middleware
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://yourdomain.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Request logger middleware
export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - User: ${req.userId || 'Unknown'}`);
  next();
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
};