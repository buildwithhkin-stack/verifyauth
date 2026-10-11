import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { IdeaRegistry } from './components/IdeaRegistry';
import { CodeGeneratorDashboard } from './components/CodeGeneratorDashboard';
import { ProtectionLabelsOverview } from './components/ProtectionLabelsOverview';
import { ProtectionLabelModal } from './components/ProtectionLabelModal';
import { NewIdeaModal } from './components/NewIdeaModal';
import { VerificationPortal } from './components/VerificationPortal';
import { SecurityTestRunner } from './components/SecurityTestRunner';
import { IdeaDocument, CodeGenerationChoice } from './types';
import { getStoredDocuments, saveDocument } from './services/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'registry' | 'generator' | 'labels' | 'verify' | 'tests'
  >('generator');

  const [documents, setDocuments] = useState<IdeaDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [labelModalDoc, setLabelModalDoc] = useState<IdeaDocument | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState<boolean>(false);
  const [isNewIdeaModalOpen, setIsNewIdeaModalOpen] = useState<boolean>(false);
  const [verificationInitialId, setVerificationInitialId] = useState<string>('');

  // Load documents from storage
  const reloadDocuments = () => {
    const docs = getStoredDocuments();
    setDocuments(docs);
    if (!selectedDocId && docs.length > 0) {
      setSelectedDocId(docs[0].id);
    }
  };

  useEffect(() => {
    reloadDocuments();

    // Silent one-time device pairing listener (zero frontend UI)
    const urlParams = new URLSearchParams(window.location.search);
    const pairKey = urlParams.get('pairPhone');
    if (pairKey) {
      localStorage.setItem('vjec_device_key', pairKey);
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }
  }, []);

  // Listen for hash changes (e.g. #/verify/VJEC-2026-HK8891)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('verify')) {
        const parts = hash.split('verify');
        const docId = parts[1]?.replace(/[\/\?=]/g, '').trim();
        if (docId) {
          setVerificationInitialId(docId);
          setActiveTab('verify');
        } else {
          setActiveTab('verify');
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleOpenLabelModal = (doc: IdeaDocument) => {
    setLabelModalDoc(doc);
    setIsLabelModalOpen(true);
  };

  const handleSelectDocumentForGenerator = (
    doc: IdeaDocument,
    tabChoice?: 'qr' | 'barcode'
  ) => {
    setSelectedDocId(doc.id);
    setActiveTab('generator');
  };

  const handleOpenVerification = (docId: string) => {
    setVerificationInitialId(docId);
    setActiveTab('verify');
  };

  const handleDocumentCreated = (
    newDoc: IdeaDocument,
    choice: CodeGenerationChoice
  ) => {
    saveDocument(newDoc);
    reloadDocuments();
    setSelectedDocId(newDoc.id);

    // If user chose both, qr, or barcode, take them to the generator or open label modal
    setActiveTab('generator');
    if (choice === 'both' || choice === 'qr' || choice === 'barcode') {
      handleOpenLabelModal(newDoc);
    }
  };

  const handleUpdateDocumentOptions = (docId: string, options: any) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      const updated: IdeaDocument = {
        ...doc,
        qrOptions: options.size ? { ...doc.qrOptions, ...options } : doc.qrOptions,
        barcodeOptions: options.format
          ? { ...doc.barcodeOptions, ...options }
          : doc.barcodeOptions,
      };
      saveDocument(updated);
      reloadDocuments();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewIdeaModal={() => setIsNewIdeaModalOpen(true)}
        totalDocuments={documents.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'registry' && (
          <IdeaRegistry
            documents={documents}
            onSelectDocumentForGenerator={handleSelectDocumentForGenerator}
            onOpenLabelModal={handleOpenLabelModal}
            onOpenVerificationPortal={handleOpenVerification}
            onOpenNewIdeaModal={() => setIsNewIdeaModalOpen(true)}
            onRefreshData={reloadDocuments}
          />
        )}

        {activeTab === 'generator' && (
          <CodeGeneratorDashboard
            documents={documents}
            selectedDocumentId={selectedDocId || (documents[0]?.id ?? '')}
            onSelectDocumentId={setSelectedDocId}
            onOpenLabelModal={handleOpenLabelModal}
            onOpenNewIdeaModal={() => setIsNewIdeaModalOpen(true)}
            onUpdateDocumentOptions={handleUpdateDocumentOptions}
          />
        )}

        {activeTab === 'labels' && (
          <ProtectionLabelsOverview
            documents={documents}
            onOpenLabelModal={handleOpenLabelModal}
          />
        )}

        {activeTab === 'verify' && (
          <VerificationPortal
            initialDocumentId={verificationInitialId}
            onOpenLabelModal={handleOpenLabelModal}
          />
        )}

        {activeTab === 'tests' && <SecurityTestRunner />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            VJEC IdeaLock • Intellectual Property Protection System • Vimal Jyothi Engineering
            College
          </p>
          <p className="font-mono text-slate-600">
            Compliant with ISO/IEC 18004 (QR) & ISO/IEC 15417 (Code 128)
          </p>
        </div>
      </footer>

      {/* New Idea Registration Modal */}
      <NewIdeaModal
        isOpen={isNewIdeaModalOpen}
        onClose={() => setIsNewIdeaModalOpen(false)}
        onDocumentCreated={handleDocumentCreated}
      />

      {/* Print-Ready Protection Label Modal */}
      <ProtectionLabelModal
        document={labelModalDoc}
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
      />
    </div>
  );
}
