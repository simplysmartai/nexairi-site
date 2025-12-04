
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface PlannerProps {
  onBack: () => void;
}

export const CollegePlanner: React.FC<PlannerProps> = ({ onBack }) => {
  const [step, setStep] = useState<'form' | 'loading' | 'results'>('form');
  const hasApiKey = !!process.env.API_KEY;
  
  const [formData, setFormData] = useState({
    gradeLevel: '11',
    gpa: '',
    testScores: '',
    targetMajor: '',
    targetSchools: '', 
    preferredSize: 'any', // New: small, medium, large
    preferredRegion: '', // New: State or Region
    extracurriculars: '',
    courseHistory: ''
  });

  const [plan, setPlan] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePlan = async () => {
    if (!formData.targetMajor) {
      alert("Please enter a target major or area of interest.");
      return;
    }
    setStep('loading');

    try {
      if (!process.env.API_KEY) throw new Error("Missing API Key");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        You are an elite College Admissions Strategist. Analyze this profile for "Future Focus" planning.
        
        STUDENT PROFILE:
        - Grade: ${formData.gradeLevel}th
        - GPA: ${formData.gpa} (Assume weighted if > 4.0)
        - Test Scores: ${formData.testScores || "Not taken / Optional"}
        - Major Interest: ${formData.targetMajor}
        - Preferred Uni Size: ${formData.preferredSize}
        - Preferred Region/State: ${formData.preferredRegion || "Flexible"}
        - Dream Schools: ${formData.targetSchools || "None listed"}
        - Activities: ${formData.extracurriculars || "None listed"}

        TASK:
        1. List 3 specific schools (Reach, Match, Safety) that fit the criteria. If the student didn't list specific schools, recommend based on major/location.
        2. For each school, provide the "Typical Admit Stats" (GPA/SAT) so the student sees the gap.
        3. Build a roadmap for the remaining high school time.

        OUTPUT JSON (Strict):
        {
          "summary": {
            "strategy_level": "String",
            "major_outlook": "String"
          },
          "school_recommendations": [
            { "name": "String", "category": "Reach|Match|Safety", "typical_stats": "String", "why_fit": "String" }
          ],
          "roadmap_steps": [
            { "term": "String", "action_item": "String" }
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
      console.error("AI Error", error);
      alert("Analysis failed. Please try again.");
      setStep('form');
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen pt-48 pb-20 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-8"></div>
        <h2 className="text-3xl font-bold text-white mb-4">Calibrating Future Focus...</h2>
        <p className="text-brand-muted max-w-md">Scanning university datasets for {formData.targetMajor} programs.</p>
      </div>
    );
  }

  if (step === 'results' && plan) {
    return (
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto animate-fade-in-up">
        <button onClick={() => setStep('form')} className="mb-8 text-sm text-brand-cyan hover:text-white flex items-center gap-2">← Adjust Profile</button>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar Stats */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-brand-dark/50 border border-brand-border rounded-2xl p-8">
                <h2 className="text-2xl font-serif font-bold text-white mb-6">Strategy Report</h2>
                <div className="space-y-4">
                   <div className="p-4 bg-brand-black/40 rounded-lg border border-brand-border">
                      <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Admissions Angle</span>
                      <p className="text-white font-bold">{plan.summary.strategy_level}</p>
                   </div>
                   <div className="p-4 bg-brand-black/40 rounded-lg border border-brand-border">
                      <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Major Outlook</span>
                      <p className="text-white font-bold">{plan.summary.major_outlook}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-12">
             
             <section>
                <h3 className="text-xl font-serif font-bold text-white mb-6 border-b border-brand-border pb-4">School Matches</h3>
                <div className="space-y-4">
                   {plan.school_recommendations.map((school: any, idx: number) => (
                      <div key={idx} className="bg-brand-dark/30 border border-brand-border rounded-xl p-6 flex flex-col md:flex-row gap-6">
                         <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                               <h4 className="text-lg font-bold text-white">{school.name}</h4>
                               <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded border ${
                                  school.category === 'Safety' ? 'border-green-500 text-green-400' :
                                  school.category === 'Reach' ? 'border-orange-500 text-orange-400' :
                                  'border-blue-500 text-blue-400'
                               }`}>{school.category}</span>
                            </div>
                            <p className="text-sm text-gray-400 mb-3">{school.why_fit}</p>
                            <div className="text-xs font-mono text-brand-muted bg-brand-black/50 p-2 rounded inline-block">
                               Target Stats: {school.typical_stats}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </section>

             <section>
                <h3 className="text-xl font-serif font-bold text-white mb-6 border-b border-brand-border pb-4">Action Roadmap</h3>
                <ul className="space-y-4">
                   {plan.roadmap_steps.map((step: any, idx: number) => (
                      <li key={idx} className="flex gap-4 items-start">
                         <span className="text-brand-cyan font-bold text-lg mt-[-2px]">→</span>
                         <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{step.term}</span>
                            <p className="text-white text-base">{step.action_item}</p>
                         </div>
                      </li>
                   ))}
                </ul>
             </section>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <button onClick={onBack} className="text-brand-cyan hover:text-white text-sm mb-2 flex items-center gap-2">← Back to Sandbox</button>
          <h1 className="text-4xl font-bold text-white">Future Focus</h1>
          <p className="text-brand-muted">Strategic college planning engine. Find your fit.</p>
        </div>
      </div>

      <div className="bg-brand-dark/30 border border-brand-border rounded-2xl p-8 backdrop-blur-sm">
        
        {!hasApiKey && (
           <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
             <strong>System Offline:</strong> Please configure a valid API Key in the environment settings to use generative features.
           </div>
        )}

        <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6 border-b border-brand-border pb-2">Your Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">Grade Level</label>
              <select name="gradeLevel" value={formData.gradeLevel} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded p-3 text-white focus:border-brand-cyan outline-none disabled:opacity-50">
                 <option value="9">9th (Freshman)</option>
                 <option value="10">10th (Sophomore)</option>
                 <option value="11">11th (Junior)</option>
                 <option value="12">12th (Senior)</option>
              </select>
           </div>
           <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">GPA (Best estimate)</label>
              <input type="number" name="gpa" value={formData.gpa} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded p-3 text-white focus:border-brand-cyan outline-none disabled:opacity-50" placeholder="e.g. 3.8" />
           </div>
           <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">SAT/ACT (Optional)</label>
              <input type="text" name="testScores" value={formData.testScores} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded p-3 text-white focus:border-brand-cyan outline-none disabled:opacity-50" placeholder="Optional" />
           </div>
        </div>

        <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6 border-b border-brand-border pb-2">Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">Target Major / Interest</label>
              <input type="text" name="targetMajor" value={formData.targetMajor} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded p-3 text-white focus:border-brand-cyan outline-none disabled:opacity-50" placeholder="e.g. Engineering, Arts, Undecided" />
           </div>
           <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">Target Schools (Optional)</label>
              <input type="text" name="targetSchools" value={formData.targetSchools} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded p-3 text-white focus:border-brand-cyan outline-none disabled:opacity-50" placeholder="Specific schools you like" />
           </div>
           <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">University Size</label>
              <select name="preferredSize" value={formData.preferredSize} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded p-3 text-white focus:border-brand-cyan outline-none disabled:opacity-50">
                 <option value="any">No Preference</option>
                 <option value="small">Small (Liberal Arts / Private)</option>
                 <option value="medium">Medium (Mid-sized)</option>
                 <option value="large">Large (State University)</option>
              </select>
           </div>
           <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">Region / State Preference</label>
              <input type="text" name="preferredRegion" value={formData.preferredRegion} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded p-3 text-white focus:border-brand-cyan outline-none disabled:opacity-50" placeholder="e.g. Texas, East Coast, Midwest" />
           </div>
        </div>

        <button 
          onClick={generatePlan}
          disabled={!hasApiKey}
          className={`w-full py-4 font-bold uppercase tracking-widest rounded-lg transition-all ${
            hasApiKey 
              ? 'bg-gradient-to-r from-brand-blue to-brand-cyan text-brand-black hover:shadow-lg hover:shadow-brand-cyan/20' 
              : 'bg-brand-border text-gray-500 cursor-not-allowed'
          }`}
        >
          Generate Strategy
        </button>
      </div>
    </div>
  );
};