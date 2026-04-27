"use client";

import { useSignUp } from "@clerk/nextjs/legacy";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [creatorType, setCreatorType] = useState<string|null>("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress,
        password,
        firstName: fullName.split(" ")[0] || "",
        lastName: fullName.split(" ").slice(1).join(" ") || "",
        unsafeMetadata: {
          creatorType,
          portfolioUrl
        }
      });
      
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError("");
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status !== 'complete') {
        console.log(JSON.stringify(completeSignUp, null, 2));
        setError("Verification incomplete. Please check your code.");
      }
      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Brand Panel */}
      <div className="hidden lg:flex w-1/2 bg-indigo-600 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-12 h-12" />
            <h1 className="text-4xl font-bold tracking-tight">CreatorShield</h1>
          </div>
          <p className="text-xl text-indigo-100">
            Digital Asset Protection Platform. Register, watermark, and defend your creations across the web.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
            <p className="text-slate-500">Enter your details to register as a creator.</p>
          </div>

          {!pendingVerification && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Jane Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="jane@example.com" required value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="creatorType">Creator Type</Label>
                <Select value={creatorType} onValueChange={setCreatorType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Photographer">Photographer</SelectItem>
                    <SelectItem value="Digital Artist">Digital Artist</SelectItem>
                    <SelectItem value="Illustrator">Illustrator</SelectItem>
                    <SelectItem value="Videographer">Videographer</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolioUrl">Portfolio URL (Optional)</Label>
                <Input id="portfolioUrl" type="url" placeholder="https://..." value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} />
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="absolute right-3 top-2.5 text-slate-400" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>

              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? "Registering..." : "Register"}
              </Button>
              <div id="clerk-captcha"></div>
            </form>
          )}

          {pendingVerification && (
            <form onSubmit={onPressVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input id="code" placeholder="Enter code sent to email" required value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? "Checking..." : "Verify Email"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500">
            Already have an account? <a href="/auth/login" className="text-indigo-600 hover:underline">Log in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
