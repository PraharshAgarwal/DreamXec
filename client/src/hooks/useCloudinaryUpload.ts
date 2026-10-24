import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  originalFilename: string;
  bytes: number;
  format: string;
  resourceType: 'image' | 'video' | 'raw';
}

export interface UseCloudinaryUploadOptions {
  folder?: string;
  tags?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  onSuccess?: (result: CloudinaryUploadResult) => void;
  onError?: (error: Error) => void;
}

export const useCloudinaryUpload = (options: UseCloudinaryUploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<CloudinaryUploadResult | null>(null);

  const uploadFile = async (file: File, customOptions?: Partial<UseCloudinaryUploadOptions>): Promise<CloudinaryUploadResult> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    const folder = customOptions?.folder || options.folder || 'campaigns';

    try {
      let uploadedData: CloudinaryUploadResult | null = null;

      // 1. Primary: Direct-to-AWS S3 upload via presigned URL (best performance, zero server memory load)
      try {
        const token = localStorage.getItem('token');
        const presignRes = await axios.post(`${API_BASE_URL}/upload/presign`, {
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          folder,
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const presignData = presignRes.data?.data;
        if (presignRes.data?.status !== 'disabled' && presignData?.uploadUrl && presignData?.fileUrl) {
          await axios.put(presignData.uploadUrl, file, {
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setProgress(percent);
              }
            },
          });

          const ext = file.name.split('.').pop() || '';
          const detectedType: 'image' | 'video' | 'raw' = file.type.startsWith('image/')
            ? 'image'
            : file.type.startsWith('video/')
            ? 'video'
            : 'raw';

          uploadedData = {
            publicId: presignData.key || `${folder}/${file.name}`,
            secureUrl: presignData.fileUrl,
            originalFilename: file.name,
            bytes: file.size,
            format: ext,
            resourceType: detectedType,
          };
        }
      } catch (s3Err: any) {
        if (s3Err?.response?.status !== 503 && s3Err?.response?.data?.status !== 'disabled') {
          const errMsg = s3Err?.response?.data?.message || s3Err?.message || '';
          console.warn('Direct AWS S3 upload unavailable or unconfigured, trying fallbacks:', errMsg);
        }
      }

      // 2. Fallback to Server Upload endpoint (/upload) streaming directly to S3
      if (!uploadedData) {
        const serverFormData = new FormData();
        serverFormData.append('file', file);
        serverFormData.append('folder', folder);

        const token = localStorage.getItem('token');
        const serverResponse = await axios.post(`${API_BASE_URL}/upload`, serverFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setProgress(percent);
            }
          },
        });

        const data = serverResponse.data?.data || serverResponse.data;
        const uploadedUrl = data?.secureUrl || data?.url || data?.secure_url;

        if (!uploadedUrl) {
          throw new Error(serverResponse.data?.message || 'Server upload failed to return file URL');
        }

        const ext = file.name.split('.').pop() || '';
        const detectedType: 'image' | 'video' | 'raw' = file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
          ? 'video'
          : 'raw';

        uploadedData = {
          publicId: data.publicId || `${folder}/${Date.now()}-${file.name}`,
          secureUrl: uploadedUrl,
          originalFilename: file.name,
          bytes: file.size,
          format: ext,
          resourceType: detectedType,
        };
      }

      setResult(uploadedData);
      setIsUploading(false);
      setProgress(100);

      options.onSuccess?.(uploadedData);
      customOptions?.onSuccess?.(uploadedData);

      return uploadedData;
    } catch (err: any) {
      const uploadError = new Error(
        err.response?.data?.error?.message || err.response?.data?.message || err.message || 'File upload failed'
      );
      setError(uploadError);
      setIsUploading(false);
      options.onError?.(uploadError);
      customOptions?.onError?.(uploadError);
      throw uploadError;
    }
  };

  const reset = () => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
  };

    return {
    uploadFile,
    isUploading,
    progress,
    error,
    result,
    reset,
  };
};

export const useS3Upload = useCloudinaryUpload;
export const useFileUpload = useCloudinaryUpload;
export type FileUploadResult = CloudinaryUploadResult;
export type UseS3UploadOptions = UseCloudinaryUploadOptions;

