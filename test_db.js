const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs } = require("firebase/firestore");
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

async function test() {
  try {
    const questionsCol = collection(db, "questions");
    console.log("Testing connection...");
    await addDoc(questionsCol, { test: "test" });
    console.log("Success!");
    process.exit(0);
  } catch (err) {
    console.error("Detailed Error:", err);
    process.exit(1);
  }
}

test();
