# Create Class Wizard Documentation

## Overview

Create Class Wizard adalah komponen komprehensif yang memungkinkan administrator untuk membuat kelas baru dengan multi-step form. Wizard ini dirancang untuk memberikan user experience yang optimal dengan validasi real-time, conflict detection, dan data integrity.

## Features

### 🎯 Core Features

- **Multi-step Wizard**: 3 langkah terstruktur dengan progress indicators
- **Real-time Validation**: Form validation dengan feedback instan
- **Schedule Conflict Detection**: Deteksi konflik jadwal pengajar
- **Bulk Student Enrollment**: Pilih multiple santri dengan advanced filtering
- **Teacher Assignment**: Pilih pengajar dengan availability checking
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: ARIA labels dan keyboard navigation

### 🔧 Technical Features

- **Type Safety**: Full TypeScript implementation
- **Form Validation**: Zod schema validation
- **Error Handling**: Comprehensive error management
- **State Management**: React hooks dengan proper state management
- **API Integration**: RESTful API dengan proper error handling
- **Performance**: Optimized rendering dan data fetching

## Architecture

### File Structure

```
app/admin/classes/create/
├── page.tsx                    # Main wizard page
components/admin/class-wizard/
├── index.tsx                    # Main wizard component
├── progress-indicator.tsx       # Progress indicator component
├── class-details-step.tsx        # Step 1: Class details
├── student-enrollment-step.tsx   # Step 2: Student enrollment
└── confirmation-step.tsx          # Step 3: Review & confirmation

lib/
├── validations/class-schema.ts    # Validation schemas
├── hooks/
│   ├── useClasses.ts           # Classes API hook
│   ├── useUstad.ts            # Teachers API hook
│   └── useSantri.ts           # Students API hook

api/
├── classes/route.ts             # Classes CRUD API
├── ustad/route.ts              # Teachers API
└── santri/route.ts             # Students API
```

### Component Hierarchy

```
CreateClassWizard (Main Component)
├── ProgressIndicator
├── ClassDetailsStep
├── StudentEnrollmentStep
└── ConfirmationStep
```

## API Endpoints

### Classes API (`/api/classes`)

- **GET**: Fetch classes dengan filters
- **POST**: Create new class dengan validation
- **PUT**: Update existing class
- **DELETE**: Delete class

### Teachers API (`/api/ustad`)

- **GET**: Fetch teachers dengan availability info
- **Query Parameters**:
  - `search`: Search teachers by name/email/specialization
  - `available`: Filter available teachers only
  - `specialization`: Filter by specialization

### Students API (`/api/santri`)

- **GET**: Fetch students dengan pagination dan filters
- **Query Parameters**:
  - `entryYear`: Filter by tahun masuk
  - `status`: Filter by status (active/inactive/graduated)
  - `search`: Search by name/email
  - `page`: Pagination page number
  - `limit`: Items per page

## Data Models

### Class Model

```typescript
interface Class {
  id: string;
  name: string;
  academicYear: string;
  ustadId: string;
  ustadName: string;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  studentIds: Record<
    string,
    {
      enrolledAt: string;
      status: string;
    }
  >;
  studentCount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  createdByName: string;
}
```

### Teacher Model

```typescript
interface Teacher {
  id: string;
  name: string;
  email: string;
  specialization: string;
  phone: string;
  currentClasses?: number;
  available?: boolean;
  createdAt: string;
}
```

### Student Model

```typescript
interface Student {
  id: string;
  name: string;
  email: string;
  entryYear: string;
  status: string;
  orangTuaId: string;
  createdAt: string;
}
```

## Wizard Steps

### Step 1: Class Details

**Purpose**: Mengumpulkan informasi dasar kelas
**Fields**:

- Nama Kelas (3-50 karakter)
- Tahun Akademik (format: YYYY/YYYY)
- Pengajar (dari daftar available teachers)
- Jadwal:
  - Hari pelaksanaan (Senin-Sabtu)
  - Waktu mulai (format: HH:MM)
  - Waktu selesai (format: HH:MM)

**Validations**:

- Nama kelas unik per tahun akademik dan pengajar
- Schedule conflict detection
- Teacher availability checking
- Time validation (minimum 30 menit, maksimal 6 jam)

### Step 2: Student Enrollment

**Purpose**: Memilih santri untuk kelas
**Features**:

- Advanced filtering (tahun masuk, status, search)
- Bulk selection (select all visible/all filtered)
- Pagination (25 items per page)
- Real-time selection counter
- Student status badges

**Filters**:

- Tahun Masuk: Semua atau tahun spesifik
- Status: Aktif/Tidak Aktif/Lulus
- Search: Nama atau email santri

**Bulk Actions**:

- Select All Visible: Pilih semua santri di halaman saat ini
- Select All Filtered: Pilih semua santri yang cocok dengan filter
- Deselect All: Hapus semua pilihan

### Step 3: Confirmation

**Purpose**: Review data dan konfirmasi pembuatan kelas
**Features**:

- Complete data summary
- Selected students preview
- Teacher assignment details
- Schedule overview
- Terms and conditions acceptance

## Validation Schemas

### Class Details Validation

```typescript
const classDetailsSchema = z.object({
  name: z.string().min(3).max(50),
  academicYear: z.string().regex(/^\d{4}\/\d{4}$/),
  ustadId: z.string().min(1),
  schedule: z
    .object({
      days: z.array(z.string()).min(1).max(6),
      startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    })
    .refine(
      (data) => {
        // Check if end time is after start time
        const [startHour, startMin] = data.startTime.split(":").map(Number);
        const [endHour, endMin] = data.endTime.split(":").map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        return endMinutes > startMinutes;
      },
      {
        message: "Waktu selesai harus setelah waktu mulai",
        path: ["endTime"],
      }
    ),
});
```

## Error Handling

### Client-side Validation

- Real-time field validation dengan Zod
- Cross-field validation (schedule conflicts)
- Form state management dengan error boundaries
- User-friendly error messages dalam Bahasa Indonesia

### Server-side Validation

- Duplicate class detection
- Schedule conflict verification
- Teacher authorization check
- Student enrollment status verification
- Data integrity validation

### Error Messages

```typescript
export const VALIDATION_MESSAGES = {
  REQUIRED: "Field ini wajib diisi",
  MIN_LENGTH: (min: number) => `Minimal ${min} karakter`,
  MAX_LENGTH: (max: number) => `Maksimal ${max} karakter`,
  SCHEDULE_CONFLICT: "Jadwal bertentangan dengan kelas lain",
  DUPLICATE_CLASS:
    "Kelas dengan nama, tahun akademik, dan pengajar yang sama sudah ada",
  // ... lainnya
};
```

## Performance Optimizations

### Frontend

- **Component Memoization**: React.memo untuk expensive renders
- **Debounced Search**: 300ms delay untuk search input
- **Virtual Scrolling**: Untuk large datasets (1000+ students)
- **Lazy Loading**: Components dan data loading
- **Optimistic Updates**: Immediate UI feedback

### Backend

- **Database Indexing**: Proper indexes untuk queries
- **Pagination**: Limit data transfer
- **Caching**: Response caching untuk frequently accessed data
- **Batch Operations**: Bulk student enrollment

## Accessibility Features

### ARIA Labels

- Proper labels untuk semua interactive elements
- Screen reader compatibility
- Focus management
- Keyboard navigation support

### Responsive Design

- Mobile-first approach
- Touch-friendly controls
- Collapsible sidebar pada mobile
- Optimized table layouts

## Testing Strategy

### Unit Tests

- Component rendering tests
- Validation schema tests
- Hook behavior tests
- API mock responses

### Integration Tests

- End-to-end wizard flow
- API integration tests
- Error scenario handling
- Browser compatibility

### Performance Tests

- Large dataset handling
- Memory usage monitoring
- Load time optimization
- Bundle size analysis

## Security Considerations

### Authentication & Authorization

- Session-based authentication dengan NextAuth
- Role-based access control (admin only)
- API endpoint protection
- Request validation

### Data Validation

- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

## Usage Example

### Basic Usage

```typescript
import CreateClassWizard from "@/components/admin/class-wizard";

function AdminDashboard() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsWizardOpen(true)}>Buat Kelas Baru</Button>

      <CreateClassWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => {
          // Handle successful class creation
          console.log("Class created successfully");
        }}
      />
    </div>
  );
}
```

### Custom Styling

Komponen menggunakan Tailwind CSS classes dan dapat dikustomisasi melalui:

- CSS variables untuk theming
- Component variants untuk different styles
- Override classes untuk custom styling

## Deployment Considerations

### Environment Variables

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
FIREBASE_DATABASE_URL=your-firebase-url
FIREBASE_SERVICE_ACCOUNT_KEY=your-service-account-key
```

### Build Configuration

- Next.js 14+ dengan App Router
- TypeScript untuk type safety
- ESLint dan Prettier untuk code quality
- Jest untuk testing

## Future Enhancements

### Planned Features

- [ ] Class templates untuk quick creation
- [ ] Advanced scheduling dengan recurring patterns
- [ ] Student grouping dan sub-classes
- [ ] Class performance analytics
- [ ] Integration dengan calendar systems
- [ ] Bulk class creation
- [ ] Class cloning functionality

### Performance Improvements

- [ ] Server-side rendering optimization
- [ ] Advanced caching strategies
- [ ] Database query optimization
- [ ] Bundle size reduction

## Troubleshooting

### Common Issues

#### Schedule Conflict Detection

**Issue**: False positive conflicts
**Solution**: Check timezone handling dan time format consistency

#### Large Dataset Performance

**Issue**: Slow rendering dengan 1000+ students
**Solution**: Implement virtual scrolling dan pagination

#### Form Validation

**Issue**: Validation errors tidak muncul
**Solution**: Pastikan Zod schema terinstall dan proper error handling

### Debug Tools

- Browser DevTools untuk performance profiling
- React DevTools untuk component debugging
- Network tab untuk API debugging
- Console logging untuk error tracking

## Support

### Documentation

- API documentation: `/api/docs`
- Component documentation: Storybook
- Code comments: JSDoc format
- Architecture documentation: README.md

### Contact

- Technical issues: Create GitHub issue
- Feature requests: Submit melalui project management
- Security concerns: Private channel communication

---

## Conclusion

Create Class Wizard menyediakan solusi komprehensif untuk manajemen kelas dengan focus pada user experience, data integrity, dan system performance. Implementation ini mengikuti best practices untuk React development, API design, dan accessibility standards.

Wizard ini dirancang untuk scalable dan maintainable dengan proper separation of concerns, comprehensive error handling, dan extensive testing coverage.
