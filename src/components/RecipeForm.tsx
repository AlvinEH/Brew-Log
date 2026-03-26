import React, { useState, useEffect } from 'react';
import { Sparkles, X, Loader2, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Recipe, BrewTiming } from '../types';

interface Props {
  onSave: (recipe: Recipe) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Recipe> | null;
}

export default function RecipeForm({ onSave, onCancel, initialData }: Props) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [source, setSource] = useState(initialData?.source || 'Personal Recipe');
  const [description, setDescription] = useState(initialData?.description || '');
  const [coffeeWeight, setCoffeeWeight] = useState(initialData?.coffeeWeight?.toString() || '15');
  const [waterWeight, setWaterWeight] = useState(initialData?.waterWeight?.toString() || '225');
  const [ratio, setRatio] = useState(initialData?.ratio || '1:15');
  const [timings, setTimings] = useState<BrewTiming[]>(() => {
    if (initialData?.timings && initialData.timings.length > 0) return initialData.timings;
    if (initialData?.steps && initialData.steps.length > 0) {
      return initialData.steps.map(step => ({ step, time: '', waterWeight: '' }));
    }
    return [
      { step: 'Bloom', time: '', waterWeight: '' },
      { step: 'First Pour', time: '', waterWeight: '' }
    ];
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = parseFloat(coffeeWeight) || 0;
    const w = parseFloat(waterWeight) || 0;
    if (c > 0 && w > 0) {
      setRatio(`1:${(w / c).toFixed(1)}`);
    }
  }, [coffeeWeight, waterWeight]);

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
    
    setTimings([...timings, { step: defaultStep, time: '', waterWeight: '' }]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const recipe: Recipe = {
        ...(initialData?.id ? { id: initialData.id } : {}),
        title,
        source,
        description,
        coffeeWeight: parseFloat(coffeeWeight) || 0,
        waterWeight: parseFloat(waterWeight) || 0,
        ratio,
        steps: timings.map(t => t.step),
        timings,
        isSaved: true
      };
      await onSave(recipe);
    } catch (err) {
      console.error("Failed to save recipe:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="pb-8 border-b border-black/5">
          <h3 className="text-xl font-bold mb-6">Basic Info</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Recipe Title*</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} className="m3-input" placeholder="e.g. Morning V60" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Source</label>
              <input value={source} onChange={e => setSource(e.target.value)} className="m3-input" placeholder="e.g. James Hoffmann" />
            </div>
          </div>
        </div>

        <div className="pb-8 border-b border-black/5">
          <h3 className="text-xl font-bold mb-6">Description</h3>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="m3-input min-h-[80px]" placeholder="Brief notes about this recipe..." />
        </div>

        <div className="pb-8 border-b border-black/5">
          <h3 className="text-xl font-bold mb-6">Ratio & Weights</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Coffee (g)</label>
              <input type="number" step="0.1" value={coffeeWeight} onChange={e => setCoffeeWeight(e.target.value)} className="m3-input" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Water (g)</label>
              <input type="number" step="1" value={waterWeight} onChange={e => setWaterWeight(e.target.value)} className="m3-input" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Ratio</label>
              <input disabled value={ratio} className="m3-input bg-surface-variant/30" />
            </div>
          </div>
        </div>

        <div className="pb-8 border-b border-black/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Brew Steps & Timings</h3>
            <button type="button" onClick={addTiming} className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1">
              <Plus size={14} /> Add Step
            </button>
          </div>
          
          <div className="space-y-4">
            {timings.map((t, idx) => (
              <div key={idx} className="flex gap-4 items-start p-4 bg-surface-variant/20 rounded-2xl">
                <div className="flex-1 space-y-4">
                  <input 
                    placeholder="Step description" 
                    value={t.step} 
                    onChange={e => updateTiming(idx, 'step', e.target.value)}
                    className="m3-input text-sm"
                  />
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase opacity-50 mb-1 ml-1">Time</label>
                      <input 
                        placeholder="e.g. 0:30" 
                        value={t.time} 
                        onChange={e => updateTiming(idx, 'time', e.target.value)}
                        className="m3-input text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase opacity-50 mb-1 ml-1">Water (g)</label>
                      <input 
                        placeholder="e.g. 50g" 
                        value={t.waterWeight || ''} 
                        onChange={e => updateTiming(idx, 'waterWeight', e.target.value)}
                        className="m3-input text-sm"
                      />
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => removeTiming(idx)} className="p-2 text-destructive hover:bg-destructive/10 rounded-full mt-1">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onCancel} className="m3-button-outlined flex-1 py-4 text-lg shadow-sm justify-center">Cancel</button>
          <button type="submit" disabled={saving} className="m3-button-primary flex-[2] py-4 text-lg shadow-lg justify-center">
            {saving ? <Loader2 className="animate-spin" size={24} /> : (initialData?.id ? 'Update Recipe' : 'Save Recipe')}
          </button>
        </div>
      </form>
    </div>
  );
}
