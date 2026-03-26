import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Recipe, UserSettings } from '../types';
import RecipeImporter, { RecipeCard } from './RecipeImporter';
import RecipeForm from './RecipeForm';

interface Props {
  recipes: Recipe[];
  onSave: (recipe: Recipe) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  userId: string;
  initialShowForm?: boolean;
  onFormClose?: () => void;
  onEdit?: (recipe: Recipe) => void;
  editingRecipe?: Partial<Recipe> | null;
  settings: UserSettings;
}

export default function RecipeTab({ 
  recipes, 
  onSave, 
  onDelete, 
  userId, 
  initialShowForm = false, 
  onFormClose, 
  onEdit,
  editingRecipe: initialEditingRecipe,
  settings 
}: Props) {
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingRecipe, setEditingRecipe] = useState<Partial<Recipe> | null>(initialEditingRecipe || null);

  useEffect(() => {
    setShowForm(initialShowForm);
  }, [initialShowForm]);

  useEffect(() => {
    setEditingRecipe(initialEditingRecipe || null);
  }, [initialEditingRecipe]);

  const handleSave = async (recipe: Recipe) => {
    await onSave(recipe);
    setShowForm(false);
    setEditingRecipe(null);
    if (onFormClose) onFormClose();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRecipe(null);
    if (onFormClose) onFormClose();
  };

  const savedRecipes = recipes.filter(r => r.isSaved);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            key="recipe-form-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10 max-w-2xl mx-auto pb-20"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-primary-container rounded-2xl shadow-sm">
                <Sparkles className="text-on-primary-container" size={24} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                {editingRecipe?.id ? 'Edit Recipe' : 'New Recipe'}
              </h2>
            </div>

            {!editingRecipe?.id && (
              <div className="pb-8 border-b border-black/5">
                <h3 className="text-xl font-bold mb-6">Import Recipe</h3>
                <RecipeImporter 
                  savedRecipes={savedRecipes}
                  geminiApiKey={settings.geminiApiKey}
                  onEdit={(recipe) => {
                    setEditingRecipe(recipe);
                  }}
                />
              </div>
            )}

            <div className="pt-8">
              <h3 className="text-xl font-bold mb-6">Recipe Details</h3>
              <RecipeForm 
                onSave={handleSave}
                onCancel={handleCancel}
                initialData={editingRecipe}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="recipe-list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-primary" />
                <h2 className="text-xl font-bold">Saved Recipes</h2>
                <span className="text-xs font-bold bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full">
                  {savedRecipes.length}
                </span>
              </div>
            </div>

            {savedRecipes.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <Sparkles size={64} className="mx-auto mb-4" />
                <p className="text-xl">No saved recipes yet.</p>
                <p className="text-sm">Use the + button to import or add one!</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
                {savedRecipes.map((recipe) => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    onToggleSave={async () => {
                      if (recipe.id) {
                        await onDelete(recipe.id);
                      }
                    }} 
                    onEdit={() => {
                      if (onEdit) {
                        onEdit(recipe);
                      } else {
                        setEditingRecipe(recipe);
                        setShowForm(true);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
