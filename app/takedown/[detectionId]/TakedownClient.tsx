"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gavel, Copy, Download, CheckCircle2, Bot, ArrowLeft, Eye, PencilLine } from "lucide-react";
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
    const html = markdownToHtml(draft);
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
      const item = new ClipboardItem({
        "text/plain": new Blob([draft], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      });
      navigator.clipboard.write([item]);
    } else {
      navigator.clipboard.writeText(draft);
    }
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
                     src={asset.watermarkedUrl || asset.originalUrl} 
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

              <div className="flex-1 min-h-[360px] overflow-hidden rounded-md border bg-slate-50">
                {draft ? (
                  <Tabs defaultValue="edit" className="h-full gap-0">
                    <div className="border-b bg-white px-3 py-2">
                      <TabsList className="bg-slate-100">
                        <TabsTrigger value="edit" className="gap-2">
                          <PencilLine className="w-4 h-4" /> Edit
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="gap-2">
                          <Eye className="w-4 h-4" /> Preview
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="edit" className="m-0 h-[320px]">
                      <Textarea
                        className="h-full min-h-full rounded-none border-0 bg-transparent p-4 font-mono text-sm leading-relaxed shadow-none focus-visible:ring-0"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                      />
                    </TabsContent>
                    <TabsContent value="preview" className="m-0 h-[320px] overflow-auto bg-white p-6">
                      <div
                        className="space-y-3 text-sm leading-7 text-slate-800"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(draft) }}
                      />
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="flex h-full min-h-[360px] flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
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

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function markdownToHtml(input: string) {
  const escaped = escapeHtml(input);
  const paragraphs = escaped.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return paragraphs
    .map((block) => {
      const withBold = block.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      const withBreaks = withBold.replace(/\n/g, "<br />");
      return `<p>${withBreaks}</p>`;
    })
    .join("");
}
