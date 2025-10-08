'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link, Copy, Check, Github, LoaderCircle } from 'lucide-react';
import { useProjectStore } from '@/hooks/useProjectStore';
import { compressAndEncode, generateUrlHash, saveSharedProjectToSupabase } from '@/lib/sharing';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

type Tab = 'link' | 'shorten' | 'badge';

export function ShareDialog() {
  const { isShareDialogOpen, closeShareDialog, code, language } = useProjectStore();
  const [activeTab, setActiveTab] = useState<Tab>('link');
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [displayUrl, setDisplayUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isShortening, setIsShortening] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isShareDialogOpen) {
      setIsProcessing(true);
      setLongUrl('');
      setShortUrl('');
      setDisplayUrl('');
      setTimeout(() => {
        const encodedData = compressAndEncode({ code, language });
        const url = generateUrlHash(encodedData);
        setLongUrl(url);
        setDisplayUrl(url);
        setIsProcessing(false);
      }, 100);
    }
  }, [isShareDialogOpen, code, language]);

  const handleCopy = (urlToCopy: string) => {
  if (!urlToCopy) return;
  navigator.clipboard.writeText(urlToCopy);
  setIsCopied(true);
  toast.success('Copied to clipboard!');
  setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleShorten = async () => {
    if (!longUrl || isShortening) return;
    setIsShortening(true);
    try {
      // Save compressed project payload to Supabase table `shared_projects` and get a short id
      const project = { code, language };
      const saved = await saveSharedProjectToSupabase(supabase, project);
      // Try common fields `project_id` or fallback to `id`
      const shortId = saved?.project_id || saved?.id;
  if (!shortId) throw new Error('No id returned from Supabase');
  const newShortUrl = `${window.location.origin}/lab/#s:${shortId}`;
  setShortUrl(newShortUrl);
  setDisplayUrl(newShortUrl); // Show short link in dialog
  try { await navigator.clipboard.writeText(newShortUrl); } catch {}
  toast.success('Short link created and copied to clipboard!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create short link.');
      console.error(e);
    } finally {
      setIsShortening(false);
    }
  };

  const markdownBadge = `[![Debug in Lemma](https://img.shields.io/badge/Debug%20in-Lemma-%2388f9b5?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNDggNDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTI0IDRMNC4yNCAyNEwyNCA0My43Nkw0My43NiAyNEwyNCA0WiIgc3Ryb2tlPSIjMzIzMDNmIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0yNCA0VjQzLjc2IiBzdHJvaz0iIzMyMzAzZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMjQgMjRINDMuNzYiIHN0cm9rPSIjMzIzMDNmIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0yNCAxNC4yNEwxNC4yNCAyNEwyNCAzMy43NkwzMy43NiAyNEwyNCAxNC4yNFoiIHN0cm9rZT0iIzMyMzAzZiIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==)](${longUrl})`;

  return (
    <AnimatePresence>
      {isShareDialogOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeShareDialog}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-lg bg-[#211f2c] rounded-lg shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ... Header and Tabs are unchanged ... */}
            <div className="p-6 min-h-[180px]">
              {isProcessing ? (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400">
                   <LoaderCircle className="w-8 h-8 animate-spin mb-4" />
                   <p>Generating shareable link...</p>
                 </div>
              ) : (
                <>
                  {activeTab === 'link' && (
                    <div>
                      <label className="text-sm font-medium text-gray-300">Shareable Link</label>
                      <div className="mt-2 flex gap-2">
                        <input type="text" readOnly value={displayUrl} className="w-full bg-tuna p-2 rounded-md border border-white/10 text-gray-300 text-sm truncate"/>
                        <div className="flex gap-2">
                          <button onClick={() => handleCopy(displayUrl)} className="flex-shrink-0 px-3 bg-aquamarine text-tuna rounded-md font-semibold flex items-center gap-2">
                            {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          </button>
                          <button onClick={handleShorten} disabled={isShortening} className="flex-shrink-0 px-3 bg-blue-600 text-white rounded-md font-semibold flex items-center gap-2 disabled:opacity-50">
                            {isShortening ? <LoaderCircle className="w-4 h-4 animate-spin" /> : 'Shorten'}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Project data is compressed and stored in the URL.</p>
                    </div>
                  )}
                  {activeTab === 'shorten' && (
                     <div className="text-center">
                        <p className="text-gray-400 mb-4">For large projects (&gt;10MB), sign in to create a public Gist.</p>
                        <button disabled className="w-full py-2.5 flex items-center justify-center gap-3 bg-[#333] text-white rounded-md opacity-50 cursor-not-allowed">
                            <Github className="w-5 h-5"/> GitHub Gist (WIP)
                        </button>
                         <div className="relative my-4">
                           <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                           <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#211f2c] px-2 text-gray-500">Or</span></div>
                         </div>
                        {shortUrl ? (
                           <div>
                             <label className="text-sm font-medium text-gray-300">Your Short Link</label>
                             <div className="mt-2 flex gap-2">
                               <input type="text" readOnly value={shortUrl} className="w-full bg-tuna p-2 rounded-md border border-white/10 text-gray-300 text-sm truncate"/>
                               <button onClick={() => handleCopy(shortUrl)} className="flex-shrink-0 px-3 bg-aquamarine text-tuna rounded-md font-semibold flex items-center gap-2">
                                 {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                               </button>
                             </div>
                           </div>
                        ) : (
                           <button onClick={handleShorten} disabled={isShortening} className="w-full py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                             {isShortening && <LoaderCircle className="w-5 h-5 animate-spin" />}
                             Generate Supabase Short URL
                           </button>
                        )}
                     </div>
                  )}
                  {activeTab === 'badge' && (
                     <div>
                        <label className="text-sm font-medium text-gray-300">Markdown Badge</label>
                        <textarea readOnly value={markdownBadge} rows={4} className="mt-2 w-full bg-tuna p-2 rounded-md border border-white/10 text-gray-300 text-xs font-mono resize-none"/>
                     </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}