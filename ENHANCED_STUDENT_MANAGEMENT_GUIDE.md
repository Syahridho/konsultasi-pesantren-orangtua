# Enhanced Student Management System Guide

## Overview

Sistem manajemen santri yang ditingkatkan dengan hubungan orang tua-siswa yang robust, mendukung struktur data yang tidak konsisten, dan menyediakan CRUD operations yang komprehensif dengan role-based access control.

## Fitur Utama

### 1. Parent-Student Relationship yang Robust

- Setiap santri WAJIB terhubung dengan akun orang tua yang ada
- Validasi otomatis untuk memastikan integritas data
- Mencegah orphaned student records
- Support untuk multiple students per parent

### 2. Data Structure Normalization

- Otomatis handle kedua format data:
  - Object format: `santri: { "studentId": { ... } }`
  - Array format: `students: [ { ... }, { ... } ]`
- Normalisasi data saat pengambilan dan penyimpanan
- Metadata tracking untuk source format

### 3. Role-Based Access Control

- **Admin**: Akses penuh ke semua data santri dan orang tua
- **Ustad**: Akses ke semua data santri untuk keperluan mengajar
- **Orang Tua**: Hanya akses ke data santri miliknya sendiri

### 4. Comprehensive CRUD Operations

- **Create**: Tambah santri baru dengan parent selection
- **Read**: View detail santri dengan informasi orang tua
- **Update**: Edit data santri dengan validasi
- **Delete**: Hapus santri dengan konfirmasi

### 5. Enhanced Validation

- Input validation dengan Zod schema
- Parent existence validation
- Data integrity checks
- Indonesian error messages

## Struktur Data

### User Data Structure

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "ustad" | "orangtua";
  createdAt: string;
  // For orang tua role
  santri?: { [studentId: string]: StudentData }; // Object format
  students?: StudentData[]; // Array format
}

interface StudentData {
  name: string;
  nis: string;
  gender: "L" | "P";
  tempatLahir: string;
  tanggalLahir: string;
  tahunDaftar: string;
  createdAt?: string;
}
```

### Normalized Student Data

```typescript
interface NormalizedSantri {
  id: string;
  userId: string; // Parent ID
  name: string;
  nis: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  tahunDaftar: string;
  createdAt: string;
  orangTuaId: string;
  orangTuaName: string;
  orangTuaEmail: string;
  orangTuaPhone: string;
  dataSource: "object" | "array"; // Track original format
}
```

## API Endpoints

### Enhanced Santri API: `/api/santri/enhanced`

#### GET - Fetch All Santri

```typescript
// Request
GET /api/santri/enhanced

// Response (200)
{
  "santriList": NormalizedSantri[],
  "parents": Parent[],
  "debug": {
    "totalUsers": number,
    "userRoles": { [userId: string]: string },
    "orangtuaCount": number,
    "totalSantriCount": number,
    "returnedSantriCount": number,
    "currentUserRole": string
  }
}

// Response (401)
{ "error": "Unauthorized" }

// Response (404)
{ "error": "User not found" }
```

#### POST - Create New Santri

```typescript
// Request
POST /api/santri/enhanced
{
  "name": string,
  "nis": string,
  "gender": "L" | "P",
  "tempatLahir": string,
  "tanggalLahir": string,
  "tahunDaftar": string,
  "orangTuaId": string
}

// Response (200)
{
  "message": "Santri berhasil ditambahkan",
  "santriId": string,
  "santriData": NormalizedSantri
}

// Response (400)
{
  "error": "Validasi gagal",
  "details": ZodIssue[]
}

// Response (404)
{ "error": "Orang tua tidak ditemukan" }
```

#### PUT - Update Santri

```typescript
// Request
PUT /api/santri/enhanced?id={santriId}&orangTuaId={orangTuaId}
{
  "name"?: string,
  "nis"?: string,
  "gender"?: "L" | "P",
  "tempatLahir"?: string,
  "tanggalLahir"?: string,
  "tahunDaftar"?: string
}

// Response (200)
{
  "message": "Data santri berhasil diperbarui",
  "santriId": string,
  "updateData": Partial<StudentData>
}
```

#### DELETE - Delete Santri

```typescript
// Request
DELETE /api/santri/enhanced?id={santriId}&orangTuaId={orangTuaId}

// Response (200)
{
  "message": "Santri berhasil dihapus",
  "santriId": string
}
```

## Frontend Components

### Enhanced Dashboard: `/dashboard/santri/enhanced`

- **Features**:

  - Search functionality (nama, NIS, orang tua)
  - Parent selection dropdown untuk create santri
  - Modal-based CRUD operations
  - View, Edit, Delete actions
  - Certificate generation
  - Responsive design
  - Indonesian language support

- **Role-based UI**:
  - Admin/Ustad: Full CRUD access
  - Orang Tua: Read-only access untuk santri miliknya

### Component Structure

```typescript
// Main Component
EnhancedSantriPage -
  // Sub-components
  AddSantriModal -
  EditSantriModal -
  ViewSantriModal -
  ParentSelector -
  CertificateGenerator;
```

## Implementation Details

### 1. Data Normalization Function

```typescript
function normalizeStudentData(user: any) {
  const students: any[] = [];

  if (user.students && Array.isArray(user.students)) {
    // Handle array format
    user.students.forEach((student: any, index: number) => {
      students.push({
        id: `array-${index}`,
        ...student,
        _source: "array",
      });
    });
  } else if (user.santri && typeof user.santri === "object") {
    // Handle object format
    Object.keys(user.santri).forEach((studentId) => {
      students.push({
        id: studentId,
        ...user.santri[studentId],
        _source: "object",
      });
    });
  }

  return students;
}
```

### 2. Validation Schemas

```typescript
const createSantriSchema = z.object({
  name: z.string().min(1, "Nama santri wajib diisi"),
  nis: z.string().min(1, "NIS wajib diisi"),
  gender: z.enum(["L", "P"], { message: "Jenis kelamin harus L atau P" }),
  tempatLahir: z.string().min(1, "Tempat lahir wajib diisi"),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  tahunDaftar: z.string().min(1, "Tahun daftar wajib diisi"),
  orangTuaId: z.string().min(1, "ID orang tua wajib dipilih"),
});
```

### 3. Role-Based Access Control

```typescript
// API Level
if (userData.role === "admin" || userData.role === "ustad") {
  // Access all students
} else if (userData.role === "orangtua") {
  // Access only own students
}

// Frontend Level
{
  session?.user.role === "admin" || session?.user.role === "ustad" ? (
    <EditButton />
  ) : null;
}
```

## Security Features

### 1. Authentication & Authorization

- Session-based authentication dengan NextAuth
- Role-based access control
- Parent-child relationship validation

### 2. Data Integrity

- Prevent orphaned student records
- Parent existence validation
- Data normalization untuk consistency

### 3. Input Validation

- Zod schema validation
- Sanitization semua input
- Indonesian error messages

## Testing Procedures

### 1. Unit Testing

```typescript
// Test data normalization
describe("normalizeStudentData", () => {
  it("should handle array format", () => {
    // Test array format
  });

  it("should handle object format", () => {
    // Test object format
  });
});

// Test validation
describe("createSantriSchema", () => {
  it("should validate correct data", () => {
    // Test valid input
  });

  it("should reject invalid data", () => {
    // Test invalid input
  });
});
```

### 2. Integration Testing

```typescript
// Test API endpoints
describe("/api/santri/enhanced", () => {
  it("GET should return santri list", async () => {
    // Test GET endpoint
  });

  it("POST should create new santri", async () => {
    // Test POST endpoint
  });
});
```

### 3. E2E Testing

```typescript
// Test user workflows
describe("Santri Management", () => {
  it("Admin can manage all santri", () => {
    // Test admin workflow
  });

  it("Orang tua can only view own santri", () => {
    // Test orang tua workflow
  });
});
```

## Deployment & Monitoring

### 1. Environment Setup

```bash
# Required environment variables
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

### 2. Monitoring

- API response time monitoring
- Error rate tracking
- Data integrity checks
- User activity logging

### 3. Logging

```typescript
// Structured logging
console.log("[ENHANCED SANTRI API] Processing users to find santri data...");
console.log("[ENHANCED SANTRI PAGE] Session found:", {
  userId: session.user.id,
  role: session.user.role,
});
```

## Troubleshooting

### Common Issues

#### 1. Data Not Loading

**Symptoms**: Santri list kosong
**Causes**:

- Tidak ada data di Firebase
- User role tidak sesuai
- API endpoint error

**Solutions**:

- Check Firebase data structure
- Verify user role di database
- Check API logs

#### 2. Parent Selection Empty

**Symptoms**: Dropdown orang tua kosong
**Causes**:

- Tidak ada user dengan role "orangtua"
- API endpoint error

**Solutions**:

- Verify orang tua users exist
- Check API response
- Refresh parent data

#### 3. Validation Errors

**Symptoms**: Form validation gagal
**Causes**:

- Input tidak sesuai schema
- Required fields kosong

**Solutions**:

- Check validation error messages
- Verify all required fields filled
- Check data format

## Future Enhancements

### Short Term (1-2 months)

1. **Bulk Operations**: Bulk import/export santri
2. **Advanced Search**: Filter by multiple criteria
3. **Data Export**: Excel/CSV export functionality
4. **Audit Trail**: Track semua perubahan data

### Medium Term (3-6 months)

1. **Real-time Updates**: WebSocket untuk live data sync
2. **Mobile App**: React Native mobile version
3. **Advanced Analytics**: Student performance tracking
4. **Notification System**: Email/SMS notifications

### Long Term (6+ months)

1. **Microservices**: Separate service untuk student management
2. **AI Integration**: Smart data validation
3. **Advanced Reporting**: Custom report builder
4. **Integration**: External system integration

## Best Practices

### 1. Code Quality

- TypeScript strict mode
- Comprehensive error handling
- Unit test coverage >80%
- Code review process

### 2. Security

- Input validation
- Rate limiting
- HTTPS everywhere
- Regular security audits

### 3. Performance

- Data pagination
- Caching strategy
- Lazy loading
- Bundle optimization

### 4. UX/UI

- Responsive design
- Loading states
- Error states
- Accessibility compliance

---

_Last Updated: 18 November 2025_
_Version: 2.0_
_Author: Development Team_
