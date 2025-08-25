import jwt from 'jsonwebtoken';
import config from 'config';

const studentAuth = (req, res, next) => {

  // console.log("this is headers",req.headers.authorization)

  const authHeader = req.headers.authorization;
  console.log(req.headers.authorization);
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  // Retrieve the JWT secret from the config file
  const secret = config.get('jwtSecret'); // This will fetch the JWT secret from config

  // Verify the token
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Attach decoded user info to the request for further use
    req.user = { id: decoded.id };

    next(); // Continue to the next middleware/route handler
  });
};


export { studentAuth };
