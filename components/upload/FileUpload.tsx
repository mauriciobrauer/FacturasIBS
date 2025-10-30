'use client';

import { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { Upload, File, X } from 'lucide-react';
import { UploadedFile } from '@/lib/types';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  onUpload: () => void;
  selectedFile: UploadedFile | null;
  isUploading: boolean;
  uploadProgress: number;
  onCancelUpload?: () => void;
}

export function FileUpload({ 
  onFileSelect, 
  onFileRemove, 
  onUpload,
  selectedFile,
  isUploading,
  uploadProgress,
  onCancelUpload
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 text-center cursor-pointer transition-colors duration-200
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-primary-300 hover:border-primary-400 hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
          </div>
          <div className="px-2">
            <p className="text-base sm:text-lg font-medium text-gray-900">
              {isDragActive 
                ? 'Suelta el archivo aquí'
                : 'Arrastra y suelta tu factura aquí o haz clic para subir'
              }
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Tipos de archivo soportados: PDF, PNG, JPG
            </p>
          </div>
        </div>
      </div>

      {/* Hidden File Input for Browse Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={isUploading}
      />

      {/* Browse Files Button */}
      <Button
        onClick={handleBrowseClick}
        disabled={isUploading}
        className="w-full text-sm sm:text-base py-2 sm:py-3"
      >
        Examinar Archivos
      </Button>

      {/* Upload Button */}
      {selectedFile && !isUploading && (
        <Button
          onClick={onUpload}
          className="w-full bg-green-500 hover:bg-green-600 text-white text-sm sm:text-base py-2 sm:py-3"
        >
          Subir Factura
        </Button>
      )}

      {/* Selected File */}
      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <File className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{selectedFile.name}</p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (isUploading) {
                  onCancelUpload && onCancelUpload();
                } else {
                  onFileRemove();
                }
              }}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-3 sm:mt-4 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Subiendo...</span>
                <span className="text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
