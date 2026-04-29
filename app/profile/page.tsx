import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { syncUserToDatabase } from "@/lib/user-sync";
import { ProfileForm } from "./ProfileForm";
import { TopNavbar } from "@/components/dashboard/TopNavbar";

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const syncedUser = await syncUserToDatabase(user);

  const profile = await db.query.users.findFirst({
    where: eq(users.id, syncedUser.id),
  });

  if (!profile) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopNavbar />
      <div className="container mx-auto max-w-4xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profile</h1>
          <p className="mt-1 text-slate-500">Keep your rights-holder details current so notices come out polished and complete.</p>
        </div>
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
