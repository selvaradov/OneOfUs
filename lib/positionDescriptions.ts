import { PoliticalPosition } from './types';

export type Region = 'UK' | 'US';

// Position descriptions by region
const ukDescriptions: Record<PoliticalPosition, string> = {
  left: 'a socialist',
  'centre-left': 'a centre-left moderate',
  centre: 'a centrist',
  conservative: 'an economic conservative',
  right: 'a national conservative',
  libertarian: 'a libertarian',
  environmentalist: 'an environmentalist',
};

const positionDescriptions: Record<Region | 'default', Record<PoliticalPosition, string>> = {
  UK: ukDescriptions,
  US: {
    left: 'a progressive',
    'centre-left': 'a liberal Democrat',
    centre: 'an independent/moderate',
    conservative: 'a traditional conservative',
    right: 'a MAGA Republican',
    libertarian: 'a libertarian',
    environmentalist: 'a climate activist',
  },
  default: ukDescriptions,
};

// Example figures by region
const ukExampleFigures: Record<PoliticalPosition, string[]> = {
  left: ['Jeremy Corbyn', 'Tony Benn', 'Diane Abbott'],
  'centre-left': ['Tony Blair', 'Keir Starmer', 'David Miliband'],
  centre: ['Nick Clegg', 'Rory Stewart', 'Ed Davey'],
  conservative: ['Margaret Thatcher', 'George Osborne', 'Rishi Sunak'],
  right: ['Nigel Farage', 'Suella Braverman', 'Lee Anderson'],
  libertarian: ['Daniel Hannan', 'Douglas Carswell', 'Steve Baker'],
  environmentalist: ['Caroline Lucas', 'Chris Packham', 'George Monbiot'],
};

const exampleFigures: Record<Region | 'default', Record<PoliticalPosition, string[]>> = {
  UK: ukExampleFigures,
  US: {
    left: ['Bernie Sanders', 'Alexandria Ocasio-Cortez', 'Ilhan Omar'],
    'centre-left': ['Barack Obama', 'Joe Biden', 'Pete Buttigieg'],
    centre: ['Joe Manchin', 'Lisa Murkowski', 'John Kasich'],
    conservative: ['Mitt Romney', 'Paul Ryan', 'Liz Cheney'],
    right: ['Donald Trump', 'Marjorie Taylor Greene', 'Tucker Carlson'],
    libertarian: ['Rand Paul', 'Ron Paul', 'Gary Johnson'],
    environmentalist: ['Al Gore', 'John Kerry', 'Ed Markey'],
  },
  default: ukExampleFigures,
};

/**
 * Get a natural language description for a political position.
 * @param position - The political position
 * @param region - Optional region to get region-specific descriptions
 */
export function getPositionDescription(position: PoliticalPosition, region?: Region): string {
  const regionDescriptions = region
    ? positionDescriptions[region] || positionDescriptions.default
    : positionDescriptions.default;

  return regionDescriptions[position] || position;
}

/**
 * Get example public figures for a political position.
 * @param position - The political position
 * @param region - Optional region to get region-specific examples
 */
export function getExampleFigures(position: PoliticalPosition, region?: Region): string[] {
  const regionExamples = region
    ? exampleFigures[region] || exampleFigures.default
    : exampleFigures.default;

  return regionExamples[position] || [];
}
