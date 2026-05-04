const fs = require('fs');

const raw = fs.readFileSync('raw_questions.txt', 'utf-8');
const lines = raw.split('\n').filter(l => l.trim().length > 0);

const questions = [];
let currentCategory = '';
let currentIntensity = 1;
let currentMood = 'casual';

for (const line of lines) {
  const match = line.match(/^\d+\.\s+(.*)$/);
  if (match) {
    const num = parseInt(line.split('.')[0]);
    
    // Determine category based on index
    if (num <= 50) {
      currentCategory = 'icebreakers';
      currentIntensity = 1;
      currentMood = 'casual';
    } else if (num <= 100) {
      currentCategory = 'funny';
      currentIntensity = 2;
      currentMood = 'funny';
    } else if (num <= 150) {
      currentCategory = 'deep';
      currentIntensity = 4;
      currentMood = 'deep';
    } else if (num <= 200) {
      currentCategory = 'relationship';
      currentIntensity = 5;
      currentMood = 'romantic';
    } else if (num <= 250) {
      currentCategory = 'hypothetical';
      currentIntensity = 3;
      currentMood = 'casual';
    } else if (num <= 300) {
      currentCategory = 'late-night';
      currentIntensity = 5;
      currentMood = 'deep';
    }

    questions.push({
      text: match[1].trim(),
      category: currentCategory,
      intensity: currentIntensity,
      mood: currentMood
    });
  }
}

fs.writeFileSync('parsed_questions.json', JSON.stringify(questions, null, 2));
console.log(`Parsed ${questions.length} questions.`);
