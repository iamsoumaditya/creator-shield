"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, CheckCircle2, ShieldCheck, ArrowRight, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function RegisterAssetPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Watermark/Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [watermarkedUrl, setWatermarkedUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [pHash, setPHash] = useState<string | null>(null);
  
  // Details state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [licenseType, setLicenseType] = useState<string| null>("");
  const [tags, setTags] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const processWatermark = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/assets/process", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to process");
      setOriginalUrl(data.originalUrl);
      setWatermarkedUrl(data.watermarkedUrl);
      setPHash(data.pHash);
      setStep(2);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToSystem = async () => {
    setIsSaving(true);
    try {
      const fullUrl = new URL(`/public${originalUrl}`, window.location.origin).toString();
      const res = await fetch("/api/assets/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          licenseType,
          tags,
          pHash,
          originalUrl: fullUrl, // In real app, you'd upload original elsewhere or during /process
          watermarkedUrl
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save asset");
      
      toast.success("Asset beautifully secured and registered.");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopNavbar />
      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Register New Asset</h1>
          <p className="text-slate-500 mt-1">Embed invisible secure watermarks to protect your work.</p>
        </div>

        {/* Stepper Header */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 transition-all -z-10" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          
          {['Upload', 'Watermark', 'Details', 'Confirm'].map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isPast = step > stepNum;
            return (
              <div key={label} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 ${
                  isActive ? "bg-indigo-600 border-indigo-600 text-white" : 
                  isPast ? "bg-indigo-600 border-indigo-600 text-white" : 
                  "bg-white border-slate-300 text-slate-400"
                }`}>
                  {isPast ? <CheckCircle2 className="w-6 h-6" /> : stepNum}
                </div>
                <span className={`text-xs mt-2 font-medium ${isActive || isPast ? "text-indigo-900" : "text-slate-500"}`}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <Card className="border-dashed border-2 border-slate-300 shadow-none bg-white/50 hover:bg-white transition-colors">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              {!previewUrl ? (
                <>
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Upload your asset</h3>
                  <p className="text-slate-500 mb-8 max-w-sm">Drag and drop your image file here, or click to browse. Max size 10MB.</p>
                  <Input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" id="file-upload" onChange={handleFileChange} />
                  <Label htmlFor="file-upload">
                    <div className="bg-indigo-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-indigo-700 cursor-pointer transition-colors shadow-sm inline-flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Browse Files
                    </div>
                  </Label>
                </>
              ) : (
                <div className="w-full">
                  <div className="relative w-full max-w-lg mx-auto aspect-video rounded-lg overflow-hidden border bg-slate-100 mb-6">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => { setFile(null); setPreviewUrl(null); }}>Choose Another</Button>
                    <Button onClick={processWatermark} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700 w-40">
                      {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Embed Watermark"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Watermark */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <div className="p-4 font-semibold text-slate-700 border-b flex justify-between items-center">
                  Original
                </div>
                <div className="p-4 bg-slate-100 aspect-square flex items-center justify-center relative overflow-hidden">
                  <img src={previewUrl!} className="max-w-full max-h-full object-contain" />
                </div>
              </Card>
              <Card className="border-indigo-200 shadow-sm overflow-hidden">
                <div className="p-4 font-semibold text-indigo-900 border-b bg-indigo-50 flex justify-between items-center">
                  Secured & Watermarked
                  <Badge variant="default" className="bg-indigo-600"><ShieldCheck className="w-3 h-3 mr-1"/> Protected</Badge>
                </div>
                <div className="p-4 bg-slate-100 aspect-square flex items-center justify-center relative overflow-hidden group">
                  <img src={watermarkedUrl || previewUrl!} className="max-w-full max-h-full object-contain" />
                  <div className="absolute inset-0 bg-indigo-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 backdrop-blur text-xs px-3 py-2 text-indigo-900 font-mono shadow-sm rounded-md font-medium border border-indigo-100">
                      pHash: {pHash}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-700">Continue to Details <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Asset Title</Label>
                <Input id="title" placeholder="E.g. Neon Cyberpunk Landscape" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" placeholder="Brief description of the work" value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>License Type</Label>
                  <Select value={licenseType} onValueChange={setLicenseType}>
                    <SelectTrigger><SelectValue placeholder="Select license..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Rights Reserved">All Rights Reserved</SelectItem>
                      <SelectItem value="Creative Commons">Creative Commons</SelectItem>
                      <SelectItem value="Commercial OK">Commercial OK</SelectItem>
                      <SelectItem value="Personal Use Only">Personal Use Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input id="tags" placeholder="art, concept, sci-fi" value={tags} onChange={e => setTags(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t mt-8">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={() => {
                  if(!title) { toast.error("Title is required"); return; }
                  if(!licenseType) { toast.error("License is required"); return; }
                  setStep(4);
                }} className="bg-indigo-600 hover:bg-indigo-700">Review Summary</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <Card className="border-indigo-100 shadow-sm overflow-hidden">
            <div className="bg-indigo-50 p-6 border-b border-indigo-100">
              <h3 className="text-xl font-bold text-indigo-900">Review & Confirm</h3>
              <p className="text-indigo-700/80 text-sm">Please verify the details below before saving.</p>
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 bg-slate-100 rounded-lg aspect-square overflow-hidden border">
                   <img src={watermarkedUrl || previewUrl!} className="w-full h-full object-cover" />
                </div>
                <div className="w-full md:w-2/3 space-y-6">
                  <div>
                    <div className="text-sm text-slate-500 font-medium mb-1">Title</div>
                    <div className="text-lg font-semibold text-slate-900">{title}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-500 font-medium mb-1">License</div>
                      <Badge variant="outline" className="font-semibold">{licenseType}</Badge>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 font-medium mb-1">Digital Signature</div>
                      <div className="text-sm font-mono text-indigo-700 bg-indigo-50 inline-block px-2 py-1 rounded">
                        Valid <ShieldCheck className="w-3 h-3 inline ml-1"/>
                      </div>
                    </div>
                    <div className="col-span-2">
                       <div className="text-sm text-slate-500 font-medium mb-1">Tags</div>
                       <div className="flex gap-2 flex-wrap">
                         {tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                           <Badge key={t} variant="secondary" className="bg-slate-100 text-slate-600">{t}</Badge>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-8 mt-4">
                <Button variant="outline" onClick={() => setStep(3)} disabled={isSaving}>Back</Button>
                <Button onClick={saveToSystem} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 w-48 shadow-lg shadow-indigo-600/20">
                  {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Securing...</> : "Confirm Registration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
