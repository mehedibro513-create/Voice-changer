/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  User, 
  Baby, 
  Bot, 
  Ghost, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  Info,
  AlertCircle
} from 'lucide-react';
import { useVoiceProcessor, VoicePreset } from './hooks/useVoiceProcessor';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const { isActive, currentPreset, setCurrentPreset, start, stop, error } = useVoiceProcessor();
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const presets: { id: VoicePreset; label: string; icon: any; color: string }[] = [
    { id: 'normal', label: 'Normal', icon: User, color: 'bg-blue-500' },
    { id: 'female', label: 'Female', icon: User, color: 'bg-pink-500' },
    { id: 'child', label: 'Child', icon: Baby, color: 'bg-yellow-500' },
    { id: 'chipmunk', label: 'Chipmunk', icon: Baby, color: 'bg-orange-500' },
    { id: 'robot', label: 'Robot', icon: Bot, color: 'bg-gray-500' },
    { id: 'monster', label: 'Monster', icon: Ghost, color: 'bg-purple-700' },
  ];

  const togglePanel = () => setIsOpen(!isOpen);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Main Content Area */}
      <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Edge Voice Changer</h1>
          <p className="text-gray-400 mb-8">
            Samsung Style Edge Panel for real-time voice effects. 
            Slide the handle on the right to start.
          </p>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-200 mb-6">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <div className={`p-8 rounded-full ${isActive ? 'bg-green-500/20' : 'bg-gray-800/50'} border-2 ${isActive ? 'border-green-500' : 'border-gray-700'} transition-all duration-500`}>
              {isActive ? (
                <Mic className="w-12 h-12 text-green-500 animate-pulse" />
              ) : (
                <MicOff className="w-12 h-12 text-gray-500" />
              )}
            </div>
            <p className="text-lg font-medium">
              Status: <span className={isActive ? 'text-green-500' : 'text-gray-500'}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Disclaimer Modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#1a1a1a] border border-gray-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4 text-yellow-500">
                <Info size={24} />
                <h2 className="text-xl font-bold">Important Note</h2>
              </div>
              <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                As a web application, this voice changer can only process audio within this browser tab. 
                It cannot directly change your voice in external apps like PUBG or Free Fire due to system security restrictions.
              </p>
              <button 
                onClick={() => setShowDisclaimer(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-colors"
              >
                I Understand
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edge Panel Handle */}
      <motion.div
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 cursor-pointer"
        onClick={togglePanel}
        whileHover={{ scale: 1.1 }}
      >
        <div className="w-2 h-16 bg-white/20 backdrop-blur-md rounded-l-full border-l border-y border-white/10 flex items-center justify-center">
          <div className="w-1 h-8 bg-white/40 rounded-full" />
        </div>
      </motion.div>

      {/* Edge Panel Content */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={togglePanel}
              className="fixed inset-0 bg-black/20 z-30"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-72 bg-[#121212]/90 backdrop-blur-xl z-40 border-l border-white/10 shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-bottom border-white/5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings size={20} className="text-blue-500" />
                  Voice Panel
                </h2>
                <button onClick={togglePanel} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <section>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Control</h3>
                  <button
                    onClick={isActive ? stop : start}
                    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all ${
                      isActive 
                        ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20' 
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
                    }`}
                  >
                    {isActive ? <MicOff size={20} /> : <Mic size={20} />}
                    {isActive ? 'Stop Processing' : 'Start Voice Changer'}
                  </button>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Voice Presets</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {presets.map((preset) => {
                      const Icon = preset.icon;
                      const isSelected = currentPreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => setCurrentPreset(preset.id)}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                            isSelected 
                              ? 'bg-white/10 border-blue-500 shadow-inner' 
                              : 'bg-white/5 border-transparent hover:bg-white/10'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full ${preset.color} flex items-center justify-center mb-2 shadow-lg`}>
                            <Icon size={20} className="text-white" />
                          </div>
                          <span className={`text-xs font-medium ${isSelected ? 'text-blue-400' : 'text-gray-400'}`}>
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Live Monitor</h3>
                  <div className="flex items-end gap-1 h-8">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={isActive ? { height: [4, Math.random() * 24 + 4, 4] } : { height: 4 }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                        className={`flex-1 rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-700'}`}
                      />
                    ))}
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-white/5 text-[10px] text-gray-600 text-center">
                Designed for Browser Environment • Offline Capable
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
