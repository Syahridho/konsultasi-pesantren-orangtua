import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";

// GET: Fetch subjects for a specific class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  // Unwrap params Promise for Next.js 16
  const resolvedParams = await params;
  const classId = resolvedParams.id;

  console.log("[CLASS SUBJECTS API] GET request started for class:", classId);

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      `[CLASS SUBJECTS API] Processing request for classId: "${classId}"`
    );

    if (!classId) {
      console.log("[CLASS SUBJECTS API] No class ID provided");
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    // Get current user's data
    const userRef = ref(database, `users/${session.user.id}`);
    console.log(
      `[CLASS SUBJECTS API] Fetching user data for: ${session.user.id}`
    );
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      console.log(`[CLASS SUBJECTS API] User not found: ${session.user.id}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnapshot.val();
    console.log(`[CLASS SUBJECTS API] User role: ${userData.role}`);

    // Check authorization
    // Admin can access all classes
    // Ustad can only access their own classes
    if (userData.role !== "admin" && userData.role !== "ustad") {
      console.log(
        `[CLASS SUBJECTS API] Unauthorized access attempt by role: ${userData.role}`
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get class data
    const classRef = ref(database, `classes/${classId}`);
    console.log(
      `[CLASS SUBJECTS API] Fetching class data from path: classes/${classId}`
    );
    const classSnapshot = await get(classRef);

    if (!classSnapshot.exists()) {
      console.log(
        `[CLASS SUBJECTS API] Class ${classId} not found, returning empty subjects`
      );
      // Return empty subjects instead of 404 to allow fallback
      return NextResponse.json({
        subjects: [],
        total: 0,
        message: `Class ${classId} not found, using default subjects`,
      });
    }

    const classData = classSnapshot.val();
    console.log(`[CLASS SUBJECTS API] Class data found:`, classData);

    // If user is ustad, check if they own this class
    if (userData.role === "ustad") {
      console.log(
        `[CLASS SUBJECTS API] Checking ustad authorization. Ustad ID: ${session.user.id}, Class ustadId: ${classData.ustadId}`
      );
      if (classData.ustadId !== session.user.id) {
        console.log(
          `[CLASS SUBJECTS API] Ustad ${session.user.id} not authorized for class ${classId}`
        );
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Extract subjects from class name
    // The class name format is expected to be: "Kelas X - Subject Name"
    // or just "Subject Name" for special classes
    const className = classData.name;
    const subjects: any[] = [];

    // Parse the class name to extract subject
    const classNameParts = className.split(" - ");
    let subjectName = "";

    if (classNameParts.length > 1) {
      // Format: "Kelas X - Subject Name"
      subjectName = classNameParts[classNameParts.length - 1].trim();
    } else {
      // Format: "Subject Name" or single word
      subjectName = className.trim();
    }

    // Only add if it's a valid subject (not just class level)
    if (
      subjectName &&
      !subjectName.match(/^(Kelas \d+|[A-Z]|\d+)$/) &&
      subjectName.length > 1
    ) {
      subjects.push({
        id: `${classId}-${subjectName.toLowerCase().replace(/\s+/g, "-")}`,
        name: subjectName,
        classId: classId,
        className: className,
      });
    }

    // Also check if ustad has specialization subjects
    if (userData.specialization) {
      const specializationSubjects = userData.specialization
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      specializationSubjects.forEach((subject: string) => {
        // Check if this subject is already in the list
        const existingSubject = subjects.find(
          (s) => s.name.toLowerCase() === subject.toLowerCase()
        );

        if (!existingSubject) {
          subjects.push({
            id: `${classId}-spec-${subject.toLowerCase().replace(/\s+/g, "-")}`,
            name: subject,
            classId: classId,
            className: className,
          });
        }
      });
    }

    console.log(
      `[CLASS SUBJECTS API] Found ${subjects.length} subjects for class ${classId}`
    );
    console.log(
      `[CLASS SUBJECTS API] Total request time: ${Date.now() - startTime}ms`
    );

    return NextResponse.json({
      subjects,
      total: subjects.length,
    });
  } catch (error) {
    console.error("[CLASS SUBJECTS API] Error fetching subjects:", error);
    console.log(
      `[CLASS SUBJECTS API] Failed request time: ${Date.now() - startTime}ms`
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
