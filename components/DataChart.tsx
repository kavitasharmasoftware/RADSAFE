
import React from 'react';

interface DataChartProps {
  label: string;
  values: number[];
  color: string;
}

const DataChart: React.FC<DataChartProps> = ({ label, values, color }) => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  return (
    <div className="p-5 bg-white border border-slate-100 rounded-3xl card-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</h4>
          <p className="text-2xl font-black text-slate-900 tracking-tight">+{values[values.length - 1]}% <span className="text-xs font-medium text-slate-400">vs LW</span></p>
        </div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      </div>
      
      <div className="flex items-end gap-1.5 h-16 w-full">
        {values.map((v, i) => {
          const height = ((v - min) / range) * 80 + 20;
          return (
            <div 
              key={i} 
              className="flex-1 rounded-t-sm transition-all duration-500 group-hover:opacity-100 opacity-60"
              style={{ height: `${height}%`, backgroundColor: color }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default DataChart;
