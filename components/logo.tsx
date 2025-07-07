"use client"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-xl",
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg flex items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20 rounded-xl">
          <div className="w-full h-full bg-gradient-to-br from-white/30 to-transparent rounded-xl" />
          <div className="absolute top-1 right-1 w-2 h-2 bg-white/40 rounded-full" />
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-white/30 rounded-full" />
        </div>

        {/* CM Text */}
        <span className="relative z-10 font-bold text-white tracking-tight">CM</span>

        {/* Subtle Border */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
      </div>
    </div>
  )
}
