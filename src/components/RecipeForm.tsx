import React, { useState, useEffect } from 'react';
import { Sparkles, Save, X, Loader2, Plus, Trash2 } from 'lucide-react';
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
  const [timings, setTimings] = useState<BrewTiming[]>(initialData?.timings || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = parseFloat(coffeeWeight) || 0;
    const w = parseFloat(waterWeight) || 0;
    if (c > 0 && w > 0) {
      setRatio(`1:${(w / c).toFixed(1)}`);
    }
  }, [coffeeWeight, waterWeight]);

  const addTiming = () => {
    setTimings([...timings, { step: '', time: '', waterWeight: '' }]);
  };

  const updateTiming = (idx: number, field: keyof BrewTiming, val: string) => {
    const newTimings = [...timings];
    newTimings[idx][field] = val;
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
    <div className="m3-card max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-container rounded-2xl">
            <Sparkles className="text-on-primary-container" size={24} />
          </div>
          <h2 className="text-2xl font-semibold">{initialData?.id ? 'Edit Recipe' : 'Create Recipe'}</h2>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-black/5 rounded-full">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Recipe Title*</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} className="m3-input" placeholder="e.g. Morning V60" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Source</label>
            <input value={source} onChange={e => setSource(e.target.value)} className="m3-input" placeholder="e.g. James Hoffmann" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="m3-input min-h-[80px]" placeholder="Brief notes about this recipe..." />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 ml-1">Brew Steps & Timings</label>
            <button type="button" onClick={addTiming} className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1">
              <Plus size={14} /> Add Step
            </button>
          </div>
          
          <div className="space-y-3">
            {timings.map((t, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <input 
                    placeholder="Step description" 
                    value={t.step} 
                    onChange={e => updateTiming(idx, 'step', e.target.value)}
                    className="m3-input h-10 text-sm"
                  />
                  <div className="flex gap-2">
                    <input 
                      placeholder="Time" 
                      value={t.time} 
                      onChange={e => updateTiming(idx, 'time', e.target.value)}
                      className="m3-input h-10 text-sm flex-1"
                    />
                    <input 
                      placeholder="Water (g)" 
                      value={t.waterWeight || ''} 
                      onChange={e => updateTiming(idx, 'waterWeight', e.target.value)}
                      className="m3-input h-10 text-sm flex-1"
                    />
                  </div>
                </div>
                <button type="button" onClick={() => removeTiming(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-full mt-1">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onCancel} className="m3-button-outlined flex-1 py-3 justify-center">Cancel</button>
          <button type="submit" disabled={saving} className="m3-button-primary flex-1 py-3 justify-center">
            {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Save Recipe</>}
          </button>
        </div>
      </form>
    </div>
  );
}
