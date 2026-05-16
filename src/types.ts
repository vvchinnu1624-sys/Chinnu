
export enum Scene {
  PASSWORD = 'password',
  TERMS = 'terms',
  VIDEO = 'video',
  CAKE_INTERACTIVE = 'cake_interactive',
  FEEDING = 'feeding',
  ENDING = 'ending'
}

export interface OpenWhenTicket {
  id: string;
  title: string;
  emoji: string;
  content: string;
}

export interface Mistake {
  id: string;
  name: string;
  text: string;
  date: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface StorySection {
  id: string;
  title: string;
  content: string;
  date?: string;
}
