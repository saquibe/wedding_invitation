"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  Download,
  DownloadCloud,
  Users,
} from "lucide-react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import JSZip from "jszip";

export default function GenerateMultiplePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [flyers, setFlyers] = useState<
    Array<{ name: string; code: string; mobile: string; qrImage: string }>
  >([]);
  const [downloading, setDownloading] = useState(false);
  const flyerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const codes = searchParams.get("codes");
    const names = searchParams.get("names");
    const mobiles = searchParams.get("mobiles");

    if (!codes || !names) {
      router.push("/");
      return;
    }

    const codeArray = codes.split(",");
    const nameArray = names.split("|");
    const mobileArray = mobiles ? mobiles.split(",") : [];

    loadAllQRs(codeArray, nameArray, mobileArray);
  }, [searchParams, router]);

  const loadAllQRs = async (
    codes: string[],
    names: string[],
    mobiles: string[],
  ) => {
    const flyerData = [];

    for (let i = 0; i < codes.length; i++) {
      try {
        const qrDataURL = await QRCode.toDataURL(codes[i], {
          width: 200,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        flyerData.push({
          name: names[i],
          code: codes[i],
          mobile: mobiles[i] || "",
          qrImage: qrDataURL,
        });
      } catch (err) {
        console.error(`Failed to generate QR for ${codes[i]}:`, err);
      }
    }

    setFlyers(flyerData);
    setLoading(false);
  };

  const downloadSingle = async (code: string) => {
    const element = flyerRefs.current[code];
    if (!element) return;

    try {
      const canvas = await html2canvas(
        element as HTMLElement,
        {
          scale: 2,
          backgroundColor: null,
          allowTaint: true,
          useCORS: true,
        } as any,
      );

      const link = document.createElement("a");
      link.download = `wedding-flyer-${code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const downloadAll = async () => {
    setDownloading(true);
    const zip = new JSZip();

    for (const flyer of flyers) {
      const element = flyerRefs.current[flyer.code];
      if (element) {
        try {
          const canvas = await html2canvas(
            element as HTMLElement,
            {
              scale: 2,
              backgroundColor: null,
              allowTaint: true,
              useCORS: true,
            } as any,
          );

          const imgData = canvas.toDataURL("image/png").split(",")[1];
          zip.file(
            `flyer-${flyer.name.replace(/\s+/g, "_")}-${flyer.code}.png`,
            imgData,
            { base64: true },
          );
        } catch (err) {
          console.error(`Failed to capture ${flyer.code}:`, err);
        }
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "all-family-flyers.zip";
    link.click();

    setDownloading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4">
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>

          {flyers.length > 1 && (
            <Button
              onClick={downloadAll}
              disabled={downloading}
              className="bg-gradient-to-r from-amber-600 to-red-600"
            >
              {downloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating ZIP...
                </>
              ) : (
                <>
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Download All ({flyers.length})
                </>
              )}
            </Button>
          )}
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#504943] mb-2 font-cinzel">
            Family Wedding Flyers
          </h2>
          <p className="text-gray-600">
            Found {flyers.length} family member{flyers.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {flyers.map((flyer) => (
            <Card key={flyer.code} className="p-4 bg-white">
              <div className="text-center mb-4">
                <h3 className="font-cinzel text-[#504943] font-semibold text-lg">
                  {flyer.name}
                </h3>
                <p className="text-xs text-gray-500">Code: {flyer.code}</p>
              </div>

              {/* Flyer Preview */}
              <div
                ref={(el) => {
                  flyerRefs.current[flyer.code] = el;
                }}
                className="relative w-full aspect-[4/3] overflow-hidden rounded-lg shadow-lg mb-4"
                style={{
                  backgroundImage: "url('/frame.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Name Overlay */}
                <div
                  className="absolute"
                  style={{
                    top: "45%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  <span
                    className="font-cinzel"
                    style={{
                      fontSize: "19px",
                      color: "#504943",
                      fontWeight: 500,
                    }}
                  >
                    {flyer.name}
                  </span>
                </div>

                {/* QR Code Overlay */}
                <div
                  className="absolute"
                  style={{
                    top: "60%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "100px",
                    height: "100px",
                    backgroundColor: "white",
                    padding: "6px",
                    borderRadius: "6px",
                  }}
                >
                  <img
                    src={flyer.qrImage}
                    alt="QR Code"
                    className="w-full h-full"
                  />
                </div>
              </div>

              <Button
                onClick={() => downloadSingle(flyer.code)}
                variant="outline"
                className="w-full border-amber-500 text-amber-700 hover:bg-amber-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Download {flyer.name.split(" ")[0]}'s Flyer
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
