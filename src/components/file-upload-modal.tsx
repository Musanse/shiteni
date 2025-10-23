'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText, Image as ImageIcon, X, Send } from 'lucide-react';
import NextImage from 'next/image';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendFile: (file: File, messageType: 'image' | 'document') => Promise<void>;
}

export default function FileUploadModal({
  isOpen,
  onClose,
  onSendFile
}: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreview(null);
      setIsUploading(false);
    }
  }, [isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleSendFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const messageType = selectedFile.type.startsWith('image/') ? 'image' : 'document';
      await onSendFile(selectedFile, messageType);
      
      // Reset state
      setSelectedFile(null);
      setPreview(null);
      onClose();
    } catch (error) {
      console.error('Error sending file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    } else if (file.type.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    } else {
      return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send File</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!selectedFile) {
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
              className="hidden"
            />
            
            {!selectedFile ? (
              <div className="space-y-2">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="text-gray-600">Click here to select a file</p>
                <p className="text-sm text-gray-500">
                  Images, PDFs, Documents (Max 10MB)
                </p>
                <p className="text-xs text-gray-400">or drag and drop files here</p>
                
                {/* Backup visible file input */}
                <div className="mt-4">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* File Preview */}
                {preview ? (
                  <div className="space-y-2">
                    <div className="relative max-h-32 max-w-full mx-auto rounded-lg overflow-hidden">
                      <NextImage
                        src={preview}
                        alt={`Preview of ${selectedFile.name}`}
                        width={200}
                        height={128}
                        className="object-contain"
                      />
                    </div>
                    <p className="text-sm text-gray-600">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    {getFileIcon(selectedFile)}
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                )}

                {/* File Actions */}
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                  >
                    Change File
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button onClick={handleClose} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleSendFile}
              disabled={!selectedFile || isUploading}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
