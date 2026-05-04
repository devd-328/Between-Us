const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");
const fs = require('fs');

const firebaseConfig = {
  apiKey: "AIzaSyCCFK5dLawDm3fOf90hSlestu0KRx7dJA4",
  authDomain: "between-us-fcd44.firebaseapp.com",
  projectId: "between-us-fcd44",
  storageBucket: "between-us-fcd44.firebasestorage.app",
  messagingSenderId: "503538001510",
  appId: "1:503538001510:web:2a7b61eac002d882d7efa7",
  measurementId: "G-RENFHNPFH1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  const questions = JSON.parse(fs.readFileSync('./parsed_questions.json', 'utf-8'));
  const questionsCol = collection(db, "questions");

  console.log(`Seeding ${questions.length} questions to Firestore...`);

  let count = 0;
  for (const q of questions) {
    await addDoc(questionsCol, q);
    count++;
    if (count % 50 === 0) console.log(`Seeded ${count} questions...`);
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(console.error);
