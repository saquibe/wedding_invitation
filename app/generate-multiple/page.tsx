"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Download, DownloadCloud } from "lucide-react";
import QRCode from "qrcode";
import JSZip from "jszip";

export default function GenerateMultiplePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [flyers, setFlyers] = useState<
    Array<{
      name: string;
      code: string;
      mobile: string;
      compositeImage: string;
    }>
  >([]);
  const [downloading, setDownloading] = useState(false);
  const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [params, setParams] = useState<{
    codes: string[];
    names: string[];
    mobiles: string[];
  } | null>(null);

  // Load frame image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = "/frame.jpeg";
    img.onload = () => {
      setFrameImage(img);
      setFrameLoaded(true);
    };
  }, []);

  // Get URL params
  useEffect(() => {
    const codes = searchParams.get("codes");
    const names = searchParams.get("names");
    const mobiles = searchParams.get("mobiles");

    if (!codes || !names) {
      router.push("/");
      return;
    }

    setParams({
      codes: codes.split(","),
      names: names.split("|"),
      mobiles: mobiles ? mobiles.split(",") : [],
    });
  }, [searchParams, router]);

  useEffect(() => {
    if (frameLoaded && params && loading) {
      loadAllFlyers(params.codes, params.names, params.mobiles);
    }
  }, [frameLoaded, params, loading]);

  const createCompositeImage = async (
    frame: HTMLImageElement,
    name: string,
    qrDataURL: string,
  ): Promise<string> => {
    // 🔥 Ensure Cinzel font is fully loaded
    await document.fonts.load("700 50px Cinzel");

    const canvas = document.createElement("canvas");
    canvas.width = frame.width;
    canvas.height = frame.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context failed");

    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

    // ✅ Premium Cinzel usage
    ctx.font = "700 50px Cinzel";
    ctx.fillStyle = "#504943";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const nameX = canvas.width / 2;
    const nameY = canvas.height * 0.53;

    ctx.fillText(name.toUpperCase(), nameX, nameY);

    const qrImg = new window.Image();
    qrImg.crossOrigin = "anonymous";
    qrImg.src = qrDataURL;

    await new Promise((res, rej) => {
      qrImg.onload = res;
      qrImg.onerror = rej;
    });

    const qrSize = 285;
    const qrX = (canvas.width - qrSize) / 2;
    const qrY = canvas.height * 0.59;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    return canvas.toDataURL("image/png");
  };

  const loadAllFlyers = async (
    codes: string[],
    names: string[],
    mobiles: string[],
  ) => {
    if (!frameImage) return;

    const flyerData = [];

    for (let i = 0; i < codes.length; i++) {
      const qrDataURL = await QRCode.toDataURL(codes[i]);

      const compositeImage = await createCompositeImage(
        frameImage,
        names[i],
        qrDataURL,
      );

      flyerData.push({
        name: names[i].toUpperCase(),
        code: codes[i],
        mobile: mobiles[i] || "",
        compositeImage,
      });
    }

    setFlyers(flyerData);
    setLoading(false);
  };

  const downloadSingle = (
    compositeImage: string,
    name: string,
    code: string,
  ) => {
    const link = document.createElement("a");
    link.download = `wedding-${name.replace(/\s+/g, "_")}-${code}.png`;
    link.href = compositeImage;
    link.click();
  };

  const downloadAll = async () => {
    setDownloading(true);

    const zip = new JSZip();

    for (const flyer of flyers) {
      const base64Data = flyer.compositeImage.split(",")[1];
      zip.file(
        `wedding-${flyer.name.replace(/\s+/g, "_")}-${flyer.code}.png`,
        base64Data,
        { base64: true },
      );
    }

    const content = await zip.generateAsync({ type: "blob" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "all-wedding-flyers.zip";
    link.click();

    setDownloading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <Loader2 className="h-12 w-12 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4">
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {flyers.length > 1 && (
            <Button
              onClick={downloadAll}
              disabled={downloading}
              className="bg-gradient-to-r from-amber-600 to-red-600"
            >
              <DownloadCloud className="mr-2 h-4 w-4" />
              Download All ({flyers.length})
            </Button>
          )}
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#504943] font-cinzel">
            Family Wedding Flyers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {flyers.map((flyer) => (
            <Card key={flyer.code} className="p-4 bg-white/95">
              <div className="text-center mb-4">
                <h3 className="font-cinzel text-[#504943] font-semibold text-lg tracking-wide">
                  {flyer.name}
                </h3>
              </div>

              <div className="mb-4 flex justify-center">
                <div className="rounded-xl shadow-lg overflow-hidden border-2 border-amber-100">
                  <img
                    src={flyer.compositeImage}
                    alt={flyer.name}
                    className="w-full max-h-[300px] object-contain"
                  />
                </div>
              </div>

              <Button
                onClick={() =>
                  downloadSingle(flyer.compositeImage, flyer.name, flyer.code)
                }
                variant="outline"
                className="w-full border-amber-500 text-amber-700 font-cinzel"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
