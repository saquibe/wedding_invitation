"use client";

import { useState } from "react";
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
import { Loader2, ArrowLeft, Save, User, Phone, QrCode } from "lucide-react";

export default function AddInvitationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    qr_code: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Special handling for mobile number - only allow digits
    if (name === "mobile_number") {
      const digitsOnly = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const generateRandomCode = () => {
    // Generate a random 6-character alphanumeric code
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    setFormData((prev) => ({ ...prev, qr_code: result }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }

    if (!formData.mobile_number.trim()) {
      setError("Mobile number is required");
      return false;
    }

    if (formData.mobile_number.length !== 10) {
      setError("Mobile number must be 10 digits");
      return false;
    }

    if (!formData.qr_code.trim()) {
      setError("QR code is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/add-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: "", mobile_number: "", qr_code: "" });

        // Redirect back to home after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setError(data.error || "Failed to add invitation");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Main Content */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-[#504943] font-cinzel">
              Add New Invitation
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter the details for the new wedding invitation
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success && (
              <Alert className="mb-6 bg-green-50 text-green-900 border-green-200">
                <AlertDescription>
                  ✓ Invitation added successfully! Redirecting...
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <User className="h-4 w-4 mr-2 text-amber-600" />
                  Full Name <span className="text-red-500 ml-1">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Dr. Vijay Patil"
                  className="h-12 text-lg border-2 border-amber-200 focus:border-amber-400"
                  required
                />
                <p className="text-xs text-gray-500">
                  Enter the full name as it should appear on the invitation
                </p>
              </div>

              {/* Mobile Number Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-amber-600" />
                  Mobile Number <span className="text-red-500 ml-1">*</span>
                </label>
                <Input
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  placeholder="e.g., 9920755555"
                  maxLength={10}
                  className="h-12 text-lg border-2 border-amber-200 focus:border-amber-400"
                  required
                />
                <p className="text-xs text-gray-500">
                  Enter 10-digit mobile number without country code
                </p>
              </div>

              {/* QR Code Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <QrCode className="h-4 w-4 mr-2 text-amber-600" />
                  QR Code <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    name="qr_code"
                    value={formData.qr_code}
                    onChange={handleChange}
                    placeholder="e.g., 15TYNT"
                    className="h-12 text-lg border-2 border-amber-200 focus:border-amber-400 flex-1"
                    required
                  />
                  <Button
                    type="button"
                    onClick={generateRandomCode}
                    variant="outline"
                    className="h-12 px-4 border-amber-500 text-amber-700 hover:bg-amber-50"
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Enter a unique code or click Generate for random code
                </p>
              </div>

              {/* Preview Section */}
              {(formData.name ||
                formData.mobile_number ||
                formData.qr_code) && (
                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h3 className="font-semibold text-[#504943] mb-3 font-cinzel">
                    Preview:
                  </h3>
                  <div className="space-y-2 text-sm">
                    {formData.name && (
                      <p>
                        <span className="font-medium text-gray-600">Name:</span>{" "}
                        {formData.name}
                      </p>
                    )}
                    {formData.mobile_number && (
                      <p>
                        <span className="font-medium text-gray-600">
                          Mobile:
                        </span>{" "}
                        {formData.mobile_number}
                      </p>
                    )}
                    {formData.qr_code && (
                      <p>
                        <span className="font-medium text-gray-600">
                          QR Code:
                        </span>{" "}
                        {formData.qr_code}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-lg bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 font-cinzel mt-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Adding Invitation...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Save Invitation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 font-cinzel text-sm">
          Wedding Invitation Flyer Generator © 2026
        </div>
      </div>
    </div>
  );
}
