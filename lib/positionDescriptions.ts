import { PoliticalPosition } from './types';

// Map political positions to natural, specific descriptions
export function getPositionDescription(position: PoliticalPosition): string {
  const descriptions: Record<PoliticalPosition, string> = {
    'left': 'a progressive activist',
    'centre-left': 'a social democrat',
    'centre': 'a centrist pragmatist',
    'centre-right': 'a moderate conservative',
    'right': 'a traditional conservative',
    'progressive': 'a progressive reformer',
    'conservative': 'a traditional conservative',
    'libertarian': 'a libertarian',
    'green': 'a green activist',
    'socialist': 'a socialist organizer',
  };

  return descriptions[position] || position;
}
