import React, { useState } from 'react';
import { Bean, Plus, Globe, Loader2, Trash2, Tag, DollarSign, Weight, Star, Edit2, Archive, RotateCcw, Calendar, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractBeanInfoFromUrl } from '../services/gemini';
import { CoffeeBean, BrewLog, UserSettings } from '../types';

interface Props {
  beans: CoffeeBean[];
  logs: BrewLog[];
  onSave: (bean: CoffeeBean) => Promise<void>;
  onDelete: (id: string) => void;
  userId: string;
  initialShowForm?: boolean;
  onFormClose?: () => void;
  onEdit?: (bean: CoffeeBean) => void;
  editingBean?: CoffeeBean | null;
  settings: UserSettings;
}

export default function CoffeeBeanTab({ beans, logs, onSave, onDelete, userId, initialShowForm, onFormClose, onEdit, editingBean, settings }: Props) {
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [showForm, setShowForm] = useState(initialShowForm || false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(editingBean?.id || null);
  const [activeTab, setActiveTab] = useState<'stock' | 'archived'>('stock');
  const [selectedRoaster, setSelectedRoaster] = useState<string>('All Roasters');
  const [importError, setImportError] = useState<string | null>(null);

  const roasters = ['All Roasters', ...Array.from(new Set(beans.map(b => b.roaster))).sort()];

  React.useEffect(() => {
    if (initialShowForm) {
      setShowForm(true);
    }
  }, [initialShowForm]);

  React.useEffect(() => {
    if (editingBean) {
      setEditingId(editingBean.id || null);
      setName(editingBean.name);
      setRoaster(editingBean.roaster);
      setRoastDate(editingBean.roastDate || '');
      setPrice(editingBean.price || '');
      setWeight(editingBean.weight || 'oz');
      setFlavorProfile(editingBean.flavorProfile || []);
      setNotes(editingBean.notes || '');
      setRating(editingBean.rating || 0);
      setIsArchived(editingBean.isArchived || false);
      setUrl(editingBean.url || '');
    }
  }, [editingBean]);
  
  // Form state
  const [name, setName] = useState(editingBean?.name || '');
  const [roaster, setRoaster] = useState(editingBean?.roaster || '');
  const [roastDate, setRoastDate] = useState(editingBean?.roastDate || '');
  const [price, setPrice] = useState(editingBean?.price || '');
  const [weight, setWeight] = useState(editingBean?.weight?.replace(/\s*oz$/i, '') || '');
  const [flavorProfile, setFlavorProfile] = useState<string[]>(editingBean?.flavorProfile || []);
  const [notes, setNotes] = useState(editingBean?.notes || '');
  const [rating, setRating] = useState(editingBean?.rating || 0);
  const [isArchived, setIsArchived] = useState(editingBean?.isArchived || false);

  const handleImport = async () => {
    if (!url) return;
    setImporting(true);
    setImportError(null);
    
    try {
      if (!settings.geminiApiKey && !process.env.GEMINI_API_KEY) {
        setImportError("Gemini API key is missing. Please add it in Settings > Preferences.");
        setImporting(false);
        return;
      }

      const info = await extractBeanInfoFromUrl(url, settings.geminiApiKey);
      
      if (info && (info.name || info.roaster)) {
        setName(info.name || '');
        setRoaster(info.roaster || '');
        setRoastDate(info.roastDate || '');
        
        // Format price and weight from import
        let importedPrice = info.price || '';
        if (importedPrice && !importedPrice.startsWith('$')) {
          importedPrice = `$${importedPrice}`;
        }
        setPrice(importedPrice);

        let importedWeight = info.weight || '';
        if (importedWeight) {
          const lowerWeight = importedWeight.toLowerCase();
          // If it already has oz, we trust the AI's extraction (which is now instructed to only get oz)
          if (lowerWeight.includes('oz')) {
            // Just ensure it's a clean oz string if there's extra text
            const numericMatch = importedWeight.match(/(\d+(\.\d+)?)\s*oz/i);
            if (numericMatch) {
              importedWeight = numericMatch[1] + 'oz';
            }
          } else {
            const numericValue = parseFloat(importedWeight.replace(/[^0-9.]/g, ''));
            if (!isNaN(numericValue)) {
              if (lowerWeight.includes('kg')) {
                importedWeight = (numericValue * 35.274).toFixed(1) + 'oz';
              } else if (lowerWeight.includes('g')) {
                importedWeight = (numericValue * 0.035274).toFixed(1) + 'oz';
              } else if (lowerWeight.includes('lb')) {
                importedWeight = (numericValue * 16).toFixed(1) + 'oz';
              } else {
                importedWeight = numericValue + 'oz';
              }
            }
          }
        }
        setWeight(importedWeight.replace(/\s*oz$/i, ''));
        
        setFlavorProfile(info.flavorProfile || []);
        setShowForm(true);
      } else {
        setImportError("Could not extract bean details. The site might be blocking access or the URL is invalid.");
      }
    } catch (err: any) {
      console.error("Import error:", err);
      let message = "Failed to import bean details.";
      if (err?.message?.includes("API_KEY_INVALID") || err?.message?.includes("invalid API key")) {
        message = "Invalid Gemini API key. Please check your settings.";
      } else if (err?.message?.includes("quota")) {
        message = "Gemini API quota exceeded. Please try again later.";
      }
      setImportError(message);
    } finally {
      setImporting(false);
    }
  };

  const startEdit = (bean: CoffeeBean) => {
    setEditingId(bean.id || null);
    setName(bean.name);
    setRoaster(bean.roaster);
    setRoastDate(bean.roastDate || '');
    setPrice(bean.price || '');
    setWeight(bean.weight?.replace(/\s*oz$/i, '') || '');
    setFlavorProfile(bean.flavorProfile || []);
    setNotes(bean.notes || '');
    setRating(bean.rating || 0);
    setIsArchived(bean.isArchived || false);
    setUrl(bean.url || '');
    setShowForm(true);
  };

  const handleToggleArchive = async (bean: CoffeeBean) => {
    const updatedBean: CoffeeBean = {
      ...bean,
      isArchived: !bean.isArchived
    };
    await onSave(updatedBean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted - starting save process");
    console.log("Raw form data:", { name, roaster, roastDate, price, weight, flavorProfile, notes, url, isArchived, rating });
    
    if (!name.trim() || !roaster.trim()) {
      console.error("Required fields missing:", { name: name.trim(), roaster: roaster.trim() });
      return;
    }
    
    setSaving(true);
    try {
      // Clean and validate data to match Firestore rules
      const bean: CoffeeBean = {
        userId,
        name: name.trim(),
        roaster: roaster.trim()
      };
      
      // Only include optional fields if they have meaningful values
      if (roastDate && roastDate.trim()) bean.roastDate = roastDate.trim();
      
      if (price && price.trim()) {
        let p = price.trim();
        if (!p.startsWith('$')) p = '$' + p;
        bean.price = p;
      }
      
      if (weight && weight.trim()) {
        let w = weight.trim();
        const lowerW = w.toLowerCase();
        if (!lowerW.endsWith('oz') && !lowerW.endsWith('g') && !lowerW.endsWith('kg') && !lowerW.endsWith('lb')) {
          w = w + 'oz';
        }
        bean.weight = w;
      }
      
      // Always include notes when editing (allow clearing), only include when creating if not empty
      if (editingId || (notes && notes.trim())) bean.notes = notes.trim();
      if (url && url.trim()) bean.url = url.trim();
      if (flavorProfile && flavorProfile.length > 0 && flavorProfile.some(f => f.trim())) {
        bean.flavorProfile = flavorProfile.filter(f => f.trim()).map(f => f.trim());
      }
      if (typeof isArchived === 'boolean') bean.isArchived = isArchived;
      if (rating && rating > 0) bean.rating = rating;
      
      if (editingId) bean.id = editingId;
      
      console.log("Cleaned bean data for Firestore:", bean);
      console.log("Required fields check:", {
        name: bean.name.length > 0,
        roaster: bean.roaster.length > 0,
        userId: !!bean.userId
      });
      
      await onSave(bean);
      console.log("Save successful, resetting form");
      resetForm();
    } catch (err) {
      console.error("Failed to save bean:", err);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setRoaster('');
    setRoastDate('');
    setPrice('');
    setWeight('');
    setFlavorProfile([]);
    setNotes('');
    setUrl('');
    setRating(0);
    setIsArchived(false);
    setEditingId(null);
    setShowForm(false);
    onFormClose?.();
  };

  const getDaysSinceRoast = (roastDate?: string) => {
    if (!roastDate) return null;
    const roast = new Date(roastDate);
    if (isNaN(roast.getTime())) return null;
    const now = new Date();
    // Reset time to midnight for accurate day calculation
    const roastMidnight = new Date(roast.getFullYear(), roast.getMonth(), roast.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = nowMidnight.getTime() - roastMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredBeans = beans.filter(bean => {
    const matchesTab = activeTab === 'stock' ? !bean.isArchived : bean.isArchived;
    const matchesRoaster = selectedRoaster === 'All Roasters' || bean.roaster === selectedRoaster;
    return matchesTab && matchesRoaster;
  });

  const getRemainingWeight = (bean: CoffeeBean) => {
    const numericWeight = parseFloat(bean.weight?.replace(/[^0-9.]/g, '') || '0');
    if (!numericWeight) return null;
    
    // Convert to grams if needed
    let initialWeightGrams = numericWeight;
    if (bean.weight?.toLowerCase().includes('oz')) {
      initialWeightGrams = numericWeight * 28.3495;
    } else if (bean.weight?.toLowerCase().includes('lb')) {
      initialWeightGrams = numericWeight * 453.592;
    } else if (bean.weight?.toLowerCase().includes('kg')) {
      initialWeightGrams = numericWeight * 1000;
    }

    const usedWeight = logs
      .filter(log => {
        // Match by ID if available
        if (log.beanId && bean.id && log.beanId === bean.id) return true;
        
        // Fallback: Match by name and roaster if ID is missing or doesn't match
        // This handles logs created before the ID system or logs where the ID wasn't linked
        const logName = log.beanName?.trim().toLowerCase();
        const beanName = bean.name.trim().toLowerCase();
        const logRoaster = log.roaster?.trim().toLowerCase();
        const beanRoaster = bean.roaster.trim().toLowerCase();
        
        return logName === beanName && logRoaster === beanRoaster;
      })
      .reduce((sum, log) => sum + (log.coffeeWeight || 0), 0);
    return Math.max(0, initialWeightGrams - usedWeight);
  };

  const getInitialWeightGrams = (bean: CoffeeBean) => {
    const numericWeight = parseFloat(bean.weight?.replace(/[^0-9.]/g, '') || '0');
    if (!numericWeight) return 0;
    
    if (bean.weight?.toLowerCase().includes('oz')) {
      return numericWeight * 28.3495;
    } else if (bean.weight?.toLowerCase().includes('lb')) {
      return numericWeight * 453.592;
    } else if (bean.weight?.toLowerCase().includes('kg')) {
      return numericWeight * 1000;
    }
    return numericWeight;
  };

  return (
    <div className="space-y-6">
      {!showForm && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-surface-variant rounded-2xl max-w-md mx-auto w-full">
            <button 
              onClick={() => setActiveTab('stock')}
              className={`flex-1 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'stock' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-black/5'}`}
            >
              In Stock
            </button>
            <button 
              onClick={() => setActiveTab('archived')}
              className={`flex-1 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'archived' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-black/5'}`}
            >
              Archive
            </button>
          </div>

          {/* Roaster Filter */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <select 
                value={selectedRoaster}
                onChange={(e) => setSelectedRoaster(e.target.value)}
                className="m3-input h-12 text-sm font-bold appearance-none bg-surface-variant/30 border-none rounded-xl px-4 pr-10 hover:bg-surface-variant/50 transition-colors cursor-pointer"
              >
                {roasters.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                <Tag size={14} />
              </div>
            </div>
          </div>
        </>
      )}

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-10 max-w-2xl mx-auto pb-20"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-primary-container rounded-2xl shadow-sm">
                <Bean className="text-on-primary-container" size={24} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">{editingId ? 'Edit Bean' : 'New Coffee Bean'}</h2>
            </div>

            <div className="pb-8 border-b border-black/5">
              <h3 className="text-xl font-bold mb-6">Import Details</h3>
              <div className="space-y-4">
                <p className="text-sm opacity-70">Import details from a roaster's website or add manually.</p>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="Paste roaster URL here..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="m3-input flex-1"
                  />
                  <button 
                    onClick={handleImport}
                    disabled={importing}
                    className="m3-button-primary"
                  >
                    {importing ? <Loader2 className="animate-spin" size={20} /> : <Globe size={20} />}
                    Import
                  </button>
                </div>
                {importError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 text-destructive text-xs font-bold mt-2 bg-destructive/10 p-3 rounded-xl border border-destructive/20"
                  >
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{importError}</span>
                  </motion.div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="pb-8 border-b border-black/5">
                <h3 className="text-xl font-bold mb-6">Basic Info</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Bean Name*</label>
                    <input required placeholder="e.g. Ethiopia Yirgacheffe" value={name} onChange={e => setName(e.target.value)} className="m3-input h-12" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Roaster*</label>
                    <input required placeholder="e.g. Onyx Coffee Lab" value={roaster} onChange={e => setRoaster(e.target.value)} className="m3-input h-12" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Roast Date</label>
                    <input 
                      type="date" 
                      value={roastDate} 
                      onChange={e => setRoastDate(e.target.value)} 
                      className="m3-input h-12 placeholder:opacity-50" 
                      placeholder="mm/dd/yyyy"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Price</label>
                      <input 
                        placeholder="e.g. $22" 
                        value={price} 
                        onChange={e => setPrice(e.target.value)} 
                        onBlur={() => {
                          if (price && !price.startsWith('$')) {
                            setPrice('$' + price);
                          }
                        }}
                        className="m3-input h-12" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Weight (oz)</label>
                      <div className="relative">
                        <input 
                          placeholder="e.g. 12" 
                          value={weight} 
                          onChange={e => setWeight(e.target.value)} 
                          className="m3-input h-12 pr-10" 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold opacity-30 pointer-events-none">oz</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pb-8 border-b border-black/5">
                <h3 className="text-xl font-bold mb-6">Flavor & Rating</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Flavor Profile (comma separated)</label>
                    <input 
                      placeholder="e.g. Chocolate, Berry, Citrus" 
                      value={flavorProfile.join(', ')} 
                      onChange={e => setFlavorProfile(e.target.value.split(',').map(s => s.trim()))}
                      className="m3-input h-12" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${rating >= star ? 'bg-primary text-white shadow-md scale-105' : 'bg-surface-variant/50 text-outline hover:bg-surface-variant'}`}
                        >
                          <Star size={24} fill={rating >= star ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pb-8 border-b border-black/5">
                <h3 className="text-xl font-bold mb-6">Notes</h3>
                <textarea 
                  placeholder="Any extra details about these beans..." 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="m3-input min-h-[120px]" 
                />
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={resetForm} className="m3-button-outlined flex-1 py-4 text-lg shadow-sm justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="m3-button-primary flex-[2] py-4 text-lg shadow-lg justify-center">
                  {saving ? <Loader2 className="animate-spin" size={24} /> : (editingId ? 'Update Bean' : 'Save Bean')}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div 
            key={activeTab}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid gap-4 md:grid-cols-2 overflow-hidden"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredBeans.length === 0 ? (
                <motion.div 
                  key="empty-state"
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="col-span-full py-12 text-center opacity-50"
                >
                  <Bean size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No {activeTab} beans found.</p>
                </motion.div>
              ) : (
                filteredBeans.map((bean) => {
                  const remaining = getRemainingWeight(bean);
                  const initialWeightGrams = getInitialWeightGrams(bean);
                  const percentage = initialWeightGrams ? (remaining! / initialWeightGrams) * 100 : 0;

                  return (
                    <motion.div 
                      key={bean.id}
                      layout="position"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ 
                        opacity: { duration: 0.2 },
                        layout: { duration: 0.3, ease: "easeInOut" }
                      }}
                      className="m3-card relative group"
                    >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold">{bean.name}</h3>
                        </div>
                        <p className="text-sm opacity-70">{bean.roaster}</p>
                      </div>
                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleToggleArchive(bean)}
                        title={bean.isArchived ? "Restore to Stock" : "Archive (Used Up)"}
                        className="p-2 text-primary hover:bg-primary-container rounded-full"
                      >
                        {bean.isArchived ? <RotateCcw size={18} /> : <Archive size={18} />}
                      </button>
                      <button 
                        onClick={() => onEdit ? onEdit(bean) : startEdit(bean)}
                        className="p-2 text-primary hover:bg-primary-container rounded-full"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => bean.id && onDelete(bean.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {bean.rating && (
                    <div className="flex gap-0.5 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={14} 
                          className={star <= bean.rating! ? 'text-primary' : 'text-outline opacity-20'} 
                          fill={star <= bean.rating! ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {bean.roastDate && !isNaN(new Date(bean.roastDate).getTime()) && (
                      <>
                        <div className="flex items-center gap-1 text-xs bg-secondary-container px-2 py-1 rounded-lg">
                          <Calendar size={12} /> Roasted: {new Date(bean.roastDate).toLocaleDateString()}
                        </div>
                        {(() => {
                          const days = getDaysSinceRoast(bean.roastDate);
                          if (days === null) return null;
                          return (
                            <div className="flex items-center gap-1 text-xs bg-secondary-container px-2 py-1 rounded-lg">
                              <Clock size={12} /> {days} days
                            </div>
                          );
                        })()}
                      </>
                    )}
                    {bean.price && (
                      <div className="flex items-center gap-1 text-xs bg-secondary-container px-2 py-1 rounded-lg">
                        <DollarSign size={12} /> {bean.price}
                      </div>
                    )}
                    {bean.weight && (
                      <div className="flex items-center gap-1 text-xs bg-secondary-container px-2 py-1 rounded-lg">
                        <Weight size={12} /> {bean.weight}
                      </div>
                    )}
                  </div>

                  {remaining !== null && !bean.isArchived && (
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                        <span className="opacity-50">
                          Stock Level
                        </span>
                        <div className="flex gap-4 items-center">
                          <span className="opacity-50">{Math.round(remaining)}g / {Math.round(initialWeightGrams)}g</span>
                          <span className="text-primary font-black">{Math.round(percentage)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                    </div>
                  )}

                {bean.flavorProfile && bean.flavorProfile.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {bean.flavorProfile.map((note, i) => (
                      <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-primary-container text-on-primary-container px-2 py-0.5 rounded-md">
                        {note}
                      </span>
                    ))}
                  </div>
                )}

                {bean.notes && <p className="text-sm italic opacity-70">{bean.notes}</p>}
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </motion.div>
  </AnimatePresence>
)}
</div>
);
}
