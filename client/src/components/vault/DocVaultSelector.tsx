import React, { useState, useEffect, useRef } from 'react';
import {
  FolderLock,
  UploadCloud,
  FileText,
  X,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { vaultService, UserDocVaultItem, VaultDocumentType } from '../../services/vaultService';
import { useCloudinaryUpload, CloudinaryUploadResult } from '../../hooks/useCloudinaryUpload';
import { DocVaultModal } from './DocVaultModal';

export interface DocVaultSelectorProps {
  label: string;
  description?: string;
  suggestedType?: VaultDocumentType | 'OTHER';
  value?: string;
  onChange: (fileUrl: string, docItem?: UserDocVaultItem) => void;
  onRemove?: () => void;
  maxSizeMB?: number;
  className?: string;
  compact?: boolean;
}

const TYPE_BADGES: Record<string, string> = {
  GOVT_ID: 'Govt ID',
  STUDENT_ID: 'Student ID',
  UNIVERSITY_ENDORSEMENT: 'Endorsement',
  BANK_PASSBOOK: 'Bank Proof',
  INVOICE: 'Invoice',
  PROJECT_PROPOSAL: 'Proposal',
  ORGANIZATION_REGISTRATION: 'Club/Org',
  OTHER: 'Doc',
};

export const DocVaultSelector: React.FC<DocVaultSelectorProps> = ({
  label,
  description = 'Upload scan or select from your central Doc Vault',
  suggestedType = 'OTHER',
  value,
  onChange,
  onRemove,
  maxSizeMB = 20,
  className = '',
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<'VAULT' | 'UPLOAD'>('VAULT');
  const [allVaultDocs, setAllVaultDocs] = useState<UserDocVaultItem[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState<string>('');
  const [autoSaveToVault, setAutoSaveToVault] = useState(true);
  const [customDocTitle, setCustomDocTitle] = useState('');
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{ name: string; size: string } | null>(null);

  // Fetch all documents from user's central Doc Vault
  const fetchAllVaultDocs = async () => {
    setLoadingVault(true);
    try {
      // Query entire user doc vault without type-locking
      const docs = await vaultService.getDocuments();
      setAllVaultDocs(docs);

      if (value) {
        const match = docs.find((d) => d.fileUrl === value);
        if (match) setSelectedVaultId(match.id);
      } else if (docs.length === 0) {
        setActiveTab('UPLOAD');
      }
    } catch (err) {
      console.warn('Could not load user doc vault:', err);
    } finally {
      setLoadingVault(false);
    }
  };

  useEffect(() => {
    fetchAllVaultDocs();
  }, []);

  // Sort docs: suggestedType matches first, then by createdAt desc
  const sortedDocs = [...allVaultDocs].sort((a, b) => {
    const aMatch = suggestedType && a.documentType === suggestedType ? 1 : 0;
    const bMatch = suggestedType && b.documentType === suggestedType ? 1 : 0;
    if (aMatch !== bMatch) return bMatch - aMatch;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Cloudinary direct upload hook
  const { uploadFile, isUploading, progress, reset } = useCloudinaryUpload({
    folder: 'campaigns/kyc',
    onSuccess: async (res: CloudinaryUploadResult) => {
      let savedDoc: UserDocVaultItem | undefined;

      if (autoSaveToVault) {
        try {
          savedDoc = await vaultService.saveDocument({
            title: customDocTitle.trim() || uploadedFileMeta?.name || 'Identity Document',
            fileName: uploadedFileMeta?.name || 'document.pdf',
            fileUrl: res.secureUrl,
            documentType: suggestedType || 'OTHER',
            fileSizeBytes: res.bytes || 0,
            mimeType: res.format ? `application/${res.format}` : undefined,
          });

          toast.success('Document uploaded & saved to your single Doc Vault! 📁');
          await fetchAllVaultDocs();
        } catch (err: any) {
          console.error('Failed to auto-save to Doc Vault:', err);
        }
      }

      onChange(res.secureUrl, savedDoc);
    },
  });

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File exceeds maximum size of ${maxSizeMB}MB`);
      return;
    }

    setUploadedFileMeta({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    });
    if (!customDocTitle) {
      setCustomDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    try {
      await uploadFile(file);
    } catch (err: any) {
      toast.error(err?.message || 'File upload failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectFromVault = (docId: string) => {
    setSelectedVaultId(docId);
    const doc = allVaultDocs.find((d) => d.id === docId);
    if (doc) {
      onChange(doc.fileUrl, doc);
      toast.success(`Selected "${doc.title}" from your Doc Vault`);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVaultId('');
    setUploadedFileMeta(null);
    reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemove?.();
  };

  // Find currently attached document info
  const attachedVaultDoc = allVaultDocs.find((d) => d.fileUrl === value);
  const isImage = value && /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(value);
  const isPdf = value && /\.pdf(\?.*)?$/i.test(value);

  return (
    <div className={`w-full transition-all ${
      compact
        ? 'p-3.5 bg-[#FCFBF7] border-2 border-[#121316] shadow-[2px_2px_0px_#121316]'
        : 'p-4 bg-[#FCFBF7] border-3 border-[#0F534A] shadow-[4px_4px_0px_#0F534A]'
    } ${className}`}>
      {/* Header & Max Size */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-dashed border-[#121316]/20">
        <div className="flex items-center gap-1.5">
          <FolderLock className="w-3.5 h-3.5 text-[#FE4E1A]" />
          <label className="font-headline font-black text-xs text-[#0F534A] uppercase tracking-wide">
            {label}
          </label>
        </div>
        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Max {maxSizeMB}MB</span>
      </div>

      {!compact && description && (
        <p className="text-[11px] text-gray-600 font-medium mb-3">{description}</p>
      )}

      {/* ── ATTACHED / SELECTED STATE ── */}
      {value ? (
        <div className="p-2.5 bg-white border-2 border-[#0F534A] shadow-[2px_2px_0px_#0F534A] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {isImage ? (
              <img src={value} alt="Preview" className="w-10 h-10 object-cover border border-[#121316] shrink-0" />
            ) : (
              <div className="w-10 h-10 bg-[#FFF9F2] border border-[#121316] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[#FE4E1A]" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-headline font-black text-[#121316] truncate max-w-[180px]">
                  {attachedVaultDoc?.title || uploadedFileMeta?.name || 'Attached Document'}
                </span>
                <span className="px-1.5 py-0.5 bg-[#9EFC5F] text-[#0F534A] border border-[#121316] text-[9px] font-headline font-black uppercase">
                  ✓ Attached
                </span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono block truncate">
                {attachedVaultDoc?.fileName || (isPdf ? 'PDF Document' : 'Document Proof')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-[#FCFBF7] hover:bg-gray-100 border border-[#121316] text-gray-700 hover:text-[#FE4E1A]"
              title="Open document in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 bg-white hover:bg-red-50 border border-[#121316] text-red-600 hover:text-red-700 cursor-pointer"
              title="Remove document"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* ── SELECTION MODES (DOC VAULT vs UPLOAD) ── */
        <div className="space-y-2.5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('VAULT')}
              className={`py-1.5 px-2 border-2 font-headline font-black text-[11px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'VAULT'
                  ? 'bg-[#0F534A] text-white border-[#121316] shadow-[2px_2px_0px_#121316]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#0F534A]'
              }`}
            >
              <FolderLock className="w-3.5 h-3.5 text-[#9EFC5F]" />
              Select Vault ({allVaultDocs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('UPLOAD')}
              className={`py-1.5 px-2 border-2 font-headline font-black text-[11px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'UPLOAD'
                  ? 'bg-[#FE4E1A] text-white border-[#121316] shadow-[2px_2px_0px_#121316]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#0F534A]'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 text-white" />
              Upload New File
            </button>
          </div>

          {/* TAB 1: SELECT FROM DOC VAULT */}
          {activeTab === 'VAULT' && (
            <div className="space-y-2">
              {loadingVault ? (
                <div className="p-3 text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0F534A]" />
                  Loading your Doc Vault...
                </div>
              ) : allVaultDocs.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={selectedVaultId}
                    onChange={(e) => handleSelectFromVault(e.target.value)}
                    className="w-full p-2 bg-white border-2 border-[#0F534A] text-xs font-bold text-[#121316] focus:outline-none shadow-[2px_2px_0px_#0F534A]"
                  >
                    <option value="">-- Choose from saved Doc Vault files ({allVaultDocs.length}) --</option>
                    {sortedDocs.map((doc) => {
                      const badge = TYPE_BADGES[doc.documentType] || doc.documentType;
                      const isSuggested = suggestedType && doc.documentType === suggestedType;
                      return (
                        <option key={doc.id} value={doc.id}>
                          {isSuggested ? '★ ' : '📁 '}
                          [{badge}] {doc.title} ({doc.fileName})
                        </option>
                      );
                    })}
                  </select>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium px-1">
                    <button
                      type="button"
                      onClick={() => setIsVaultModalOpen(true)}
                      className="text-[#0F534A] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Layers className="w-3 h-3 text-[#FE4E1A]" />
                      Manage Vault ({allVaultDocs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('UPLOAD')}
                      className="text-[#FE4E1A] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Upload new
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white border-2 border-dashed border-[#0F534A]/40 text-center space-y-2">
                  <p className="text-xs text-gray-600 font-medium">
                    No documents stored in your Doc Vault yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('UPLOAD')}
                    className="px-3 py-1.5 bg-[#FE4E1A] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0px_#121316] hover:bg-[#e03d0d] cursor-pointer"
                  >
                    + Upload First Document
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD NEW FILE */}
          {activeTab === 'UPLOAD' && (
            <div className="space-y-2">
              {!compact && (
                <div className="p-2.5 bg-[#FFF9F2] border-2 border-[#0F534A] space-y-1">
                  <label className="block text-xs font-headline font-black uppercase text-[#0F534A]">
                    Document Nickname in Vault
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Identity Proof / College ID 2026"
                    value={customDocTitle}
                    onChange={(e) => setCustomDocTitle(e.target.value)}
                    className="w-full px-2 py-1 text-xs font-bold border border-[#0F534A] focus:outline-none bg-white"
                  />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed text-center cursor-pointer select-none transition-all ${
                  compact ? 'p-4' : 'p-6'
                } ${
                  isDragOver
                    ? 'border-[#FE4E1A] bg-[#FFF9F2] shadow-[3px_3px_0px_#FE4E1A]'
                    : 'border-[#0F534A] bg-white hover:bg-[#FFF9F2] shadow-[2px_2px_0px_#0F534A]'
                }`}
              >
                {isUploading ? (
                  <div className="space-y-1.5 py-1">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#FE4E1A] mx-auto" />
                    <p className="text-xs font-headline font-black text-[#0F534A] uppercase">
                      Uploading to Vault... {progress}%
                    </p>
                    <div className="w-28 h-1.5 bg-gray-200 mx-auto overflow-hidden border border-[#121316]">
                      <div className="h-full bg-[#FE4E1A] transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <UploadCloud className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-[#0F534A] mx-auto`} />
                    <p className="text-xs font-headline font-black text-[#121316] uppercase">
                      Drag &amp; Drop or <span className="text-[#FE4E1A] underline">Browse</span>
                    </p>
                    <p className="text-[10px] text-gray-500">PDF, JPG, PNG up to {maxSizeMB}MB</p>
                  </div>
                )}
              </div>

              {/* Auto-Save Checkbox */}
              <div className="p-2 bg-white border border-[#0F534A]/40 flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-[#121316] font-bold">
                  <input
                    type="checkbox"
                    checked={autoSaveToVault}
                    onChange={(e) => setAutoSaveToVault(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#0F534A]"
                  />
                  <span>Save to my Doc Vault for campaign reuse</span>
                </label>
                <Sparkles className="w-3 h-3 text-[#FE4E1A]" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Central Doc Vault Management Modal */}
      <DocVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => {
          setIsVaultModalOpen(false);
          fetchAllVaultDocs();
        }}
        onSelectDocument={(doc) => {
          handleSelectFromVault(doc.id);
        }}
      />
    </div>
  );
};
