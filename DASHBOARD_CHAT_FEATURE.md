# Dashboard Chat Feature - Documentation

## Overview
Fitur chat telah ditambahkan ke dashboard untuk **Admin** dan **Ustad**. Fitur ini memungkinkan mereka untuk berkomunikasi dengan orang tua santri secara real-time.

## 📍 Location
- **Route**: `/dashboard/chat`
- **Component**: `app/dashboard/chat/page.tsx`

## 🎯 Access Control
Hanya role berikut yang dapat mengakses:
- ✅ **Admin** - Full access
- ✅ **Ustad** - Full access
- ❌ **Orangtua** - Tidak dapat akses (tetap menggunakan `/chat`)

### Auto-redirect:
- Jika user belum login → redirect ke `/login`
- Jika user role `orangtua` → redirect ke `/dashboard` dengan error message

## 🚀 Features

### 1. Real-time Messaging
- Pesan terkirim dan diterima secara real-time menggunakan Firebase Realtime Database
- Auto-scroll ke pesan terbaru
- Message status indicators (sent/delivered/read)

### 2. Chat List Sidebar
- Menampilkan semua percakapan aktif
- Sorted berdasarkan pesan terakhir (newest first)
- Search functionality untuk mencari chat berdasarkan nama
- Filter options (All, Unread, Read)
- Start new chat dengan button "+" di header

### 3. Chat Window
- Tampilan pesan yang clean dan modern
- Grouping pesan berdasarkan tanggal
- Avatar untuk setiap participant
- Time stamp untuk setiap pesan
- Status indicator untuk pesan yang dikirim

### 4. Responsive Design
- **Desktop (≥768px)**: Sidebar always visible
- **Mobile (<768px)**: Sidebar collapsible dengan toggle button
- Overlay backdrop on mobile untuk menutup sidebar

## 🎨 UI Components Used
- `ChatSidebar` - List of chats
- `ChatWindow` - Message display and input
- `MessageStatusIndicator` - Show message status
- `Button`, `Input`, `Card`, `Avatar` - Shadcn UI components

## 📱 Mobile Behavior
1. Sidebar hidden by default pada mobile
2. Toggle button (hamburger menu) di top-left untuk show/hide sidebar
3. Saat chat dipilih, sidebar otomatis tertutup
4. Click overlay untuk close sidebar

## 🔧 Technical Implementation

### State Management
```typescript
const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
const [sidebarOpen, setSidebarOpen] = useState(true);
```

### Hooks Used
- `useSession()` - Get current user data
- `useRouter()` - Navigation and redirects
- `useEffect()` - Handle side effects (auth check, resize listener)
- `useCallback()` - Memoize event handlers
- `useMemo()` - Optimize performance

### Performance Optimizations
1. **Memoized handlers** - `handleSelectChat`, `handleResize`
2. **Debounced resize** - Prevent excessive re-renders
3. **Conditional rendering** - Only render when authenticated
4. **CSS transitions** - Smooth sidebar animations

## 📂 File Structure
```
app/dashboard/chat/
  └── page.tsx                    # Main chat page

components/chat/
  ├── ChatSidebar.tsx            # Chat list component
  ├── ChatWindow.tsx             # Message display component
  └── MessageStatusIndicator.tsx # Status indicator

styles/
  └── chat.css                    # Chat-specific styles
```

## 🔗 Integration with Sidebar

### Updated Menu Items
```typescript
// Admin
Object.freeze({ href: "/dashboard/chat", label: "Chat", icon: MessageCircle })

// Ustad  
Object.freeze({ href: "/dashboard/chat", label: "Chat", icon: MessageCircle })

// Orangtua (tetap ke /chat)
Object.freeze({ href: "/chat", label: "Chat", icon: MessageCircle })
```

## 🧪 Testing Checklist

### As Admin
- [x] Can access `/dashboard/chat`
- [x] Can see all chats
- [x] Can send messages
- [x] Can search chats
- [x] Can start new chat
- [x] Mobile sidebar works

### As Ustad
- [x] Can access `/dashboard/chat`
- [x] Can see all chats
- [x] Can send messages
- [x] Can search chats
- [x] Can start new chat
- [x] Mobile sidebar works

### As Orangtua
- [x] Cannot access `/dashboard/chat` (redirected)
- [x] Still can use `/chat` normally

## 🎯 Future Enhancements
- [ ] Typing indicators
- [ ] File/image sharing
- [ ] Voice messages
- [ ] Group chat support
- [ ] Message reactions
- [ ] Push notifications
- [ ] Unread message counter in sidebar menu

## 🐛 Known Issues
None at the moment.

## 📝 Notes
- Chat data is stored in Firebase Realtime Database
- All existing chat functionality from `/chat` is preserved
- `/chat` route masih tetap ada untuk orangtua
- `/dashboard/chat` khusus untuk admin dan ustad

## 🔐 Security
- Authentication check dilakukan di level component
- Role-based access control implemented
- Firebase security rules harus dikonfigurasi untuk proper access control

---

**Created**: 2025-11-19  
**Last Updated**: 2025-11-19  
**Version**: 1.0.0
