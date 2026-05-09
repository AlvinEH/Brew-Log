import React, { useState } from 'react';
import { Droplets } from 'lucide-react';
import { motion } from 'motion/react';

const WaterConverter = React.memo(() => {
  const [ml, setMl] = useState<string>('225');
  const [oz, setOz] = useState<string>('7.6');

  const handleMlChange = (val: string) => {
    setMl(val);
    const numVal = parseFloat(val);
    if (!isNaN(numVal)) {
      setOz((numVal / 29.5735).toFixed(1));
    } else {
      setOz('');
    }
  };

  const handleOzChange = (val: string) => {
    setOz(val);
    const numVal = parseFloat(val);
    if (!isNaN(numVal)) {
      setMl(Math.round(numVal * 29.5735).toString());
    } else {
      setMl('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="m3-card max-w-md mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary-container rounded-2xl">
          <Droplets className="text-on-primary-container" size={24} />
        </div>
        <h2 className="text-2xl font-semibold">Water Converter</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Milliliters (ml / g)</label>
          <input 
            type="number" 
            value={ml}
            onChange={(e) => handleMlChange(e.target.value)}
            className="m3-input"
            placeholder="ml"
          />
        </div>

        <div className="flex items-center justify-center py-2">
          <div className="h-px bg-black/5 flex-1"></div>
          <span className="px-4 text-xs font-bold uppercase tracking-widest opacity-30">Conversion</span>
          <div className="h-px bg-black/5 flex-1"></div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Fluid Ounces (oz)</label>
          <input 
            type="number" 
            value={oz}
            onChange={(e) => handleOzChange(e.target.value)}
            className="m3-input"
            placeholder="oz"
          />
        </div>

        <div className="p-4 bg-secondary-container rounded-2xl text-center">
          <p className="text-sm text-on-secondary-container opacity-70">Quick Reference</p>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="text-center">
              <p className="text-xs font-bold opacity-50 uppercase">8 oz</p>
              <p className="font-bold">~237 ml</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold opacity-50 uppercase">12 oz</p>
              <p className="font-bold">~355 ml</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default WaterConverter;
