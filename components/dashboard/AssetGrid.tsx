"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type Asset = {
  id: string;
  title: string;
  watermarkedUrl: string | null;
  originalUrl: string;
  pHash: string | null;
  createdAt: Date;
  _count: { detections: number };
};

export function AssetGrid({ assets }: { assets: Asset[] }) {
  if (!assets.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
        <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
          <Search className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No assets found</h3>
        <p className="text-slate-500 max-w-sm mb-6">You haven't registered any digital assets yet. Secure your first work to start monitoring.</p>
        <Link href="/assets/register">
          <Button className="bg-indigo-600 hover:bg-indigo-700">Register First Asset</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {assets.map((asset) => (
        <Card key={asset.id} className="overflow-hidden flex flex-col hover:border-indigo-200 hover:shadow-md transition-all">
          <div className="h-48 w-full bg-slate-100 relative group">
            <img 
              src={asset.watermarkedUrl || asset.originalUrl} 
              alt={asset.title}
              className="w-full h-full object-cover"
            />
            {asset.pHash && (
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded font-mono">
                pHash: {asset.pHash.substring(0, 8)}...
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Badge variant={asset._count.detections > 0 ? "destructive" : "secondary"}>
                {asset._count.detections} detections
              </Badge>
            </div>
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Link href={`/assets/${asset.id}`}>
                <Button variant="secondary" size="sm">View Details</Button>
              </Link>
            </div>
          </div>
          <CardContent className="flex-1 p-4">
            <h4 className="font-semibold text-lg line-clamp-1 text-slate-900 mb-1">{asset.title}</h4>
            <p className="text-xs text-slate-500">
              Registered {formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true })}
            </p>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Link href={`/assets/${asset.id}`} className="w-full">
              <Button variant="outline" className="w-full h-9 gap-2">
                <Search className="w-4 h-4" /> Scan Now
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
