import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Search, Send, CheckCircle2 } from "lucide-react";

type StatsProps = {
  totalAssets: number;
  activeDetections: number;
  takedownsSent: number;
  resolved: number;
};

export function StatsRow({ stats }: { stats: StatsProps }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Total Assets</CardTitle>
          <Layers className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{stats.totalAssets}</div>
          <p className="text-xs text-slate-500 mt-1">Protected works</p>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Active Detections</CardTitle>
          <Search className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{stats.activeDetections}</div>
          <p className="text-xs text-slate-500 mt-1">Requires review</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Takedowns Sent</CardTitle>
          <Send className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{stats.takedownsSent}</div>
          <p className="text-xs text-slate-500 mt-1">Pending resolution</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Resolved</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{stats.resolved}</div>
          <p className="text-xs text-slate-500 mt-1">Successfully protected</p>
        </CardContent>
      </Card>
    </div>
  );
}
