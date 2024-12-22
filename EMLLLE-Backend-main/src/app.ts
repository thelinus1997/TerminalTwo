import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import eventsRoutes from './api/events';
import organizationsRoutes from './api/organizations';
import userRoutes from './api/users';

dotenv.config({ path: './src/.env' });
const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
} else {
  console.log('JWT_SECRET is defined:', JWT_SECRET);
}

// Extend the Request type to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | string;
    }
  }
}

// Middleware to verify JWT
export function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).send('Access Denied: No Token Provided!'); // Unauthorized

  jwt.verify(token, JWT_SECRET as string, (err, user) => {
    if (err) return res.status(403).send('Access Denied: Invalid Token!'); // Forbidden
    req.user = user;
    next();
  });
}

// Protected route example
app.get('/protected', authenticateToken, (req, res) => {
  const user = req.user as JwtPayload;
  res.send(`Hello ${user.name}, you have access to this route!`);
});

// Apply the authentication middleware to the existing routes that need protection
app.use('/api/organizations/', authenticateToken, organizationsRoutes);
app.use('/api/events/', authenticateToken, eventsRoutes);

// Apply user routes without authentication middleware
app.use('/api/users/', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
