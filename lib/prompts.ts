import { Prompt } from './types';
import { Region } from './positionDescriptions';
import promptsData from '@/data/scenarios.json';

export function getAllPrompts(): Prompt[] {
  return promptsData as Prompt[];
}

export function getRandomPrompt(): Prompt {
  const prompts = getAllPrompts();
  const randomIndex = Math.floor(Math.random() * prompts.length);
  return prompts[randomIndex];
}

/**
 * Get a random prompt filtered by user's country.
 * - UK users get UK/Scotland/Wales scenarios
 * - US users get US scenarios
 * - Other/unknown users get all scenarios randomly
 */
export function getRandomPromptForRegion(userCountry?: string): Prompt {
  const prompts = getAllPrompts();

  let filteredPrompts: Prompt[];

  if (userCountry === 'UK') {
    // UK users get UK, Scotland, and Wales scenarios
    filteredPrompts = prompts.filter((p) => {
      const region = p.metadata?.region;
      return region === 'UK' || region === 'Scotland' || region === 'Wales' || !region;
    });
  } else if (userCountry === 'US') {
    // US users get US scenarios only
    filteredPrompts = prompts.filter((p) => p.metadata?.region === 'US');
  } else {
    // Other or unspecified: sample from all scenarios
    filteredPrompts = prompts;
  }

  // Fallback to all prompts if no matches (shouldn't happen)
  if (filteredPrompts.length === 0) {
    filteredPrompts = prompts;
  }

  const randomIndex = Math.floor(Math.random() * filteredPrompts.length);
  return filteredPrompts[randomIndex];
}

/**
 * Get the display region for a prompt (used for position descriptions).
 * Maps Scotland/Wales to UK for position description purposes.
 */
export function getPromptRegion(prompt: Prompt): Region | undefined {
  const region = prompt.metadata?.region;
  if (region === 'UK' || region === 'Scotland' || region === 'Wales') {
    return 'UK';
  }
  if (region === 'US') {
    return 'US';
  }
  return undefined;
}

export function getPromptById(id: string): Prompt | undefined {
  const prompts = getAllPrompts();
  return prompts.find((prompt) => prompt.id === id);
}

export function getPromptsByCategory(category: string): Prompt[] {
  const prompts = getAllPrompts();
  return prompts.filter((prompt) => prompt.category === category);
}
