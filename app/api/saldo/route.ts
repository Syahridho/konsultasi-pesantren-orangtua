import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, runTransaction, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { addCorsHeaders, handleCorsPreflight } from "@/lib/cors";

export async function GET(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const santriId = searchParams.get("santriId");

    if (!santriId) {
      return NextResponse.json({ error: "santriId is required" }, { status: 400 });
    }

    // Check if the current user has access to this student's data
    // Admin and Petugas can access anyone. Orangtua can only access their own children.
    const userRole = session.user.role;
    if (userRole === "orangtua") {
      const parentRef = ref(database, `users/${session.user.id}`);
      const parentSnapshot = await get(parentRef);
      const parentData = parentSnapshot.val();

      if (!parentData || !parentData.studentIds || !parentData.studentIds.includes(santriId)) {
        return NextResponse.json({ error: "Forbidden access to this student" }, { status: 403 });
      }
    }

    const saldoRef = ref(database, `saldo/${santriId}`);
    const saldoSnapshot = await get(saldoRef);

    if (!saldoSnapshot.exists()) {
      return addCorsHeaders(NextResponse.json({ amount: 0 }));
    }

    return addCorsHeaders(NextResponse.json(saldoSnapshot.val()));
  } catch (error) {
    console.error("[SALDO GET API] Error:", error);
    return addCorsHeaders(NextResponse.json({ error: "Internal server error" }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin and petugas can mutate balances
    if (session.user.role !== "admin" && session.user.role !== "petugas") {
      return NextResponse.json({ error: "Forbidden: Only petugas or admin can mutate balance" }, { status: 403 });
    }

    const body = await request.json();
    const { santriId, nominal, tipe, keterangan } = body;

    if (!santriId || typeof nominal !== "number" || nominal <= 0 || !tipe || !keterangan) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (tipe !== "tambah" && tipe !== "kurang") {
      return NextResponse.json({ error: "tipe must be 'tambah' or 'kurang'" }, { status: 400 });
    }

    const saldoRef = ref(database, `saldo/${santriId}`);
    
    // Pre-fetch initial snapshot to prevent Firebase transaction cold-cache abort (currentData=null on 1st pass)
    const initialSnapshot = await get(saldoRef);
    const initialAmount = initialSnapshot.exists() ? (initialSnapshot.val().amount || 0) : 0;

    if (tipe === "kurang" && initialAmount < nominal) {
      return addCorsHeaders(
        NextResponse.json(
          { error: "Saldo tidak mencukupi" },
          { status: 400 }
        )
      );
    }

    let saldoSebelum = 0;
    let saldoSesudah = 0;
    let transactionSuccess = false;

    // Use runTransaction for atomic updates
    try {
      const result = await runTransaction(saldoRef, (currentData) => {
        let currentAmount = 0;
        
        if (currentData && typeof currentData.amount === "number") {
          currentAmount = currentData.amount;
        } else {
          // Fallback to pre-fetched value on cold-cache initial run
          currentAmount = initialAmount;
        }

        saldoSebelum = currentAmount;

        if (tipe === "tambah") {
          saldoSesudah = currentAmount + nominal;
        } else if (tipe === "kurang") {
          if (currentAmount < nominal) {
            return undefined; // Abort transaction if balance is insufficient
          }
          saldoSesudah = currentAmount - nominal;
        }

        // Return the new data to be saved
        return {
          amount: saldoSesudah,
          updatedAt: new Date().toISOString(),
          updatedBy: session.user.id
        };
      });

      if (result.committed) {
        transactionSuccess = true;
      } else {
        return addCorsHeaders(
          NextResponse.json({ error: "Insufficient balance or transaction aborted" }, { status: 400 })
        );
      }
    } catch (txnError) {
      console.error("[SALDO TRANSACTION API] Error:", txnError);
      return NextResponse.json({ error: "Transaction failed" }, { status: 500 });
    }

    if (transactionSuccess) {
      // Record mutation log
      const mutasiRef = ref(database, `mutasi_saldo/${santriId}`);
      
      const logData = {
        tipe,
        nominal,
        saldoSebelum,
        saldoSesudah,
        keterangan,
        petugasId: session.user.id,
        petugasName: session.user.name || "Unknown",
        createdAt: new Date().toISOString()
      };

      await push(mutasiRef, logData);

      return addCorsHeaders(NextResponse.json({ 
        message: "Transaction successful",
        newAmount: saldoSesudah,
        log: logData 
      }));
    }

    return addCorsHeaders(NextResponse.json({ error: "Transaction failed" }, { status: 500 }));

  } catch (error) {
    console.error("[SALDO POST API] Error:", error);
    return addCorsHeaders(NextResponse.json({ error: "Internal server error" }, { status: 500 }));
  }
}
