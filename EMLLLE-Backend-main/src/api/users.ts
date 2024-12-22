import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../app';
import { User, userSchema } from '../schemas/userSchema';
import { readJSONFile, writeJSONFile } from '../utils/fileUtils';

dotenv.config({ path: './src/.env' });
const router = express.Router();
const filePath = 'database/users.json';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

// Register a new user (public)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const users: User[] = await readJSONFile(filePath);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser: User = { id: uuidv4(), ...req.body, password: hashedPassword };

    // Validate the new user data
    const parsedUser = userSchema.safeParse(newUser);
    if (!parsedUser.success) {
      return res.status(400).send(parsedUser.error.errors);
    }

    users.push(parsedUser.data);
    await writeJSONFile(filePath, users);
    res.status(201).send(parsedUser.data);
  } catch (error) {
    res.status(500).send('Error registering user');
  }
});

// Login a user (public)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const users: User[] = await readJSONFile(filePath);
    const user = users.find((u) => u.username === req.body.username);
    if (!user) return res.status(404).send('User not found');

    if (!req.body.password || !user.password) {
      return res.status(400).send('Password is required');
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(401).send('Invalid password');

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET as string, { expiresIn: '1h' });
    res.header('Authorization', `Bearer ${token}`);
    res.cookie('token', token, { httpOnly: true });
    res.json({ token });
  } catch (error) {
    res.status(500).send('Error logging in user');
  }
});

// Get all users (protected)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const users: User[] = await readJSONFile(filePath);
    res.send(users);
  } catch (error) {
    res.status(500).send('Error reading users');
  }
});

// Get user by ID (protected)
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const users: User[] = await readJSONFile(filePath);
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).send('User not found');
    res.send(user);
  } catch (error) {
    res.status(500).send('Error reading users');
  }
});

// Search user by username (protected)
router.get('/search/:username', authenticateToken, async (req: Request, res: Response) => {
  try {
    const users: User[] = await readJSONFile(filePath);
    const user = users.find((u) => u.username === req.params.username);
    if (!user) return res.status(404).send('User not found');
    res.send(user);
  } catch (error) {
    res.status(500).send('Error reading users');
  }
});

// Replace user by ID (protected)
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const token = req.header('Authorization')!.split(' ')[1];
    const currentUser = jwt.decode(token) as JwtPayload;
    let users: User[] = await readJSONFile(filePath);
    const userIndex = users.findIndex((u) => u.id === req.params.id);
    if (userIndex === -1) return res.status(404).send('User not found');

    if (users[userIndex].id !== currentUser.id) {
      return res.status(403).send('You can only edit your own user data');
    }

    const updatedUser: User = { id: req.params.id, ...req.body };

    // Validate the updated user data
    const parsedUser = userSchema.safeParse(updatedUser);
    if (!parsedUser.success) {
      return res.status(400).send(parsedUser.error.errors);
    }

    users[userIndex] = parsedUser.data;
    await writeJSONFile(filePath, users);
    res.send(parsedUser.data);
  } catch (error) {
    res.status(500).send('Error updating user');
  }
});

// Update specific field of a user with specific ID (protected)
router.patch('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const token = req.header('Authorization')!.split(' ')[1];
    const currentUser = jwt.decode(token) as JwtPayload;
    let users: User[] = await readJSONFile(filePath);
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).send('User not found');

    if (user.id !== currentUser.id) {
      return res.status(403).send('You can only edit your own user data');
    }

    const updatedUser = { ...user, ...req.body };

    // Validate the updated user data
    const parsedUser = userSchema.safeParse(updatedUser);
    if (!parsedUser.success) {
      return res.status(400).send(parsedUser.error.errors);
    }

    const userIndex = users.findIndex((u) => u.id === req.params.id);
    users[userIndex] = parsedUser.data;
    await writeJSONFile(filePath, users);
    res.send(parsedUser.data);
  } catch (error) {
    res.status(500).send('Error updating user');
  }
});

// Delete user with specific ID (protected)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const token = req.header('Authorization')!.split(' ')[1];
    const currentUser = jwt.decode(token) as JwtPayload;
    let users: User[] = await readJSONFile(filePath);
    const userIndex = users.findIndex((u) => u.id === req.params.id);
    if (userIndex === -1) return res.status(404).send('User not found');

    if (users[userIndex].id !== currentUser.id) {
      return res.status(403).send('You can only delete your own user data');
    }

    users.splice(userIndex, 1);
    await writeJSONFile(filePath, users);
    res.status(204).send();
  } catch (error) {
    res.status(500).send('Error deleting user');
  }
});

export default router;
