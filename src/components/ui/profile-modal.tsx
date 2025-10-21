'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Camera, 
  Upload, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { UserRole, roleLabels } from '@/types/roles';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail?: string;
  userRole: UserRole;
  onAvatarUploaded?: (avatarUrl: string) => void;
  onRefreshProfile?: () => void;
}

export function ProfileModal({ isOpen, onClose, userName, userEmail, userRole, onAvatarUploaded, onRefreshProfile }: ProfileModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getRoleColor = () => {
    switch (userRole) {
      case 'admin':
        return 'text-red-600';
      case 'institution':
      case 'loan_officer':
      case 'credit_analyst':
      case 'customer_service':
      case 'manager':
        return 'text-blue-600';
      case 'customer':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRoleLabel = () => {
    return roleLabels[userRole] || 'User';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadStatus('error');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadStatus('error');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setUploadStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', 'avatar');

      // Upload to server
      const response = await fetch('/api/customer/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadStatus('success');
        
        // Create the avatar URL and notify parent component
        const avatarUrl = `/uploads/${data.filename}`;
        if (onAvatarUploaded) {
          onAvatarUploaded(avatarUrl);
        }
        
        // Refresh profile data from database
        if (onRefreshProfile) {
          onRefreshProfile();
        }
        
        // Don't reset the form - keep the uploaded avatar visible
        // The avatar will persist until the modal is closed
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Only reset if there was no successful upload
    if (uploadStatus !== 'success') {
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    setUploadStatus('idle');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border rounded-lg shadow-lg w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Profile Settings</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* User Info */}
            <div className="text-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-medium">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Avatar preview" 
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      userName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="h-4 w-4" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg">{userName}</h3>
                  <p className="text-sm text-muted-foreground">{userEmail || 'No email'}</p>
                  <p className={`text-xs ${getRoleColor()}`}>{getRoleLabel()}</p>
                </div>
              </div>
            </div>

            {/* Upload Status */}
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Avatar uploaded successfully!</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadStatus('idle')}
                  className="ml-auto h-6 w-6 p-0 text-green-800 hover:text-green-900"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Failed to upload avatar. Please try again.</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadStatus('idle')}
                  className="ml-auto h-6 w-6 p-0 text-red-800 hover:text-red-900"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* File Info */}
            {selectedFile && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Selected File</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Avatar
                  </>
                )}
              </Button>
            </div>

            {/* Instructions */}
            <div className="text-xs text-muted-foreground text-center">
              <p>Supported formats: JPG, PNG, GIF</p>
              <p>Maximum file size: 5MB</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}