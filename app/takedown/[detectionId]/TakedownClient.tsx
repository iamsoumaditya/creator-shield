"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Gavel, Copy, Download, CheckCircle2, Bot, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type TakedownDetection = {
  id: string;
  infringingUrl: string;
  matchScore: number;
  createdAt: string | Date;
  takedownDraft?: string | null;
};

type TakedownAsset = {
  id: string;
  title: string;
  watermarkedUrl: string | null;
  originalUrl: string;
  pHash?: string | null;
};

export function TakedownClient({ detection, asset }: { detection: TakedownDetection; asset: TakedownAsset }) {
  const router = useRouter();
  const [platform, setPlatform] = useState<string | null>("Google Search");
  const [draft, setDraft] = useState(detection.takedownDraft || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const generateNotice = async () => {
    if (!platform) {
       toast.error("Please select a platform first.");
       return;
    }

    setIsGenerating(true);
    setDraft(""); // clear current
    
    try {
      const response = await fetch("/api/takedown/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          detectionId: detection.id,
          platform,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate takedown notice");
      }

      if (!response.body) throw new Error("No response body");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let text = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        text += chunkValue;
        setDraft(text);
      }
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate takedown notice";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft);
    toast.success("Copied to clipboard");
  };

  const downloadTxt = () => {
    const blob = new Blob([draft], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DMCA_Notice_${asset.title.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const markAsSent = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/takedown/${detection.id}/resolve`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Detection marked as RESOLVED.");
      router.push("/dashboard#takedowns");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href={`/assets/${asset.id}`} className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Asset
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-4">Draft Takedown Notice</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Panel: Context */}
        <div className="w-full lg:w-1/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Infringement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                 <div className="text-xs text-slate-500 font-medium mb-1">Protected Asset</div>
                 <div className="flex gap-4 items-center bg-slate-50 p-2 rounded border">
                   <img 
                     src={asset.watermarkedUrl || (asset.originalUrl?.match(/[/\\]/) ? `/uploads/${asset.originalUrl.split(/[/\\]/).pop()}` : asset.originalUrl)} 
                     alt={asset.title} 
                     className="w-12 h-12 rounded object-cover" 
                   />
                   <div>
                     <div className="font-semibold text-sm">{asset.title}</div>
                     <Badge variant="outline" className="mt-1 text-xs">{asset.pHash ? asset.pHash.substring(0,8)+"..." : "No Hash"}</Badge>
                   </div>
                 </div>
               </div>

               <div>
                 <div className="text-xs text-slate-500 font-medium mb-1">Infringing URL</div>
                 <a href={detection.infringingUrl} target="_blank" className="text-sm font-medium text-indigo-600 break-all leading-tight hover:underline">
                   {detection.infringingUrl}
                 </a>
               </div>

               <div>
                 <div className="text-xs text-slate-500 font-medium mb-1">Match Confidence</div>
                 <div className="flex items-center gap-2">
                   <div className="text-xl font-bold">{Math.round(detection.matchScore * 100)}%</div>
                   <Badge variant="destructive" className="bg-rose-100 text-rose-700">High Match</Badge>
                 </div>
               </div>

               <div>
                 <div className="text-xs text-slate-500 font-medium mb-1">Detection Date</div>
                 <div className="text-sm font-medium text-slate-800">{new Date(detection.createdAt).toLocaleString()}</div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Generator */}
        <div className="w-full lg:w-2/3">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="flex items-center gap-2">
                 <Gavel className="w-5 h-5 text-indigo-600" />
                 Notice Generator
              </CardTitle>
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 font-mono">Powered by Gemini AI</Badge>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Platform to Notify</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Google Search">Google Search</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Twitter/X">Twitter/X</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="Cloudflare">Cloudflare</SelectItem>
                      <SelectItem value="Other">Other (Generic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={generateNotice} disabled={isGenerating || !platform} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm w-full md:w-auto">
                  {isGenerating ? <><Bot className="w-4 h-4 mr-2 animate-bounce" /> Drafting...</> : <><Bot className="w-4 h-4 mr-2" /> Generate Notice</>}
                </Button>
              </div>

              <div className="flex-1 min-h-[300px] border rounded-md bg-slate-50 overflow-hidden relative">
                 {draft ? (
                   <textarea
                     className="w-full h-full p-4 bg-transparent outline-none resize-none font-mono text-sm leading-relaxed"
                     value={draft}
                     onChange={(e) => setDraft(e.target.value)}
                   />
                 ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-3">
                     <Gavel className="w-12 h-12 text-slate-200" />
                     <p>Select a platform and generate your legally-sound DMCA takedown draft.</p>
                   </div>
                 )}
              </div>

              <div className="flex flex-wrap gap-3 items-center justify-between pt-4 border-t">
                <div className="flex gap-2 w-full md:w-auto">
                   <Button variant="outline" onClick={copyToClipboard} disabled={!draft} className="flex-1 md:flex-none">
                     <Copy className="w-4 h-4 mr-2" /> Copy
                   </Button>
                   <Button variant="outline" onClick={downloadTxt} disabled={!draft} className="flex-1 md:flex-none">
                     <Download className="w-4 h-4 mr-2" /> Download
                   </Button>
                </div>
                <Button onClick={markAsSent} disabled={isUpdating} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-sm">
                   {isUpdating ? "Updating..." : <><CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Sent & Resolved</>}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
