export default function PlatformLoading() {
  return (
    <div aria-label="Loading page" aria-live="polite" className="animate-pulse space-y-7">
      <div className="h-4 w-32 rounded bg-white/10" />
      <div className="h-10 w-72 max-w-full rounded-xl bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 rounded-2xl bg-white/[.06]" />)}
      </div>
      <div className="h-80 rounded-3xl bg-white/[.05]" />
    </div>
  );
}
