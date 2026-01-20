"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, AlertCircle, Printer } from "lucide-react";

export default function CertificatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState("");
  const [userData, setUserData] = useState<any>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Extract certificate URL safely
  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;

      const possibleUrls = [
        user.certUrl,
        user.cert_url,
        user.url,
        (user as any).url,
      ];

      const foundUrl = possibleUrls.find(
        (url) => typeof url === "string" && url.trim() !== ""
      );

      setCertificateUrl(foundUrl || "");
      setUserData(user);
    }
  }, [session]);

  // ✅ CORS-SAFE VIEW / PRINT HANDLER
  const handleViewCertificate = () => {
    if (!certificateUrl) {
      alert("Certificate not available. Please contact support.");
      return;
    }

    setLoading(true);

    try {
      window.open(certificateUrl, "_blank");
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    const supportEmail = "support@registrationteam.in";
    const subject = `Certificate Issue - ${
      userData?.registrationNumber || "Unknown"
    }`;

    const body = `Hello,

I am unable to access my certificate.

Registration Number: ${userData?.registrationNumber || "N/A"}
Name: ${userData?.name || "N/A"}
Email: ${userData?.email || "N/A"}

Certificate URL in system:
${certificateUrl || "Not available"}

Please assist.

Thank you.`;

    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session?.user) return null;

  const user = session.user as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <Card className="shadow-2xl border border-gray-300 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Certificate Access
            </h2>
            <p className="text-blue-100">AOICON 2026 • KOLKATA</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* User Info */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {user.name}
              </h3>
              <div className="inline-flex items-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                <span className="text-sm font-medium text-gray-700 mr-2">
                  Reg No:
                </span>
                <span className="font-bold text-blue-800">
                  {user.registrationNumber}
                </span>
              </div>
            </div>

            {/* View / Print Button */}
            <Button
              onClick={handleViewCertificate}
              disabled={loading || !certificateUrl}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Opening Certificate...
                </>
              ) : (
                <>
                  <Printer className="mr-3 h-6 w-6" />
                  {certificateUrl
                    ? "View / Print Certificate"
                    : "Certificate Not Available"}
                </>
              )}
            </Button>

            {/* Instruction */}
            {certificateUrl && (
              <p className="text-xs text-gray-500 text-center">
                Tip: Use your browser’s <strong>Print</strong> option to save as
                PDF
              </p>
            )}

            {/* Contact Support */}
            {!certificateUrl && (
              <Button
                onClick={handleContactSupport}
                variant="outline"
                className="w-full h-12 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                <AlertCircle className="mr-2 h-5 w-5" />
                Contact Support
              </Button>
            )}

            {/* Back */}
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              className="w-full h-12"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
