import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  label?: string;
}

const CustomSelect: React.FC<Props> = ({ value, onChange, options, placeholder = 'Select...', className = '', label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-surface-variant/30 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-primary transition-all text-left"
      >
        <span className={selectedOption ? 'text-on-surface' : 'text-on-surface/50'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={18} 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} opacity-50`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-[100] left-0 right-0 mt-1 bg-surface border border-black/5 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    value === option.value 
                      ? 'bg-primary-container text-on-primary-container' 
                      : 'hover:bg-surface-variant/50 text-on-surface'
                  }`}
                >
                  <span>{option.label}</span>
                  {value === option.value && <Check size={16} />}
                </button>
              ))}
              {options.length === 0 && (
                <div className="px-4 py-3 text-sm opacity-50 italic">
                  No options available
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
