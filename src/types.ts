import { Timestamp } from 'firebase/firestore';

export interface BrewTiming {
  step: string;
  time: string;
  waterWeight?: string;
}

export interface BrewLog {
  id?: string;
  userId: string;
  date: Timestamp;
  beanName: string;
  roaster?: string;
  grinder?: string;
  grindSize?: string;
  recipeId?: string;
  coffeeWeight: number;
  waterWeight: number;
  waterTemp?: string;
  ratio?: string;
  timings?: BrewTiming[];
  notes?: string;
  rating?: number;
}

export interface Recipe {
  id?: string;
  userId?: string;
  title: string;
  source: string;
  description: string;
  coffeeWeight: number;
  waterWeight: number;
  ratio: string;
  steps: string[];
  timings?: BrewTiming[];
  url?: string;
  isSaved?: boolean;
}

export interface CoffeeBean {
  id?: string;
  userId: string;
  name: string;
  roaster: string;
  roastDate?: string;
  isArchived?: boolean;
  price?: string;
  weight?: string;
  flavorProfile?: string[];
  url?: string;
  notes?: string;
  rating?: number;
}

export interface Grinder {
  id?: string;
  userId: string;
  name: string;
  brand?: string;
  type?: 'Manual' | 'Electric';
  notes?: string;
}

export type ColorScheme = 'default' | 'catppuccin' | 'rose-pine' | 'gruvbox' | 'everforest';

export interface UserSettings {
  userId: string;
  tempUnit: 'C' | 'F';
  defaultGrinderId?: string;
  theme: 'light' | 'dark' | 'system';
  colorScheme: ColorScheme;
}
