
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

interface HappyHoundProps {
  onBack: () => void;
}

// Expanded Breed List for Auto-Complete
const DOG_BREEDS = [
  "Mixed Breed", "Labrador Retriever", "Golden Retriever", "German Shepherd", 
  "French Bulldog", "Bulldog", "Poodle", "Beagle", "Rottweiler", "Dachshund",
  "Corgi", "Australian Shepherd", "Yorkshire Terrier", "Boxer", "Husky",
  "Great Dane", "Doberman Pinscher", "Shih Tzu", "Miniature Schnauzer", "Chihuahua",
  "Bernese Mountain Dog", "Border Collie", "Basset Hound", "Boston Terrier",
  "Cavalier King Charles Spaniel", "Cocker Spaniel", "Havanese", "Maltese",
  "Pomeranian", "Pug", "Shiba Inu", "Siberian Husky", "Vizsla", "Weimaraner"
];

// API Mapping for Dog CEO (Generic fallback for lookups)
const BREED_API_MAP: Record<string, string> = {
  "Labrador Retriever": "retriever/labrador",
  "Golden Retriever": "retriever/golden",
  "German Shepherd": "germanshepherd",
  "French Bulldog": "bulldog/french",
  "Bulldog": "bulldog/english",
  "Poodle": "poodle/standard",
  "Beagle": "beagle",
  "Rottweiler": "rottweiler",
  "Dachshund": "dachshund",
  "Corgi": "corgi/cardigan",
  "Australian Shepherd": "australian/shepherd",
  "Husky": "husky",
  "Chihuahua": "chihuahua"
};

export const HappyHound: React.FC<HappyHoundProps> = ({ onBack }) => {
  const [step, setStep] = useState<'form' | 'loading' | 'results'>('form');
  const hasApiKey = !!process.env.API_KEY;
  
  const [formData, setFormData] = useState({
    name: '',
    age: 2,
    weight: 20,
    weightUnit: 'lbs' as 'kg' | 'lbs',
    breed: '',
    secondaryBreed: '',
    energy: 'active',
    health: [] as string[],
    homeType: 'house_small_yard',
    fenceType: 'physical',
  });

  // Autocomplete State
  const [breedInput, setBreedInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [plan, setPlan] = useState<any>(null);
  const [breedImage, setBreedImage] = useState<string>('');

  useEffect(() => {
    // Close autocomplete on click outside
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBreedSelect = (selectedBreed: string) => {
    setBreedInput(selectedBreed);
    setFormData(prev => ({ ...prev, breed: selectedBreed }));
    setShowSuggestions(false);
  };

  const toggleHealthFlag = (flag: string) => {
    setFormData(prev => ({
      ...prev,
      health: prev.health.includes(flag) 
        ? prev.health.filter(f => f !== flag)
        : [...prev.health, flag]
    }));
  };

  const fetchBreedImage = async (breed: string) => {
    // Simple mapping check
    const apiBreedPath = BREED_API_MAP[breed] || null;
    
    // Default fallback image
    let imageUrl = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800';

    if (apiBreedPath) {
      try {
        const res = await fetch(`https://dog.ceo/api/breed/${apiBreedPath}/images/random`);
        const data = await res.json();
        if (data.status === 'success') imageUrl = data.message;
      } catch (e) {
        console.warn('Could not fetch breed image', e);
      }
    }
    return imageUrl;
  };

  const generatePlan = async () => {
    if (!formData.breed) {
      alert("Please select a breed.");
      return;
    }
    setStep('loading');
    const imgUrl = await fetchBreedImage(formData.breed);
    setBreedImage(imgUrl);

    try {
      if (!process.env.API_KEY) throw new Error("Missing API Key");

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `You are “Nexairi Dog Coach.” Create a highly specific, science-based 7-day dog exercise plan. Focus on enrichment and breed-specific needs.`;
      
      const finalBreed = (formData.breed.includes('Mixed') || formData.breed.includes('Mutt')) && formData.secondaryBreed 
        ? `Mixed (${formData.breed} + ${formData.secondaryBreed})` 
        : formData.breed;

      const userPromptInput = {
        dog: {
          name: formData.name,
          age_years: formData.age,
          weight: `${formData.weight} ${formData.weightUnit}`,
          breed: finalBreed,
          energy_level: formData.energy,
          health_flags: formData.health
        },
        environment: {
          home: formData.homeType,
          fence: formData.fenceType
        }
      };

      const prompt = `
        ${systemInstruction}
        
        DATA:
        ${JSON.stringify(userPromptInput)}
        
        REQUIREMENTS:
        1. "headline": A fun, encouraging title for the plan.
        2. "breed_insight": One specific fact about how this breed's genetics affect exercise (e.g. "Herding dogs need mental jobs, not just running").
        3. "weekly_plan": Array of 7 days. Each day needs a "focus" (e.g. "Agility", "Rest", "Sniffari") and a specific "activity" description.
        4. "safety_tip": One crucial safety tip based on their home/fence setup.
        
        OUTPUT JSON:
        {
          "headline": "String",
          "risk_level": "Low|Moderate|High",
          "breed_insight": "String",
          "safety_tip": "String",
          "weekly_plan": [
            { "day": "Monday", "focus": "String", "activity": "String", "duration": "String" }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        setPlan(JSON.parse(response.text));
        setStep('results');
      }
    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate plan. Please try again.");
      setStep('form');
    }
  };

  const copyToClipboard = () => {
    if (!plan) return;
    const text = `
      ${plan.headline} for ${formData.name}
      Risk Level: ${plan.risk_level}
      Insight: ${plan.breed_insight}
      Safety: ${plan.safety_tip}

      ${plan.weekly_plan.map((d: any) => `${d.day} (${d.focus}): ${d.activity} - ${d.duration}`).join('\n')}
    `;
    navigator.clipboard.writeText(text);
    alert("Plan copied to clipboard!");
  };

  // --- RENDER ---

  if (step === 'loading') {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin mb-8"></div>
        <h2 className="text-3xl font-bold text-white mb-4">Designing {formData.name}'s Routine...</h2>
        <p className="text-brand-muted max-w-md">Analyzing genetic needs, home environment, and energy constraints.</p>
      </div>
    );
  }

  if (step === 'results' && plan) {
    return (
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in-up">
        <button onClick={() => setStep('form')} className="mb-8 text-sm text-brand-cyan hover:text-white flex items-center gap-2">
          ← New Profile
        </button>

        <div className="bg-brand-dark/50 border border-brand-border rounded-2xl p-8 mb-12 flex flex-col md:flex-row gap-8 items-center">
          <div className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0 rounded-full overflow-hidden border-4 border-brand-cyan/20 bg-brand-black">
            <img src={breedImage} alt={formData.breed} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold text-white mb-2">{formData.name}</h1>
            <p className="text-xl text-brand-cyan font-serif italic mb-4">{plan.headline}</p>
            <div className="bg-brand-black/40 p-4 rounded-lg border border-brand-border">
              <p className="text-sm text-gray-300"><strong>Breed Insight:</strong> {plan.breed_insight}</p>
            </div>
          </div>
        </div>

        {/* Safety Alert */}
        <div className="mb-12 bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex gap-3 items-start">
           <span className="text-blue-400 text-xl">ℹ️</span>
           <p className="text-sm text-blue-200">{plan.safety_tip}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plan.weekly_plan.map((day: any, idx: number) => (
            <div key={idx} className="bg-brand-dark/30 border border-brand-border rounded-xl p-6 hover:border-brand-cyan/30 transition-colors">
              <div className="flex justify-between items-center mb-4 border-b border-brand-border pb-2">
                <h3 className="font-bold text-white text-lg">{day.day}</h3>
                <span className="text-xs font-mono text-brand-cyan uppercase">{day.focus}</span>
              </div>
              <p className="text-sm text-gray-300 mb-3">{day.activity}</p>
              <div className="text-xs text-brand-muted font-mono">{day.duration}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center gap-4">
          <button onClick={copyToClipboard} className="px-8 py-3 border border-brand-border text-brand-text font-bold uppercase tracking-wider rounded hover:bg-brand-dark transition-colors">
            Copy to Clipboard
          </button>
          <button onClick={() => window.print()} className="px-8 py-3 bg-brand-text text-brand-black font-bold uppercase tracking-wider rounded hover:bg-white transition-colors">
            Print / Save PDF
          </button>
        </div>
      </div>
    );
  }

  // Form Step
  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Happy Hound Exercise Plan</h1>
        <p className="text-brand-muted">Science-based fitness planning for your dog's specific needs.</p>
      </div>

      <div className="bg-brand-dark/30 border border-brand-border rounded-2xl p-8 backdrop-blur-sm">
        
        {!hasApiKey && (
           <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
             <strong>System Offline:</strong> Please configure a valid API Key in the environment settings to use generative features.
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6">
             <div>
                <label className="block text-xs font-bold text-brand-cyan uppercase tracking-wider mb-2">Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded-lg px-4 py-3 text-white focus:border-brand-cyan focus:outline-none disabled:opacity-50" placeholder="Buddy" />
             </div>
             <div>
                <label className="block text-xs font-bold text-brand-cyan uppercase tracking-wider mb-2">Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded-lg px-4 py-3 text-white focus:border-brand-cyan focus:outline-none disabled:opacity-50" />
             </div>
             <div>
                <label className="block text-xs font-bold text-brand-cyan uppercase tracking-wider mb-2">Weight</label>
                <div className="flex">
                   <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} disabled={!hasApiKey} className="w-2/3 bg-brand-black border border-brand-border rounded-l-lg px-4 py-3 text-white focus:border-brand-cyan focus:outline-none disabled:opacity-50" />
                   <select name="weightUnit" value={formData.weightUnit} onChange={handleInputChange} disabled={!hasApiKey} className="w-1/3 bg-brand-dark border border-brand-border rounded-r-lg px-2 py-3 text-white focus:border-brand-cyan focus:outline-none border-l-0 disabled:opacity-50">
                      <option value="lbs">LBS</option>
                      <option value="kg">KG</option>
                   </select>
                </div>
             </div>
          </div>

          {/* Predictive Breed Input */}
          <div className="col-span-full relative" ref={wrapperRef}>
             <label className="block text-xs font-bold text-brand-cyan uppercase tracking-wider mb-2">Primary Breed</label>
             <input 
                type="text" 
                value={breedInput}
                onChange={(e) => {
                   setBreedInput(e.target.value);
                   setFormData(prev => ({...prev, breed: e.target.value}));
                   setShowSuggestions(true);
                }}
                onFocus={() => hasApiKey && setShowSuggestions(true)}
                disabled={!hasApiKey}
                className="w-full bg-brand-black border border-brand-border rounded-lg px-4 py-3 text-white focus:border-brand-cyan focus:outline-none disabled:opacity-50"
                placeholder="Type to search (e.g. 'Golden')"
             />
             {showSuggestions && breedInput.length > 1 && (
                <div className="absolute z-50 w-full bg-brand-dark border border-brand-border mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                   {DOG_BREEDS.filter(b => b.toLowerCase().includes(breedInput.toLowerCase())).map(b => (
                      <div 
                        key={b} 
                        onClick={() => handleBreedSelect(b)}
                        className="px-4 py-2 hover:bg-brand-cyan hover:text-brand-black cursor-pointer text-sm text-gray-300 transition-colors"
                      >
                         {b}
                      </div>
                   ))}
                   {DOG_BREEDS.filter(b => b.toLowerCase().includes(breedInput.toLowerCase())).length === 0 && (
                      <div className="px-4 py-2 text-xs text-gray-500 italic">No matches found</div>
                   )}
                </div>
             )}
          </div>

          {/* Secondary Breed - Only if 'Mixed Breed' or 'Mutt' detected */}
          {(breedInput.toLowerCase().includes('mixed') || breedInput.toLowerCase().includes('mutt')) && (
             <div className="col-span-full animate-fade-in-up">
                <label className="block text-xs font-bold text-brand-cyan uppercase tracking-wider mb-2">Secondary Breed / Mix (Optional)</label>
                <select name="secondaryBreed" value={formData.secondaryBreed} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded-lg px-4 py-3 text-white focus:border-brand-cyan focus:outline-none disabled:opacity-50">
                   <option value="">Unknown / Other</option>
                   {DOG_BREEDS.filter(b => !b.includes('Mixed')).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
             </div>
          )}

          <div className="col-span-full border-t border-brand-border pt-6 mt-2">
             <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Residence Profile</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Home Type</label>
                   <select name="homeType" value={formData.homeType} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded-lg px-4 py-3 text-white focus:border-brand-cyan focus:outline-none disabled:opacity-50">
                      <option value="apartment">Apartment / Condo</option>
                      <option value="house_small_yard">House (Small Yard)</option>
                      <option value="house_big_yard">House (Large Yard)</option>
                      <option value="acreage">Acreage / Farm</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Fence Status</label>
                   <select name="fenceType" value={formData.fenceType} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded-lg px-4 py-3 text-white focus:border-brand-cyan focus:outline-none disabled:opacity-50">
                      <option value="none">No Fence / Unfenced</option>
                      <option value="physical">Physical Fence (Secure)</option>
                      <option value="invisible">Invisible / Electric Fence</option>
                   </select>
                </div>
             </div>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-xs font-bold text-brand-cyan uppercase tracking-wider mb-4">Health Flags</label>
          <div className="flex flex-wrap gap-3">
            {['Arthritis', 'Anxiety', 'Overweight', 'Puppy', 'Senior', 'Brachycephalic'].map((flag) => (
              <button
                key={flag}
                onClick={() => toggleHealthFlag(flag)}
                disabled={!hasApiKey}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.health.includes(flag)
                    ? 'bg-red-500/20 text-red-400 border border-red-500'
                    : 'bg-brand-black text-gray-400 border border-brand-border hover:border-gray-400'
                }`}
              >
                {flag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={onBack} className="w-1/3 py-4 rounded-xl border border-brand-border text-gray-400 font-bold uppercase tracking-widest hover:text-white transition-colors">
            Cancel
          </button>
          <button 
            onClick={generatePlan}
            disabled={!hasApiKey}
            className={`w-2/3 py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${
              hasApiKey 
                ? 'bg-gradient-to-r from-brand-blue to-brand-cyan text-brand-black hover:shadow-lg hover:shadow-brand-cyan/20' 
                : 'bg-brand-border text-gray-500 cursor-not-allowed'
            }`}
          >
            Create Routine
          </button>
        </div>
      </div>
    </div>
  );
};