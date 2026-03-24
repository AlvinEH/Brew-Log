import React, { useState, useMemo } from 'react';
import { Calendar, Star, Trash2, ChevronRight, Droplets, Bean, Coffee, Sparkles, Filter, X, History, Scale, Thermometer, Pencil, Hammer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrewLog, Recipe, CoffeeBean } from '../types';
import { Timestamp } from 'firebase/firestore';

interface Props {
  logs: BrewLog[];
  onDelete: (id: string) => void;
  onEdit: (log: BrewLog) => void;
  savedRecipes: Recipe[];
  savedBeans: CoffeeBean[];
}

// Helper function to handle both Timestamp objects and ISO strings
const getDateFromLog = (dateField: any): Date => {
  if (dateField instanceof Timestamp) {
    return dateField.toDate();
  } else if (typeof dateField === 'string') {
    return new Date(dateField);
  } else if (dateField instanceof Date) {
    return dateField;
  } else {
    return new Date(); // fallback
  }
};

interface Props {
  logs: BrewLog[];
  onDelete: (id: string) => void;
  onEdit: (log: BrewLog) => void;
  savedRecipes: Recipe[];
  savedBeans: CoffeeBean[];
}

export default function BrewLogList({ logs, onDelete, onEdit, savedRecipes, savedBeans }: Props) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBean, setSelectedBean] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const logDate = getDateFromLog(log.date);
      const logDateStr = logDate.toISOString().split('T')[0];
      
      const dateMatch = (!startDate || logDateStr >= startDate) && 
                        (!endDate || logDateStr <= endDate);
      
      const beanMatch = !selectedBean || log.beanName === selectedBean;
      
      return dateMatch && beanMatch;
    });
  }, [logs, startDate, endDate, selectedBean]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedBean('');
  };

  const hasActiveFilters = startDate || endDate || selectedBean;

  if (logs.length === 0) {
    return (
      <div className="text-center py-20 opacity-50">
        <Coffee size={64} className="mx-auto mb-4" />
        <p className="text-xl">No brew logs yet. Start your first brew!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Filters Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <History size={20} className="text-primary" />
            <h2 className="text-xl font-bold">Brew History</h2>
            <span className="text-xs font-bold bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full">
              {filteredLogs.length}
            </span>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl transition-all ${showFilters || hasActiveFilters ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-variant/50 text-outline hover:bg-surface-variant'}`}
          >
            <Filter size={20} />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="m3-card bg-surface-variant/20 border-none space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 ml-1">From Date</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      className="m3-input h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 ml-1">To Date</label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      className="m3-input h-10 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 ml-1">Coffee Bean</label>
                  <select 
                    value={selectedBean} 
                    onChange={(e) => setSelectedBean(e.target.value)}
                    className="m3-input h-10 text-sm appearance-none"
                  >
                    <option value="">All Beans</option>
                    {Array.from(new Set(logs.map(l => l.beanName))).sort().map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                {hasActiveFilters && (
                  <button 
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest hover:opacity-70 transition-opacity pt-2"
                  >
                    <X size={14} />
                    Clear Filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <p className="text-lg">No brews match your filters.</p>
          <button onClick={clearFilters} className="text-primary font-bold mt-2">Clear all filters</button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
        <div 
          key={log.id}
          className="m3-card group relative overflow-hidden cursor-pointer"
          onClick={() => log.id && toggleExpand(log.id)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-1">
                <Calendar size={12} />
                {getDateFromLog(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                <motion.div
                  animate={{ rotate: expandedLogId === log.id ? 180 : 0 }}
                  className="ml-auto sm:hidden"
                >
                  <ChevronRight size={16} className="rotate-90" />
                </motion.div>
              </div>
              <h3 className="text-xl font-bold mb-1 truncate">{log.beanName}</h3>
              <p className="text-sm opacity-70 mb-3 truncate">{log.roaster || 'Unknown Roaster'}</p>
              
              {log.recipeId && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-3 bg-primary-container/30 w-fit px-2 py-1 rounded-lg">
                  <Sparkles size={12} />
                  <span>{savedRecipes.find(r => r.id === log.recipeId)?.title || 'Linked Recipe'}</span>
                </div>
              )}
              
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Bean size={14} className="opacity-50" />
                    <span className="font-bold">{log.coffeeWeight}g</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Droplets size={14} className="opacity-50" />
                    <span className="font-bold">{log.waterWeight}g</span>
                  </div>
                  {log.waterTemp && (
                    <div className="flex items-center gap-1.5">
                      <Thermometer size={14} className="opacity-50" />
                      <span className="font-bold">{log.waterTemp}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-primary-container px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-on-primary-container shadow-sm">
                    <Scale size={12} className="opacity-70" />
                    <span>{log.ratio}</span>
                  </div>
                  {log.grindSize && (
                    <div className="flex items-center gap-1.5 bg-secondary-container pl-2.5 pr-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-on-secondary-container shadow-sm whitespace-nowrap">
                      <Hammer size={12} className="opacity-70" />
                      <span>{log.grindSize.toLowerCase().includes('click') ? log.grindSize : `${log.grindSize} clicks`}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

              <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={i < (log.rating || 0) ? "fill-primary text-primary" : "text-outline opacity-30"} 
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => onEdit(log)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    title="Edit brew"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => log.id && onDelete(log.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    title="Delete brew"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
          </div>

          <AnimatePresence initial={false}>
            {expandedLogId === log.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                {log.timings && log.timings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-black/5">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2">Brew Timings</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                      {log.timings.map((t, tIdx) => {
                        const currentWater = parseFloat(t.waterWeight?.replace(/[^\d.]/g, '') || '0');
                        const prevWater = tIdx > 0 
                          ? parseFloat(log.timings![tIdx - 1].waterWeight?.replace(/[^\d.]/g, '') || '0')
                          : 0;
                        const diff = currentWater - prevWater;
                        
                        return (
                          <div key={tIdx} className="flex justify-between items-center text-xs">
                            <span className="opacity-70 truncate mr-2 flex-1">{t.step}</span>
                            <div className="flex shrink-0 items-center text-right">
                              <div className="w-10">
                                {t.waterWeight && diff > 0 && (
                                  <span className="text-[10px] font-bold text-primary/40">+{diff}g</span>
                                )}
                              </div>
                              <div className="w-12">
                                {t.waterWeight && <span className="font-bold text-primary">{t.waterWeight}</span>}
                              </div>
                              <div className="w-12">
                                <span className="font-mono opacity-60">{t.time}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {log.notes && (
                  <div className="mt-4 pt-4 border-t border-black/5">
                    <p className="text-sm italic opacity-70">{log.notes}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
        </div>
      )}
    </div>
  );
}


