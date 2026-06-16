import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global setup that runs before all tests.
 *
 * Resets the Notes Wiki data file to a known seed state.
 * This ensures tests always start with predictable data.
 *
 * Set UMBRACO_DATA_PATH env var to point to your Umbraco's App_Data folder.
 * Example: UMBRACO_DATA_PATH=/path/to/umbraco/App_Data
 */
async function globalSetup(config: FullConfig) {
  const umbracoDataPath = process.env.UMBRACO_DATA_PATH;

  if (!umbracoDataPath) {
    console.warn(
      '\n⚠️  UMBRACO_DATA_PATH not set. Skipping data reset.\n' +
      '   Set this to your Umbraco App_Data folder to reset test data before each run.\n' +
      '   Example: UMBRACO_DATA_PATH=/path/to/Umbraco.Web.UI/App_Data\n'
    );
    return;
  }

  const notesWikiDataDir = path.join(umbracoDataPath, 'NotesWiki');
  const targetDataFile = path.join(notesWikiDataDir, 'data.json');
  const seedDataFile = path.join(__dirname, 'test-seed-data.json');

  // Ensure the NotesWiki directory exists
  if (!fs.existsSync(notesWikiDataDir)) {
    fs.mkdirSync(notesWikiDataDir, { recursive: true });
    console.log(`📁 Created NotesWiki data directory: ${notesWikiDataDir}`);
  }

  // Copy seed data to the target location
  const seedData = fs.readFileSync(seedDataFile, 'utf-8');
  fs.writeFileSync(targetDataFile, seedData, 'utf-8');

  console.log(`🌱 Reset Notes Wiki data to seed state: ${targetDataFile}`);
}

export default globalSetup;
