import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { name, mobile_number, qr_code } = await req.json();

    // Validate required fields
    if (!name || !mobile_number || !qr_code) {
      return NextResponse.json(
        { error: "Name, mobile number, and QR code are required" },
        { status: 400 },
      );
    }

    // Validate mobile number format
    if (!/^\d{10}$/.test(mobile_number)) {
      return NextResponse.json(
        { error: "Mobile number must be 10 digits" },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const collection = db.collection("marriage_invitation");

    // Check if QR code already exists
    const existingQR = await collection.findOne({ qr_code });
    if (existingQR) {
      return NextResponse.json(
        { error: "QR code already exists. Please use a unique code." },
        { status: 400 },
      );
    }

    // Create new invitation document
    const newInvitation = {
      name: name.trim(),
      mobile_number: mobile_number.trim(),
      qr_code: qr_code.trim().toUpperCase(),
      created_at: new Date(),
    };

    const result = await collection.insertOne(newInvitation);

    return NextResponse.json({
      success: true,
      message: "Invitation added successfully",
      id: result.insertedId,
    });
  } catch (error: any) {
    console.error("Add invitation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add invitation" },
      { status: 500 },
    );
  }
}
