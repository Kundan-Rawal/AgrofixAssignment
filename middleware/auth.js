import jwt from 'jsonwebtoken';

export const authenticateUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.SECERET_KEY_BACKEND_JWT, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = user; // ✅ Attach decoded user payload to the request
    next();
  });
};


export const authorizeRole = (role) => {
    return (req, res, next) => {
      if (req.user.role !== role) {
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