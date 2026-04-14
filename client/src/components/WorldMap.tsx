import { Globe } from "lucide-react";

interface MapData {
  country: string;
  value: number;
}

interface WorldMapProps {
  data: MapData[];
}

export default function WorldMap({ data }: WorldMapProps) {
  // Sorting for top list
  const topCountries = [...data].sort((a, b) => b.value - a.value).slice(0, 5);
  const maxVal = topCountries[0]?.value || 1;

  return (
    <div className="bg-secondary p-8 rounded-[3rem] border border-gray-800 shadow-2xl relative overflow-hidden h-full">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-xl font-black text-white mb-1">Global Reach</h3>
          <p className="text-sm text-gray-500 font-medium">Real-time activation heat</p>
        </div>
        <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20">
          <Globe className="w-6 h-6 text-accent" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center h-[280px]">
        {/* Placeholder for SVG Map or actual SVG */}
        <div className="flex-1 w-full bg-dark/30 rounded-3xl border border-gray-800/50 flex items-center justify-center relative group">
           <svg viewBox="0 0 1000 500" className="w-full h-full p-4 opacity-40 group-hover:opacity-60 transition-opacity">
              <title>XAuth Global Activation Map</title>
              {/* Very simplified world outline for visual effect */}

              <path d="M150,150 L250,150 L300,200 L250,300 L150,250 Z" fill="currentColor" className="text-gray-600" />
              <path d="M400,100 L550,80 L650,120 L700,300 L550,350 L450,250 Z" fill="currentColor" className="text-gray-600" />
              <path d="M200,350 L350,380 L380,480 L250,450 Z" fill="currentColor" className="text-gray-600" />
              <path d="M750,150 L850,120 L900,250 L800,350 Z" fill="currentColor" className="text-gray-600" />
              {/* Pulse dots for activations */}
              {data.length > 0 && <circle cx="500" cy="150" r="8" fill="#3b82f6" className="animate-pulse" />}
              {data.length > 1 && <circle cx="200" cy="200" r="5" fill="#3b82f6" className="animate-ping" />}
           </svg>
           <div className="absolute inset-0 flex items-center justify-center">
             <span className="bg-dark/80 px-4 py-2 rounded-xl border border-gray-700 text-[10px] font-black text-white uppercase tracking-tighter shadow-2xl">
               Live Geographic Telemetry
             </span>
           </div>
        </div>

        {/* Top Countries List */}
        <div className="w-full md:w-48 space-y-4">
          {topCountries.map((c) => (
            <div key={c.country} className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500">
                <span>{c.country}</span>
                <span className="text-white">{c.value}</span>
              </div>
              <div className="h-1.5 w-full bg-dark/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent rounded-full transition-all duration-1000" 
                  style={{ width: `${(c.value / maxVal) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {topCountries.length === 0 && (
            <div className="text-center py-10 text-xs text-gray-600 font-bold italic">Gathering geo-data...</div>
          )}
        </div>
      </div>
    </div>
  );
}
