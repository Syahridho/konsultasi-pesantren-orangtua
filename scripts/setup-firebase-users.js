// This script can be used to set up test users in Firebase
// Run with: node scripts/setup-firebase-users.js

const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");
const { getDatabase, ref, set } = require("firebase/database");

// Firebase configuration - should match your .env.local
const firebaseConfig = {
  apiKey: "AIzaSyAYsEGg_ck46zY07gxXaX6_m50bycBMkrg",
  authDomain: "pam-s4.firebaseapp.com",
  databaseURL:
    "https://pam-s4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pam-s4",
  storageBucket: "pam-s4.firebasestorage.app",
  messagingSenderId: "137824683720",
  appId: "1:137824683720:web:5dd807d5a0d2e02f73c7fd",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Test users to create
const testUsers = [
  {
    email: "admin@app.com",
    password: "password123",
    name: "Admin Utama",
    role: "admin",
  },
  {
    email: "ustad@app.com",
    password: "password123",
    name: "Ustad Budi",
    role: "ustad",
  },
  {
    email: "parent@app.com",
    password: "password123",
    name: "Orang Tua Sinta",
    role: "orangtua",
  },
];

async function createTestUsers() {
  console.log("Creating test users in Firebase...");

  for (const user of testUsers) {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password
      );

      const firebaseUser = userCredential.user;

      // Store additional user data in Realtime Database
      await set(ref(database, `users/${firebaseUser.uid}`), {
        name: user.name,
        role: user.role,
        email: user.email,
        createdAt: new Date().toISOString(),
      });

      console.log(`✅ Created user: ${user.email} with role: ${user.role}`);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        console.log(`⚠️  User ${user.email} already exists`);
      } else {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
      }
    }
  }

  console.log(
    "\nSetup complete! You can now test login with these credentials:"
  );
  console.log("Admin: admin@app.com / password123");
  console.log("Ustad: ustad@app.com / password123");
  console.log("Parent: parent@app.com / password123");
}

// Run the setup
createTestUsers().catch(console.error);
