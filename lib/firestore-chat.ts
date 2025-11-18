import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  DocumentData,
  enableIndexedDbPersistence,
  disableNetwork,
  enableNetwork,
} from "firebase/firestore";
import { db } from "./firestore";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any; // Firestore Timestamp
}

export interface Chat {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participant1Name: string;
  participant2Name: string;
  lastMessage?: string;
  lastMessageTime?: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "ustad" | "orangtua";
}

// Initialize offline persistence
let isPersistenceEnabled = false;
const enableOfflineSupport = async () => {
  if (!isPersistenceEnabled) {
    try {
      await enableIndexedDbPersistence(db);
      isPersistenceEnabled = true;
      console.log("Offline persistence enabled");
    } catch (error: any) {
      if (error.code === "failed-precondition") {
        console.warn(
          "Multiple tabs open, persistence can only be enabled in one tab at a time."
        );
      } else if (error.code === "unimplemented") {
        console.warn("The current browser does not support persistence.");
      }
    }
  }
};

// Initialize offline support
enableOfflineSupport();

// Fallback function for when real-time listeners fail
const fallbackQuery = async (
  q: any,
  callback: (results: any[]) => void,
  isRealTime: boolean = true
): Promise<() => void> => {
  if (isRealTime) {
    try {
      return onSnapshot(q, (querySnapshot: any) => {
        const results: any[] = [];
        querySnapshot.forEach((doc: any) => {
          const docData = doc.data();
          results.push({ id: doc.id, ...docData });
        });
        callback(results);
      });
    } catch (error) {
      console.warn(
        "Real-time listener failed, falling back to one-time query:",
        error
      );
      // Fall back to one-time query
      const querySnapshot = await getDocs(q);
      const results: any[] = [];
      querySnapshot.forEach((doc: any) => {
        const docData = doc.data();
        results.push({ id: doc.id, ...docData });
      });
      callback(results);

      // Return empty unsubscribe function
      return () => {};
    }
  } else {
    // Always do one-time query
    const querySnapshot = await getDocs(q);
    const results: any[] = [];
    querySnapshot.forEach((doc: any) => {
      const docData = doc.data();
      results.push({ id: doc.id, ...docData });
    });
    callback(results);

    // Return empty unsubscribe function
    return () => {};
  }
};

// Fungsi untuk mendapatkan daftar user berdasarkan role
export async function getUsersByRole(
  role: "ustad" | "orangtua"
): Promise<User[]> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", role));
    const querySnapshot = await getDocs(q);

    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        uid: doc.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      });
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
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participant1Id", "in", [currentUserId, otherUserId]),
      where("participant2Id", "in", [currentUserId, otherUserId])
    );
    const querySnapshot = await getDocs(q);

    // Cari chat room yang sudah ada antara dua user ini
    for (const doc of querySnapshot.docs) {
      const chatData = doc.data();
      if (
        (chatData.participant1Id === currentUserId &&
          chatData.participant2Id === otherUserId) ||
        (chatData.participant1Id === otherUserId &&
          chatData.participant2Id === currentUserId)
      ) {
        return doc.id;
      }
    }

    // Buat chat room baru
    const newChat = {
      participant1Id: currentUserId,
      participant2Id: otherUserId,
      participant1Name: currentUserName,
      participant2Name: otherUserName,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(chatsRef, newChat);
    return docRef.id;
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
    // Tambahkan pesan ke sub-collection messages
    const messagesRef = collection(db, "chats", chatId, "messages");
    const newMessage = {
      text,
      senderId,
      senderName,
      createdAt: serverTimestamp(),
    };

    await addDoc(messagesRef, newMessage);

    // Update last message di chat room
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

// Fungsi untuk mendapatkan daftar chat user
export function getUserChats(
  userId: string,
  callback: (chats: Chat[]) => void,
  useRealTime: boolean = true
): () => void {
  let allUnsubscribes: (() => void)[] = [];

  const processChats = async () => {
    try {
      const chatsRef = collection(db, "chats");

      // Get chats where user is participant1
      const q1 = query(
        chatsRef,
        where("participant1Id", "==", userId),
        orderBy("lastMessageTime", "desc")
      );

      const unsubscribe1 = await fallbackQuery(
        q1,
        (chats1: Chat[]) => {
          // Get chats where user is participant2
          const q2 = query(
            chatsRef,
            where("participant2Id", "==", userId),
            orderBy("lastMessageTime", "desc")
          );

          fallbackQuery(
            q2,
            (chats2: Chat[]) => {
              // Combine and deduplicate chats
              const allChats = [...chats1, ...chats2];
              const uniqueChats = allChats.filter(
                (chat, index, self) =>
                  index === self.findIndex((c) => c.id === chat.id)
              );

              // Sort by lastMessageTime
              uniqueChats.sort((a, b) => {
                const timeA = a.lastMessageTime?.toMillis?.() || 0;
                const timeB = b.lastMessageTime?.toMillis?.() || 0;
                return timeB - timeA;
              });

              callback(uniqueChats);
            },
            useRealTime
          );
        },
        useRealTime
      );

      if (unsubscribe1) {
        allUnsubscribes.push(unsubscribe1);
      }
    } catch (error) {
      console.error("Error in getUserChats:", error);
      callback([]);
    }
  };

  processChats();

  // Return combined unsubscribe function
  return () => {
    allUnsubscribes.forEach((unsub) => unsub());
  };
}

// Fungsi untuk mendapatkan pesan dalam chat room
export function getChatMessages(
  chatId: string,
  callback: (messages: Message[]) => void,
  useRealTime: boolean = true
): () => void {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  // Return a function that returns the unsubscribe function
  return (() => {
    let unsubscribeFunc: (() => void) | undefined;

    fallbackQuery(
      q,
      (messages: Message[]) => {
        callback(messages);
      },
      useRealTime
    ).then((unsubscribe) => {
      unsubscribeFunc = unsubscribe;
    });

    return () => {
      if (unsubscribeFunc) {
        unsubscribeFunc();
      }
    };
  })();
}

// Fungsi untuk mendapatkan detail user berdasarkan ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      return null;
    }

    const userData = docSnap.data();
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

// Function to toggle network status for offline support
export const toggleNetwork = async (enabled: boolean) => {
  try {
    if (enabled) {
      await enableNetwork(db);
      console.log("Network enabled");
    } else {
      await disableNetwork(db);
      console.log("Network disabled");
    }
  } catch (error) {
    console.error("Error toggling network:", error);
  }
};
