# Panduan Error Handling

Proyek ini dilengkapi dengan sistem error handling yang komprehensif menggunakan komponen dari shadcn/ui. Berikut adalah panduan penggunaannya:

## Komponen Error yang Tersedia

### 1. Halaman Error Bawaan Next.js

#### `app/not-found.tsx`

- Digunakan untuk menangani error 404 (halaman tidak ditemukan)
- Otomatis ditampilkan oleh Next.js ketika route tidak ditemukan

#### `app/error.tsx`

- Digunakan untuk menangani error 500 (server error)
- Menangkap error yang terjadi di level route

#### `app/global-error.tsx`

- Digunakan untuk menangani error kritis di level root
- Hanya berjalan di production dan menampilkan error UI tanpa melayout

### 2. Komponen Error Reusable

#### `GenericErrorPage`

Komponen error yang dapat digunakan untuk berbagai jenis HTTP error:

```tsx
import { GenericErrorPage } from "@/components/error";

// Penggunaan dasar
<GenericErrorPage statusCode={404} />

// Dengan custom pesan
<GenericErrorPage
  statusCode={403}
  title="Akses Ditolak"
  description="Anda tidak memiliki izin untuk mengakses halaman ini."
  showRetry={true}
  onRetry={() => window.location.reload()}
/>

// Penggunaan inline (di dalam komponen lain)
<GenericErrorPage
  statusCode={404}
  inline={true}
  showRetry={false}
/>
```

#### `ErrorBoundary`

Komponen React Error Boundary untuk menangkap error di React components:

```tsx
import { ErrorBoundary } from "@/components/error";

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log error ke service monitoring
        console.error("Error caught:", error, errorInfo);
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}
```

#### `ApiErrorHandler`

Komponen untuk menangani error dari API calls:

```tsx
import { ApiErrorHandler } from "@/components/error";

function DataComponent() {
  const [error, setError] = useState(null);

  // ... fetch data logic

  return (
    <div>
      {error ? (
        <ApiErrorHandler
          error={error}
          onRetry={() => fetchData()}
          showInline={true}
          customMessage="Gagal memuat data. Silakan coba lagi."
        />
      ) : (
        <YourData />
      )}
    </div>
  );
}
```

## Status Codes yang Didukung

Komponen `GenericErrorPage` sudah dilengkapi dengan pesan untuk status codes berikut:

- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **408**: Request Timeout
- **409**: Conflict
- **422**: Unprocessable Entity
- **429**: Too Many Requests
- **500**: Internal Server Error
- **502**: Bad Gateway
- **503**: Service Unavailable
- **504**: Gateway Timeout

## Best Practices

### 1. Menggunakan Error Boundary

Wrap komponen yang mungkin menyebabkan error dengan ErrorBoundary:

```tsx
// Di layout atau halaman
<ErrorBoundary>
  <DashboardPage />
</ErrorBoundary>

// Untuk komponen spesifik
<ErrorBoundary fallback={<CustomErrorFallback />}>
  <ComplexComponent />
</ErrorBoundary>
```

### 2. Error Handling di API Calls

Gunakan `ApiErrorHandler` untuk menampilkan error dari API:

```tsx
async function fetchData() {
  try {
    const response = await fetch("/api/data");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    setError(error);
  }
}
```

### 3. Error Logging

Error boundary sudah mencatat error ke console. Untuk production, tambahkan error logging service:

```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Log ke service seperti Sentry, LogRocket, dll
    errorReportingService.captureException(error, {
      extra: errorInfo,
    });
  }}
>
  <App />
</ErrorBoundary>
```

## Testing Error Pages

Untuk testing error pages, Anda dapat:

1. **Test 404**: Kunjungi URL yang tidak ada
2. **Test 500**: Throw error di komponen:
   ```tsx
   function TestError() {
     throw new Error("Test error");
     return <div>Test</div>;
   }
   ```
3. **Test API Error**: Modifikasi API route untuk return error

## Customization

### Mengubah Tema

Komponen error menggunakan shadcn/ui, sehingga mengikuti tema aplikasi. Untuk custom styling:

```tsx
// Override dengan custom props
<GenericErrorPage
  customIcon={<CustomErrorIcon />}
  title="Custom Error Title"
  description="Custom error description"
/>
```

### Multi-language Support

Komponen error saat ini menggunakan Bahasa Indonesia. Untuk multi-language:

1. Buat file translations
2. Gunakan hook i18n untuk mengganti teks
3. Teruskan props yang sudah di-translate ke komponen error

## Troubleshooting

### Error Boundary Tidak Berfungsi

- Pastikan ErrorBoundary digunakan di client component ("use client")
- Error boundary tidak menangkap error di event handlers, async code, atau server-side rendering

### Halaman Error Tidak Muncul

- Pastikan file error.tsx dan not-found.tsx berada di folder yang benar
- Untuk global-error.tsx, pastikan ada tag `<html>` dan `<body>`

### Styling Tidak Sesuai

- Pastikan shadcn/ui sudah diinstall dengan benar
- Periksa apakah CSS variables sudah diatur dengan benar di globals.css
