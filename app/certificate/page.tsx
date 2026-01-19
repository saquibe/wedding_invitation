"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  Download,
  ArrowLeft,
  FileText,
  Award,
  AlertCircle,
} from "lucide-react";

export default function CertificatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState("");
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;
      // console.log("Session user object on certificate page:", {
      //   name: user.name,
      //   email: user.email,
      //   registrationNumber: user.registrationNumber,
      //   mobile: user.mobile,
      //   certUrl: user.certUrl,
      //   allProps: Object.keys(user),
      // });

      // Try multiple possible field names for certificate URL
      const possibleUrls = [
        user.certUrl,
        user.cert_url,
        user.url,
        (user as any).url,
      ];

      // console.log("Possible certificate URLs:", possibleUrls);

      // Use the first non-empty URL
      const foundUrl = possibleUrls.find((url) => url && url.trim() !== "");
      // console.log("Selected certificate URL:", foundUrl);

      setCertificateUrl(foundUrl || "");
      setUserData(user);
    }
  }, [session]);

  const handleDownloadCertificate = async () => {
    if (!certificateUrl) {
      alert("Certificate URL not available. Please contact support.");
      // console.log("User data for debugging:", userData);
      return;
    }

    setLoading(true);
    try {
      // Validate URL
      if (!certificateUrl.startsWith("http")) {
        alert(`Invalid certificate URL: ${certificateUrl}`);
        return;
      }

      // Open certificate in new tab
      window.open(certificateUrl, "_blank");
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to open certificate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    const supportEmail = "support@registrationteam.in";
    const subject = `Certificate Issue - ${
      userData?.registrationNumber || "Unknown"
    }`;
    const body = `Hello,\n\nI'm having issues accessing my certificate.\n\nRegistration Number: ${
      userData?.registrationNumber || "N/A"
    }\nName: ${userData?.name || "N/A"}\nEmail: ${
      userData?.email || "N/A"
    }\n\nCertificate URL from system: ${
      certificateUrl || "Not available"
    }\n\nPlease assist.`;

    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your certificate...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <Card className="overflow-hidden shadow-2xl border border-gray-300">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Download Certificate
            </h2>
            <p className="text-blue-100">AOICON 2026 • KOLKATA</p>
          </div>

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

            {/* Certificate Status */}
            {/* <div className="space-y-4">
              <div
                className={`flex items-center justify-center p-4 rounded-lg border ${
                  certificateUrl
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                {certificateUrl ? (
                  <FileText className="w-6 h-6 mr-3 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 mr-3 text-yellow-600" />
                )}
                <div className="text-left">
                  <p
                    className={`font-medium ${
                      certificateUrl ? "text-green-900" : "text-yellow-900"
                    }`}
                  >
                    {certificateUrl
                      ? "Certificate Available"
                      : "Certificate Not Found"}
                  </p>
                  <p
                    className={`text-sm ${
                      certificateUrl ? "text-green-700" : "text-yellow-700"
                    }`}
                  >
                    {certificateUrl
                      ? "Click download to view your certificate"
                      : "URL not associated with registration"}
                  </p>
                </div>
              </div>

              {certificateUrl && (
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
                  <p className="font-medium mb-1">Certificate URL:</p>
                  <p className="break-all">{certificateUrl}</p>
                </div>
              )}
            </div> */}

            {/* Download Button */}
            <Button
              onClick={handleDownloadCertificate}
              disabled={loading || !certificateUrl}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Opening Certificate...
                </>
              ) : (
                <>
                  <Download className="mr-3 h-6 w-6" />
                  {certificateUrl
                    ? "Download Certificate"
                    : "Certificate Not Available"}
                </>
              )}
            </Button>

            {/* Contact Support Button (only show if no certificate) */}
            {!certificateUrl && (
              <Button
                onClick={handleContactSupport}
                variant="outline"
                className="w-full h-12 text-base border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                <AlertCircle className="mr-2 h-5 w-5" />
                Contact Support
              </Button>
            )}

            {/* Back Button */}
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              className="w-full h-12 text-base"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Login
            </Button>

            {/* Contact Info */}
            {/* <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">
                For any certificate-related issues, please contact:
              </p>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-800">Registration Team</p>
                <p className="text-gray-600">support@registrationteam.in</p>
              </div>
            </div> */}
          </div>
        </Card>
      </div>
    </div>
  );
}
