/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Coffee, 
  Plus, 
  History, 
  Sparkles, 
  LogOut, 
  LogIn,
  Loader2,
  AlertCircle,
  Bean,
  Settings,
  User as UserIcon,
  Hammer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrewLog, CoffeeBean, Grinder, Recipe, UserSettings, ColorScheme } from './types';
import { 
  auth, 
  db, 
  getGoogleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  handleFirestoreError,
  OperationType
} from './firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  doc,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { User } from 'firebase/auth';

// Components
import BrewLogList from './components/BrewLogList';
import BrewLogForm from './components/BrewLogForm';
import RecipeImporter from './components/RecipeImporter';
import RecipeForm from './components/RecipeForm';
import RatioCalculator from './components/RatioCalculator';
import TemperatureConverter from './components/TemperatureConverter';
import CoffeeBeanTab from './components/CoffeeBeanTab';
import GrinderTab from './components/GrinderTab';
import FloatingActionButton from './components/FloatingActionButton';

type Tab = 'history' | 'new' | 'recipes' | 'beans' | 'grinders' | 'settings' | 'new-bean' | 'new-grinder';
type SettingsSubTab = 'ratio' | 'temp' | 'preferences' | 'account';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState({
    logs: false,
    beans: false,
    grinders: false,
    recipes: false,
    settings: false
  });
  const [activeTab, setActiveTab] = useState<Tab>('history');
  const [previousTab, setPreviousTab] = useState<Tab>('history');

  const navigateToTab = (newTab: Tab) => {
    const isNewTab = ['new', 'new-bean', 'new-grinder'].includes(newTab);
    const isCurrentTabNew = ['new', 'new-bean', 'new-grinder'].includes(activeTab);

    if (isNewTab && !isCurrentTabNew) {
      setPreviousTab(activeTab);
    }
    setActiveTab(newTab);
  };
  const [logs, setLogs] = useState<BrewLog[]>([]);
  const [beans, setBeans] = useState<CoffeeBean[]>([]);
  const [grinders, setGrinders] = useState<Grinder[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ 
    userId: '', 
    tempUnit: 'F',
    theme: 'system',
    colorScheme: 'default',
    lowStockThreshold: 50
  });
  const [error, setError] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<BrewLog | null>(null);
  const [editingBean, setEditingBean] = useState<CoffeeBean | null>(null);
  const [editingGrinder, setEditingGrinder] = useState<Grinder | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Partial<Recipe> | null>(null);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('ratio');

  useEffect(() => {
    if (activeTab !== 'recipes') {
      setShowRecipeForm(false);
      setEditingRecipe(null);
    }
    if (activeTab !== 'new') setEditingLog(null);
    if (activeTab !== 'new-bean') setEditingBean(null);
    if (activeTab !== 'new-grinder') setEditingGrinder(null);
  }, [activeTab]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all scheme classes
    root.classList.remove('scheme-catppuccin', 'scheme-rose-pine', 'scheme-gruvbox', 'scheme-everforest');
    if (settings.colorScheme && settings.colorScheme !== 'default') {
      root.classList.add(`scheme-${settings.colorScheme}`);
    }

    // Handle Dark Mode
    const isDark = settings.theme === 'dark' || 
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme, settings.colorScheme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("Auth state changed:", u ? `User: ${u.uid} (${u.email})` : "No user");
      setUser(u);
      if (!u) {
        setLoading(false);
        console.log("User not authenticated, stopping loading");
      } else {
        console.log("User authenticated:", {
          uid: u.uid,
          email: u.email,
          emailVerified: u.emailVerified
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    // Check if all initial data is loaded
    const isAllLoaded = Object.values(dataLoaded).every(v => v);
    if (isAllLoaded && loading) {
      setLoading(false);
    }
  }, [user?.uid, dataLoaded, loading]);

  useEffect(() => {
    if (!user?.uid) {
      setLogs([]);
      setBeans([]);
      setRecipes([]);
      setGrinders([]);
      return;
    }

    // Brew Logs Subscription
    const qBrews = query(
      collection(db, 'brews'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubBrews = onSnapshot(qBrews, (snapshot) => {
      const newLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BrewLog[];
      setLogs(newLogs);
      setDataLoaded(prev => prev.logs ? prev : { ...prev, logs: true });
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'brews');
      setDataLoaded(prev => prev.logs ? prev : { ...prev, logs: true });
    });

    // Coffee Beans Subscription
    const qBeans = query(
      collection(db, 'beans'),
      where('userId', '==', user.uid)
    );

    const unsubBeans = onSnapshot(qBeans, (snapshot) => {
      const newBeans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CoffeeBean[];
      setBeans(newBeans);
      setDataLoaded(prev => prev.beans ? prev : { ...prev, beans: true });
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'beans');
      setDataLoaded(prev => prev.beans ? prev : { ...prev, beans: true });
    });

    // Grinders Subscription
    const qGrinders = query(
      collection(db, 'grinders'),
      where('userId', '==', user.uid)
    );

    const unsubGrinders = onSnapshot(qGrinders, (snapshot) => {
      const newGrinders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Grinder[];
      setGrinders(newGrinders);
      setDataLoaded(prev => prev.grinders ? prev : { ...prev, grinders: true });
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'grinders');
      setDataLoaded(prev => prev.grinders ? prev : { ...prev, grinders: true });
    });

    // Recipes Subscription
    const qRecipes = query(
      collection(db, 'recipes'),
      where('userId', '==', user.uid)
    );

    const unsubRecipes = onSnapshot(qRecipes, (snapshot) => {
      const newRecipes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recipe[];
      setRecipes(newRecipes);
      setDataLoaded(prev => prev.recipes ? prev : { ...prev, recipes: true });
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'recipes');
      setDataLoaded(prev => prev.recipes ? prev : { ...prev, recipes: true });
    });

    return () => {
      unsubBrews();
      unsubBeans();
      unsubGrinders();
      unsubRecipes();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const qSettings = query(
      collection(db, 'settings'),
      where('userId', '==', user.uid)
    );

    const unsubSettings = onSnapshot(qSettings, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setSettings({
          userId: user.uid,
          tempUnit: 'F',
          theme: 'system',
          colorScheme: 'default',
          lowStockThreshold: 50,
          ...data
        } as UserSettings);
      } else {
        // Default settings
        setSettings({ userId: user.uid, tempUnit: 'F', theme: 'system', colorScheme: 'default', lowStockThreshold: 50 });
      }
      setDataLoaded(prev => prev.settings ? prev : { ...prev, settings: true });
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'settings');
      setDataLoaded(prev => prev.settings ? prev : { ...prev, settings: true });
    });

    return () => unsubSettings();
  }, [user?.uid]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, getGoogleProvider());
    } catch (err) {
      setError('Failed to login. Please try again.');
    }
  };

  const handleLogout = () => signOut(auth);

  const saveLog = async (log: BrewLog) => {
    console.log("saveLog called with:", log);
    console.log("Current user:", user);
    
    if (!user?.uid) {
      console.error("User not authenticated");
      setError("You must be signed in to save brew logs");
      return;
    }
    
    try {
      let dateString: string;
      if (log.date instanceof Timestamp) {
        dateString = log.date.toDate().toISOString();
      } else if (typeof log.date === 'string') {
        dateString = log.date;
      } else if (log.date && (log.date as any).seconds) {
        // Handle POJO version of Timestamp that sometimes comes back from Firestore
        dateString = new Date((log.date as any).seconds * 1000).toISOString();
      } else {
        dateString = new Date().toISOString();
      }
      
      // Clean and validate data to match Firestore rules
      const cleanedLog: any = {
        userId: user.uid,
        date: dateString,
        beanName: log.beanName?.trim() || '',
        coffeeWeight: log.coffeeWeight || 0,
        waterWeight: log.waterWeight || 0
      };
      
      // Validate required fields
      if (!cleanedLog.beanName || cleanedLog.beanName.length === 0) {
        setError("Bean name is required");
        throw new Error("Bean name is required");
      }
      
      if (cleanedLog.coffeeWeight <= 0 || cleanedLog.waterWeight <= 0) {
        setError("Coffee weight and water weight must be greater than 0");
        throw new Error("Invalid weights");
      }
      
      // Only include optional fields if they have meaningful values
      if (log.beanId && log.beanId.trim()) cleanedLog.beanId = log.beanId.trim();
      if (log.roaster && log.roaster.trim()) cleanedLog.roaster = log.roaster.trim();
      if (log.grinder && log.grinder.trim()) cleanedLog.grinder = log.grinder.trim();
      if (log.grindSize && log.grindSize.trim()) cleanedLog.grindSize = log.grindSize.trim();
      if (log.recipeId && log.recipeId.trim()) cleanedLog.recipeId = log.recipeId.trim();
      if (log.ratio && log.ratio.trim()) cleanedLog.ratio = log.ratio.trim();
      if (log.waterTemp && log.waterTemp.trim()) cleanedLog.waterTemp = log.waterTemp.trim();
      if (log.notes && log.notes.trim()) cleanedLog.notes = log.notes.trim();
      if (log.timings && Array.isArray(log.timings) && log.timings.length > 0) {
        cleanedLog.timings = log.timings;
      }
      if (log.rating && log.rating > 0 && log.rating <= 5) cleanedLog.rating = log.rating;
      
      console.log("Final cleaned brew log data for Firestore:", cleanedLog);
      
      if (log.id) {
        console.log("Updating existing log with ID:", log.id);
        await updateDoc(doc(db, 'brews', log.id), cleanedLog);
        console.log("Brew log updated successfully");
      } else {
        console.log("Creating new brew log");
        const docRef = await addDoc(collection(db, 'brews'), cleanedLog);
        console.log("Brew log created with ID:", docRef.id);
      }
      navigateToTab('history');
      setEditingLog(null);
    } catch (err) {
      console.error("saveLog error:", err);
      handleFirestoreError(err, log.id ? OperationType.UPDATE : OperationType.CREATE, 'brews');
      setError(err instanceof Error ? err.message : 'An error occurred while saving the brew log.');
      throw err;
    }
  };

  const handleEditLog = (log: BrewLog) => {
    navigateToTab('new');
    setEditingLog(log);
  };

  const deleteLog = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'brews', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'brews');
    }
  };

  const saveBean = async (bean: CoffeeBean) => {
    console.log("saveBean called with:", bean);
    console.log("Current user:", user);
    console.log("User authenticated:", !!user?.uid);
    
    if (!user?.uid) {
      console.error("User not authenticated");
      setError("You must be signed in to save beans");
      return;
    }
    
    try {
      if (bean.id) {
        console.log("Updating existing bean with ID:", bean.id);
        const { id, ...data } = bean;
        console.log("Data to update:", data);
        await updateDoc(doc(db, 'beans', id), data);
        console.log("Bean updated successfully");
      } else {
        console.log("Creating new bean with data:", bean);
        const docRef = await addDoc(collection(db, 'beans'), bean);
        console.log("Bean created with ID:", docRef.id);
      }
    } catch (err) {
      console.error("saveBean error:", err);
      handleFirestoreError(err, bean.id ? OperationType.UPDATE : OperationType.CREATE, 'beans');
      setError(err instanceof Error ? err.message : 'An error occurred while saving the bean.');
      throw err;
    }
  };

  const deleteBean = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'beans', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'beans');
    }
  };

  const saveGrinder = async (grinder: Grinder) => {
    try {
      if (grinder.id) {
        const { id, ...data } = grinder;
        await updateDoc(doc(db, 'grinders', id), data);
      } else {
        await addDoc(collection(db, 'grinders'), grinder);
      }
    } catch (err) {
      handleFirestoreError(err, grinder.id ? OperationType.UPDATE : OperationType.CREATE, 'grinders');
      setError(err instanceof Error ? err.message : 'An error occurred while saving the grinder.');
      throw err;
    }
  };

  const deleteGrinder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'grinders', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'grinders');
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    try {
      const settingsDocRef = doc(db, 'settings', user.uid);
      // Ensure all required fields are present by merging with current settings and defaults
      const fullSettings = { 
        userId: user.uid,
        tempUnit: 'F',
        theme: 'system',
        colorScheme: 'default',
        ...settings, 
        ...newSettings 
      };
      await setDoc(settingsDocRef, fullSettings, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-24 h-24 bg-primary-container rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Coffee className="text-on-primary-container" size={48} />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">BrewLog</h1>
          <p className="text-lg opacity-70 mb-10">Track your daily pourover journey with precision and style.</p>
          
          <button 
            onClick={handleLogin}
            className="m3-button-primary w-full py-4 text-lg justify-center shadow-lg"
          >
            <LogIn size={24} />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (!user) return;
    try {
      if (recipe.id) {
        const { id, ...data } = recipe;
        await updateDoc(doc(db, 'recipes', id), data);
      } else {
        await addDoc(collection(db, 'recipes'), {
          ...recipe,
          userId: user.uid,
          createdAt: new Date().toISOString()
        });
      }
      setShowRecipeForm(false);
      setEditingRecipe(null);
    } catch (err) {
      handleFirestoreError(err, recipe.id ? OperationType.UPDATE : OperationType.CREATE, 'recipes');
    }
  };

  const handleSaveAsRecipe = (logData: Partial<BrewLog>) => {
    const recipeData: Partial<Recipe> = {
      title: `${logData.beanName || 'New'} Recipe`,
      source: 'Personal Brew',
      description: logData.notes || '',
      coffeeWeight: logData.coffeeWeight || 15,
      waterWeight: logData.waterWeight || 225,
      ratio: logData.ratio || '1:15',
      timings: logData.timings || [],
      steps: logData.timings?.map(t => t.step) || []
    };
    setEditingRecipe(recipeData);
    setShowRecipeForm(true);
    navigateToTab('recipes');
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-black/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Coffee className="text-primary" size={28} />
          <span className="text-2xl font-bold tracking-tight">BrewLog</span>
        </div>
        
        <div className="flex items-center gap-4">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
            alt="Profile" 
            className="w-10 h-10 rounded-full border-2 border-primary-container"
            referrerPolicy="no-referrer"
          />
          <button onClick={handleLogout} className="p-2 hover:bg-black/5 rounded-full text-outline">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="tab-content-wrapper overflow-hidden"
          >
            {activeTab === 'history' && (
              <BrewLogList logs={logs} onDelete={deleteLog} onEdit={handleEditLog} savedRecipes={recipes} savedBeans={beans} />
            )}
            {activeTab === 'new' && (
              <BrewLogForm 
                onSave={saveLog} 
                userId={user.uid} 
                savedBeans={beans.filter(b => !b.isArchived)} 
                savedGrinders={grinders} 
                savedRecipes={recipes.filter(r => r.isSaved)}
                tempUnit={settings.tempUnit}
                defaultGrinderId={settings.defaultGrinderId}
                initialData={editingLog}
                onCancel={() => {
                  setEditingLog(null);
                  setActiveTab(previousTab);
                }}
                onSaveAsRecipe={handleSaveAsRecipe}
              />
            )}
            {activeTab === 'beans' && (
              <CoffeeBeanTab 
                beans={beans} 
                logs={logs}
                onSave={saveBean} 
                onDelete={deleteBean} 
                userId={user.uid} 
                onEdit={(bean) => {
                  setEditingBean(bean);
                  navigateToTab('new-bean');
                }}
                settings={settings}
              />
            )}
            {activeTab === 'new-bean' && (
              <CoffeeBeanTab 
                beans={beans} 
                logs={logs}
                onSave={saveBean} 
                onDelete={deleteBean} 
                userId={user.uid} 
                initialShowForm={true}
                onFormClose={() => {
                  setEditingBean(null);
                  setActiveTab(previousTab);
                }}
                editingBean={editingBean}
                settings={settings}
              />
            )}
            {activeTab === 'grinders' && (
              <GrinderTab 
                grinders={grinders} 
                onSave={saveGrinder} 
                onDelete={deleteGrinder} 
                userId={user.uid} 
                onEdit={(grinder) => {
                  setEditingGrinder(grinder);
                  navigateToTab('new-grinder');
                }}
              />
            )}
            {activeTab === 'new-grinder' && (
              <GrinderTab 
                grinders={grinders} 
                onSave={saveGrinder} 
                onDelete={deleteGrinder} 
                userId={user.uid} 
                initialShowForm={true}
                onFormClose={() => {
                  setEditingGrinder(null);
                  setActiveTab(previousTab);
                }}
                editingGrinder={editingGrinder}
              />
            )}
            {activeTab === 'recipes' && (
              <div className="space-y-6">
                <AnimatePresence mode="wait" initial={false}>
                  {showRecipeForm ? (
                    <motion.div
                      key="recipe-form"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <RecipeForm 
                        onSave={handleSaveRecipe}
                        onCancel={() => {
                          setShowRecipeForm(false);
                          setEditingRecipe(null);
                        }}
                        initialData={editingRecipe}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="recipe-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex justify-end mb-4">
                        <button 
                          onClick={() => {
                            setEditingRecipe(null);
                            setShowRecipeForm(true);
                          }}
                          className="m3-button-tonal py-2 px-4 text-sm"
                        >
                          <Plus size={18} /> Manual Add
                        </button>
                      </div>
                      <RecipeImporter 
                        savedRecipes={recipes.filter(r => r.isSaved)}
                        geminiApiKey={settings.geminiApiKey}
                        onEdit={(recipe) => {
                          setEditingRecipe(recipe);
                          setShowRecipeForm(true);
                        }} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="m3-card bg-primary-container/10 border-none">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary-container rounded-xl">
                      <Settings className="text-on-primary-container" size={20} />
                    </div>
                    <h2 className="text-lg font-bold">Settings Menu</h2>
                  </div>
                  <div className="relative">
                    <select
                      value={settingsSubTab}
                      onChange={(e) => setSettingsSubTab(e.target.value as SettingsSubTab)}
                      className="m3-input w-full appearance-none bg-surface-variant/30 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                    >
                      <option value="ratio">Ratio Calculator</option>
                      <option value="temp">Temperature Converter</option>
                      <option value="preferences">Preferences</option>
                      <option value="account">Account Info</option>
                    </select>
                  </div>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={settingsSubTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {settingsSubTab === 'ratio' && <RatioCalculator />}
                    {settingsSubTab === 'temp' && <TemperatureConverter />}
                    {settingsSubTab === 'preferences' && (
                      <div className="m3-card">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="p-3 bg-primary-container rounded-2xl">
                            <Settings className="text-on-primary-container" size={24} />
                          </div>
                          <h2 className="text-2xl font-bold">Preferences</h2>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-3 ml-1">Theme</label>
                            <select
                              value={settings.theme}
                              onChange={(e) => updateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                              className="m3-input w-full appearance-none bg-surface-variant/30 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                            >
                              <option value="system">System Default</option>
                              <option value="light">Light Mode</option>
                              <option value="dark">Dark Mode</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-3 ml-1">Color Scheme</label>
                            <select
                              value={settings.colorScheme}
                              onChange={(e) => updateSettings({ colorScheme: e.target.value as ColorScheme })}
                              className="m3-input w-full appearance-none bg-surface-variant/30 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                            >
                              <option value="default">Coffee (Default)</option>
                              <option value="catppuccin">Catppuccin</option>
                              <option value="rose-pine">Rose Pine</option>
                              <option value="gruvbox">Gruvbox</option>
                              <option value="everforest">Everforest</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-3 ml-1">Temperature Unit</label>
                            <select
                              value={settings.tempUnit}
                              onChange={(e) => updateSettings({ tempUnit: e.target.value as 'C' | 'F' })}
                              className="m3-input w-full appearance-none bg-surface-variant/30 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                            >
                              <option value="F">Fahrenheit (°F)</option>
                              <option value="C">Celsius (°C)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-3 ml-1">Default Grinder</label>
                            <select
                              value={settings.defaultGrinderId || ''}
                              onChange={(e) => updateSettings({ defaultGrinderId: e.target.value || undefined })}
                              className="m3-input w-full appearance-none bg-surface-variant/30 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                            >
                              <option value="">None</option>
                              {grinders.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-3 ml-1">Gemini API Key (Optional)</label>
                            <div className="space-y-2">
                              <input 
                                type="password"
                                placeholder="Paste your Gemini API key here..."
                                value={settings.geminiApiKey || ''}
                                onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
                                className="m3-input w-full"
                              />
                              <p className="text-[10px] opacity-50 px-1">
                                Required for AI features if not configured on the server. Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">AI Studio</a>.
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-3 ml-1">Low Stock Alert Threshold (g)</label>
                            <input 
                              type="number"
                              value={settings.lowStockThreshold}
                              onChange={(e) => updateSettings({ lowStockThreshold: parseInt(e.target.value) || 0 })}
                              className="m3-input w-full bg-surface-variant/30 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-primary transition-all"
                              placeholder="e.g. 50"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {settingsSubTab === 'account' && (
                      <div className="m3-card bg-primary-container/20 border-none">
                        <div className="flex items-center gap-3 mb-4">
                          <UserIcon className="text-primary" size={20} />
                          <h3 className="font-bold">Account Info</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p><span className="opacity-60">Signed in as:</span> <span className="font-medium">{user.displayName}</span></p>
                          <p><span className="opacity-60">Email:</span> <span className="font-medium">{user.email}</span></p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton 
        visible={
          activeTab !== 'new' && 
          activeTab !== 'new-bean' &&
          activeTab !== 'new-grinder' &&
          activeTab !== 'recipes' && 
          activeTab !== 'settings'
        }
        onAddBrew={() => navigateToTab('new')}
        onAddBean={() => {
          setEditingBean(null);
          navigateToTab('new-bean');
        }}
        onAddGrinder={() => {
          setEditingGrinder(null);
          navigateToTab('new-grinder');
        }}
      />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface-variant border-t border-black/5 px-4 py-3 flex justify-around items-center shadow-2xl z-50 select-none">
        <NavButton 
          active={activeTab === 'history'} 
          onClick={() => navigateToTab('history')}
          icon={<History size={24} />}
          label="History"
        />
        <NavButton 
          active={activeTab === 'beans'} 
          onClick={() => navigateToTab('beans')}
          icon={<Bean size={24} />}
          label="Beans"
        />
        <NavButton 
          active={activeTab === 'grinders'} 
          onClick={() => navigateToTab('grinders')}
          icon={<Hammer size={24} />}
          label="Grinders"
        />
        <NavButton 
          active={activeTab === 'recipes'} 
          onClick={() => navigateToTab('recipes')}
          icon={<Sparkles size={24} />}
          label="Recipes"
        />
        <NavButton 
          active={activeTab === 'settings'} 
          onClick={() => navigateToTab('settings')}
          icon={<Settings size={24} />}
          label="Settings"
        />
      </nav>

      {/* Error Toast */}
      <AnimatePresence initial={false}>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-24 left-6 right-6 bg-red-100 text-red-800 p-4 rounded-2xl flex items-center gap-3 shadow-lg z-[60]"
          >
            <AlertCircle size={20} />
            <span className="flex-1 text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="text-xs font-bold uppercase">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 relative flex-1 touch-manipulation ${active ? 'text-primary' : 'text-outline opacity-60'}`}
    >
      <div className={`p-2 rounded-2xl transition-all duration-300 ${active ? 'bg-primary-container' : 'bg-transparent'}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-wider transition-all ${active ? 'opacity-100' : 'opacity-80'}`}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -top-1 w-1 h-1 bg-primary rounded-full"
        />
      )}
    </button>
  );
}

