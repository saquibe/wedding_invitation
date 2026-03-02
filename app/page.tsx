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
import { Loader2, Search, Users, User, PlusCircle } from "lucide-react";

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      setError("Please enter a name or mobile number");
      return;
    }

    setLoading(true);
    setError("");
    setSearchResults([]);
    setSearched(false);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchTerm: searchTerm.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.results || []);
        setSearched(true);
      } else {
        setError(data.error || "Search failed");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSingle = (qrCode: string, name: string) => {
    router.push(`/generate?code=${qrCode}&name=${encodeURIComponent(name)}`);
  };

  const handleGenerateMultiple = () => {
    if (searchResults.length > 0) {
      const codes = searchResults.map((r) => r.qr_code).join(",");
      const names = searchResults.map((r) => r.name).join("|");
      const mobiles = searchResults.map((r) => r.mobile_number).join(",");

      router.push(
        `/generate-multiple?codes=${codes}&names=${encodeURIComponent(names)}&mobiles=${mobiles}`,
      );
    }
  };

  const handleAddNewInvitation = () => {
    router.push("/add-invitation");
  };

  const isMobileSearch = /^\d{10}$/.test(searchTerm);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto pt-16">
        {/* Header with Add Button */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-[#504943] mb-4 font-cinzel">
            <div className="flex justify-end mb-4">
              <Button
                onClick={handleAddNewInvitation}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-cinzel"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add New Invitation
              </Button>
            </div>
            Wedding Invitation
          </h1>
          <p className="text-xl text-gray-600 font-cinzel">
            Generate your personalized flyer
          </p>
        </div>

        {/* Search Card */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-[#504943] font-cinzel">
              Search by Name or Mobile Number
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your full name or 10-digit mobile number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g., Your Name or 1234567890"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-lg border-2 border-amber-200 focus:border-amber-400"
                  required
                />
                <Search className="absolute left-4 top-4 h-6 w-6 text-amber-400" />
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 font-cinzel"
                disabled={loading || !searchTerm.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </form>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Search Results */}
            {searched && searchResults.length > 0 && (
              <div className="mt-8">
                {/* If mobile search with multiple results, show "Generate All" button */}
                {isMobileSearch && searchResults.length > 1 ? (
                  <>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-[#504943] flex items-center">
                            <Users className="h-5 w-5 mr-2 text-amber-600" />
                            Found {searchResults.length} family members
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            This mobile number is associated with{" "}
                            {searchResults.length} people
                          </p>
                        </div>
                        <Button
                          onClick={handleGenerateMultiple}
                          className="bg-gradient-to-r from-amber-600 to-red-600"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Generate All ({searchResults.length})
                        </Button>
                      </div>
                    </div>

                    {/* Show individual members */}
                    <h4 className="text-md font-semibold text-gray-700 mb-3">
                      Individual Members:
                    </h4>
                    <div className="space-y-3">
                      {searchResults.map((result, index) => (
                        <Card
                          key={index}
                          className="p-4 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-[#504943] font-cinzel text-lg">
                                {result.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Mobile: {result.mobile_number}
                              </p>
                              <p className="text-xs text-gray-400">
                                Code: {result.qr_code}
                              </p>
                            </div>
                            <Button
                              onClick={() =>
                                handleGenerateSingle(
                                  result.qr_code,
                                  result.name,
                                )
                              }
                              variant="outline"
                              className="border-amber-500 text-amber-700 hover:bg-amber-50"
                            >
                              <User className="mr-2 h-4 w-4" />
                              Generate
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  // Single result (either name search or mobile with one result)
                  <div className="space-y-3">
                    {searchResults.map((result, index) => (
                      <Card
                        key={index}
                        className="p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-[#504943] font-cinzel text-xl">
                              {result.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Mobile: {result.mobile_number}
                            </p>
                            <p className="text-xs text-gray-400">
                              Code: {result.qr_code}
                            </p>
                          </div>
                          <Button
                            onClick={() =>
                              handleGenerateSingle(result.qr_code, result.name)
                            }
                            className="bg-gradient-to-r from-amber-600 to-red-600 h-12 px-6"
                          >
                            Generate Flyer
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {searched && searchResults.length === 0 && !error && (
              <div className="text-center py-8 text-gray-500">
                No records found for "{searchTerm}"
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={handleAddNewInvitation}
            className="text-amber-600 hover:text-amber-800 font-cinzel"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Need to add a new invitation? Click here
          </Button>
        </div>

        {/* Decorative Footer */}
        <div className="text-center mt-8 text-gray-500 font-cinzel text-sm">
          Wedding Invitation Flyer Generator © 2026
        </div>
      </div>
    </div>
  );
}
