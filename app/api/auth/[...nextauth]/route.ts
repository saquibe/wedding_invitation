// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getDatabase } from "@/lib/mongodb";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Mobile", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        // console.log("\n================ AUTHORIZE CALLED ================");
        // console.log("📱 Identifier:", credentials?.identifier);
        // console.log("🔢 OTP:", credentials?.otp);
        // console.log("OTP length:", credentials?.otp?.length);

        if (!credentials?.identifier || !credentials?.otp) {
          // console.log("❌ Missing credentials");
          return null;
        }

        try {
          const db = await getDatabase();
          const usersCollection = db.collection("aoicon_certificate");

          const identifier = credentials.identifier.trim();
          const otp = credentials.otp.trim();

          const isEmail = identifier.includes("@");
          const isMobile = /^\d{10}$/.test(identifier);

          // console.log("🔍 Searching for:", identifier);
          // console.log("Is email:", isEmail);
          // console.log("Is mobile:", isMobile);

          if (!isEmail && !isMobile) {
            // console.log("❌ Invalid identifier format");
            return null;
          }

          // Find user by identifier
          let query;
          if (isEmail) {
            query = {
              $or: [{ email: identifier }, { "Email ID": identifier }],
            };
          } else {
            query = {
              $or: [{ mobile: identifier }, { Mobile: identifier }],
            };
          }

          // console.log("🔎 MongoDB query:", JSON.stringify(query, null, 2));

          const user = await usersCollection.findOne(query);

          // console.log("👤 User found:", user ? "YES" : "NO");

          if (!user) {
            console.log("❌ User not found with identifier:", identifier);
            return null;
          }

          // console.log("📋 User document:", {
          //   _id: user._id,
          //   name: user.name,
          //   email: user.email,
          //   mobile: user.mobile,
          //   uid: user.uid,
          //   url: user.url,
          //   otp: user.otp,
          //   otpExpiry: user.otpExpiry,
          //   otpType: typeof user.otp,
          // });

          // Check OTP
          if (!user.otp) {
            // console.log("❌ No OTP stored for user");
            return null;
          }

          // Compare OTPs
          const storedOTP = String(user.otp).trim();
          const receivedOTP = otp;

          // console.log("🔐 OTP Comparison:");
          // console.log(
          //   "Stored OTP:",
          //   `"${storedOTP}"`,
          //   `(type: ${typeof storedOTP}, length: ${storedOTP.length})`
          // );
          // console.log(
          //   "Received OTP:",
          //   `"${receivedOTP}"`,
          //   `(type: ${typeof receivedOTP}, length: ${receivedOTP.length})`
          // );
          // console.log("Exact match (===):", storedOTP === receivedOTP);
          // console.log("Loose match (==):", storedOTP == receivedOTP);

          if (storedOTP !== receivedOTP) {
            // console.log("❌ OTP does not match");
            // console.log("Character by character comparison:");
            for (
              let i = 0;
              i < Math.max(storedOTP.length, receivedOTP.length);
              i++
            ) {
              const sChar = storedOTP[i] || " ";
              const rChar = receivedOTP[i] || " ";
              // console.log(
              //   `  Position ${i}: "${sChar}" (${sChar.charCodeAt(
              //     0
              //   )}) vs "${rChar}" (${rChar.charCodeAt(0)}) - ${
              //     sChar === rChar ? "✓" : "✗"
              //   }`
              // );
            }
            return null;
          }

          // Check expiry
          const now = new Date();
          const expiry = user.otpExpiry ? new Date(user.otpExpiry) : null;

          // console.log("⏰ OTP Expiry Check:");
          // console.log("Current time:", now.toISOString());
          // console.log("OTP expiry:", expiry ? expiry.toISOString() : "null");

          if (!expiry) {
            // console.log("❌ No expiry date found");
            return null;
          }

          if (expiry < now) {
            // console.log("❌ OTP expired");
            const diffMinutes = Math.round(
              (now.getTime() - expiry.getTime()) / (1000 * 60)
            );
            // console.log(`Expired ${diffMinutes} minutes ago`);
            return null;
          }

          // console.log("✅ OTP is valid!");

          // Clear OTP from database
          const updateResult = await usersCollection.updateOne(
            { _id: user._id },
            { $unset: { otp: "", otpExpiry: "" } }
          );

          // console.log(
          //   "🗑️ OTP cleared from DB:",
          //   updateResult.modifiedCount > 0 ? "Success" : "Failed"
          // );

          // Prepare user data for NextAuth
          const userData = {
            id: user._id.toString(),
            name: user.name || user["Full Name"] || "",
            email: user.email || user["Email ID"] || "",
            registrationNumber: user.uid || user["Registration Number"] || "",
            mobile: (user.mobile || user["Mobile"] || "").toString(),
            certUrl: user.url || user.certUrl || user["cert_url"] || "",
          };

          // console.log("✅ AUTHENTICATION SUCCESSFUL!");
          // console.log("👤 User data for session:", userData);
          // console.log("=============================================\n");

          return userData;
        } catch (error: any) {
          console.error("🔥 AUTH ERROR:", error);
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // console.log("\n🔄 JWT CALLBACK");
      if (user) {
        // console.log("Adding user data to token:", {
        //   id: user.id,
        //   name: user.name,
        //   email: user.email,
        //   mobile: (user as any).mobile,
        //   certUrl: (user as any).certUrl,
        // });

        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.registrationNumber = (user as any).registrationNumber;
        token.mobile = (user as any).mobile;
        token.certUrl = (user as any).certUrl;
      }
      // console.log("Final token:", token);
      return token;
    },
    async session({ session, token }) {
      // console.log("\n🔄 SESSION CALLBACK");
      // console.log("Token received:", {
      //   id: token.id,
      //   name: token.name,
      //   email: token.email,
      //   certUrl: token.certUrl,
      // });

      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).name = token.name;
        (session.user as any).email = token.email;
        (session.user as any).registrationNumber = token.registrationNumber;
        (session.user as any).mobile = token.mobile;
        (session.user as any).certUrl = token.certUrl;

        // console.log("Session user updated:", {
        //   name: session.user.name,
        //   email: session.user.email,
        //   mobile: (session.user as any).mobile,
        //   registrationNumber: (session.user as any).registrationNumber,
        //   certUrl: (session.user as any).certUrl,
        // });
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error("NextAuth Error:", code, metadata);
    },
    warn(code) {
      console.warn("NextAuth Warning:", code);
    },
    debug(code, metadata) {
      // console.log("NextAuth Debug:", code, metadata);
    },
  },
});

export { handler as GET, handler as POST };
