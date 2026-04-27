export interface Schedule {
  id: number;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  location: string;
  target: string;
  summary: string;
  link: string;
}

export interface Benefit {
  id: number;
  name: string;
  category: string;
  summary: string;
  link: string;
}

// Frontend dummy data removed. Replace these arrays with backend responses.
export const schedules: Schedule[] = [];
export const qualifications: Schedule[] = [];
export const allItems: Schedule[] = [...schedules, ...qualifications];

export function getItemById(id: number): Schedule | undefined {
  return allItems.find((item) => item.id === id);
}
