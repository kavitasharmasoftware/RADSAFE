
import React, { useEffect, useState } from 'react';

interface VisualizerProps {
  isActive: boolean;
  intensity: number;
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive, intensity }) => {
  const [bars, setBars] = useState<number[]>(new Array(30).fill(4));

  useEffect(() => {
    if (!isActive) {
      setBars(new Array(30).fill(4));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => 
        Math.max(8, Math.random() * intensity * 80 + 8)
      ));
    }, 80);

    return () => clearInterval(interval);
  }, [isActive, intensity]);

  return (
    <div className="flex items-end justify-center gap-1 h-12 w-full max-w-sm mx-auto">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-blue-600 transition-all duration-75"
          style={{ height: `${height}%`, opacity: isActive ? 0.8 : 0.1 }}
        />
      ))}
    </div>
  );
};

export default Visualizer;
