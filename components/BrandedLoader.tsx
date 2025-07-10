import { Logo } from "./logo";

export function BrandedLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90">
      <Logo size="lg" className="mb-6 animate-bounce" />
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
      <div className="text-lg font-semibold text-green-700 animate-pulse">{text}</div>
    </div>
  );
} 