'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, FileImage, FileVideo, Loader2 } from 'lucide-react';

interface MediaUploadProps {
  label: string;
  type: 'image' | 'video';
  currentUrl: string;
  onUploadSuccess: (url: string) => void;
  onRemove: () => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

export function MediaUpload({ 
  label, 
  type, 
  currentUrl, 
  onUploadSuccess, 
  onRemove,
  isUploading,
  setIsUploading
}: MediaUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate size
    const maxSize = type === 'image' ? 8 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande.');
      return;
    }

    // Validate type
    if (type === 'image' && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato no permitido. Usa JPG, PNG o WEBP.');
      return;
    }
    if (type === 'video' && !['video/mp4', 'video/webm'].includes(file.type)) {
      setError('El video debe ser MP4 o WEBM.');
      return;
    }

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `products/${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('product-media')
        .getPublicUrl(filePath);

      onUploadSuccess(publicUrlData.publicUrl);
    } catch (err: unknown) {
      console.error('Error uploading media:', err);
      setError('Error al subir el archivo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm text-neutral-400 uppercase font-mono">{label}</label>
      
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-[160px]">
        
        {currentUrl ? (
          <div className="relative w-full h-full flex flex-col items-center">
            {type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUrl} alt="Preview" className="max-h-32 object-contain rounded" />
            ) : (
              <video src={currentUrl} controls muted playsInline className="max-h-32 rounded w-full bg-black" />
            )}
            
            <div className="absolute top-0 right-0 flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-neutral-900/80 p-1.5 rounded text-white hover:bg-neutral-700 transition-colors"
                title="Cambiar"
                disabled={isUploading}
              >
                <Upload size={16} />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="bg-red-900/80 p-1.5 rounded text-white hover:bg-red-700 transition-colors"
                title="Eliminar"
                disabled={isUploading}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-neutral-500">
            {type === 'image' ? <FileImage size={32} className="mb-2" /> : <FileVideo size={32} className="mb-2" />}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-neutral-700 text-white rounded font-medium hover:bg-neutral-600 transition-colors flex items-center gap-2 text-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  {type === 'image' ? 'Subiendo imagen...' : 'Subiendo video...'}
                </>
              ) : (
                <>
                  <Upload size={16} />
                  {type === 'image' ? 'Seleccionar imagen' : 'Seleccionar video'}
                </>
              )}
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={type === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm'}
          onChange={handleFileSelect}
        />
      </div>
      
      {error && <p className="text-red-500 text-xs mt-1 font-bold">{error}</p>}
    </div>
  );
}
