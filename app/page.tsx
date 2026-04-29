import Link from "next/link";
import { ArrowRight, ShieldCheck, Search, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";

export default async function LandingPage() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Navigation */}
      <nav className="w-full border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <ShieldCheck className="w-6 h-6" />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              CreatorShield
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 leading-tight">
              Protect Your Digital Legacy <br className="hidden sm:block" />
              Before It's Stolen.
            </h1>

            <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              CreatorShield uses steganographic watermarking, global web
              scanning, and automated AI takedowns to ensure your creative work
              remains yours.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isSignedIn ? "/dashboard" : "/auth/login"}>
                <Button
                  size="lg"
                  className="h-12 px-8 text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  {isSignedIn ? "Go to Dashboard" : "Start Protecting Now"}{" "}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base border-slate-200 text-slate-700 hover:bg-slate-100 bg-white shadow-sm"
                >
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-20 bg-white border-y border-slate-100"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-slate-900">
                The Ultimate Defense System
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                A comprehensive suite of tools designed to track, identify, and
                resolve copyright infringement automatically.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:border-indigo-100 hover:bg-indigo-50/50">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-6">
                  <Lock className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">
                  Invisible Watermarks
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  We embed cryptographic metadata directly into the pixels of
                  your images using advanced steganography. It's invisible to
                  the eye but acts as an undeniable proof of ownership.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:border-indigo-100 hover:bg-indigo-50/50">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-6">
                  <Search className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">
                  Global Web Scanning
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Powered by Google Cloud Vision, our platform continuously
                  scours the internet to find where your assets are being used
                  without authorization.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:border-indigo-100 hover:bg-indigo-50/50">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">
                  AI DMCA Takedowns
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  When infringement is detected, our integrated Gemini AI drafts
                  a legally sound, formally formatted DMCA takedown notice
                  specific to the infringing platform in seconds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-slate-900">
              Ready to secure your work?
            </h2>
            <p className="text-slate-500 text-lg mb-8 max-w-2xl mx-auto">
              Join creators who trust CreatorShield to monitor, protect, and
              defend their digital assets across the web.
            </p>
            <Link href={isSignedIn ? "/dashboard" : "/auth/login"}>
              <Button
                size="lg"
                className="h-12 px-10 text-base bg-slate-900 text-white hover:bg-slate-800 shadow-md"
              >
                {isSignedIn ? "Open Dashboard" : "Sign In"}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t bg-white text-center text-slate-400 text-sm">
        <p>
          &copy; {new Date().getFullYear()} CreatorShield. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
