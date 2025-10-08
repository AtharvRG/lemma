'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { LoaderCircle, Code, AlertTriangle } from 'lucide-react';
import { decodeAndDecompress } from '@/lib/sharing';
import { SharedProjectState } from '@/types';
import Link from 'next/link';

interface SharedPreviewClientProps {
  longUrl: string | null;
  error?: string;
}

type Status = 'loading' | 'success' | 'error';

export function SharedPreviewClient({ longUrl, error: initialError }: SharedPreviewClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [project, setProject] = useState<SharedProjectState | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialError) {
      setErrorMessage(initialError);
      setStatus('error');
      return;
    }

    if (!longUrl) {
      setErrorMessage('Link not found or has expired.');
      setStatus('error');
      return;
    }

    try {
      const hash = new URL(longUrl).hash;
      if (!hash.startsWith('#h:')) {
        throw new Error('Invalid Lemma share link format.');
      }
      const encodedData = hash.substring(3);
      const decodedProject = decodeAndDecompress(encodedData);

      if (!decodedProject) {
        throw new Error('Could not decode the project data. The link may be corrupted.');
      }

      setProject(decodedProject);
      setStatus('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setStatus('error');
    }
  }, [longUrl, initialError]);

  const handleOpenInLab = () => {
    if (longUrl) {
      router.push(longUrl);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center text-gray-400">
            <LoaderCircle className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-xl">Loading Shared Project...</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center text-red-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong.</h2>
            <p className="text-red-400 mb-6">{errorMessage}</p>
            <Link href="/" className="px-6 py-2 bg-aquamarine text-tuna font-bold rounded-md">
              Go Home
            </Link>
          </div>
        );
      case 'success':
        return (
          <div className="w-full max-w-4xl bg-[#211f2c] rounded-lg shadow-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white">Lemma Shared Project</h1>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-300">
                <Code className="w-4 h-4" />
                Language: <span className="font-semibold text-white capitalize">{project?.language}</span>
              </div>
              <div className="h-[400px] w-full rounded-md overflow-hidden border border-white/10">
                <Editor
                  height="100%"
                  language={project?.language}
                  value={project?.code}
                  theme="tomorrow-night-eighties"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    contextmenu: false,
                  }}
                />
              </div>
            </div>
            <div className="p-4 bg-tuna/50 text-right">
              <button 
                onClick={handleOpenInLab}
                className="px-8 py-3 bg-aquamarine text-tuna font-bold rounded-md hover:scale-105 transition-transform"
              >
                Open in Lab
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-tuna p-4">
      {renderContent()}
    </main>
  );
}