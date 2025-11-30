import { PoliticalPosition } from './types';

// Map political positions to natural, specific descriptions
export function getPositionDescription(position: PoliticalPosition): string {
  const descriptions: Record<PoliticalPosition, string> = {
    left: 'a socialist',
    'centre-left': 'a centre-left moderate',
    centre: 'a centrist',
    conservative: 'an economic conservative',
    right: 'a national conservative',
    libertarian: 'a libertarian',
    environmentalist: 'an environmentalist',
  };

  return descriptions[position] || position;
}

// Prototypical example figures for each political position
export function getExampleFigures(position: PoliticalPosition): string[] {
  const examples: Record<PoliticalPosition, string[]> = {
    left: ['Jeremy Corbyn', 'Bernie Sanders', 'Alexandria Ocasio-Cortez'],
    'centre-left': ['Tony Blair', 'Barack Obama', 'Keir Starmer'],
    centre: ['Emmanuel Macron', 'Nick Clegg', 'Rory Stewart'],
    conservative: ['Margaret Thatcher', 'Ronald Reagan', 'George Osborne'],
    right: ['Nigel Farage', 'Marine Le Pen', 'Viktor Orbán'],
    libertarian: ['Peter Thiel', 'Rand Paul', 'Milton Friedman'],
    environmentalist: ['Caroline Lucas', 'Greta Thunberg', 'Al Gore'],
  };

  return examples[position] || [];
}
