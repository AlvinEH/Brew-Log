import React, { useState, useEffect } from 'react';
import { Coffee, Save, Plus, Trash2, ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrewLog, BrewTiming, CoffeeBean, Grinder, Recipe } from '../types';
import { Timestamp } from 'firebase/firestore';

interface Props {
  onSave: (log: BrewLog) => Promise<void>;
  userId: string;
  savedBeans: CoffeeBean[];
  savedGrinders: Grinder[];
  savedRecipes: Recipe[];
  tempUnit: 'C' | 'F';
  defaultGrinderId?: string;
  initialData?: BrewLog | null;
  onCancel?: () => void;
  onSaveAsRecipe?: (logData: Partial<BrewLog>) => void;
}

export default function BrewLogForm({ onSave, userId, savedBeans, savedGrinders, savedRecipes, tempUnit, defaultGrinderId, initialData, onCancel, onSaveAsRecipe }: Props) {
  const [beanName, setBeanName] = useState(initialData?.beanName || '');
  const [beanId, setBeanId] = useState(initialData?.beanId || '');
  const [roaster, setRoaster] = useState(initialData?.roaster || '');
  const [grinder, setGrinder] = useState(initialData?.grinder || (() => {
    if (defaultGrinderId) {
      const g = savedGrinders.find(g => g.id === defaultGrinderId);
      return g ? g.name : '';
    }
    return '';
  }));
  const [grindSize, setGrindSize] = useState(initialData?.grindSize || '');
  const [recipeId, setRecipeId] = useState(initialData?.recipeId || '');
  const [coffeeWeight, setCoffeeWeight] = useState(initialData?.coffeeWeight.toString() || '15');
  const [waterWeight, setWaterWeight] = useState(initialData?.waterWeight.toString() || '225');
  const [waterTemp, setWaterTemp] = useState(initialData?.waterTemp || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [rating, setRating] = useState(initialData?.rating || 3);
  const [timings, setTimings] = useState<BrewTiming[]>(initialData?.timings || []);
  const [showBeanSelector, setShowBeanSelector] = useState(false);
  const [showGrinderSelector, setShowGrinderSelector] = useState(false);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setBeanName(initialData.beanName);
      setRoaster(initialData.roaster);
      setGrinder(initialData.grinder);
      setGrindSize(initialData.grindSize || '');
      setRecipeId(initialData.recipeId || '');
      setCoffeeWeight(initialData.coffeeWeight.toString());
      setWaterWeight(initialData.waterWeight.toString());
      setWaterTemp(initialData.waterTemp || '');
      setNotes(initialData.notes || '');
      setRating(initialData.rating || 3);
      setTimings(initialData.timings || []);
    } else {
      setBeanName('');
      setRoaster('');
      setGrinder(defaultGrinderId ? (savedGrinders.find(g => g.id === defaultGrinderId)?.name || '') : '');
      setGrindSize('');
      setRecipeId('');
      setCoffeeWeight('15');
      setWaterWeight('225');
      setWaterTemp('');
      setNotes('');
      setRating(3);
      setTimings([
        { step: 'Bloom', time: '' },
        { step: 'First Pour', time: '' }
      ]);
    }
  }, [initialData, defaultGrinderId, savedGrinders]);

  const selectSavedBean = (bean: CoffeeBean) => {
    setBeanName(bean.name);
    setBeanId(bean.id || '');
    setRoaster(bean.roaster);
    setShowBeanSelector(false);
  };

  const selectSavedGrinder = (g: Grinder) => {
    setGrinder(g.name);
    setShowGrinderSelector(false);
  };

  const selectSavedRecipe = (r: Recipe) => {
    setRecipeId(r.id || '');
    setCoffeeWeight(r.coffeeWeight.toString());
    setWaterWeight(r.waterWeight.toString());
    if (r.timings && r.timings.length > 0) {
      setTimings(r.timings);
    } else if (r.steps && r.steps.length > 0) {
      setTimings(r.steps.map(step => ({ step, time: '' })));
    }
    setShowRecipeSelector(false);
  };

  const getOrdinal = (n: number) => {
    const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
    return ordinals[n - 1] || `${n}th`;
  };

  const addTiming = () => {
    const nextIdx = timings.length;
    let defaultStep = '';
    
    if (nextIdx === 0) {
      defaultStep = 'Bloom';
    } else {
      defaultStep = `${getOrdinal(nextIdx)} Pour`;
    }
    
    setTimings([...timings, { step: defaultStep, time: '' }]);
  };

  const updateTiming = (idx: number, field: keyof BrewTiming, val: string) => {
    const newTimings = [...timings];
    let finalVal = val;
    
    if (field === 'waterWeight') {
      const oldVal = timings[idx].waterWeight || '';
      // If deleting the 'g', allow it temporarily so they can continue deleting numbers
      if (oldVal.endsWith('g') && val === oldVal.slice(0, -1)) {
        finalVal = val;
      } else if (val && !val.endsWith('g')) {
        // Automatically append 'g' if it's a numeric value
        const numeric = val.replace(/[^0-9.]/g, '');
        if (numeric) finalVal = `${numeric}g`;
      }
    }
    
    newTimings[idx][field] = finalVal;
    setTimings(newTimings);
  };

  const removeTiming = (idx: number) => {
    setTimings(timings.filter((_, i) => i !== idx));
  };

  const handleCoffeeWeightChange = (val: string) => {
    setCoffeeWeight(val);
    const newCoffee = parseFloat(val);
    if (!newCoffee || isNaN(newCoffee) || !recipeId) return;

    const linkedRecipe = savedRecipes.find(r => r.id === recipeId);
    if (linkedRecipe && linkedRecipe.coffeeWeight > 0) {
      const scale = newCoffee / linkedRecipe.coffeeWeight;
      
      // Update total water
      setWaterWeight(Math.round(linkedRecipe.waterWeight * scale).toString());
      
      // Update timings water weights
      if (linkedRecipe.timings) {
        setTimings(prev => {
          // Only update if the lengths match, suggesting the user hasn't radically changed the structure
          if (prev.length !== linkedRecipe.timings?.length) return prev;
          
          return prev.map((t, i) => {
            const rTiming = linkedRecipe.timings![i];
            if (rTiming.waterWeight) {
              const match = rTiming.waterWeight.match(/(\d+(\.\d+)?)/);
              if (match) {
                const baseVal = parseFloat(match[0]);
                const scaledVal = Math.round(baseVal * scale);
                // Preserve the unit if it was there
                const unit = rTiming.waterWeight.replace(/[0-9.]/g, '') || 'g';
                return { ...t, waterWeight: `${scaledVal}${unit}` };
              }
            }
            return t;
          });
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('BrewLogForm submitting with data:', { beanName, roaster, grinder, grindSize, recipeId, coffeeWeight, waterWeight, waterTemp, notes, rating, timings });
    setSaving(true);
    try {
      const cWeight = parseFloat(coffeeWeight) || 0;
      const wWeight = parseFloat(waterWeight) || 0;
      
      let finalTemp = waterTemp?.trim();
      if (finalTemp && !finalTemp.includes('°') && !finalTemp.toLowerCase().includes('c') && !finalTemp.toLowerCase().includes('f')) {
        finalTemp = `${finalTemp}°${tempUnit}`;
      }

      // Create a clean log object with only meaningful values
      const log: BrewLog = {
        userId,
        date: initialData?.date || Timestamp.now(),
        beanName: beanName.trim(),
        beanId: beanId || undefined,
        coffeeWeight: cWeight,
        waterWeight: wWeight
      };
      
      // Only add optional fields if they have meaningful values
      if (roaster?.trim()) log.roaster = roaster.trim();
      if (grinder?.trim()) log.grinder = grinder.trim();
      if (grindSize?.trim()) log.grindSize = grindSize.trim();
      if (recipeId?.trim()) log.recipeId = recipeId.trim();
      if (finalTemp?.trim()) log.waterTemp = finalTemp.trim();
      if (notes?.trim()) log.notes = notes.trim();
      if (cWeight > 0 && wWeight > 0) {
        log.ratio = `1:${(wWeight / cWeight).toFixed(1)}`;
      }
      if (timings && timings.length > 0) log.timings = timings;
      if (rating && rating > 0) log.rating = rating;
      if (initialData?.id) log.id = initialData.id;
      
      console.log('Cleaned log data being sent to onSave:', log);
      await onSave(log);
      
      if (!initialData) {
        // Reset form only if it's a new log
        setBeanName('');
        setRoaster('');
        setGrinder('');
        setGrindSize('');
        setRecipeId('');
        setTimings([]);
        setWaterTemp('');
        setNotes('');
      }
    } catch (err) {
      console.error("Failed to save brew log:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsRecipeClick = () => {
    if (onSaveAsRecipe) {
      const cWeight = parseFloat(coffeeWeight) || 0;
      const wWeight = parseFloat(waterWeight) || 0;
      onSaveAsRecipe({
        beanName,
        coffeeWeight: cWeight,
        waterWeight: wWeight,
        ratio: `1:${(wWeight / cWeight).toFixed(1)}`,
        timings,
        notes
      });
    }
  };

  return (
    <motion.form 
      initial={false}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="space-y-10 max-w-2xl mx-auto pb-20"
    >
      <div className="pb-8 border-b border-black/5">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary-container rounded-2xl shadow-sm">
            <Coffee className="text-on-primary-container" size={24} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">New Brew Log</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 min-w-0">
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Bean Name*</label>
              <div className="flex gap-2 items-center">
                <input required value={beanName} onChange={e => setBeanName(e.target.value)} className="m3-input flex-1 w-0 h-12" placeholder="e.g. Ethiopia Yirgacheffe" />
                {savedBeans.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setShowBeanSelector(!showBeanSelector)}
                    className="flex items-center justify-center bg-primary-container text-on-primary-container w-12 h-12 rounded-xl shrink-0 hover:bg-primary-container/80 transition-colors"
                    title="Select saved bean"
                  >
                    <ChevronDown size={20} />
                  </button>
                )}
              </div>
              
              <AnimatePresence initial={false}>
                {showBeanSelector && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 top-full left-0 right-0 mt-2 bg-surface border border-black/5 rounded-2xl shadow-xl max-h-48 overflow-y-auto p-2"
                  >
                    {savedBeans.map(bean => (
                      <button 
                        key={bean.id} 
                        type="button"
                        onClick={() => selectSavedBean(bean)}
                        className="w-full text-left p-3 hover:bg-primary-container rounded-xl transition-colors"
                      >
                        <p className="font-bold text-sm">{bean.name}</p>
                        <p className="text-xs opacity-70">{bean.roaster}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Roaster</label>
              <input value={roaster} onChange={e => setRoaster(e.target.value)} className="m3-input h-12" placeholder="e.g. Onyx Coffee Lab" />
            </div>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Recipe (Optional)</label>
              <div className="flex gap-2 items-center">
                <div 
                  onClick={() => savedRecipes.length > 0 && setShowRecipeSelector(!showRecipeSelector)}
                  className={`m3-input flex-1 w-0 h-12 bg-surface-variant/30 flex items-center px-4 overflow-hidden ${savedRecipes.length > 0 ? 'cursor-pointer hover:bg-surface-variant/50' : ''}`}
                >
                  <Sparkles size={16} className="mr-2 text-primary shrink-0" />
                  <span className="truncate opacity-70 flex-1 min-w-0">
                    {recipeId ? savedRecipes.find(r => r.id === recipeId)?.title : 'Link a saved recipe...'}
                  </span>
                </div>
                {savedRecipes.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setShowRecipeSelector(!showRecipeSelector)}
                    className="flex items-center justify-center bg-primary-container text-on-primary-container w-12 h-12 rounded-xl shrink-0 hover:bg-primary-container/80 transition-colors"
                    title="Select saved recipe"
                  >
                    <ChevronDown size={20} />
                  </button>
                )}
              </div>
              
              <AnimatePresence initial={false}>
                {showRecipeSelector && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 top-full left-0 right-0 mt-2 bg-surface border border-black/5 rounded-2xl shadow-xl max-h-48 overflow-y-auto p-2"
                  >
                    <button 
                      type="button"
                      onClick={() => {
                        setRecipeId('');
                        setShowRecipeSelector(false);
                      }}
                      className="w-full text-left p-3 hover:bg-primary-container rounded-xl transition-colors text-xs opacity-60 italic"
                    >
                      None (Clear selection)
                    </button>
                    {savedRecipes.map(r => (
                      <button 
                        key={r.id} 
                        type="button"
                        onClick={() => selectSavedRecipe(r)}
                        className="w-full text-left p-3 hover:bg-primary-container rounded-xl transition-colors"
                      >
                        <p className="font-bold text-sm">{r.title}</p>
                        <p className="text-xs opacity-70">{r.source}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Grinder</label>
              <div className="flex gap-2 items-center">
                <input value={grinder} onChange={e => setGrinder(e.target.value)} className="m3-input flex-1 w-0 h-12" placeholder="e.g. Comandante C40" />
                {savedGrinders.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setShowGrinderSelector(!showGrinderSelector)}
                    className="flex items-center justify-center bg-primary-container text-on-primary-container w-12 h-12 rounded-xl shrink-0 hover:bg-primary-container/80 transition-colors"
                    title="Select saved grinder"
                  >
                    <ChevronDown size={20} />
                  </button>
                )}
              </div>
              
              <AnimatePresence initial={false}>
                {showGrinderSelector && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 top-full left-0 right-0 mt-2 bg-surface border border-black/5 rounded-2xl shadow-xl max-h-48 overflow-y-auto p-2"
                  >
                    {savedGrinders.map(g => (
                      <button 
                        key={g.id} 
                        type="button"
                        onClick={() => selectSavedGrinder(g)}
                        className="w-full text-left p-3 hover:bg-primary-container rounded-xl transition-colors"
                      >
                        <p className="font-bold text-sm">{g.name}</p>
                        <p className="text-xs opacity-70">{g.brand}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Grind Size (Clicks)</label>
              <input value={grindSize} onChange={e => setGrindSize(e.target.value)} className="m3-input h-12" placeholder="e.g. 25 clicks" />
            </div>
          </div>
        </div>
      </div>

      <div className="pb-8 border-b border-black/5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Measurements</h3>
          <button 
            type="button" 
            onClick={handleSaveAsRecipeClick}
            className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
          >
            <Sparkles size={14} /> Save as Recipe
          </button>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Coffee (g)</label>
            <input 
              type="number" 
              value={coffeeWeight} 
              onChange={e => handleCoffeeWeightChange(e.target.value)} 
              className="m3-input" 
              placeholder="Grams"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Water (g)</label>
            <input 
              type="number" 
              value={waterWeight} 
              onChange={e => setWaterWeight(e.target.value)} 
              className="m3-input" 
              placeholder="Grams"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Water Temp (°{tempUnit})</label>
            <input 
              value={waterTemp} 
              onChange={e => setWaterTemp(e.target.value)} 
              className="m3-input" 
              placeholder={`e.g. ${tempUnit === 'F' ? '200' : '93'}`}
            />
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-primary">
          Calculated Ratio: {coffeeWeight && waterWeight ? `1:${((parseFloat(waterWeight) || 0) / (parseFloat(coffeeWeight) || 1)).toFixed(1)}` : 'Enter measurements to see ratio'}
        </p>
      </div>

      <div className="pb-8 border-b border-black/5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Brew Timings</h3>
          <button type="button" onClick={addTiming} className="m3-button-tonal py-1.5 px-4 text-sm">
            <Plus size={16} /> Add Step
          </button>
        </div>
        
        <div className="space-y-4">
          {timings.length > 0 && (
            <div className="flex gap-3 px-1 mb-1">
              <span className="w-24 text-[10px] font-bold uppercase tracking-wider opacity-40">Water (g)</span>
              <span className="w-24 text-[10px] font-bold uppercase tracking-wider opacity-40">Time</span>
              <div className="flex-1" />
              <div className="w-9" />
            </div>
          )}
          {timings.map((t, idx) => (
            <div key={idx} className="flex gap-3 items-center min-w-0">
              <input 
                placeholder="Water (g)" 
                value={t.waterWeight || ''} 
                onChange={e => updateTiming(idx, 'waterWeight', e.target.value)}
                className="m3-input w-24 h-12"
              />
              <input 
                placeholder="Time" 
                value={t.time} 
                onChange={e => updateTiming(idx, 'time', e.target.value)}
                className="m3-input w-24 h-12"
              />
              <div className="flex-1" />
              <button type="button" onClick={() => removeTiming(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-full shrink-0">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {timings.length === 0 && <p className="text-sm opacity-50 italic">No timings added yet.</p>}
        </div>
      </div>

      <div className="pb-8 border-b border-black/5">
        <h3 className="text-xl font-bold mb-6">Final Thoughts</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Rating (1-5)</label>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map(r => (
                <button 
                  key={r} 
                  type="button"
                  onClick={() => setRating(r)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all font-bold text-lg ${rating === r ? 'bg-primary text-white shadow-md scale-105' : 'bg-surface-variant/50 text-outline hover:bg-surface-variant'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="m3-input min-h-[120px]" placeholder="How did it taste? Any adjustments for next time?" />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="m3-button-outlined flex-1 py-4 text-lg shadow-sm justify-center"
          >
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving} className={`m3-button-primary ${onCancel ? 'flex-[2]' : 'w-full'} py-4 text-lg shadow-lg justify-center`}>
          {saving ? <Loader2 className="animate-spin" size={24} /> : (
            <>
              <Save size={24} /> {initialData ? 'Update' : 'Save Brew Log'}
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}
