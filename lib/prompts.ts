import { Prompt } from './types';
import promptsData from '@/data/scenarios.json';

export function getAllPrompts(): Prompt[] {
  return promptsData as Prompt[];
}

export function getRandomPrompt(): Prompt {
  const prompts = getAllPrompts();
  const randomIndex = Math.floor(Math.random() * prompts.length);
  return prompts[randomIndex];
}

export function getPromptById(id: string): Prompt | undefined {
  const prompts = getAllPrompts();
  return prompts.find((prompt) => prompt.id === id);
}

export function getPromptsByCategory(category: string): Prompt[] {
  const prompts = getAllPrompts();
  return prompts.filter((prompt) => prompt.category === category);
}
