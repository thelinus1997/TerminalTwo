import express, { Request, Response } from 'express';
import { decode, JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { authenticateToken } from '../app';
import { Organization, organizationSchema } from '../schemas/organisationSchema';
import { readJSONFile, writeJSONFile } from '../utils/fileUtils';

const router = express.Router();
const filePath = 'database/organizations.json';

// Get all organizations
router.get('', async (req: Request, res: Response) => {
  try {
    const organizations = await readJSONFile(filePath);
    res.send(organizations);
  } catch (error) {
    res.status(500).send('Error reading organizations');
  }
});

// Get organization by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizations = await readJSONFile(filePath);
    const organization = organizations.find((o: Organization) => o.id === req.params.id);
    if (!organization) return res.status(404).send('Organization not found');
    res.send(organization);
  } catch (error) {
    res.status(500).send('Error reading organizations');
  }
});

// Create new organization (protected)
router.post('', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationReq = organizationSchema.parse(req.body);
    const token = req.header('Authorization')!.split(' ')[1];
    const user = decode(token) as JwtPayload;
    const organizations = await readJSONFile(filePath);
    const newOrganization: Organization = { id: uuidv4(), ...organizationReq, userId: user.id };

    // Validate the new organization data
    const parsedOrganization = organizationSchema.safeParse(newOrganization);
    if (!parsedOrganization.success) {
      return res.status(400).send(parsedOrganization.error.errors);
    }

    organizations.push(parsedOrganization.data);
    await writeJSONFile(filePath, organizations);

    res.status(201).send('Organization created');
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).send(error.errors);
    } else {
      res.status(500).send('Error creating organization');
    }
  }
});

// Update organization (protected)
router.patch('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationReq = organizationSchema.parse(req.body);
    const token = req.header('Authorization')!.split(' ')[1];
    const user = decode(token) as JwtPayload;
    let organizations = await readJSONFile(filePath);
    const organizationIndex = organizations.findIndex(
      (o: Organization) => o.id === req.params.id && o.userId === user.id
    );
    if (organizationIndex === -1) return res.status(404).send('Organization not found');

    organizations[organizationIndex].name = organizationReq.name;

    await writeJSONFile(filePath, organizations);
    res.send(organizations[organizationIndex]);
  } catch (error) {
    res.status(500).send('Error updating organization');
  }
});

// Delete organization (protected)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    let organizations = await readJSONFile(filePath);
    organizations = organizations.filter((o: Organization) => o.id !== req.params.id);
    await writeJSONFile(filePath, organizations);
    res.status(204).send();
  } catch (error) {
    res.status(500).send('Error deleting organization');
  }
});

export default router;
