"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Phone, Shield } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"identifier" | "otp">("identifier");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [messageType, setMessageType] = useState<"email" | "mobile" | "">("");
  const [testOtp, setTestOtp] = useState("");
  const router = useRouter();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setTestOtp("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      // console.log("Send OTP response:", data);

      if (response.ok) {
        setSuccess(data.message);
        setMessageType(data.type);
        setStep("otp");
        if (data.testOtp) {
          setTestOtp(data.testOtp);
          // console.log("Test OTP (for development):", data.testOtp);
        }
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        identifier,
        otp,
        redirect: false,
      });

      // console.log("SignIn result:", result);

      if (result?.error) {
        setError("Invalid OTP. Please try again.");
      } else if (result?.ok) {
        router.push("/certificate");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("identifier");
    setOtp("");
    setError("");
    setSuccess("");
    setMessageType("");
    setTestOtp("");
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`OTP resent to your ${messageType}`);
        if (data.testOtp) {
          setTestOtp(data.testOtp);
          // console.log("Resent OTP (for development):", data.testOtp);
        }
      } else {
        setError(data.error || "Failed to resend OTP");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative w-full flex justify-center mb-10 mt-[-100px]">
            <Image
              src="/aoicon-image.jpeg"
              alt="AOICON 2026 Kolkata"
              width={420}
              height={140}
              priority
              className="
                w-full
                max-w-[280px]
                sm:max-w-[340px]
                md:max-w-[420px]
                h-auto
                object-contain
              "
            />
          </div>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center text-gray-800">
              {step === "identifier"
                ? "Enter your registered email or mobile"
                : "Enter the OTP"}
            </CardTitle>
            <CardDescription className="text-center">
              {step === "identifier"
                ? "We'll send you a one-time password"
                : `Sent to your ${messageType}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* {testOtp && (
              <Alert className="mb-4 bg-blue-50 text-blue-900 border-blue-200">
                <AlertDescription className="font-mono">
                  <strong>For testing:</strong> OTP is {testOtp}
                </AlertDescription>
              </Alert>
            )} */}

            {step === "identifier" ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Email or Mobile Number"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="pl-10 h-12 text-base"
                      required
                    />
                    {identifier.includes("@") ? (
                      <Mail className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                    ) : (
                      <Phone className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 pl-1">
                    Enter your registered email or 10-digit mobile number
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                  disabled={loading || !identifier}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="h-12 text-center text-2xl tracking-widest font-semibold"
                    maxLength={6}
                    required
                  />
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-500">
                      OTP is valid for 10 minutes
                    </p>
                    <p className="text-xs text-gray-400">
                      Sent to: {identifier}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Continue"
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12"
                      onClick={handleBack}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12"
                      onClick={handleResendOTP}
                      disabled={loading}
                    >
                      Resend OTP
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-gray-600">Having trouble logging in?</p>
          <p className="text-sm">
            <a
              href="mailto:support@registrationteam.in"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Contact Support
            </a>
          </p>
        </div> */}
      </div>
    </div>
  );
}
