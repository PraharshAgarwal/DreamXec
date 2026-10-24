import React, { useState, useEffect, useRef } from 'react';
import {
  FolderLock,
  UploadCloud,
  FileText,
  Trash2,
  ExternalLink,
  X,
  Plus,
  RefreshCw,
  Sparkles,
  Search,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { vaultService, UserDocVaultItem, VaultDocumentType } from '../../services/vaultService';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { resolveBackendMediaUrl } from '../../utils/apiConfig';

export interface DocVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument?: (doc: UserDocVaultItem) => void;
}

const DOCUMENT_TYPE_LABELS: Record<VaultDocumentType, string> = {
  GOVT_ID: 'Govt Identity Proof',
  STUDENT_ID: 'Student ID Card',
  UNIVERSITY_ENDORSEMENT: 'University Endorsement Letter',
  BANK_PASSBOOK: 'Bank Statement / Passbook',
  INVOICE: 'Project Invoice / Receipt',
  PROJECT_PROPOSAL: 'Project Proposal Deck',
  ORGANIZATION_REGISTRATION: 'Club / Org Registration',
  OTHER: 'General Document',
};

export const DocVaultModal: React.FC<DocVaultModalProps> = ({
  isOpen,
  onClose,
  onSelectDocument,
}) => {
  const [docs, setDocs] = useState<UserDocVaultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [isUploadingMode, setIsUploadingMode] = useState(false);

  // Upload Form State
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<VaultDocumentType>('GOVT_ID');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const result = await vaultService.getDocuments(
        selectedTypeFilter === 'ALL' ? undefined : selectedTypeFilter,
        search.trim() || undefined
      );
      setDocs(result);
    } catch (err) {
      console.error('Failed to load doc vault:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocs();
    }
  }, [isOpen, selectedTypeFilter, search]);

  const { uploadFile, isUploading, progress } = useCloudinaryUpload({
    folder: 'campaigns/kyc',
    onSuccess: async (res) => {
      try {
        const saved = await vaultService.saveDocument({
          title: docTitle.trim() || 'Uploaded Document',
          fileName: res.originalFilename || 'document.pdf',
          fileUrl: res.secureUrl,
          documentType: docType,
          fileSizeBytes: res.bytes || 0,
          mimeType: res.format ? `application/${res.format}` : undefined,
        });

        toast.success(`Saved "${saved.title}" to your single Doc Vault! 📁`);
        setDocTitle('');
        setIsUploadingMode(false);
        await fetchDocs();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to save to Doc Vault');
      }
    },
  });

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from your Doc Vault?`)) {
      return;
    }

    try {
      await vaultService.deleteDocument(id);
      toast.success('Document removed from your Doc Vault');
      await fetchDocs();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete document');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#FCFBF7] border-4 border-[#0F534A] shadow-[8px_8px_0_#FE4E1A] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-[#0F534A] text-white flex items-center justify-between border-b-4 border-[#121316]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] shadow-[2px_2px_0_#121316]">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline font-black text-lg uppercase tracking-wider text-white">
                My Central Doc Vault
              </h2>
              <p className="text-xs text-[#9EFC5F] font-medium">
                Single unified document storage for all your campaigns, KYC, and institutional proofs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-white text-[#121316] hover:bg-[#FE4E1A] hover:text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar & Filters */}
        <div className="p-4 bg-white border-b-2 border-[#0F534A]/20 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents by title or filename..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border-2 border-[#0F534A] text-xs font-bold text-[#121316] focus:outline-none shadow-[2px_2px_0_#0F534A]"
              />
            </div>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 border-2 border-[#0F534A] text-xs font-bold text-[#121316] focus:outline-none shadow-[2px_2px_0_#0F534A] bg-white shrink-0"
            >
              <option value="ALL">All Document Types</option>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsUploadingMode(!isUploadingMode)}
            className="w-full sm:w-auto px-4 py-2 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[3px_3px_0_#121316] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {isUploadingMode ? 'Cancel Upload' : 'Upload New Document to Vault'}
          </button>
        </div>

        {/* Upload Drawer / Section */}
        {isUploadingMode && (
          <div className="p-4 bg-[#FFF9F2] border-b-3 border-[#FE4E1A] space-y-3 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                  Document Name / Nickname in Vault *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Student Identity Card 2026 / HOD Endorsement Letter / Aadhar Scan"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border-2 border-[#0F534A] text-xs font-bold text-[#121316] focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                  Document Category / Type *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as VaultDocumentType)}
                  className="w-full px-3 py-1.5 border-2 border-[#0F534A] text-xs font-bold text-[#121316] focus:outline-none bg-white"
                >
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp"
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) uploadFile(e.dataTransfer.files[0]);
              }}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed text-center cursor-pointer select-none transition-all ${
                dragOver
                  ? 'border-[#FE4E1A] bg-[#FFF9F2]'
                  : 'border-[#0F534A] bg-white hover:bg-[#FFF9F2]'
              }`}
            >
              {isUploading ? (
                <div className="space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#FE4E1A] mx-auto" />
                  <p className="text-xs font-headline font-black text-[#0F534A] uppercase">
                    Uploading &amp; Securing to Vault... {progress}%
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <UploadCloud className="w-6 h-6 text-[#0F534A] mx-auto" />
                  <p className="text-xs font-headline font-black text-[#121316] uppercase">
                    Drag &amp; Drop or <span className="text-[#FE4E1A] underline">Browse</span>
                  </p>
                  <p className="text-[10px] text-gray-500">PDF, DOCX, JPG, PNG up to 20MB</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Document Grid / List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-sm font-bold text-gray-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#0F534A]" />
              Loading your Doc Vault...
            </div>
          ) : docs.length === 0 ? (
            <div className="py-12 bg-white border-2 border-dashed border-[#0F534A]/40 text-center space-y-2">
              <FolderLock className="w-8 h-8 text-[#0F534A] mx-auto opacity-50" />
              <p className="text-sm font-headline font-black text-[#121316] uppercase">
                No documents found in your Doc Vault
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Documents you upload during campaign creation or directly in this vault are stored here for instant reuse across all forms.
              </p>
              <button
                type="button"
                onClick={() => setIsUploadingMode(true)}
                className="mt-2 px-4 py-1.5 bg-[#FE4E1A] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0_#121316]"
              >
                + Upload First Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {docs.map((doc) => {
                const isImage = /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(doc.fileUrl);
                const isPdf = /\.pdf(\?.*)?$/i.test(doc.fileUrl);

                return (
                  <div
                    key={doc.id}
                    className="p-3 bg-white border-2 border-[#0F534A] shadow-[3px_3px_0_#0F534A] flex items-center justify-between gap-3 hover:shadow-[4px_4px_0_#FE4E1A] transition-all"
                  >
                    <div className="flex items-center gap-3 truncate">
                      {isImage ? (
                        <img
                          src={resolveBackendMediaUrl(doc.fileUrl)}
                          alt={doc.title}
                          className="w-12 h-12 object-cover border border-[#121316] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-[#FFF9F2] border border-[#121316] flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-[#FE4E1A]" />
                        </div>
                      )}

                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-headline font-black text-[#121316] truncate">
                            {doc.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.5 bg-[#FFDD33] text-[#121316] border border-[#121316] text-[9px] font-headline font-black uppercase">
                            {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onSelectDocument && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectDocument(doc);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-[#9EFC5F] hover:bg-[#8cee4b] text-[#0F534A] border border-[#121316] font-headline font-black text-[11px] uppercase shadow-[1px_1px_0_#121316] cursor-pointer"
                        >
                          Select
                        </button>
                      )}

                      <a
                        href={resolveBackendMediaUrl(doc.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-[#FCFBF7] hover:bg-gray-100 border border-[#121316] text-gray-700 hover:text-[#FE4E1A]"
                        title="View Document"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="p-1.5 bg-white hover:bg-red-50 border border-[#121316] text-red-600 hover:text-red-700 cursor-pointer"
                        title="Delete from Vault"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#FCFBF7] border-t-2 border-[#0F534A]/20 flex items-center justify-between text-xs text-gray-600 font-medium">
          <span>Total Vaulted Documents: <strong>{docs.length}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0F534A] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0_#121316] cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
