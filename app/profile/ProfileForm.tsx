"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type ProfileFormProps = {
  profile: {
    name: string;
    email: string;
    creatorType: string | null;
    portfolioUrl: string | null;
    companyName: string | null;
    websiteUrl: string | null;
    instagramHandle: string | null;
    xHandle: string | null;
    location: string | null;
    bio: string | null;
  };
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [creatorType, setCreatorType] = useState(profile.creatorType ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolioUrl ?? "");
  const [companyName, setCompanyName] = useState(profile.companyName ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(profile.websiteUrl ?? "");
  const [instagramHandle, setInstagramHandle] = useState(profile.instagramHandle ?? "");
  const [xHandle, setXHandle] = useState(profile.xHandle ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorType,
          portfolioUrl,
          companyName,
          websiteUrl,
          instagramHandle,
          xHandle,
          location,
          bio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      toast.success("Profile updated.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={profile.name} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Creator Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Creator Type</Label>
              <Select value={creatorType} onValueChange={setCreatorType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Photographer">Photographer</SelectItem>
                  <SelectItem value="Digital Artist">Digital Artist</SelectItem>
                  <SelectItem value="Illustrator">Illustrator</SelectItem>
                  <SelectItem value="Videographer">Videographer</SelectItem>
                  <SelectItem value="Designer">Designer</SelectItem>
                  <SelectItem value="Writer">Writer</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
            </div>
            <div className="space-y-2">
              <Label>Portfolio URL</Label>
              <Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://portfolio.example" />
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yourwebsite.com" />
            </div>
            <div className="space-y-2">
              <Label>Company or Studio</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Instagram Handle</Label>
              <Input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@yourhandle" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>X Handle</Label>
              <Input value={xHandle} onChange={(e) => setXHandle(e.target.value)} placeholder="@yourhandle" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Short Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short rights-holder bio for legal notices and profile context." className="min-h-32" />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
