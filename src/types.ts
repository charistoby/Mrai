export interface Memory {
  pace?: "slow" | "normal";
  [key: string]: any;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ObjectiveQuestion {
  qid: number;
  question: string;
  options: string[];
  topic?: string;
  correct?: string;
  userAnswer?: string;
}

export interface TheoryQuestion {
  qid: number;
  question: string;
  mark?: string;
}

export interface TestData {
  [qid: string]: ObjectiveQuestion | TheoryQuestion;
}

export interface ChatResponse {
  type: "chat" | "quiz" | "theory_quiz";
  reply: string;
  testData?: TestData;
}

export interface SolverResult {
  solved: boolean;
  value?: any;
  explanation?: string;
}
