import React, { useState, useEffect } from 'react';
import { Scale, Calculator } from 'lucide-react';
import { motion } from 'motion/react';

export default function RatioCalculator() {
  const [coffee, setCoffee] = useState<string>('15');
  const [water, setWater] = useState<string>('225');
  const [ratio, setRatio] = useState<number>(15);

  const handleCoffeeChange = (val: string) => {
    setCoffee(val);
    const numVal = parseFloat(val);
    if (!isNaN(numVal)) {
      setWater(Math.round(numVal * ratio).toString());
    } else {
      setWater('');
    }
  };

  const handleWaterChange = (val: string) => {
    setWater(val);
    const numVal = parseFloat(val);
    if (!isNaN(numVal)) {
      setCoffee((numVal / ratio).toFixed(1));
    } else {
      setCoffee('');
    }
  };

  const handleRatioChange = (val: number) => {
    setRatio(val);
    const numCoffee = parseFloat(coffee);
    if (!isNaN(numCoffee)) {
      setWater(Math.round(numCoffee * val).toString());
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
          <Scale className="text-on-primary-container" size={24} />
        </div>
        <h2 className="text-2xl font-semibold">Ratio Calculator</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Coffee (grams)</label>
          <input 
            type="number" 
            value={coffee}
            onChange={(e) => handleCoffeeChange(e.target.value)}
            className="m3-input"
            placeholder="Grams"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Water (grams)</label>
          <input 
            type="number" 
            value={water}
            onChange={(e) => handleWaterChange(e.target.value)}
            className="m3-input"
            placeholder="Grams"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ratio (1 : X)</label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="10" 
              max="20" 
              step="0.5"
              value={ratio}
              onChange={(e) => handleRatioChange(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-xl font-bold w-12 text-center">{ratio}</span>
          </div>
        </div>

        <div className="p-4 bg-secondary-container rounded-2xl text-center">
          <p className="text-sm text-on-secondary-container opacity-70">Recommended Ratio</p>
          <p className="text-lg font-bold text-on-secondary-container">1 : {ratio}</p>
        </div>
      </div>
    </motion.div>
  );
}
