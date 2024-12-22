import { promises as fs } from 'fs';
import path from 'path';

const basePath = path.resolve(__dirname, '../../src');

export const readJSONFile = async (filePath: string): Promise<any> => {
  try {
    const data = await fs.readFile(path.join(basePath, filePath), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

export const writeJSONFile = async (filePath: string, data: any): Promise<void> => {
  try {
    await fs.writeFile(path.join(basePath, filePath), JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
};
