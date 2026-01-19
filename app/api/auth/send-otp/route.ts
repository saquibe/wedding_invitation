// app/api/auth/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { generateOTP, generateOTPExpiry } from "@/lib/otp";
import { sendSMS } from "@/lib/sms";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { identifier: rawIdentifier } = await req.json();
    const identifier = rawIdentifier?.trim();

    if (!identifier) {
      return NextResponse.json(
        { error: "Email or mobile number is required" },
        { status: 400 }
      );
    }

    // console.log("\n================ SEND OTP ================");
    // console.log("📱 Identifier:", identifier);

    const db = await getDatabase();
    const usersCollection = db.collection("aoicon_certificate");

    const isEmail = identifier.includes("@");
    const isMobile = /^\d{10}$/.test(identifier);

    if (!isEmail && !isMobile) {
      return NextResponse.json(
        { error: "Please enter a valid email or 10-digit mobile number" },
        { status: 400 }
      );
    }

    // console.log("🔍 Searching in database...");

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

    if (!user) {
      // console.log("❌ User not found");
      return NextResponse.json(
        { error: "No registration found with this email/mobile number" },
        { status: 404 }
      );
    }

    // console.log("✅ User found:", {
    //   name: user.name,
    //   email: user.email,
    //   mobile: user.mobile,
    //   uid: user.uid,
    // });

    const otp = generateOTP();
    const otpExpiry = generateOTPExpiry();

    // console.log("🔢 Generated OTP:", otp, "(type:", typeof otp + ")");
    // console.log("⏰ OTP Expiry:", otpExpiry.toISOString());

    // Store OTP in database
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          otp: otp,
          otpExpiry: otpExpiry,
        },
      }
    );

    // console.log(
    //   "💾 OTP stored in DB:",
    //   updateResult.modifiedCount > 0 ? "Success" : "Failed"
    // );

    // Verify OTP was stored
    const verifyUser = await usersCollection.findOne({ _id: user._id });
    // console.log("✅ Verified stored OTP:", verifyUser?.otp);

    // Send OTP via SMS or Email
    if (isEmail) {
      await sendEmail(identifier, otp);
      // console.log("📧 Email sent to:", identifier);
    } else {
      await sendSMS(identifier, otp);
      // console.log("📱 SMS sent to:", identifier);
    }

    // console.log("=========================================\n");

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to your ${isEmail ? "email" : "mobile"}`,
      type: isEmail ? "email" : "mobile",
      testOtp: otp, // For testing only
    });
  } catch (error: any) {
    console.error("❌ Send OTP error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
