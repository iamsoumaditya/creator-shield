"use client";

import { use, useEffect, useState } from "react";
import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, Search, Image as ImageIcon, AlertTriangle, CheckCircle, ExternalLink, PenTool, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
 const { id } = use(params)
  const fetchAsset = async () => {
    try {
      const res = await fetch(`/api/assets/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAsset(data.asset);
    } catch (err: any) {
      toast.error(err.message || "Failed to load asset details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/assets/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Scan complete! Found ${data.newDetections} new matches.`);
      // Refresh to see detections
      fetchAsset();
    } catch (err: any) {
      toast.error(err.message || "Failed to run scan");
    } finally {
      setIsScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <TopNavbar />
        <div className="flex-1 flex items-center justify-center">
           <div className="animate-spin text-indigo-600"><Loader2 className="w-8 h-8"/></div>
        </div>
      </div>
    );
  }

  if (!asset) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopNavbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* Asset Hero Image */}
          <div className="w-full lg:w-1/3 bg-slate-200 rounded-xl overflow-hidden shadow-sm border aspect-square relative group">
            <img src={asset.watermarkedUrl || asset.originalUrl} alt={asset.title} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4">
              <Badge className="bg-indigo-600/90 backdrop-blur border-none"><ShieldCheck className="w-3 h-3 mr-1" /> Protected</Badge>
            </div>
          </div>
          
          {/* Asset Hero Meta */}
          <div className="w-full lg:w-2/3 flex flex-col justify-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">{asset.title}</h1>
            <p className="text-slate-500 mb-6 text-lg">{asset.description || "No description provided."}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div>
                <div className="text-xs text-slate-500 font-medium mb-1">pHash Signature</div>
                <div className="font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded text-sm inline-block truncate max-w-full">
                  {asset.pHash ? asset.pHash.substring(0,16)+"..." : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium mb-1">Registration Date</div>
                <div className="font-medium text-slate-800">{new Date(asset.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium mb-1">Detections</div>
                <div className="font-bold text-slate-800">{asset.detections?.length || 0}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium mb-1">Original File</div>
                <a href={asset.originalUrl} target="_blank" className="text-indigo-600 hover:underline flex items-center text-sm font-medium">
                  View <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>

            <div>
              <Button onClick={handleScan} disabled={isScanning} className="bg-indigo-600 hover:bg-indigo-700 shadow-md h-12 px-6">
                {isScanning ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Scanning Global Web...</>
                ) : (
                  <><Search className="w-5 h-5 mr-2" /> Scan the Web Now</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Detections Table Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-slate-900">Matches & Detections</h2>
              <TabsList className="bg-slate-100">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unauthorized" className="text-rose-600 data-[state=active]:text-rose-700">Unauthorized</TabsTrigger>
                <TabsTrigger value="reviewing" className="text-amber-600 data-[state=active]:text-amber-700">Reviewing</TabsTrigger>
                <TabsTrigger value="resolved" className="text-emerald-600 data-[state=active]:text-emerald-700">Resolved</TabsTrigger>
              </TabsList>
            </div>

            {/* Detections Table component extracted within page for simplicity */}
            <TabsContent value="all" className="m-0">
              <DetectionsTable detections={asset.detections} filter="ALL" />
            </TabsContent>
            <TabsContent value="unauthorized" className="m-0">
               <DetectionsTable detections={asset.detections} filter="UNAUTHORIZED" />
            </TabsContent>
            <TabsContent value="reviewing" className="m-0">
               <DetectionsTable detections={asset.detections} filter="REVIEWING" />
            </TabsContent>
             <TabsContent value="resolved" className="m-0">
               <DetectionsTable detections={asset.detections} filter="RESOLVED" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function DetectionsTable({ detections, filter }: { detections: any[], filter: string }) {
  const filtered = filter === "ALL" ? detections : detections.filter(d => d.status === filter);

  if (!filtered || filtered.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-900">All clear</h3>
        <p className="text-slate-500">No matching detections found for this filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
          <tr>
            <th className="px-4 py-3 font-medium">Infringing URL</th>
            <th className="px-4 py-3 font-medium">Match Score</th>
            <th className="px-4 py-3 font-medium text-center">Status</th>
            <th className="px-4 py-3 font-medium text-center">Found</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(detection => (
            <tr key={detection.id} className="border-b last:border-0 hover:bg-slate-50/50">
              <td className="px-4 py-4 max-w-[200px] truncate">
                <a href={detection.infringingUrl} target="_blank" className="font-medium text-indigo-600 hover:underline">
                  {detection.infringingUrl}
                </a>
              </td>
              <td className="px-4 py-4 w-48">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
                  {Math.round(detection.matchScore * 100)}% Match
                </div>
                <Progress value={detection.matchScore * 100} className="h-2 bg-slate-200" />
              </td>
              <td className="px-4 py-4 text-center">
                {detection.status === "UNAUTHORIZED" && <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none select-none">Unauthorized</Badge>}
                {detection.status === "REVIEWING" && <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none select-none">Reviewing</Badge>}
                {detection.status === "RESOLVED" && <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 select-none">Resolved</Badge>}
                {detection.status === "LICENSED" && <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 select-none">Licensed</Badge>}
              </td>
              <td className="px-4 py-4 text-center text-slate-500 whitespace-nowrap">
                {formatDistanceToNow(new Date(detection.createdAt), { addSuffix: true })}
              </td>
              <td className="px-4 py-4 text-right">
                <Link href={`/takedown/${detection.id}`}>
                   <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                     <PenTool className="w-4 h-4 mr-2" /> Draft Takedown
                   </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
