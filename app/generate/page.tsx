"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Download, Home } from "lucide-react";
import QRCode from "qrcode";

export default function GenerateFlyerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [qrCodeData, setQrCodeData] = useState("");
  const [name, setName] = useState("");
  const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null);
  const [qrImage, setQrImage] = useState<string>("");
  const [compositeImage, setCompositeImage] = useState<string>("");

  useEffect(() => {
    const code = searchParams.get("code");
    const personName = searchParams.get("name");

    if (!code || !personName) {
      router.push("/");
      return;
    }

    setQrCodeData(code);
    setName(decodeURIComponent(personName));

    // Load frame and generate QR
    Promise.all([loadFrameImage(), generateQRCode(code)]).then(() => {
      setLoading(false);
    });
  }, [searchParams, router]);

  const loadFrameImage = (): Promise<void> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = "/frame.jpeg"; // Make sure this matches your filename
      img.onload = () => {
        setFrameImage(img);
        resolve();
      };
    });
  };

  const generateQRCode = async (data: string): Promise<void> => {
    try {
      const qrDataURL = await QRCode.toDataURL(data, {
        width: 200,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrImage(qrDataURL);
    } catch (err) {
      console.error("QR generation failed:", err);
    }
  };

  // Create composite image when all assets are loaded
  useEffect(() => {
    if (!loading && frameImage && qrImage && canvasRef.current) {
      createCompositeImage();
    }
  }, [loading, frameImage, qrImage]);

  const createCompositeImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !frameImage || !qrImage) return;

    // Set canvas dimensions to match frame
    canvas.width = frameImage.width;
    canvas.height = frameImage.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw frame first
    ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);

    // Draw name
    ctx.font = 'bold 40px "Cinzel", serif';
    ctx.fillStyle = "#504943";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Position name - adjust these coordinates based on your frame
    const nameX = canvas.width / 2; // Center horizontally
    const nameY = canvas.height * 0.53; // 47% from top (adjust as needed)

    ctx.fillText(name, nameX, nameY);

    // Load and draw QR code
    const qrImg = new window.Image();
    qrImg.crossOrigin = "anonymous";
    qrImg.onload = () => {
      // Position QR - adjust these coordinates based on your frame
      const qrSize = 285; // Size of QR code
      const qrX = (canvas.width - qrSize) / 2; // Center horizontally
      const qrY = canvas.height * 0.59; // 60% from top (adjust as needed)

      // Draw white background for QR
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

      // Draw QR code
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Convert canvas to data URL
      setCompositeImage(canvas.toDataURL("image/png"));
    };
    qrImg.src = qrImage;
  };

  const handleDownload = () => {
    if (!compositeImage) return;

    const link = document.createElement("a");
    link.download = `wedding-${name.replace(/\s+/g, "_")}-${qrCodeData}.png`;
    link.href = compositeImage;
    link.click();
  };

  const handlePrint = () => {
    if (!compositeImage) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Wedding Flyer - ${name}</title>
            <style>
              body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: white;
              }
              img {
                max-width: 100%;
                height: auto;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }
              @media print {
                body { background: white; }
                img { box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <img src="${compositeImage}" />
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600 font-cinzel">Creating your flyer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>

          <Button variant="ghost" onClick={() => router.push("/")}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </div>

        {/* Main Content */}
        <Card className="p-6 md:p-8 bg-white/95 backdrop-blur shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#504943] mb-2 font-cinzel">
              Your Wedding Invitation
            </h2>
            <p className="text-gray-500 font-cinzel text-lg">{name}</p>
          </div>

          {/* Composite Image Preview */}
          {compositeImage && (
            <div className="mb-8 flex justify-center">
              <div className="relative rounded-xl shadow-2xl overflow-hidden max-w-2xl">
                <img
                  src={compositeImage}
                  alt={`Wedding flyer for ${name}`}
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
            <Button
              onClick={handleDownload}
              className="bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 h-12 px-8 text-lg font-cinzel"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Flyer
            </Button>

            <Button
              onClick={handlePrint}
              variant="outline"
              className="h-12 px-8 text-lg border-2 border-amber-600 text-amber-700 hover:bg-amber-50 font-cinzel"
            >
              🖨️ Print Flyer
            </Button>
          </div>

          {/* QR Code Info */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500 bg-amber-50 inline-block px-4 py-2 rounded-full">
              <span className="font-semibold">QR Code contains:</span>{" "}
              {qrCodeData}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
