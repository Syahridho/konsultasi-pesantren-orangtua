import {
  ref,
  push,
  onValue,
  set,
  get,
  query,
  orderByChild,
  limitToLast,
  update,
} from "firebase/database";
import { database } from "./firebase";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  status?: "sent" | "delivered" | "read";
  statusTimestamp?: {
    sent?: string;
    delivered?: string;
    read?: string;
  };
}

export interface Chat {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participant1Name: string;
  participant2Name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  createdAt: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "ustad" | "orangtua";
}

// Fungsi untuk mendapatkan daftar user berdasarkan role
export async function getUsersByRole(
  role: "ustad" | "orangtua"
): Promise<User[]> {
  try {
    const usersRef = ref(database, "users");
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      return [];
    }

    const users: User[] = [];
    const data = snapshot.val();

    Object.keys(data).forEach((uid) => {
      const user = data[uid];
      if (user.role === role) {
        users.push({
          uid,
          name: user.name,
          email: user.email,
          role: user.role,
        });
      }
    });

    return users;
  } catch (error) {
    console.error("Error getting users by role:", error);
    return [];
  }
}

// Fungsi untuk mendapatkan atau membuat chat room antara dua user
export async function getOrCreateChatRoom(
  currentUserId: string,
  otherUserId: string,
  currentUserName: string,
  otherUserName: string
): Promise<string> {
  try {
    // Cek apakah chat room sudah ada
    const chatsRef = ref(database, "chats");
    const snapshot = await get(chatsRef);

    if (snapshot.exists()) {
      const chats = snapshot.val();

      // Cari chat room yang sudah ada antara dua user ini
      const existingChatId = Object.keys(chats).find((chatId) => {
        const chat = chats[chatId];
        return (
          (chat.participant1Id === currentUserId &&
            chat.participant2Id === otherUserId) ||
          (chat.participant1Id === otherUserId &&
            chat.participant2Id === currentUserId)
        );
      });

      if (existingChatId) {
        return existingChatId;
      }
    }

    // Buat chat room baru
    const newChatRef = push(chatsRef);
    const chatId = newChatRef.key!;

    const newChat: Omit<Chat, "id"> = {
      participant1Id: currentUserId,
      participant2Id: otherUserId,
      participant1Name: currentUserName,
      participant2Name: otherUserName,
      createdAt: new Date().toISOString(),
    };

    await set(newChatRef, newChat);
    return chatId;
  } catch (error) {
    console.error("Error creating chat room:", error);
    throw error;
  }
}

// Fungsi untuk mengirim pesan
export async function sendMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> {
  try {
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const newMessageRef = push(messagesRef);

    const newMessage: Omit<Message, "id"> = {
      text,
      senderId,
      senderName,
      createdAt: new Date().toISOString(),
      status: "sent",
      statusTimestamp: {
        sent: new Date().toISOString(),
      },
    };

    await set(newMessageRef, newMessage);

    // Update last message di chat room
    const chatRef = ref(database, `chats/${chatId}`);
    const chatSnapshot = await get(chatRef);

    if (chatSnapshot.exists()) {
      const chatData = chatSnapshot.val();
      await set(chatRef, {
        ...chatData,
        lastMessage: text,
        lastMessageTime: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

// Fungsi untuk mendapatkan daftar chat user
export function getUserChats(
  userId: string,
  callback: (chats: Chat[]) => void
): () => void {
  const chatsRef = ref(database, "chats");

  const unsubscribe = onValue(chatsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const chats: Chat[] = [];
    const data = snapshot.val();

    Object.keys(data).forEach((chatId) => {
      const chat = data[chatId];
      if (chat.participant1Id === userId || chat.participant2Id === userId) {
        chats.push({
          id: chatId,
          ...chat,
        });
      }
    });

    // Urutkan berdasarkan lastMessageTime (terbaru dulu)
    chats.sort((a, b) => {
      const timeA = a.lastMessageTime
        ? new Date(a.lastMessageTime).getTime()
        : 0;
      const timeB = b.lastMessageTime
        ? new Date(b.lastMessageTime).getTime()
        : 0;
      return timeB - timeA;
    });

    callback(chats);
  });

  return unsubscribe;
}

// Fungsi untuk mendapatkan pesan dalam chat room
export function getChatMessages(
  chatId: string,
  callback: (messages: Message[]) => void
): () => void {
  const messagesRef = query(
    ref(database, `chats/${chatId}/messages`),
    orderByChild("createdAt")
  );

  const unsubscribe = onValue(messagesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const messages: Message[] = [];
    const data = snapshot.val();

    Object.keys(data).forEach((messageId) => {
      const message = data[messageId];
      messages.push({
        id: messageId,
        ...message,
      });
    });

    callback(messages);
  });

  return unsubscribe;
}

// Fungsi untuk mendapatkan detail user berdasarkan ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    const userData = snapshot.val();
    return {
      uid: userId,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    };
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
}

// Fungsi untuk mencari chat berdasarkan nama orang tua atau santri
export async function searchChats(
  userId: string,
  searchQuery: string
): Promise<Chat[]> {
  try {
    if (!searchQuery.trim()) {
      return [];
    }

    const chatsRef = ref(database, "chats");
    const usersRef = ref(database, "users");

    // Get all chats and users
    const [chatsSnapshot, usersSnapshot] = await Promise.all([
      get(chatsRef),
      get(usersRef),
    ]);

    if (!chatsSnapshot.exists()) {
      return [];
    }

    const allChats = chatsSnapshot.val();
    const allUsers = usersSnapshot.val();
    const searchResults: Chat[] = [];
    const query = searchQuery.toLowerCase();

    // Helper function to check if user has matching student
    const hasMatchingStudent = (user: any, query: string): boolean => {
      if (user.students && Array.isArray(user.students)) {
        return user.students.some(
          (student: any) =>
            student.name && student.name.toLowerCase().includes(query)
        );
      }
      if (user.santri && typeof user.santri === "object") {
        return Object.values(user.santri).some(
          (student: any) =>
            student.name && student.name.toLowerCase().includes(query)
        );
      }
      return false;
    };

    // Search through chats
    Object.keys(allChats).forEach((chatId) => {
      const chat = allChats[chatId];

      // Only include chats where the current user is a participant
      if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
        return;
      }

      // Get other participant info
      const otherParticipantId =
        chat.participant1Id === userId
          ? chat.participant2Id
          : chat.participant1Id;

      const otherParticipant = allUsers[otherParticipantId];

      if (!otherParticipant) {
        return;
      }

      // Check if other participant name matches
      const nameMatches =
        otherParticipant.name &&
        otherParticipant.name.toLowerCase().includes(query);

      // Check if other participant has matching students
      const studentMatches = hasMatchingStudent(otherParticipant, query);

      if (nameMatches || studentMatches) {
        searchResults.push({
          id: chatId,
          ...chat,
        });
      }
    });

    // Sort by last message time (most recent first)
    searchResults.sort((a, b) => {
      const timeA = a.lastMessageTime
        ? new Date(a.lastMessageTime).getTime()
        : 0;
      const timeB = b.lastMessageTime
        ? new Date(b.lastMessageTime).getTime()
        : 0;
      return timeB - timeA;
    });

    return searchResults;
  } catch (error) {
    console.error("Error searching chats:", error);
    return [];
  }
}

// Fungsi untuk mengupdate status pesan
export async function updateMessageStatus(
  chatId: string,
  messageId: string,
  status: "delivered" | "read",
  userId: string
): Promise<void> {
  try {
    const messageRef = ref(database, `chats/${chatId}/messages/${messageId}`);
    const messageSnapshot = await get(messageRef);

    if (!messageSnapshot.exists()) {
      throw new Error("Message not found");
    }

    const messageData = messageSnapshot.val();

    // Only recipient can update status (not the sender)
    if (messageData.senderId === userId) {
      throw new Error("Cannot update status for own message");
    }

    // Prepare status update
    const statusUpdate: any = {
      status,
    };

    // Initialize statusTimestamp if it doesn't exist
    const currentStatusTimestamp = messageData.statusTimestamp || {};

    // Add timestamp for the specific status
    statusUpdate.statusTimestamp = {
      ...currentStatusTimestamp,
      [status]: new Date().toISOString(),
    };

    // Update message status
    await update(messageRef, statusUpdate);
  } catch (error) {
    console.error("Error updating message status:", error);
    throw error;
  }
}

// Fungsi untuk menandai pesan sebagai terkirim (untuk penerima)
export async function markMessagesAsDelivered(
  chatId: string,
  messageIds: string[],
  userId: string
): Promise<void> {
  try {
    for (const messageId of messageIds) {
      await updateMessageStatus(chatId, messageId, "delivered", userId);
    }
  } catch (error) {
    console.error("Error marking messages as delivered:", error);
    throw error;
  }
}

// Fungsi untuk menandai pesan sebagai dibaca (untuk penerima)
export async function markMessagesAsRead(
  chatId: string,
  messageIds: string[],
  userId: string
): Promise<void> {
  try {
    for (const messageId of messageIds) {
      await updateMessageStatus(chatId, messageId, "read", userId);
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
}

// Fungsi untuk mendapatkan user dengan informasi santri
export async function getUserWithStudents(userId: string): Promise<any> {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val();
  } catch (error) {
    console.error("Error getting user with students:", error);
    return null;
  }
}
