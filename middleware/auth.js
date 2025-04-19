import jwt from 'jsonwebtoken';

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization header' });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const token = tokenParts[1];
    if (typeof token !== 'string' || token.split('.').length !== 3) {
      return res.status(401).json({ message: 'Malformed JWT' });
    }

    // Convert to promise-based verification
    const user = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.SECRET_KEY_BACKEND_JWT, (err, decoded) => {
        err ? reject(err) : resolve(decoded);
      });
    });


    req.user = user;
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' 
      ? 'Token expired' 
      : 'Invalid token';
    return res.status(403).json({ message });
  }
};

export const authorizeRole = (role) => {
  return (req, res, next) => {
    console.log("[DEBUG] User Role:", req.user?.role, "Expected Role:", role); // Check role match
    if (req.user?.role !== role) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

  export const matchUserId = (req, res, next) => {
    const tokenUserId = req.user?.id;        // Extracted from JWT
    const paramUserId = parseInt(req.params.user_id || req.params.id); // From URL
  
    if (tokenUserId !== paramUserId) {
      return res.status(403).json({ message: "Unauthorized: User ID does not match" });
    }
  
    next();
  };