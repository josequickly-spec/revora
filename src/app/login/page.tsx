import AuthForm from "@/components/enterprise/AuthForm";
import { brand } from "@/lib/brand";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string | string[] }>;
}) {
  const params = await searchParams;
  const resetToken = typeof params.reset === "string" ? params.reset : "";
  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-12 text-slate-100">
      <div className="mx-auto mb-8 max-w-lg text-center">
        <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">{brand.name}</p>
        <h1 className="mt-3 text-4xl font-black">Secure operations workspace</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{brand.tagline}</p>
      </div>
      <AuthForm initialResetToken={resetToken} />
    </main>
  );
}
