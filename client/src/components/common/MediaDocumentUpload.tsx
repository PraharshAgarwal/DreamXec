import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Video, Image as ImageIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useCloudinaryUpload, CloudinaryUploadResult } from '../../hooks/useCloudinaryUpload';
import { TactileNeobrutalistButton } from '../ui/TactileNeobrutalistButton';

export interface MediaDocumentUploadProps {
  label?: string;
  description?: string;
  acceptedTypes?: 'image' | 'video' | 'document' | 'all';
  maxSizeMB?: number;
  folder?: string;
  value?: string;
  onUploadSuccess: (result: CloudinaryUploadResult) => void;
  onRemove?: () => void;
  className?: string;
}

export const MediaDocumentUpload: React.FC<MediaDocumentUploadProps> = ({
  label = 'Upload File',
  description = 'Supports PNG, JPG, PDF, or MP4',
  acceptedTypes = 'all',
  maxSizeMB = 25,
  folder = 'campaigns',
  value,
  onUploadSuccess,
  onRemove,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(value || null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: string } | null>(null);

  const { uploadFile, isUploading, progress, error, reset } = useCloudinaryUpload({
    folder,
    onSuccess: (res) => {
      setLocalPreview(res.secureUrl);
      onUploadSuccess(res);
    },
  });

  const getAcceptString = () => {
    switch (acceptedTypes) {
      case 'image':
        return 'image/png,image/jpeg,image/webp,image/svg+xml';
      case 'video':
        return 'video/mp4,video/quicktime,video/webm';
      case 'document':
        return '.pdf,.docx,.doc,.xlsx,.xls,.zip';
      default:
        return 'image/*,video/*,.pdf,.docx,.doc,.xlsx,.xls,.zip';
    }
  };

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size exceeds maximum allowed limit of ${maxSizeMB}MB`);
      return;
    }

    setFileMeta({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    });

    try {
      await uploadFile(file);
    } catch (err) {
      console.error('Direct Cloudinary upload error:', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalPreview(null);
    setFileMeta(null);
    reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemove?.();
  };

  const isImage = localPreview && /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(localPreview);
  const isVideo = localPreview && /\.(mp4|mov|webm)(\?.*)?$/i.test(localPreview);
  const isPdf = localPreview && /\.pdf(\?.*)?$/i.test(localPreview);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label className="font-headline font-bold text-sm text-[#0F534A] uppercase tracking-wide">
            {label}
          </label>
          <span className="text-xs font-semibold text-gray-500">Max: {maxSizeMB}MB</span>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-3 transition-all p-6 text-center cursor-pointer select-none ${
          isDragOver
            ? 'border-[#FE4E1A] bg-[#FFF9F2] shadow-[6px_6px_0px_#FE4E1A]'
            : localPreview
            ? 'border-[#0F534A] bg-white shadow-[4px_4px_0px_#0F534A]'
            : 'border-[#4717AE] bg-[#FCFBF7] shadow-[4px_4px_0px_#4717AE] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#FE4E1A]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptString()}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {/* Upload in Progress */}
        {isUploading ? (
          <div className="py-4 space-y-3">
            <div className="w-12 h-12 mx-auto border-4 border-[#FE4E1A] border-t-transparent rounded-full animate-spin" />
            <p className="font-headline font-bold text-sm text-[#0F534A]">
              Uploading direct to cloud... {progress}%
            </p>
            <div className="w-48 mx-auto h-2 bg-gray-200 border border-[#0F534A] overflow-hidden">
              <div
                className="h-full bg-[#FE4E1A] transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : localPreview ? (
          /* Preview State */
          <div className="relative flex flex-col items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-3 -right-3 w-8 h-8 bg-[#F4002C] text-white border-2 border-[#121316] flex items-center justify-center shadow-[2px_2px_0px_#121316] hover:bg-black transition-all z-20"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>

            {isImage ? (
              <img
                src={localPreview}
                alt="Upload preview"
                className="max-h-48 w-auto object-contain border-2 border-[#0F534A]"
              />
            ) : isVideo ? (
              <video
                src={localPreview}
                controls
                className="max-h-48 w-auto border-2 border-[#0F534A]"
              />
            ) : isPdf ? (
              <div className="flex items-center gap-3 p-4 bg-[#FFF9F2] border-2 border-[#0F534A]">
                <FileText className="w-8 h-8 text-[#FE4E1A]" />
                <div className="text-left">
                  <p className="font-headline font-bold text-sm text-[#121316]">PDF Document</p>
                  <a
                    href={localPreview}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#0F534A] underline font-bold"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Document ↗
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-bold text-[#0F534A]">
                <CheckCircle className="w-5 h-5 text-[#0F534A]" />
                <span>Uploaded: {fileMeta?.name || 'File attached'}</span>
              </div>
            )}

            <p className="text-xs font-bold text-gray-500">
              Click or drag another file to replace
            </p>
          </div>
        ) : (
          /* Empty / Initial State */
          <div className="py-4 space-y-2">
            <div className="w-12 h-12 mx-auto bg-[#FFF9F2] border-2 border-[#0F534A] shadow-[2px_2px_0px_#0F534A] flex items-center justify-center">
              {acceptedTypes === 'video' ? (
                <Video className="w-6 h-6 text-[#FE4E1A]" />
              ) : acceptedTypes === 'document' ? (
                <FileText className="w-6 h-6 text-[#4717AE]" />
              ) : (
                <UploadCloud className="w-6 h-6 text-[#FE4E1A]" />
              )}
            </div>
            <p className="font-headline font-black text-sm text-[#121316] uppercase tracking-wide">
              Drag & Drop file or <span className="text-[#FE4E1A] underline">Browse</span>
            </p>
            <p className="text-xs font-medium text-gray-600">{description}</p>
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-[#F4002C]">
            <AlertCircle className="w-4 h-4" />
            <span>{error.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
