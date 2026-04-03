import React, { useState } from 'react';
import { Thermometer } from 'lucide-react';
import { motion } from 'motion/react';

const TemperatureConverter = React.memo(() => {
  const [celsius, setCelsius] = useState('');
  const [fahrenheit, setFahrenheit] = useState('');

  const handleCelsiusChange = (val: string) => {
    setCelsius(val);
    if (val === '') {
      setFahrenheit('');
      return;
    }
    const c = parseFloat(val);
    if (!isNaN(c)) {
      setFahrenheit(((c * 9) / 5 + 32).toFixed(1));
    }
  };

  const handleFahrenheitChange = (val: string) => {
    setFahrenheit(val);
    if (val === '') {
      setCelsius('');
      return;
    }
    const f = parseFloat(val);
    if (!isNaN(f)) {
      setCelsius(((f - 32) * 5 / 9).toFixed(1));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="m3-card"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-secondary-container rounded-2xl">
          <Thermometer className="text-on-secondary-container" size={24} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Temp Converter</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider opacity-50 ml-1">Celsius (°C)</label>
          <input
            type="number"
            value={celsius}
            onChange={(e) => handleCelsiusChange(e.target.value)}
            className="m3-input text-center text-xl font-bold py-4"
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider opacity-50 ml-1">Fahrenheit (°F)</label>
          <input
            type="number"
            value={fahrenheit}
            onChange={(e) => handleFahrenheitChange(e.target.value)}
            className="m3-input text-center text-xl font-bold py-4"
            placeholder="32"
          />
        </div>
      </div>
      
      <p className="mt-4 text-xs opacity-50 text-center italic">
        Quick reference for your brew water temperature.
      </p>
    </motion.div>
  );
});

export default TemperatureConverter;
