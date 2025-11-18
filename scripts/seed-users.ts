import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';

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
const auth = getAuth(app);
const database = getDatabase(app);

// Helper data
const firstNames = [
  'Ahmad', 'Muhammad', 'Abdullah', 'Ali', 'Umar', 'Fatimah', 'Aisyah', 'Khadijah', 'Zahra', 'Maryam',
  'Hasan', 'Husain', 'Ibrahim', 'Ismail', 'Yusuf', 'Zainab', 'Ruqayyah', 'Ummu', 'Hafsah', 'Siti',
  'Abdul', 'Khalid', 'Bilal', 'Salman', 'Hamzah', 'Aminah', 'Safiyyah', 'Sumayyah', 'Asma', 'Hafshah'
];

const lastNames = [
  'Rahman', 'Rahim', 'Hakim', 'Aziz', 'Karim', 'Malik', 'Hadi', 'Nasir', 'Bashir', 'Jamil',
  'Fadil', 'Kamil', 'Latif', 'Majid', 'Rashid', 'Salim', 'Tahir', 'Wahid', 'Zakir', 'Amir',
  'Faris', 'Ghani', 'Habib', 'Idris', 'Jabir', 'Kafi', 'Lutfi', 'Munir', 'Nabil', 'Qasim'
];

const specializations = [
  'Tahfidz Al-Quran',
  'Fiqih',
  'Hadits',
  'Tafsir',
  'Bahasa Arab',
  'Akhlak & Tasawuf',
  'Sejarah Islam',
  'Ushul Fiqh',
  'Ilmu Tajwid',
  'Nahwu & Sharaf'
];

function getRandomName(): string {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

function getRandomPhone(): string {
  return `08${Math.floor(Math.random() * 900000000 + 100000000)}`;
}

function getRandomSpecialization(): string {
  return specializations[Math.floor(Math.random() * specializations.length)];
}

function getRandomEntryYear(): string {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
  return years[Math.floor(Math.random() * years.length)].toString();
}

async function createUstad(index: number) {
  const name = getRandomName();
  const email = `ustad${index}@pesantren.test`;
  const password = 'Password123!';

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Realtime Database
    await set(ref(database, `users/${user.uid}`), {
      id: user.uid,
      name,
      email,
      role: 'ustad',
      phone: getRandomPhone(),
      specialization: getRandomSpecialization(),
      available: true,
      currentClasses: Math.floor(Math.random() * 5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Sign out immediately after creation
    await signOut(auth);

    console.log(`✅ Created Ustad ${index}: ${name} (${email})`);
    return user.uid;
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  Ustad ${index} already exists: ${email}`);
    } else {
      console.error(`❌ Error creating Ustad ${index}:`, error.message);
    }
    return null;
  }
}

async function createSantriWithParent(index: number) {
  const santriName = getRandomName();
  const parentName = getRandomName();
  const santriEmail = `santri${index}@pesantren.test`;
  const parentEmail = `orangtua${index}@pesantren.test`;
  const password = 'Password123!';

  try {
    // Create Santri
    const santriCredential = await createUserWithEmailAndPassword(auth, santriEmail, password);
    const santriUser = santriCredential.user;
    await signOut(auth);

    // Create Parent
    const parentCredential = await createUserWithEmailAndPassword(auth, parentEmail, password);
    const parentUser = parentCredential.user;
    await signOut(auth);

    const entryYear = getRandomEntryYear();
    const statuses = ['active', 'active', 'active', 'inactive'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // Create Santri profile
    await set(ref(database, `users/${santriUser.uid}`), {
      id: santriUser.uid,
      name: santriName,
      email: santriEmail,
      role: 'santri',
      phone: getRandomPhone(),
      entryYear,
      status,
      parentId: parentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create Parent profile
    await set(ref(database, `users/${parentUser.uid}`), {
      id: parentUser.uid,
      name: parentName,
      email: parentEmail,
      role: 'orangtua',
      phone: getRandomPhone(),
      studentIds: [santriUser.uid],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Created Santri ${index}: ${santriName} (${santriEmail})`);
    console.log(`✅ Created Parent ${index}: ${parentName} (${parentEmail})`);

    return {
      santriId: santriUser.uid,
      parentId: parentUser.uid,
    };
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  Santri/Parent ${index} already exists`);
    } else {
      console.error(`❌ Error creating Santri/Parent ${index}:`, error.message);
    }
    return null;
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function seedUsers() {
  console.log('🌱 Starting user seeding...\n');

  // Create 20 Ustad (sequential to avoid rate limiting)
  console.log('📚 Creating 20 Ustad...');
  for (let i = 1; i <= 20; i++) {
    await createUstad(i);
    await delay(500); // Small delay to avoid rate limiting
  }

  console.log('\n👨‍🎓 Creating 60 Santri with Parents...');
  for (let i = 1; i <= 60; i++) {
    await createSantriWithParent(i);
    await delay(500); // Small delay to avoid rate limiting
  }

  console.log('\n✨ Seeding completed!');
  console.log('\n📊 Summary:');
  console.log('   - 20 Ustad accounts created');
  console.log('   - 60 Santri accounts created');
  console.log('   - 60 Orangtua accounts created');
  console.log('   - Total: 140 users\n');
  console.log('🔑 Default password for all accounts: Password123!\n');
  console.log('📧 Email format:');
  console.log('   - Ustad: ustad1@pesantren.test to ustad20@pesantren.test');
  console.log('   - Santri: santri1@pesantren.test to santri60@pesantren.test');
  console.log('   - Orangtua: orangtua1@pesantren.test to orangtua60@pesantren.test');
}

// Run the seeder
seedUsers()
  .then(() => {
    console.log('\n✅ Done! You can now login with any of the created accounts.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
