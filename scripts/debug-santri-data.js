// Debug script to check Firebase data structure
// Run with: node scripts/debug-santri-data.js

const { initializeApp } = require("firebase/app");
const { getDatabase, ref, get } = require("firebase/database");
require("dotenv").config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function debugSantriData() {
  try {
    console.log("=== DEBUGGING SANTRI DATA ===");

    // Get all users
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) {
      console.log("❌ No users found in database");
      return;
    }

    const allUsers = usersSnapshot.val();
    console.log(`✅ Found ${Object.keys(allUsers).length} users`);

    // Count users by role
    const roleCounts = {};
    let orangtuaWithSantri = 0;
    let totalSantriCount = 0;

    Object.keys(allUsers).forEach((userId) => {
      const user = allUsers[userId];
      const role = user.role || "unknown";
      roleCounts[role] = (roleCounts[role] || 0) + 1;

      if (role === "orangtua") {
        console.log(`\n👨‍👩‍👧‍👦 ORANGTUA: ${user.name} (${userId})`);
        console.log(`   Email: ${user.email}`);

        if (user.santri) {
          orangtuaWithSantri++;
          const santriKeys = Object.keys(user.santri);
          console.log(
            `   ✅ Has ${santriKeys.length} santri: ${santriKeys.join(", ")}`
          );

          // Show each santri details
          santriKeys.forEach((santriId) => {
            const santri = user.santri[santriId];
            totalSantriCount++;
            console.log(`      👶 SANTRI: ${santri.name} (${santriId})`);
            console.log(`         NIS: ${santri.nis || "N/A"}`);
            console.log(
              `         Gender: ${
                santri.gender || santri.jenisKelamin || "N/A"
              }`
            );
            console.log(
              `         Tahun Daftar: ${santri.tahunDaftar || "N/A"}`
            );
          });
        } else {
          console.log(`   ❌ No santri data found`);
        }
      }
    });

    console.log("\n=== SUMMARY ===");
    console.log("Users by role:", roleCounts);
    console.log(`Orangtua with santri: ${orangtuaWithSantri}`);
    console.log(`Total santri count: ${totalSantriCount}`);

    // Check for admin users
    const adminUsers = Object.keys(allUsers).filter(
      (userId) => allUsers[userId].role === "admin"
    );

    if (adminUsers.length > 0) {
      console.log("\n🔑 ADMIN USERS:");
      adminUsers.forEach((userId) => {
        const admin = allUsers[userId];
        console.log(`   ${admin.name} (${userId}) - ${admin.email}`);
      });
    } else {
      console.log("\n❌ NO ADMIN USERS FOUND");
    }
  } catch (error) {
    console.error("❌ Error debugging santri data:", error);
  }
}

// Run the debug function
debugSantriData()
  .then(() => {
    console.log("\n=== DEBUG COMPLETE ===");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Debug script failed:", error);
    process.exit(1);
  });
