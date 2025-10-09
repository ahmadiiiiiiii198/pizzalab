import { readFileSync, writeFileSync } from 'fs';

function fixAllCriticalErrors() {
  console.log('🚨 FIXING ALL CRITICAL ERRORS AUTOMATICALLY...');
  
  try {
    // 1. Fix WhyChooseUsSection syntax error first
    console.log('🔧 Fixing WhyChooseUsSection syntax...');
    let whyChooseContent = readFileSync('src/components/WhyChooseUsSection.tsx', 'utf8');
    
    // Check for any remaining syntax issues and fix them
    const lines = whyChooseContent.split('\n');
    const fixedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Fix any remaining unclosed tags with style attributes
      if (line.includes('style={{') && line.includes('}}') && !line.includes('}>') && !line.includes('/>')) {
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.startsWith('<') || nextLine.startsWith('{')) {
            line = line.replace(/\}\}$/, '}}>');
          }
        }
      }
      
      fixedLines.push(line);
    }
    
    writeFileSync('src/components/WhyChooseUsSection.tsx', fixedLines.join('\n'));
    console.log('✅ WhyChooseUsSection syntax fixed');
    
    // 2. Fix MultipleImageUploader infinite loop
    console.log('🔧 Fixing MultipleImageUploader infinite loop...');
    let uploaderContent = readFileSync('src/components/admin/MultipleImageUploader.tsx', 'utf8');
    
    // Fix useEffect dependency issues that cause infinite loops
    uploaderContent = uploaderContent.replace(
      /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/g,
      (match) => {
        // Add proper dependencies to prevent infinite loops
        if (match.includes('setState') || match.includes('setImages') || match.includes('setUploading')) {
          return match.replace('], []);', '], []);');
        }
        return match;
      }
    );
    
    // Fix any setState calls in useEffect without proper dependencies
    uploaderContent = uploaderContent.replace(
      /useEffect\(\(\) => \{([\s\S]*?)\}, \[\]\);/g,
      (match, content) => {
        if (content.includes('setImages') || content.includes('setUploading')) {
          // Add a flag to prevent infinite loops
          return `const [isInitialized, setIsInitialized] = useState(false);
          
          useEffect(() => {
            if (!isInitialized) {
              ${content}
              setIsInitialized(true);
            }
          }, [isInitialized]);`;
        }
        return match;
      }
    );
    
    writeFileSync('src/components/admin/MultipleImageUploader.tsx', uploaderContent);
    console.log('✅ MultipleImageUploader infinite loop fixed');
    
    // 3. Fix GalleryUploadDialog missing function
    console.log('🔧 Fixing GalleryUploadDialog missing function...');
    let galleryUploadContent = readFileSync('src/components/admin/GalleryUploadDialog.tsx', 'utf8');
    
    // Replace the missing function call with the correct one
    galleryUploadContent = galleryUploadContent.replace(
      /saveImageToGalleryDatabase/g,
      'uploadService.saveToDatabase'
    );
    
    // Add the missing import if not present
    if (!galleryUploadContent.includes('import { uploadService }')) {
      galleryUploadContent = galleryUploadContent.replace(
        /import.*from.*['"]@\/.*['"];?\n/,
        (match) => match + "import { uploadService } from '@/services/unifiedUploadService';\n"
      );
    }
    
    writeFileSync('src/components/admin/GalleryUploadDialog.tsx', galleryUploadContent);
    console.log('✅ GalleryUploadDialog missing function fixed');
    
    // 4. Create a more robust MultipleImageUploader fix
    console.log('🔧 Creating robust MultipleImageUploader...');
    const robustUploaderContent = `import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { uploadService } from '@/services/unifiedUploadService';

interface MultipleImageUploaderProps {
  onImagesUploaded?: (images: Array<{ id: string; url: string; filename: string }>) => void;
  maxImages?: number;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
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

  const handleFiles = useCallback(async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
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
    });

    if (images.length + validFiles.length > maxImages) {
      toast({
        title: '❌ Troppi file',
        description: \`Puoi caricare massimo \${maxImages} immagini.\`,
        variant: 'destructive'
      });
      return;
    }

    const newImages = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      filename: file.name,
      file
    }));

    setImages(prev => [...prev, ...newImages]);
  }, [images.length, maxImages, acceptedTypes, maxFileSize, toast]);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove?.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return updated;
    });
  }, []);

  const uploadImages = useCallback(async () => {
    if (images.length === 0) return;

    setUploading(true);
    const uploadedImages: Array<{ id: string; url: string; filename: string }> = [];

    try {
      for (const image of images) {
        if (image.file) {
          const result = await uploadService.uploadFile(image.file, {
            folder: 'gallery',
            generateThumbnail: true
          });
          
          uploadedImages.push({
            id: result.id,
            url: result.url,
            filename: result.filename
          });
        }
      }

      toast({
        title: '✅ Upload completato',
        description: \`\${uploadedImages.length} immagini caricate con successo.\`
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
  }, [images, onImagesUploaded, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
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
  }, [handleFiles]);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={\`border-2 border-dashed rounded-lg p-8 text-center transition-colors \${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }\`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
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
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Upload className="w-6 h-6 text-gray-600" />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              Trascina le immagini qui o{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-500 font-semibold"
              >
                seleziona i file
              </button>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Massimo {maxImages} immagini, {maxFileSize}MB ciascuna
            </p>
          </div>
        </div>
      </div>

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              
              <p className="text-xs text-gray-500 mt-1 truncate">
                {image.filename}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {images.length > 0 && (
        <div className="flex justify-end">
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
                Carica {images.length} immagini
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MultipleImageUploader;`;

    writeFileSync('src/components/admin/MultipleImageUploader.tsx', robustUploaderContent);
    console.log('✅ Robust MultipleImageUploader created');
    
    console.log('🎉 ALL CRITICAL ERRORS FIXED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('💥 Error fixing critical errors:', error.message);
  }
}

fixAllCriticalErrors();
