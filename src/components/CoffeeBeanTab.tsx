import React, { useState } from 'react';
import { Bean, Plus, Globe, Loader2, Trash2, Tag, DollarSign, Weight, Star, Edit2, Archive, RotateCcw, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractBeanInfoFromUrl } from '../services/gemini';
import { CoffeeBean } from '../types';

interface Props {
  beans: CoffeeBean[];
  onSave: (bean: CoffeeBean) => Promise<void>;
  onDelete: (id: string) => void;
  userId: string;
  initialShowForm?: boolean;
  onFormClose?: () => void;
  onEdit?: (bean: CoffeeBean) => void;
  editingBean?: CoffeeBean | null;
}

export default function CoffeeBeanTab({ beans, onSave, onDelete, userId, initialShowForm, onFormClose, onEdit, editingBean }: Props) {
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [showForm, setShowForm] = useState(initialShowForm || false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(editingBean?.id || null);
  const [activeTab, setActiveTab] = useState<'stock' | 'archived'>('stock');

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
      setWeight(editingBean.weight || '');
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
  const [weight, setWeight] = useState(editingBean?.weight || '');
  const [flavorProfile, setFlavorProfile] = useState<string[]>(editingBean?.flavorProfile || []);
  const [notes, setNotes] = useState(editingBean?.notes || '');
  const [rating, setRating] = useState(editingBean?.rating || 0);
  const [isArchived, setIsArchived] = useState(editingBean?.isArchived || false);

  const handleImport = async () => {
    if (!url) return;
    setImporting(true);
    const info = await extractBeanInfoFromUrl(url);
    if (info) {
      setName(info.name || '');
      setRoaster(info.roaster || '');
      setRoastDate(info.roastDate || '');
      setPrice(info.price || '');
      setWeight(info.weight || '');
      setFlavorProfile(info.flavorProfile || []);
      setShowForm(true);
    }
    setImporting(false);
  };

  const startEdit = (bean: CoffeeBean) => {
    setEditingId(bean.id || null);
    setName(bean.name);
    setRoaster(bean.roaster);
    setRoastDate(bean.roastDate || '');
    setPrice(bean.price || '');
    setWeight(bean.weight || '');
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
    setSaving(true);
    try {
      const bean: CoffeeBean = {
        userId,
        name,
        roaster,
        roastDate,
        price,
        weight,
        flavorProfile,
        notes,
        url,
        isArchived,
        rating: rating > 0 ? rating : undefined
      };
      if (editingId) bean.id = editingId;
      
      await onSave(bean);
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

  const filteredBeans = beans.filter(bean => 
    activeTab === 'stock' ? !bean.isArchived : bean.isArchived
  );

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
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="pb-8 border-b border-black/5">
                <h3 className="text-xl font-bold mb-6">Basic Info</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Bean Name*</label>
                    <input required placeholder="e.g. Ethiopia Yirgacheffe" value={name} onChange={e => setName(e.target.value)} className="m3-input h-11" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Roaster*</label>
                    <input required placeholder="e.g. Onyx Coffee Lab" value={roaster} onChange={e => setRoaster(e.target.value)} className="m3-input h-11" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Roast Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-outline opacity-50" size={18} />
                      <input 
                        type="date" 
                        value={roastDate} 
                        onChange={e => setRoastDate(e.target.value)} 
                        className="m3-input pl-10 h-11" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Price</label>
                      <input placeholder="e.g. $22" value={price} onChange={e => setPrice(e.target.value)} className="m3-input h-11" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Weight</label>
                      <input placeholder="e.g. 250g" value={weight} onChange={e => setWeight(e.target.value)} className="m3-input h-11" />
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
                      className="m3-input h-11" 
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
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredBeans.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-12 text-center opacity-50"
              >
                <Bean size={48} className="mx-auto mb-4 opacity-20" />
                <p>No {activeTab} beans found.</p>
              </motion.div>
            ) : (
              filteredBeans.map((bean) => (
                <motion.div 
                  key={bean.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="m3-card relative group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold">{bean.name}</h3>
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
                      <div className="flex items-center gap-1 text-xs bg-secondary-container px-2 py-1 rounded-lg">
                        <Calendar size={12} /> Roasted: {new Date(bean.roastDate).toLocaleDateString()}
                      </div>
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

                {bean.flavorProfile && bean.flavorProfile.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {bean.flavorProfile.map((note, i) => (
                      <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-primary-container text-on-primary-container px-2 py-0.5 rounded-md">
                        {note}
                      </span>
                    ))}
                  </div>
                )}

                {bean.notes && <p className="text-sm italic opacity-70">"{bean.notes}"</p>}
              </motion.div>
            ))
          )}
        </AnimatePresence>
        </div>
      )}
    </div>
  );
}
