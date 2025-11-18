import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set, push } from "firebase/database";
import { database } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all role requests from Firebase
    const requestsRef = ref(database, "roleRequests");
    const snapshot = await get(requestsRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ requests: [] });
    }

    const requests = snapshot.val();
    const requestsList = Object.keys(requests).map((key) => ({
      id: key,
      ...requests[key],
    }));

    // Filter only pending requests
    const pendingRequests = requestsList.filter(
      (request) => request.status === "pending"
    );

    return NextResponse.json({ requests: pendingRequests });
  } catch (error) {
    console.error("Error fetching role requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestedRole, reason } = await request.json();

    if (!requestedRole || !reason) {
      return NextResponse.json(
        { error: "Requested role and reason are required" },
        { status: 400 }
      );
    }

    // Create new role request
    const requestsRef = ref(database, "roleRequests");
    const newRequestRef = push(requestsRef);

    const requestData = {
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      currentRole: session.user.role,
      requestedRole,
      reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await set(newRequestRef, requestData);

    return NextResponse.json(
      { message: "Role request submitted successfully", request: requestData },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating role request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
