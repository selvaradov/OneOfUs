import { PoliticalPosition } from './types';

// Map political positions to natural, specific descriptions
export function getPositionDescription(position: PoliticalPosition): string {
  const descriptions: Record<PoliticalPosition, string> = {
    left: 'a left-wing progressive',
    'social-democrat': 'a social democrat',
    centre: 'a centrist',
    'centre-right': 'a moderate conservative',
    right: 'a nationalist conservative',
    conservative: 'a traditional conservative',
    libertarian: 'a libertarian',
    environmentalist: 'an environmentalist',
    'trade-unionist': 'a trade unionist',
  };

  return descriptions[position] || position;
}

// Prototypical example figures for each political position (mix of UK/US/global)
export function getExampleFigures(position: PoliticalPosition): string[] {
  const examples: Record<PoliticalPosition, string[]> = {
    left: ['Jeremy Corbyn', 'Noam Chomsky', 'Alexandria Ocasio-Cortez'],
    'social-democrat': ['Barack Obama', 'Tony Blair', 'Keir Starmer'],
    centre: ['Emmanuel Macron', 'Nick Clegg', 'Rory Stewart'],
    'centre-right': ['David Cameron', 'Angela Merkel', 'Theresa May'],
    right: ['Nigel Farage', 'Donald Trump', 'Marine Le Pen'],
    conservative: ['Margaret Thatcher', 'Ronald Reagan', 'Jacob Rees-Mogg'],
    libertarian: ['Liz Truss', 'Milton Friedman', 'Elon Musk'],
    environmentalist: ['Caroline Lucas', 'Greta Thunberg', 'Al Gore'],
    'trade-unionist': ['Tony Benn', 'Mick Lynch', 'Bob Crow'],
  };

  return examples[position] || [];
}
