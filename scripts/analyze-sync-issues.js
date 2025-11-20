const fs = require('fs');

// Read database file
const data = JSON.parse(fs.readFileSync('db_realtime.txt', 'utf8'));
const users = data.users;
const classes = data.classes;

console.log('===========================================');
console.log('ANALISIS MASALAH SINKRONISASI DATABASE');
console.log('===========================================\n');

// 1. Analisis format data orangtua
console.log('1. ANALISIS FORMAT DATA ORANGTUA');
console.log('-------------------------------------------');
let orangtuaWithStudents = 0;
let orangtuaWithSantri = 0;
let orangtuaWithStudentIds = 0;
let orangtuaWithNoChildren = 0;
let orangtuaDetails = [];

Object.keys(users).forEach(uid => {
  const user = users[uid];
  if (user.role === 'orangtua') {
    let detail = { id: uid, name: user.name, email: user.email, formats: [] };
    
    if (user.students) {
      orangtuaWithStudents++;
      detail.formats.push(`students (${Array.isArray(user.students) ? user.students.length : 'object'})`);
    }
    if (user.santri) {
      orangtuaWithSantri++;
      detail.formats.push(`santri (${typeof user.santri === 'object' ? Object.keys(user.santri).length : 'unknown'})`);
    }
    if (user.studentIds) {
      orangtuaWithStudentIds++;
      detail.formats.push(`studentIds (${Array.isArray(user.studentIds) ? user.studentIds.length : 'unknown'})`);
    }
    
    if (!user.students && !user.santri && !user.studentIds) {
      orangtuaWithNoChildren++;
      detail.formats.push('NONE');
    }
    
    orangtuaDetails.push(detail);
  }
});

console.log(`Total Orangtua: ${orangtuaDetails.length}`);
console.log(`- Menggunakan field 'students': ${orangtuaWithStudents}`);
console.log(`- Menggunakan field 'santri': ${orangtuaWithSantri}`);
console.log(`- Menggunakan field 'studentIds': ${orangtuaWithStudentIds}`);
console.log(`- Tidak memiliki data anak: ${orangtuaWithNoChildren}\n`);

// Show problematic cases
console.log('KASUS BERMASALAH (format tidak konsisten):');
orangtuaDetails.forEach(detail => {
  if (detail.formats.length > 1) {
    console.log(`⚠️  ${detail.name} (${detail.id})`);
    console.log(`   Memiliki multiple format: ${detail.formats.join(', ')}`);
  }
});
console.log();

// 2. Analisis user santri
console.log('2. ANALISIS USER DENGAN ROLE SANTRI');
console.log('-------------------------------------------');
let santriUsers = [];
let santriWithoutParent = [];
let santriWithParent = [];
let parentIdNotFound = [];

Object.keys(users).forEach(uid => {
  const user = users[uid];
  if (user.role === 'santri') {
    santriUsers.push({ id: uid, name: user.name, parentId: user.parentId });
    
    if (user.parentId) {
      santriWithParent.push({ id: uid, name: user.name, parentId: user.parentId });
      
      // Check if parent exists
      if (!users[user.parentId]) {
        parentIdNotFound.push({ id: uid, name: user.name, parentId: user.parentId });
      }
    } else {
      santriWithoutParent.push({ id: uid, name: user.name });
    }
  }
});

console.log(`Total user dengan role 'santri': ${santriUsers.length}`);
console.log(`- Memiliki parentId: ${santriWithParent.length}`);
console.log(`- Tidak memiliki parentId: ${santriWithoutParent.length}`);
console.log(`- ParentId tidak ditemukan di database: ${parentIdNotFound.length}\n`);

if (santriWithoutParent.length > 0) {
  console.log('SANTRI TANPA PARENT ID:');
  santriWithoutParent.forEach(s => {
    console.log(`❌ ${s.name} (${s.id})`);
  });
  console.log();
}

if (parentIdNotFound.length > 0) {
  console.log('SANTRI DENGAN PARENT ID TIDAK VALID:');
  parentIdNotFound.forEach(s => {
    console.log(`❌ ${s.name} (${s.id}) -> Parent ${s.parentId} not found`);
  });
  console.log();
}

// 3. Validasi relasi bidirectional
console.log('3. VALIDASI RELASI PARENT-CHILD (BIDIRECTIONAL)');
console.log('-------------------------------------------');
let missingBackReference = [];
let mismatchedReferences = [];

santriWithParent.forEach(santri => {
  const parent = users[santri.parentId];
  if (parent) {
    let found = false;
    
    // Check in studentIds array
    if (parent.studentIds && Array.isArray(parent.studentIds)) {
      found = parent.studentIds.includes(santri.id);
    }
    
    // Check in santri object
    if (!found && parent.santri && typeof parent.santri === 'object') {
      found = !!parent.santri[santri.id];
    }
    
    // Check in students array
    if (!found && parent.students && Array.isArray(parent.students)) {
      // Students array biasanya tidak memiliki ID reference
      found = true; // Assume it's there for legacy format
    }
    
    if (!found) {
      missingBackReference.push({
        santri: santri.name,
        santriId: santri.id,
        parent: parent.name,
        parentId: parent.id
      });
    }
  }
});

console.log(`Santri dengan parent yang valid: ${santriWithParent.length}`);
console.log(`Relasi tidak sinkron (parent tidak referensi balik): ${missingBackReference.length}\n`);

if (missingBackReference.length > 0) {
  console.log('RELASI TIDAK SINKRON:');
  missingBackReference.forEach(rel => {
    console.log(`❌ Santri: ${rel.santri} (${rel.santriId})`);
    console.log(`   Parent: ${rel.parent} (${rel.parentId})`);
    console.log(`   Parent tidak memiliki referensi balik ke santri ini\n`);
  });
}

// 4. Analisis Classes
console.log('4. ANALISIS CLASSES DAN STUDENT ENROLLMENT');
console.log('-------------------------------------------');
let totalClasses = 0;
let classesWithStudents = 0;
let invalidStudentRefs = [];

if (classes) {
  Object.keys(classes).forEach(classId => {
    const classData = classes[classId];
    totalClasses++;
    
    if (classData.studentIds) {
      classesWithStudents++;
      
      // Check if all student IDs are valid
      Object.keys(classData.studentIds).forEach(studentId => {
        if (!users[studentId]) {
          invalidStudentRefs.push({
            classId: classId,
            className: classData.name,
            studentId: studentId
          });
        } else if (users[studentId].role !== 'santri') {
          invalidStudentRefs.push({
            classId: classId,
            className: classData.name,
            studentId: studentId,
            issue: `User role is '${users[studentId].role}', not 'santri'`
          });
        }
      });
    }
  });
}

console.log(`Total classes: ${totalClasses}`);
console.log(`Classes dengan studentIds: ${classesWithStudents}`);
console.log(`Invalid student references di classes: ${invalidStudentRefs.length}\n`);

if (invalidStudentRefs.length > 0) {
  console.log('STUDENT REFERENCES TIDAK VALID DI CLASSES:');
  invalidStudentRefs.forEach(ref => {
    console.log(`❌ Class: ${ref.className} (${ref.classId})`);
    console.log(`   Student ID: ${ref.studentId}`);
    if (ref.issue) {
      console.log(`   Issue: ${ref.issue}`);
    } else {
      console.log(`   Issue: User not found`);
    }
    console.log();
  });
}

// 5. Summary dan Rekomendasi
console.log('===========================================');
console.log('RINGKASAN MASALAH');
console.log('===========================================\n');

let issueCount = 0;

if (orangtuaWithStudents > 0 || orangtuaWithSantri > 0) {
  issueCount++;
  console.log(`${issueCount}. INKONSISTENSI FORMAT DATA ORANGTUA`);
  console.log(`   - ${orangtuaWithStudents} orangtua menggunakan format 'students' (array)`);
  console.log(`   - ${orangtuaWithSantri} orangtua menggunakan format 'santri' (object)`);
  console.log(`   - ${orangtuaWithStudentIds} orangtua menggunakan format 'studentIds' (array)`);
  console.log(`   Rekomendasi: Standardisasi ke format 'studentIds' (array of UIDs)\n`);
}

if (santriWithoutParent.length > 0) {
  issueCount++;
  console.log(`${issueCount}. SANTRI TANPA PARENT ID`);
  console.log(`   - ${santriWithoutParent.length} santri tidak memiliki parentId`);
  console.log(`   Rekomendasi: Tambahkan parentId untuk setiap santri\n`);
}

if (parentIdNotFound.length > 0) {
  issueCount++;
  console.log(`${issueCount}. PARENT ID TIDAK VALID`);
  console.log(`   - ${parentIdNotFound.length} santri memiliki parentId yang tidak ada`);
  console.log(`   Rekomendasi: Perbaiki atau hapus referensi yang invalid\n`);
}

if (missingBackReference.length > 0) {
  issueCount++;
  console.log(`${issueCount}. RELASI TIDAK SINKRON`);
  console.log(`   - ${missingBackReference.length} santri tidak direferensi balik oleh parent`);
  console.log(`   Rekomendasi: Sinkronkan relasi bidirectional\n`);
}

if (invalidStudentRefs.length > 0) {
  issueCount++;
  console.log(`${issueCount}. STUDENT REFERENCES TIDAK VALID DI CLASSES`);
  console.log(`   - ${invalidStudentRefs.length} referensi student tidak valid`);
  console.log(`   Rekomendasi: Hapus atau perbaiki referensi yang invalid\n`);
}

if (issueCount === 0) {
  console.log('✅ Tidak ditemukan masalah sinkronisasi!\n');
} else {
  console.log(`⚠️  Total ${issueCount} kategori masalah ditemukan\n`);
}

console.log('===========================================');
console.log('SOLUSI YANG DISARANKAN');
console.log('===========================================\n');

console.log('1. MIGRASI DATA KE FORMAT STANDAR');
console.log('   - Gunakan format "studentIds" (array of user IDs) untuk orangtua');
console.log('   - Gunakan format "parentId" (single user ID) untuk santri');
console.log('   - Hapus format lama "students" dan "santri"\n');

console.log('2. PERBAIKI RELASI BIDIRECTIONAL');
console.log('   - Pastikan setiap santri memiliki parentId yang valid');
console.log('   - Pastikan setiap parent memiliki studentIds yang valid');
console.log('   - Validasi dua arah (parent -> child dan child -> parent)\n');

console.log('3. CLEANUP CLASSES');
console.log('   - Hapus student references yang tidak valid');
console.log('   - Pastikan semua studentIds di class adalah user dengan role "santri"\n');

console.log('4. BUAT MIGRATION SCRIPT');
console.log('   - Script untuk migrate data lama ke format baru');
console.log('   - Script untuk validasi dan fix relasi broken');
console.log('   - Backup data sebelum migration\n');
