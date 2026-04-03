import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Loader2, Info, Hammer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Grinder } from '../types';

interface Props {
  grinders: Grinder[];
  onSave: (grinder: Grinder) => Promise<void>;
  onDelete: (id: string) => void;
  userId: string;
  initialShowForm?: boolean;
  onFormClose?: () => void;
  onEdit?: (grinder: Grinder) => void;
  editingGrinder?: Grinder | null;
}

const GrinderTab = React.memo(({ grinders, onSave, onDelete, userId, initialShowForm, onFormClose, onEdit, editingGrinder }: Props) => {
  const [showForm, setShowForm] = useState(initialShowForm || false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(editingGrinder?.id || null);
  
  // Form state
  const [name, setName] = useState(editingGrinder?.name || '');
  const [brand, setBrand] = useState(editingGrinder?.brand || '');
  const [type, setType] = useState<'Manual' | 'Electric'>(editingGrinder?.type || 'Manual');
  const [notes, setNotes] = useState(editingGrinder?.notes || '');

  React.useEffect(() => {
    if (initialShowForm) {
      setShowForm(true);
    }
  }, [initialShowForm]);

  React.useEffect(() => {
    if (editingGrinder) {
      setEditingId(editingGrinder.id || null);
      setName(editingGrinder.name);
      setBrand(editingGrinder.brand || '');
      setType(editingGrinder.type || 'Manual');
      setNotes(editingGrinder.notes || '');
    }
  }, [editingGrinder]);

  const startEdit = (grinder: Grinder) => {
    setEditingId(grinder.id || null);
    setName(grinder.name);
    setBrand(grinder.brand || '');
    setType(grinder.type || 'Manual');
    setNotes(grinder.notes || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const grinder: Grinder = {
        userId,
        name,
        brand,
        type,
        notes
      };
      if (editingId) grinder.id = editingId;
      
      await onSave(grinder);
      resetForm();
    } catch (err) {
      console.error("Failed to save grinder:", err);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setBrand('');
    setType('Manual');
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
                <Hammer className="text-on-primary-container" size={24} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">{editingId ? 'Edit Grinder' : 'New Grinder'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="pb-8 border-b border-black/5">
                <h3 className="text-xl font-bold mb-6">Grinder Details</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Grinder Name*</label>
                    <input required placeholder="e.g. Comandante C40" value={name} onChange={e => setName(e.target.value)} className="m3-input h-11" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1 ml-1">Brand</label>
                    <input placeholder="e.g. Comandante" value={brand} onChange={e => setBrand(e.target.value)} className="m3-input h-11" />
                  </div>
                </div>
              </div>
              
              <div className="pb-8 border-b border-black/5">
                <h3 className="text-xl font-bold mb-6">Type</h3>
                <div className="flex gap-4">
                  {(['Manual', 'Electric'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all ${type === t ? 'bg-primary text-on-primary shadow-lg scale-105' : 'bg-surface-variant/50 text-on-surface hover:bg-surface-variant'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pb-8 border-b border-black/5">
                <h3 className="text-xl font-bold mb-6">Notes</h3>
                <textarea 
                  placeholder="e.g. Best for pourover, 25 clicks is my baseline" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="m3-input min-h-[120px]" 
                />
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={resetForm} className="m3-button-outlined flex-1 py-4 text-lg shadow-sm justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="m3-button-primary flex-[2] py-4 text-lg shadow-lg justify-center">
                  {saving ? <Loader2 className="animate-spin" size={24} /> : (editingId ? 'Update Grinder' : 'Save Grinder')}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-2">
              <Hammer size={20} className="text-primary" />
              <h2 className="text-xl font-bold">Grinders</h2>
              <span className="text-xs font-bold bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full">
                {grinders.length}
              </span>
            </div>
          </div>

          <motion.div layout className="grid gap-4 md:grid-cols-2 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            {grinders.map((grinder) => (
              <motion.div 
                key={grinder.id}
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
                    <h3 className="text-lg font-bold">{grinder.name}</h3>
                    <p className="text-sm opacity-70">{grinder.brand || 'Unknown Brand'}</p>
                  </div>
                  <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit ? onEdit(grinder) : startEdit(grinder)}
                      className="p-2 text-primary hover:bg-primary-container rounded-full"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => grinder.id && onDelete(grinder.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${grinder.type === 'Electric' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                    {grinder.type}
                  </span>
                </div>

                {grinder.notes && (
                  <div className="mt-4 flex gap-2 items-start opacity-70">
                    <Info size={14} className="mt-1 shrink-0" />
                    <p className="text-sm italic">{grinder.notes}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {grinders.length === 0 && !showForm && (
            <div className="col-span-full py-12 text-center opacity-50">
              <Hammer className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No grinders saved yet. Add one to track your settings!</p>
            </div>
          )}
        </motion.div>
      </div>
    )}
    </div>
  );
});

export default GrinderTab;
