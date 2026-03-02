import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { searchTerm } = await req.json();

    console.log("🔍 Search term received:", searchTerm);

    if (!searchTerm) {
      return NextResponse.json(
        { error: "Search term is required" },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const collection = db.collection("marriage_invitation");

    let query = {};
    const isMobile = /^\d{10}$/.test(searchTerm);

    if (isMobile) {
      // Search by mobile number
      query = { mobile_number: searchTerm };
      console.log("📱 Mobile search query:", query);
    } else {
      // Search by name (case-insensitive partial match)
      query = {
        name: {
          $regex: searchTerm,
          $options: "i",
        },
      };
      console.log("📝 Name search query:", query);
    }

    const results = await collection.find(query).toArray();
    console.log("✅ Results found:", results.length);
    console.log("📊 Results:", JSON.stringify(results, null, 2));

    return NextResponse.json({
      success: true,
      results: results.map((result) => ({
        name: result.name,
        mobile_number: result.mobile_number,
        qr_code: result.qr_code,
      })),
    });
  } catch (error: any) {
    console.error("❌ Search error:", error);
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 },
    );
  }
}
