import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Loader2, Info, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Brewer } from '../types';

interface Props {
  brewers: Brewer[];
  onSave: (brewer: Brewer) => Promise<void>;
  onDelete: (id: string) => void;
  userId: string;
  initialShowForm?: boolean;
  onFormClose?: () => void;
  onEdit?: (brewer: Brewer) => void;
  editingBrewer?: Brewer | null;
}

const BrewerTab = React.memo(({ brewers, onSave, onDelete, userId, initialShowForm, onFormClose, onEdit, editingBrewer }: Props) => {
  const [showForm, setShowForm] = useState(initialShowForm || false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(editingBrewer?.id || null);
  
  // Form state
  const [name, setName] = useState(editingBrewer?.name || '');
  const [brand, setBrand] = useState(editingBrewer?.brand || '');
  const [type, setType] = useState(editingBrewer?.type || '');
  const [notes, setNotes] = useState(editingBrewer?.notes || '');

  React.useEffect(() => {
    if (initialShowForm) {
      setShowForm(true);
    }
  }, [initialShowForm]);

  React.useEffect(() => {
    if (editingBrewer) {
      setEditingId(editingBrewer.id || null);
      setName(editingBrewer.name);
      setBrand(editingBrewer.brand || '');
      setType(editingBrewer.type || '');
      setNotes(editingBrewer.notes || '');
    }
  }, [editingBrewer]);

  const startEdit = (brewer: Brewer) => {
    setEditingId(brewer.id || null);
    setName(brewer.name);
    setBrand(brewer.brand || '');
    setType(brewer.type || '');
    setNotes(brewer.notes || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const brewer: Brewer = {
        userId,
        name,
        brand,
        type,
        notes
      };
      if (editingId) brewer.id = editingId;
      
      await onSave(brewer);
      resetForm();
    } catch (err) {
      console.error("Failed to save brewer:", err);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setBrand('');
    setType('');
    setNotes('');
    setEditingId(null);
    setShowForm(false);
    onFormClose?.();
  };

  return (
    <div className="space-y-6">
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
                <Coffee className="text-on-primary-container" size={24} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">{editingId ? 'Edit Brewer' : 'New Brewer'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="pb-8 border-b border-black/5">
                <h3 className="text-xl font-bold mb-6">Brewer Details</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Brewer Name*</label>
                    <input required placeholder="e.g. Hario V60" value={name} onChange={e => setName(e.target.value)} className="m3-input h-11" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Brand</label>
                    <input placeholder="e.g. Hario" value={brand} onChange={e => setBrand(e.target.value)} className="m3-input h-11" />
                  </div>
                </div>
              </div>
              
              <div className="pb-8 border-b border-black/5">
                <h3 className="text-xl font-bold mb-6">Type</h3>
                <input placeholder="e.g. Pourover, Immersion, Press" value={type} onChange={e => setType(e.target.value)} className="m3-input h-11" />
              </div>

              <div className="pb-8 border-b border-black/5">
                <h3 className="text-xl font-bold mb-6">Notes</h3>
                <textarea 
                  placeholder="e.g. Use 02 size filters, pre-heat well" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="m3-input min-h-[120px]" 
                />
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={resetForm} className="m3-button-outlined flex-1 py-4 text-lg shadow-sm justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="m3-button-primary flex-[2] py-4 text-lg shadow-lg justify-center">
                  {saving ? <Loader2 className="animate-spin" size={24} /> : (editingId ? 'Update Brewer' : 'Save Brewer')}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <div className="space-y-6">
          <motion.div layout className="grid gap-4 md:grid-cols-2 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            {brewers.map((brewer) => (
              <motion.div 
                key={brewer.id}
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
                    <h3 className="text-lg font-bold">{brewer.name}</h3>
                    <p className="text-sm opacity-70">{brewer.brand || 'Unknown Brand'}</p>
                  </div>
                  <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit ? onEdit(brewer) : startEdit(brewer)}
                      className="p-2 text-primary hover:bg-primary-container rounded-full"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => brewer.id && onDelete(brewer.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {brewer.type && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary-container text-on-primary-container">
                      {brewer.type}
                    </span>
                  </div>
                )}

                {brewer.notes && (
                  <div className="mt-4 flex gap-2 items-start opacity-70">
                    <Info size={14} className="mt-1 shrink-0" />
                    <p className="text-sm italic">{brewer.notes}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {brewers.length === 0 && !showForm && (
            <div className="col-span-full py-12 text-center opacity-50">
              <Coffee className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No brewers saved yet. Add one to track your gear!</p>
            </div>
          )}
        </motion.div>
      </div>
    )}
    </div>
  );
});

export default BrewerTab;
