const fs = require('fs');

// Read database file
const data = JSON.parse(fs.readFileSync('db_realtime.txt', 'utf8'));
const users = data.users;

console.log('===========================================');
console.log('USER DENGAN FORMAT LAMA (LEGACY)');
console.log('===========================================\n');

let legacyUsers = [];

Object.keys(users).forEach(uid => {
  const user = users[uid];
  
  // Check for legacy formats
  if (user.santri && typeof user.santri === 'object') {
    legacyUsers.push({
      id: uid,
      name: user.name,
      email: user.email,
      role: user.role,
      format: 'santri (object)',
      data: user.santri
    });
  }
  
  if (user.students && Array.isArray(user.students)) {
    legacyUsers.push({
      id: uid,
      name: user.name,
      email: user.email,
      role: user.role,
      format: 'students (array)',
      data: user.students
    });
  }
});

console.log(`Total user dengan format lama: ${legacyUsers.length}\n`);

legacyUsers.forEach((user, index) => {
  console.log(`${index + 1}. USER: ${user.name} (${user.email})`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Format: ${user.format}`);
  console.log(`   Data:`);
  console.log(JSON.stringify(user.data, null, 4));
  console.log();
});

console.log('===========================================');
console.log('CATATAN');
console.log('===========================================');
console.log('Format ini tidak kompatibel dengan sistem baru yang menggunakan:');
console.log('- studentIds: array of user IDs (untuk orangtua)');
console.log('- parentId: single user ID (untuk santri)');
console.log('\nData ini perlu dimigrasikan ke format baru.');
