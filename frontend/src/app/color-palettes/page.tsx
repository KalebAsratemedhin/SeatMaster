"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";

interface ColorPalette {
  name: string;
  category: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

const palettes: ColorPalette[] = [
  // Professional & Corporate
  {
    name: "Modern Navy & Gold",
    category: "Professional & Corporate",
    colors: {
      primary: "#1e3a8a",
      secondary: "#f59e0b", 
      accent: "#64748b",
      background: "#f8fafc",
      text: "#1e293b"
    }
  },
  {
    name: "Sophisticated Charcoal",
    category: "Professional & Corporate",
    colors: {
      primary: "#374151",
      secondary: "#6366f1",
      accent: "#10b981",
      background: "#ffffff",
      text: "#111827"
    }
  },
  {
    name: "Executive Blue",
    category: "Professional & Corporate",
    colors: {
      primary: "#2563eb",
      secondary: "#7c3aed",
      accent: "#059669",
      background: "#f9fafb",
      text: "#1f2937"
    }
  },
  // Elegant & Luxury
  {
    name: "Royal Purple",
    category: "Elegant & Luxury",
    colors: {
      primary: "#7c3aed",
      secondary: "#f59e0b",
      accent: "#ec4899",
      background: "#faf5ff",
      text: "#581c87"
    }
  },
  {
    name: "Emerald Elegance",
    category: "Elegant & Luxury",
    colors: {
      primary: "#059669",
      secondary: "#dc2626",
      accent: "#7c2d12",
      background: "#f0fdf4",
      text: "#064e3b"
    }
  },
  {
    name: "Midnight Luxury",
    category: "Elegant & Luxury",
    colors: {
      primary: "#1e293b",
      secondary: "#fbbf24",
      accent: "#be185d",
      background: "#0f172a",
      text: "#f1f5f9"
    }
  },
  // Modern & Tech
  {
    name: "Tech Blue",
    category: "Modern & Tech",
    colors: {
      primary: "#0ea5e9",
      secondary: "#8b5cf6",
      accent: "#f59e0b",
      background: "#ffffff",
      text: "#0f172a"
    }
  },
  {
    name: "Neon Cyber",
    category: "Modern & Tech",
    colors: {
      primary: "#06b6d4",
      secondary: "#8b5cf6",
      accent: "#10b981",
      background: "#0f172a",
      text: "#f8fafc"
    }
  },
  {
    name: "Minimalist Gray",
    category: "Modern & Tech",
    colors: {
      primary: "#6b7280",
      secondary: "#3b82f6",
      accent: "#ef4444",
      background: "#ffffff",
      text: "#111827"
    }
  },
  // Vibrant & Creative
  {
    name: "Sunset Gradient",
    category: "Vibrant & Creative",
    colors: {
      primary: "#f97316",
      secondary: "#ec4899",
      accent: "#8b5cf6",
      background: "#fef7ff",
      text: "#7c2d12"
    }
  },
  {
    name: "Ocean Breeze",
    category: "Vibrant & Creative",
    colors: {
      primary: "#0ea5e9",
      secondary: "#06b6d4",
      accent: "#10b981",
      background: "#f0f9ff",
      text: "#0c4a6e"
    }
  },
  {
    name: "Forest Fresh",
    category: "Vibrant & Creative",
    colors: {
      primary: "#16a34a",
      secondary: "#84cc16",
      accent: "#f59e0b",
      background: "#f0fdf4",
      text: "#14532d"
    }
  },
  // Warm & Inviting
  {
    name: "Peach Fuzz",
    category: "Warm & Inviting",
    colors: {
      primary: "#fb923c",
      secondary: "#f59e0b",
      accent: "#ec4899",
      background: "#fff7ed",
      text: "#9a3412"
    }
  },
  {
    name: "Coffee & Cream",
    category: "Warm & Inviting",
    colors: {
      primary: "#92400e",
      secondary: "#fbbf24",
      accent: "#dc2626",
      background: "#fefce8",
      text: "#451a03"
    }
  },
  {
    name: "Warm Neutrals",
    category: "Warm & Inviting",
    colors: {
      primary: "#78716c",
      secondary: "#d97706",
      accent: "#059669",
      background: "#fafaf9",
      text: "#292524"
    }
  },
  // Dark Mode
  {
    name: "Dark Elegance",
    category: "Dark Mode",
    colors: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      accent: "#10b981",
      background: "#0f172a",
      text: "#f8fafc"
    }
  },
  {
    name: "Midnight Purple",
    category: "Dark Mode",
    colors: {
      primary: "#7c3aed",
      secondary: "#ec4899",
      accent: "#f59e0b",
      background: "#1e1b4b",
      text: "#e0e7ff"
    }
  },
  {
    name: "Charcoal & Gold",
    category: "Dark Mode",
    colors: {
      primary: "#374151",
      secondary: "#fbbf24",
      accent: "#ef4444",
      background: "#111827",
      text: "#f9fafb"
    }
  },
  // Unique & Artistic
  {
    name: "Mint & Coral",
    category: "Unique & Artistic",
    colors: {
      primary: "#10b981",
      secondary: "#f97316",
      accent: "#8b5cf6",
      background: "#f0fdfa",
      text: "#064e3b"
    }
  },
  {
    name: "Rose Gold",
    category: "Unique & Artistic",
    colors: {
      primary: "#be185d",
      secondary: "#fbbf24",
      accent: "#7c3aed",
      background: "#fdf2f8",
      text: "#831843"
    }
  }
];

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className="w-16 h-16 rounded-lg border-2 border-gray-200 shadow-sm"
        style={{ backgroundColor: color }}
      />
      <div className="text-xs text-center">
        <div className="font-mono text-gray-600">{color}</div>
        <div className="text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function PaletteCard({ palette }: { palette: ColorPalette }) {
  const isSelected = palette.name === "Coffee & Cream";
  
  return (
    <div 
      className={`p-6 rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow ${
        isSelected 
          ? 'border-amber-500 ring-2 ring-amber-200 ring-offset-2' 
          : 'border-gray-200'
      }`}
      style={{ backgroundColor: palette.colors.background }}
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 
            className="text-xl font-bold"
            style={{ color: palette.colors.text }}
          >
            {palette.name}
          </h3>
          {isSelected && (
            <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
              ✓ Selected
            </span>
          )}
        </div>
        <p 
          className="text-sm opacity-75"
          style={{ color: palette.colors.text }}
        >
          {palette.category}
        </p>
      </div>
      
      <div className="grid grid-cols-5 gap-4 mb-4">
        <ColorSwatch color={palette.colors.primary} label="Primary" />
        <ColorSwatch color={palette.colors.secondary} label="Secondary" />
        <ColorSwatch color={palette.colors.accent} label="Accent" />
        <ColorSwatch color={palette.colors.background} label="Background" />
        <ColorSwatch color={palette.colors.text} label="Text" />
      </div>
      
      <div className="space-y-2">
        <div 
          className="px-4 py-2 rounded-lg font-medium"
          style={{ 
            backgroundColor: palette.colors.primary,
            color: palette.colors.background
          }}
        >
          Primary Button
        </div>
        <div 
          className="px-4 py-2 rounded-lg border-2 font-medium"
          style={{ 
            borderColor: palette.colors.secondary,
            color: palette.colors.secondary,
            backgroundColor: palette.colors.background
          }}
        >
          Secondary Button
        </div>
        <div 
          className="px-4 py-2 rounded-lg font-medium"
          style={{ 
            backgroundColor: palette.colors.accent,
            color: palette.colors.background
          }}
        >
          Accent Element
        </div>
      </div>
    </div>
  );
}

export default function ColorPalettesPage() {
  const categories = Array.from(new Set(palettes.map(p => p.category)));
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Color Palette Showcase</h1>
            <p className="text-gray-600 mt-1">Visual representations of beautiful website color palettes</p>
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="p-6">
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
            <div>
              <h2 className="text-lg font-semibold text-amber-900">Coffee & Cream Active</h2>
              <p className="text-sm text-amber-700">
                Your SeatMaster application is now using the Coffee & Cream color palette. 
                Switch between light and dark modes using the theme toggle to see the full effect.
              </p>
            </div>
          </div>
        </div>
        
        {categories.map(category => (
          <section key={category} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {palettes
                .filter(palette => palette.category === category)
                .map(palette => (
                  <PaletteCard key={palette.name} palette={palette} />
                ))}
            </div>
          </section>
        ))}
        
        <section className="mt-12 p-6 bg-white rounded-xl border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use These Palettes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For SeatMaster</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• <strong>Primary:</strong> Main brand color for buttons, links, and key elements</li>
                <li>• <strong>Secondary:</strong> Supporting color for secondary actions</li>
                <li>• <strong>Accent:</strong> Highlights, notifications, and special elements</li>
                <li>• <strong>Background:</strong> Page and card backgrounds</li>
                <li>• <strong>Text:</strong> Primary text color for readability</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Recommendations</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• <strong>Professional:</strong> Modern Navy & Gold, Executive Blue</li>
                <li>• <strong>Tech-forward:</strong> Tech Blue, Neon Cyber</li>
                <li>• <strong>Luxury:</strong> Royal Purple, Emerald Elegance</li>
                <li>• <strong>Warm:</strong> Peach Fuzz, Coffee & Cream</li>
                <li>• <strong>Dark Mode:</strong> Dark Elegance, Midnight Purple</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
