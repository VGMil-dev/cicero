"use client";

import React from 'react';
import { DIProvider } from '../contexts/DIContext';
import { AudioCaptureProvider } from '../contexts/AudioCaptureContext';
import { Header } from '../components/organisms/Header';
import { NotebookSpiral } from '../components/molecules/NotebookSpiral';
import { StatusIndicator } from '../components/organisms/StatusIndicator';
import { CaptureCard } from '../components/organisms/CaptureCard';
import { AnalysisStatus } from '../components/organisms/AnalysisStatus';
import { Dashboard } from '../components/organisms/Dashboard';

/**
 * Entry point page for the Cicero application.
 * Wraps the application layout in DIProvider (Composition Root)
 * and AudioCaptureProvider (Application State orchestrator),
 * rendering the atomic components declaratively.
 */
export default function Home() {
  return (
    <DIProvider>
      <AudioCaptureProvider>
        <main className="flex-1 w-full min-h-screen bg-[#f5f4f0] p-6 md:p-12 font-body relative overflow-x-hidden bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:24px_24px]">
          <Header />
          <div className="max-w-3xl mx-auto">
            <section className="w-full bg-white border-4 border-black rounded-[2rem] p-8 md:p-12 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <NotebookSpiral />
              <div className="pl-6 md:pl-10">
                <StatusIndicator />
                <CaptureCard />
                <AnalysisStatus />
                <Dashboard />
              </div>
            </section>
          </div>
        </main>
      </AudioCaptureProvider>
    </DIProvider>
  );
}
