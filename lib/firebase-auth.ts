import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
} from "firebase/auth";
import { ref, get, set, push } from "firebase/database";
import { auth, database } from "./firebase";
import { secondaryDatabase } from "./firebase-secondary";

export interface FirebaseUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "ustad" | "orangtua";
}

export interface StudentData {
  name: string;
  nis: string;
  tahunDaftar: string;
  gender: string;
  tempatLahir: string;
  tanggalLahir: string;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<FirebaseUser | null> {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    if (!user) {
      return null;
    }

    // Get user data from Firebase Realtime Database
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      console.error("User data not found in database for UID:", user.uid);
      return null;
    }

    const userData = snapshot.val();

    return {
      id: user.uid,
      email: user.email || "",
      name: userData.name || "",
      role: userData.role || "orangtua",
    };
  } catch (error: any) {
    // Handle specific Firebase Auth errors
    if (error.code === "auth/user-not-found") {
      console.error("User not found:", email);
    } else if (error.code === "auth/wrong-password") {
      console.error("Wrong password for user:", email);
    } else if (error.code === "auth/invalid-credential") {
      console.error("Invalid credentials for user:", email);
    } else if (error.code === "auth/too-many-requests") {
      console.error("Too many requests for user:", email);
    } else {
      console.error("Authentication error:", error);
    }
    throw error; // Re-throw the error to be handled by NextAuth
  }
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: "admin" | "ustad" | "orangtua" = "orangtua",
  students?: StudentData[],
  authInstance?: any
): Promise<FirebaseUser | null> {
  try {
    // Create user with Firebase Auth using provided auth instance
    const userCredential = await createUserWithEmailAndPassword(
      authInstance,
      email,
      password
    );
    const user = userCredential.user;

    if (!user) {
      return null;
    }

    // Use the appropriate database instance based on the auth instance provided
    const dbInstance = authInstance ? secondaryDatabase : database;

    // Save user data to Firebase Realtime Database
    const userRef = ref(dbInstance, `users/${user.uid}`);
    const userData: any = {
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // NEW FORMAT: Create separate santri users and store references
    if (students && students.length > 0 && role === "orangtua") {
      const studentIds: string[] = [];

      // Create each santri as a separate user in the database
      for (const student of students) {
        // Generate a unique ID for the santri using Firebase push
        const usersRef = ref(dbInstance, `users`);
        const newSantriRef = push(usersRef);
        const santriId = newSantriRef.key!;

        const santriData = {
          id: santriId,
          name: student.name,
          email: `santri_${santriId}@pesantren.local`, // Dummy email for display
          role: "santri",
          nis: student.nis || "",
          entryYear: student.tahunDaftar || new Date().getFullYear().toString(),
          status: "active",
          phone: "",
          gender: student.gender || "",
          tempatLahir: student.tempatLahir || "",
          tanggalLahir: student.tanggalLahir || "",
          parentId: user.uid, // Link to parent
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save santri to database
        await set(newSantriRef, santriData);
        studentIds.push(santriId);
      }

      // Store only the IDs in the parent user (NEW FORMAT)
      userData.studentIds = studentIds;
    }

    await set(userRef, userData);

    return {
      id: user.uid,
      email: user.email || "",
      name,
      role,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return null;
  }
}

export async function resetPassword(email: string): Promise<boolean> {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Password reset error:", error);
    return false;
  }
}
