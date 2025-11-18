# Guide Debugging Masalah Santri Dashboard untuk Role Admin

## Masalah

Data santri tidak muncul saat pengguna dengan role admin mengakses halaman `/dashboard/santri`

## Root Cause Analysis

Berdasarkan investigasi, ditemukan beberapa masalah:

### 1. Routing Inconsistencies

- **Issue**: Sidebar menunjukkan admin seharusnya mengakses `/dashboard/santri/semua` tetapi halaman ini tidak ada
- **Impact**: Admin di-redirect ke halaman yang tidak ada atau halaman yang salah
- **Fix**: Membuat halaman `/dashboard/santri/semua/page.tsx` dan memperbaiki routing di sidebar

### 2. Missing Logging

- **Issue**: Tidak ada logging yang cukup untuk debugging
- **Impact**: Sulit mengidentifikasi penyebab masalah
- **Fix**: Menambahkan comprehensive logging di API dan frontend

### 3. Data Structure Issues

- **Issue**: API mungkin tidak mengembalikan data yang diharapkan
- **Impact**: Frontend tidak dapat menampilkan data
- **Fix**: Menambahkan debug info di response API

## Solusi yang Diimplementasikan

### 1. File Baru: `/app/dashboard/santri/semua/page.tsx`

- Halaman khusus untuk admin dan ustad melihat semua data santri
- Menggunakan API endpoint yang sama (`/api/santri`)
- Memiliki logging yang komprehensif

### 2. Enhanced API: `/app/api/santri/route.ts`

- Menambahkan detailed logging untuk debugging
- Menambahkan debug info di response
- Memperbaiki error handling

### 3. Fixed Routing: `/components/Sidebar.tsx`

- Memperbaiki routing untuk admin dan ustad ke `/dashboard/santri/semua`
- Menjaga konsistensi dengan menu items

### 4. Enhanced Frontend: `/app/dashboard/santri/page.tsx`

- Menambahkan logging untuk debugging
- Memperbaiki error handling

## Prosedur Testing

### Step 1: Verifikasi Environment Setup

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan Firebase credentials
```

### Step 2: Run Debug Script

```bash
# Debug data structure di Firebase
node scripts/debug-santri-data.js
```

### Step 3: Start Development Server

```bash
npm run dev
```

### Step 4: Testing Scenarios

#### Scenario A: Admin Access

1. Login sebagai admin
2. Klik menu "Data Santri" di sidebar
3. Expected: Di-redirect ke `/dashboard/santri/semua`
4. Expected: Melihat semua data santri dari semua orang tua
5. Check browser console untuk logging

#### Scenario B: Ustad Access

1. Login sebagai ustad
2. Klik menu "Data Santri" di sidebar
3. Expected: Di-redirect ke `/dashboard/santri/semua`
4. Expected: Melihat semua data santri dari semua orang tua
5. Check browser console untuk logging

#### Scenario C: Orang Tua Access

1. Login sebagai orang tua
2. Klik menu "Data Santri" di sidebar
3. Expected: Di-redirect ke `/dashboard/santri/orangtua`
4. Expected: Melihat hanya data santri miliknya
5. Check browser console untuk logging

### Step 5: API Testing

```bash
# Test API endpoint dengan curl
curl -X GET "http://localhost:3000/api/santri" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Step 6: Check Logs

1. Browser console logs
2. Server console logs
3. Debug script output

## Troubleshooting

### Issue 1: Data Santri Tetap Kosong

**Symptoms**: Halaman berhasil dimuat tapi tidak ada data santri
**Debug Steps**:

1. Check browser console untuk `[SANTRI PAGE]` logs
2. Check server console untuk `[SANTRI API]` logs
3. Run debug script untuk verifikasi data di Firebase
4. Verifikasi user role di database

**Possible Causes**:

- Tidak ada data santri di Firebase
- User role tidak sesuai di database
- API endpoint mengalami error

### Issue 2: Unauthorized Access

**Symptoms**: Mendapatkan error 401 Unauthorized
**Debug Steps**:

1. Check session data di browser console
2. Verifikasi user role di Firebase
3. Check middleware configuration

**Possible Causes**:

- Session expired
- User role tidak sesuai
- Authentication configuration error

### Issue 3: Routing Error

**Symptoms**: Halaman tidak ditemukan atau redirect yang salah
**Debug Steps**:

1. Check sidebar configuration
2. Verify file structure
3. Check Next.js routing

**Possible Causes**:

- File tidak ada
- Routing configuration salah
- Next.js caching issue

## Monitoring & Maintenance

### Production Monitoring

1. Monitor API response times
2. Track error rates
3. Log unauthorized access attempts
4. Monitor data consistency

### Regular Checks

1. Weekly data integrity checks
2. Monthly security audits
3. Quarterly performance reviews

## Future Improvements

### Short Term (1-2 weeks)

1. Implement proper error boundaries
2. Add loading states yang lebih baik
3. Implement data pagination
4. Add search functionality

### Medium Term (1-2 months)

1. Implement caching strategy
2. Add data export functionality
3. Implement audit logging
4. Add data validation

### Long Term (3-6 months)

1. Implement microservices architecture
2. Add real-time data synchronization
3. Implement advanced filtering
4. Add analytics dashboard

## Contact & Support

For issues related to this debugging guide:

- Technical Lead: [Contact Info]
- System Administrator: [Contact Info]
- Development Team: [Contact Info]

---

_Last Updated: 18 November 2025_
_Version: 1.0_
