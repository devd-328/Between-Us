export interface Question {
  id: string;
  text: string;
  category: string;
  displayCategory?: string;
  intensity: number;
}

export const DUMMY_QUESTIONS: Question[] = [
  { id: "q1", text: "What's the most beautiful thing you've seen recently?", category: "ICEBREAKER", intensity: 1 },
  { id: "q2", text: "What is a controversial opinion you have about food?", category: "FUN", intensity: 1 },
  { id: "q3", text: "What's a hobby you've always wanted to pick up but never did?", category: "CURIOSITY", intensity: 2 },
  { id: "q4", text: "When was the last time you felt truly understood?", category: "DEEP", intensity: 4 },
  { id: "q5", text: "What's a version of the future you've had to mourn?", category: "DEEP", intensity: 5 },
  { id: "q6", text: "If you could redo one day in your life, what would it be?", category: "REFLECTION", intensity: 4 },
  { id: "q7", text: "What part of yourself do you hide from the world?", category: "VULNERABLE", intensity: 5 },
  { id: "q8", text: "What's the best compliment you've ever received?", category: "MEMORY", intensity: 2 },
  { id: "q9", text: "If our friendship was a movie, what genre would it be?", category: "US", intensity: 2 },
  { id: "q10", text: "What do you think is my greatest strength?", category: "US", intensity: 3 },
];
