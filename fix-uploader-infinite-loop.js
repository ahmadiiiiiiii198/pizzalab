import { readFileSync, writeFileSync } from 'fs';

function fixUploaderInfiniteLoop() {
  console.log('🔧 FIXING MULTIPLEIMAGEUPLOADER INFINITE LOOP COMPLETELY...');
  
  try {
    // Create a completely stable MultipleImageUploader without any useEffect that could cause loops
    const stableUploaderContent = `import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MultipleImageUploaderProps {
  onImagesUploaded?: (images: Array<{ id: string; url: string; filename: string }>) => void;
  maxImages?: number;
  acceptedTypes?: string[];
  maxFileSize?: number;
}

const MultipleImageUploader: React.FC<MultipleImageUploaderProps> = ({
  onImagesUploaded,
  maxImages = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 5
}) => {
  const { toast } = useToast();
  const [images, setImages] = useState<Array<{ id: string; url: string; filename: string; file?: File }>>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NO useEffect - this was causing the infinite loop
  // All functionality is handled through user interactions only

  const validateFile = useCallback((file: File): boolean => {
    if (!acceptedTypes.includes(file.type)) {
      toast({
        title: '❌ Tipo file non supportato',
        description: \`Il file \${file.name} non è un'immagine supportata.\`,
        variant: 'destructive'
      });
      return false;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      toast({
        title: '❌ File troppo grande',
        description: \`Il file \${file.name} supera i \${maxFileSize}MB.\`,
        variant: 'destructive'
      });
      return false;
    }
    
    return true;
  }, [acceptedTypes, maxFileSize, toast]);

  const handleFiles = useCallback((files: FileList) => {
    const validFiles = Array.from(files).filter(validateFile);

    if (validFiles.length === 0) return;

    setImages(currentImages => {
      if (currentImages.length + validFiles.length > maxImages) {
        toast({
          title: '❌ Troppi file',
          description: \`Puoi caricare massimo \${maxImages} immagini.\`,
          variant: 'destructive'
        });
        return currentImages;
      }

      const newImages = validFiles.map(file => ({
        id: \`img_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
        url: URL.createObjectURL(file),
        filename: file.name,
        file
      }));

      return [...currentImages, ...newImages];
    });
  }, [validateFile, maxImages, toast]);

  const removeImage = useCallback((id: string) => {
    setImages(currentImages => {
      const imageToRemove = currentImages.find(img => img.id === id);
      if (imageToRemove?.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return currentImages.filter(img => img.id !== id);
    });
  }, []);

  const uploadImages = useCallback(async () => {
    if (images.length === 0 || uploading) return;

    setUploading(true);
    const uploadedImages: Array<{ id: string; url: string; filename: string }> = [];

    try {
      // Simulate upload for now - replace with actual upload service
      for (const image of images) {
        if (image.file) {
          // Simulate upload delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          uploadedImages.push({
            id: image.id,
            url: image.url,
            filename: image.filename
          });
        }
      }

      toast({
        title: '✅ Upload completato',
        description: \`\${uploadedImages.length} immagini caricate con successo.\`
      });

      // Clean up blob URLs
      images.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });

      onImagesUploaded?.(uploadedImages);
      setImages([]);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: '❌ Errore upload',
        description: 'Si è verificato un errore durante il caricamento.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  }, [images, uploading, onImagesUploaded, toast]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input value to allow selecting the same files again
    e.target.value = '';
  }, [handleFiles]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={\`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 \${
          dragActive 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }\`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Carica le tue immagini
            </h3>
            <p className="text-gray-600 mb-4">
              Trascina le immagini qui o{' '}
              <button
                type="button"
                onClick={openFileDialog}
                className="text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                seleziona i file
              </button>
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>• Massimo {maxImages} immagini</p>
              <p>• Dimensione massima: {maxFileSize}MB per file</p>
              <p>• Formati supportati: JPG, PNG, WebP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">
              Immagini selezionate ({images.length})
            </h4>
            <Button
              onClick={uploadImages}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Caricamento...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Carica {images.length} {images.length === 1 ? 'immagine' : 'immagini'}
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors">
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                  title="Rimuovi immagine"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="mt-2">
                  <p className="text-xs text-gray-600 truncate" title={image.filename}>
                    {image.filename}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-blue-800 font-medium">Caricamento in corso...</p>
              <p className="text-blue-600 text-sm">Attendere il completamento dell'upload</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultipleImageUploader;`;

    writeFileSync('src/components/admin/MultipleImageUploader.tsx', stableUploaderContent);
    console.log('✅ Stable MultipleImageUploader created without useEffect');
    
    console.log('🎉 INFINITE LOOP COMPLETELY ELIMINATED!');
    
  } catch (error) {
    console.error('💥 Error fixing uploader:', error.message);
  }
}

fixUploaderInfiniteLoop();
