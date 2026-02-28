export interface Transaction {
  id: string;
  type: 'spend' | 'add';
  amount: number;
  note: string;
  date: string;
}

export interface Break {
  start: string;
  end: string;
  name?: string;
}

export interface MealPreset {
  id: string;
  name: string;
  amount: number;
}

export interface BudgetSettings {
  total: number;
  startDate: string;
  endDate: string;
  mealsPerWeek: number;
  semester: string;
  breaks: Break[];
}

export interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  breaks: Break[];
}
