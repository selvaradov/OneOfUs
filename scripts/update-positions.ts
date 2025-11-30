#!/usr/bin/env node
/**
 * Script to update political positions in scenarios.json
 * Maps old position names to new ones:
 * - 'social-democrat' → 'centre-left'
 * - 'centre-right' → 'conservative'
 * - 'trade-unionist' → 'left' (closest ideological match)
 */

import * as fs from 'fs';
import * as path from 'path';
import { Prompt } from '../lib/types';

const POSITION_MAPPING: Record<string, string> = {
  'social-democrat': 'centre-left',
  'centre-right': 'conservative',
  'trade-unionist': 'left',
};

const scenariosPath = path.join(__dirname, '..', 'data', 'scenarios.json');

// Read the scenarios file
const scenariosData = JSON.parse(fs.readFileSync(scenariosPath, 'utf-8')) as Prompt[];

let updateCount = 0;

// Update positions in each scenario
scenariosData.forEach((scenario) => {
  if (scenario.positions && Array.isArray(scenario.positions)) {
    scenario.positions = scenario.positions.map((position) => {
      const posStr = position as string;
      if (posStr in POSITION_MAPPING) {
        console.log(
          `Updating "${posStr}" to "${POSITION_MAPPING[posStr]}" in scenario ${scenario.id}`
        );
        updateCount++;
        return POSITION_MAPPING[posStr] as (typeof scenario.positions)[number];
      }
      return position;
    });
  }
});

// Write back to file
fs.writeFileSync(scenariosPath, JSON.stringify(scenariosData, null, 2) + '\n');

console.log(`\nUpdated ${updateCount} position references in scenarios.json`);
