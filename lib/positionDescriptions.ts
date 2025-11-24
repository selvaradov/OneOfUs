import { PoliticalPosition } from './types';

// Map political positions to natural, specific descriptions
export function getPositionDescription(position: PoliticalPosition): string {
  const descriptions: Record<PoliticalPosition, string> = {
    'left': 'a left-wing progressive',
    'centre-left': 'a social democrat',
    'centre': 'a centrist',
    'centre-right': 'a moderate conservative',
    'right': 'a national conservative',
    'progressive': 'a progressive',
    'conservative': 'a traditional conservative',
    'libertarian': 'a libertarian',
    'green': 'an environmentalist',
    'socialist': 'a socialist',
  };

  return descriptions[position] || position;
}
