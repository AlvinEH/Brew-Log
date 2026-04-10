import React, { useState } from 'react';
import { Hammer, Coffee, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GrinderTab from './GrinderTab';
import BrewerTab from './BrewerTab';
import { Grinder, Brewer } from '../types';

interface Props {
  grinders: Grinder[];
  brewers: Brewer[];
  onSaveGrinder: (grinder: Grinder) => Promise<void>;
  onDeleteGrinder: (id: string) => void;
  onSaveBrewer: (brewer: Brewer) => Promise<void>;
  onDeleteBrewer: (id: string) => void;
  userId: string;
  onEditGrinder?: (grinder: Grinder) => void;
  onEditBrewer?: (brewer: Brewer) => void;
  initialSubTab?: 'grinders' | 'brewers';
  editingGrinder?: Grinder | null;
  editingBrewer?: Brewer | null;
  initialShowForm?: boolean;
  onFormClose?: () => void;
}

const ToolsTab = React.memo(({ 
  grinders, 
  brewers, 
  onSaveGrinder, 
  onDeleteGrinder, 
  onSaveBrewer, 
  onDeleteBrewer, 
  userId, 
  onEditGrinder, 
  onEditBrewer,
  initialSubTab = 'grinders',
  editingGrinder,
  editingBrewer,
  initialShowForm,
  onFormClose
}: Props) => {
  const [activeSubTab, setActiveSubTab] = useState<'grinders' | 'brewers'>(initialSubTab);

  React.useEffect(() => {
    if (editingGrinder) setActiveSubTab('grinders');
    if (editingBrewer) setActiveSubTab('brewers');
  }, [editingGrinder, editingBrewer]);

  React.useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  return (
    <div className="space-y-6">
      {!initialShowForm && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Wrench size={20} className="text-primary" />
              <h2 className="text-xl font-bold">Coffee Gear</h2>
              <span className="text-xs font-bold bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full">
                {activeSubTab === 'grinders' ? grinders.length : brewers.length}
              </span>
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-surface-variant rounded-2xl max-w-md mx-auto w-full">
            <button
              onClick={() => setActiveSubTab('grinders')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeSubTab === 'grinders' 
                  ? 'bg-primary text-on-primary shadow-md' 
                  : 'text-on-surface hover:bg-black/5'
              }`}
            >
              <Hammer size={18} />
              Grinders
            </button>
            <button
              onClick={() => setActiveSubTab('brewers')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeSubTab === 'brewers' 
                  ? 'bg-primary text-on-primary shadow-md' 
                  : 'text-on-surface hover:bg-black/5'
              }`}
            >
              <Coffee size={18} />
              Brewers
            </button>
          </div>
      </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === 'grinders' ? (
            <GrinderTab 
              grinders={grinders}
              onSave={onSaveGrinder}
              onDelete={onDeleteGrinder}
              userId={userId}
              onEdit={onEditGrinder}
              editingGrinder={editingGrinder}
              initialShowForm={initialShowForm && activeSubTab === 'grinders'}
              onFormClose={onFormClose}
            />
          ) : (
            <BrewerTab 
              brewers={brewers}
              onSave={onSaveBrewer}
              onDelete={onDeleteBrewer}
              userId={userId}
              onEdit={onEditBrewer}
              editingBrewer={editingBrewer}
              initialShowForm={initialShowForm && activeSubTab === 'brewers'}
              onFormClose={onFormClose}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

export default ToolsTab;
