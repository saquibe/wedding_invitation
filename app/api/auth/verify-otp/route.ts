import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { identifier, otp } = await req.json();

    // console.log("🔐 VERIFY OTP API CALLED at:", new Date().toISOString());
    // console.log("Identifier:", identifier);
    // console.log("OTP received:", otp);

    if (!identifier || !otp) {
      return NextResponse.json(
        { success: false, error: "Identifier and OTP are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection("aoicon_certificate");

    const isEmail = identifier.includes("@");

    // Find user by identifier
    let user;
    if (isEmail) {
      user = await usersCollection.findOne({
        $or: [{ email: identifier }, { "Email ID": identifier }],
      });
    } else {
      user = await usersCollection.findOne({
        $or: [{ mobile: identifier }, { Mobile: identifier }],
      });
    }

    // console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      // console.log("❌ User not found");
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // console.log("User details:", {
    //   name: user.name,
    //   email: user.email,
    //   mobile: user.mobile,
    //   storedOTP: user.otp,
    //   storedOTPType: typeof user.otp,
    //   otpExpiry: user.otpExpiry,
    // });

    // Check OTP
    if (!user.otp) {
      // console.log("❌ No OTP found for user");
      return NextResponse.json(
        { success: false, error: "No OTP found. Please request a new OTP." },
        { status: 401 }
      );
    }

    // Compare OTPs (ensure both are strings)
    const storedOTP = String(user.otp);
    const receivedOTP = String(otp);

    // console.log("Comparing OTPs:");
    // console.log("Stored OTP:", storedOTP);
    // console.log("Received OTP:", receivedOTP);
    // console.log("Match:", storedOTP === receivedOTP);

    if (storedOTP !== receivedOTP) {
      // console.log("❌ OTP mismatch");
      return NextResponse.json(
        { success: false, error: "Invalid OTP" },
        { status: 401 }
      );
    }

    // Check expiry
    const now = new Date();
    const expiry = user.otpExpiry ? new Date(user.otpExpiry) : null;

    // console.log("Checking expiry:");
    // console.log("Current time:", now.toISOString());
    // console.log("OTP expiry:", expiry ? expiry.toISOString() : "No expiry");

    if (!expiry) {
      // console.log("❌ No expiry date found");
      return NextResponse.json(
        { success: false, error: "OTP expired" },
        { status: 401 }
      );
    }

    if (expiry < now) {
      // console.log("❌ OTP expired");
      const diffMinutes = Math.round(
        (now.getTime() - expiry.getTime()) / (1000 * 60)
      );
      // console.log(`Expired ${diffMinutes} minutes ago`);
      return NextResponse.json(
        { success: false, error: "OTP expired. Please request a new OTP." },
        { status: 401 }
      );
    }

    // console.log("✅ OTP verified successfully!");

    // Clear OTP from database
    await usersCollection.updateOne(
      { _id: user._id },
      { $unset: { otp: "", otpExpiry: "" } }
    );

    // Prepare user data for NextAuth
    const userData = {
      id: user._id.toString(),
      name: user.name || user["Full Name"] || "",
      email: user.email || user["Email ID"] || "",
      registrationNumber: user.uid || user["Registration Number"] || "",
      mobile: (user.mobile || user["Mobile"] || "").toString(),
      certUrl: user.url || user.certUrl || user["cert_url"] || "",
    };

    // console.log("User data for NextAuth:", userData);

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error: any) {
    console.error("❌ Verify OTP error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
