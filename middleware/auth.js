import jwt from 'jsonwebtoken';

export const authenticateUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // 1. Check if header exists
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization header' });
  }

  // 2. Check if it's a valid "Bearer <token>" format
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid token format. Use: "Bearer <token>"' });
  }

  const token = tokenParts[1];

  // 3. Check if the token is a valid JWT string (3 parts separated by dots)
  if (typeof token !== 'string' || token.split('.').length !== 3) {
    return res.status(401).json({ message: 'Malformed JWT token' });
  }

  // 4. Now verify the token
  jwt.verify(token, process.env.SECERET_KEY_BACKEND_JWT, (err, user) => {
    if (err) {
      console.log("[DEBUG] JWT Verify Error:", err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
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