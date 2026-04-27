"use client";

import { useSignIn } from "@clerk/nextjs/legacy";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        console.log(result);
        setError("Sign in is incomplete. You might need to verify your email first.");
      }
    } catch (err: any) {
      console.error("error", err.errors?.[0]?.longMessage);
      setError(err.errors?.[0]?.message || "Invalid email or password.");
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
            Welcome back. Sign in to monitor your digital assets and protected content.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Login</h2>
            <p className="text-slate-500">Enter your credentials to access your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="jane@example.com" required value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
            </div>

            <div className="space-y-2 relative">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-sm text-indigo-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="absolute right-3 top-2.5 text-slate-400" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div id="clerk-captcha"></div>
          </form>

          <p className="text-center text-sm text-slate-500">
            Don't have an account? <Link href="/auth/register" className="text-indigo-600 hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
