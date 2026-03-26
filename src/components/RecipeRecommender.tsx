import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Loader2, ExternalLink, Bookmark, BookmarkX, ChevronDown, ChevronUp, Edit2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getRecommendedRecipes } from '../services/gemini';
import { Recipe } from '../types';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

export default function RecipeRecommender({ onEdit, savedRecipes = [], geminiApiKey }: { onEdit?: (recipe: Recipe) => void, savedRecipes?: Recipe[], geminiApiKey?: string }) {
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!geminiApiKey && !process.env.GEMINI_API_KEY) {
        setError("Gemini API key is missing. Please add it in Settings > Preferences.");
        setLoading(false);
        return;
      }

      const data = await getRecommendedRecipes(queryText, geminiApiKey);
      if (data && data.length > 0) {
        setRecommendedRecipes(data);
      } else {
        setError("No recipes found. Try a different search term.");
      }
    } catch (err: any) {
      console.error("Error fetching recipes:", err);
      let message = "Failed to fetch recipes. Please try again.";
      if (err?.message?.includes("429") || err?.message?.includes("quota")) {
        message = "Gemini API rate limit exceeded (429). If you haven't set a personal API key in Settings, the shared key might be exhausted. Please try again later or add your own key.";
      } else if (err?.message?.includes("API_KEY_INVALID") || err?.message?.includes("invalid API key")) {
        message = "Invalid Gemini API key. Please check your settings.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (recipe: Recipe) => {
    if (!auth.currentUser) return;

    // Find if this recipe is already in our saved list to get its ID and current status
    const savedVersion = savedRecipes.find(r => r.title === recipe.title);
    const isCurrentlySaved = !!savedVersion;
    const recipeId = savedVersion?.id || recipe.id;

    if (isCurrentlySaved && recipeId) {
      // Unsave
      try {
        await deleteDoc(doc(db, 'recipes', recipeId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `recipes/${recipeId}`);
      }
    } else {
      // Save
      try {
        const { isSaved, id, ...recipeData } = recipe;
        await addDoc(collection(db, 'recipes'), {
          ...recipeData,
          userId: auth.currentUser.uid,
          createdAt: new Date().toISOString(),
          isSaved: true // Explicitly mark as saved
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'recipes');
      }
    }
  };

  const isRecipeSaved = (title: string) => {
    return savedRecipes.some(r => r.title === title);
  };

  return (
    <div className="space-y-8">
      <div className="m3-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary-container rounded-2xl">
            <Sparkles className="text-on-primary-container" size={24} />
          </div>
          <h2 className="text-2xl font-semibold">Recipe Finder</h2>
        </div>

        <div className="flex gap-2 min-w-0">
          <input 
            type="text" 
            placeholder="Search for a bean type or method..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRecipes()}
            className="m3-input flex-1"
          />
          <button 
            onClick={fetchRecipes}
            disabled={loading}
            className="m3-button-primary shrink-0"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            Find
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2 text-destructive text-xs font-bold mt-4 bg-destructive/10 p-3 rounded-xl border border-destructive/20"
          >
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </div>

      {savedRecipes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Bookmark size={16} className="text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">Saved Recipes</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
            {savedRecipes.map((recipe) => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                onToggleSave={() => toggleSave(recipe)} 
                onEdit={onEdit ? () => onEdit(recipe) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {recommendedRecipes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">Recommended</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
            {recommendedRecipes.map((recipe, idx) => (
              <RecipeCard 
                key={recipe.id || `${recipe.title}-${idx}`} 
                recipe={{ ...recipe, isSaved: isRecipeSaved(recipe.title) }} 
                onToggleSave={() => toggleSave(recipe)} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const RecipeCard: React.FC<{ 
  recipe: Recipe; 
  onToggleSave: () => void | Promise<void>;
  onEdit?: () => void;
}> = ({ recipe, onToggleSave, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className="m3-card flex flex-col relative group cursor-pointer w-full min-w-0"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex justify-between items-start mb-4 w-full gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold leading-tight">{recipe.title}</h3>
          <p className="text-sm opacity-70">{recipe.source}</p>
        </div>
        <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          {recipe.url && (
            <a 
              href={recipe.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 hover:bg-black/5 rounded-full text-outline"
              title="View Source"
            >
              <ExternalLink size={18} />
            </a>
          )}
          {recipe.isSaved && onEdit && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 hover:bg-black/5 rounded-full text-outline"
              title="Edit Recipe"
            >
              <Edit2 size={18} />
            </button>
          )}
          <button 
            onClick={onToggleSave}
            className={`p-2 rounded-full transition-colors ${recipe.isSaved ? 'bg-primary text-on-primary' : 'hover:bg-black/5 text-outline'}`}
            title={recipe.isSaved ? "Remove from Saved" : "Save Recipe"}
          >
            {recipe.isSaved ? <BookmarkX size={18} /> : <Bookmark size={18} />}
          </button>
        </div>
      </div>
      
      <p className={`text-sm mb-4 flex-1 w-full ${isExpanded ? '' : 'line-clamp-3'}`}>
        {recipe.description}
      </p>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 bg-secondary-container rounded-xl text-center">
          <p className="text-[10px] uppercase font-bold opacity-50">Coffee</p>
          <p className="font-bold">{recipe.coffeeWeight}g</p>
        </div>
        <div className="p-2 bg-secondary-container rounded-xl text-center">
          <p className="text-[10px] uppercase font-bold opacity-50">Water</p>
          <p className="font-bold">{recipe.waterWeight}g</p>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden w-full"
          >
            <div className="space-y-2 pt-2 border-t border-black/5">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">Instructions</p>
              </div>
              <ul className="text-sm space-y-1.5 list-none pl-0 opacity-80">
                {recipe.timings && recipe.timings.length > 0 ? (
                  recipe.timings.map((t, tIdx) => {
                    const currentWater = parseFloat(t.waterWeight?.replace(/[^\d.]/g, '') || '0');
                    const prevWater = tIdx > 0 
                      ? parseFloat(recipe.timings![tIdx - 1].waterWeight?.replace(/[^\d.]/g, '') || '0')
                      : 0;
                    const diff = currentWater - prevWater;
                    
                    return (
                      <li key={tIdx} className="flex justify-between items-center text-xs">
                        <span className="opacity-70 truncate mr-2 flex-1">{t.step}</span>
                        <div className="flex shrink-0 items-center text-right">
                          <div className="w-10">
                            {t.waterWeight && diff > 0 && (
                              <span className="text-[10px] font-bold text-primary/40">+{diff}g</span>
                            )}
                          </div>
                          <div className="w-12">
                            {t.waterWeight && <span className="font-bold text-primary text-xs">{t.waterWeight}</span>}
                          </div>
                          <div className="w-12">
                            <span className="font-mono text-xs opacity-60">{t.time}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  recipe.steps.map((step, sIdx) => (
                    <li key={sIdx}>{step}</li>
                  ))
                )}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-1 flex justify-center opacity-30 group-hover:opacity-60 transition-opacity">
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
    </div>
  );
}
