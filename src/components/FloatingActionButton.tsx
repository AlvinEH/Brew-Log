import React, { useState, useRef } from 'react';
import { Plus, Coffee, Bean, Hammer, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onAddBrew: () => void;
  onAddBean: () => void;
  onAddGrinder: () => void;
  onAddRecipe: () => void;
  visible?: boolean;
}

export default function FloatingActionButton({ onAddBrew, onAddBean, onAddGrinder, onAddRecipe, visible = true }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen(!isOpen);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <>
          {/* Backdrop for closing when clicking outside */}
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-[65] bg-black/10 backdrop-blur-[2px]"
              />
            )}
          </AnimatePresence>

          <motion.div 
            ref={fabRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-[70] flex flex-col items-end gap-4"
          >
            <AnimatePresence initial={false}>
              {isOpen && (
                <div className="flex flex-col items-end gap-3 mb-2">
                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    onClick={() => handleAction(onAddBrew)}
                    className="flex items-center gap-3 group"
                  >
                    <span className="bg-surface-variant text-on-surface-variant px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg transition-opacity">
                      New Brew
                    </span>
                    <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                      <Coffee size={24} />
                    </div>
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    transition={{ delay: 0.05 }}
                    onClick={() => handleAction(onAddBean)}
                    className="flex items-center gap-3 group"
                  >
                    <span className="bg-surface-variant text-on-surface-variant px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg transition-opacity">
                      New Bean
                    </span>
                    <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                      <Bean size={24} />
                    </div>
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => handleAction(onAddGrinder)}
                    className="flex items-center gap-3 group"
                  >
                    <span className="bg-surface-variant text-on-surface-variant px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg transition-opacity">
                      New Grinder
                    </span>
                    <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                      <Hammer size={24} />
                    </div>
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    transition={{ delay: 0.15 }}
                    onClick={() => handleAction(onAddRecipe)}
                    className="flex items-center gap-3 group"
                  >
                    <span className="bg-surface-variant text-on-surface-variant px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg transition-opacity">
                      New Recipe
                    </span>
                    <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                      <Sparkles size={24} />
                    </div>
                  </motion.button>
                </div>
              )}
            </AnimatePresence>

            <button
              onClick={toggle}
              className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-300 ${
                isOpen ? 'bg-error-container text-on-error-container rotate-45' : 'bg-primary text-on-primary'
              }`}
            >
              <Plus size={32} />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
