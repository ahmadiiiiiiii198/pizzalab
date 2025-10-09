import { readFileSync, writeFileSync } from 'fs';

function fixGalleryUploadDialog() {
  console.log('🔧 FIXING GALLERY UPLOAD DIALOG COMPLETELY...');
  
  try {
    // Create a completely stable and working GalleryUploadDialog
    const stableDialogContent = `import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  featured: boolean;
}

interface GalleryUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (image: GalleryImage) => void;
}

const GalleryUploadDialog: React.FC<GalleryUploadDialogProps> = ({ 
  isOpen, 
  onClose, 
  onUploadComplete 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const { toast } = useToast();
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(
        file => file.type.startsWith('image/')
      );
      
      if (files.length === 0) {
        toast({
          title: "❌ Nessuna immagine valida",
          description: "Assicurati di caricare solo file immagine",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, [toast]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(
        file => file.type.startsWith('image/')
      );
      
      if (files.length === 0) {
        toast({
          title: "❌ Nessuna immagine valida",
          description: "Assicurati di caricare solo file immagine",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, [toast]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of selectedFiles) {
        console.log('📤 Uploading file:', file.name);

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = \`\${uuidv4()}.\${fileExt}\`;
        const filePath = \`gallery/\${fileName}\`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Upload error:', uploadError);
          toast({
            title: "❌ Errore caricamento",
            description: \`Errore durante il caricamento di \${file.name}: \${uploadError.message}\`,
            variant: "destructive",
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('images')
          .getPublicUrl(filePath);

        console.log('✅ File uploaded, URL:', publicUrl);

        // Create gallery image object
        const imageId = uuidv4();
        const newImage: GalleryImage = {
          id: imageId,
          src: publicUrl,
          alt: file.name.split('.')[0] || "Immagine caricata",
          featured: false,
        };

        // Save to database
        const { error: dbError } = await supabase
          .from('gallery_images')
          .insert({
            id: imageId,
            title: newImage.alt,
            description: '',
            image_url: publicUrl,
            category: 'main',
            sort_order: 999,
            is_active: true,
            is_featured: false
          });

        if (dbError) {
          console.error('❌ Database error:', dbError);
          toast({
            title: "⚠️ Avviso",
            description: \`Immagine caricata ma non salvata nel database: \${dbError.message}\`,
            variant: "destructive",
          });
          continue;
        }

        console.log('✅ Image saved to database');

        // Notify parent component
        onUploadComplete(newImage);
      }
      
      toast({
        title: "✅ Caricamento completato",
        description: \`\${selectedFiles.length} immagine/i aggiunta/e alla galleria\`,
      });

      // Reset state
      setSelectedFiles([]);
      setFileInputKey(Date.now());
      
      // Close dialog
      onClose();
      
    } catch (error) {
      console.error('💥 Upload error:', error);
      toast({
        title: "❌ Errore",
        description: error instanceof Error ? error.message : "Errore durante il caricamento",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, toast, onUploadComplete, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Carica nuove immagini
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          <div
            className={\`border-2 border-dashed rounded-lg p-8 text-center transition-all \${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }\`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              key={fileInputKey}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="gallery-file-input"
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-600" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Trascina le immagini qui
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  oppure
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('gallery-file-input')?.click()}
                >
                  Seleziona file
                </Button>
              </div>
            </div>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">
                File selezionati ({selectedFiles.length})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={\`\${file.name}-\${index}\`}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ImageIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Annulla
            </Button>
            <Button
              type="button"
              onClick={uploadFiles}
              disabled={selectedFiles.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Caricamento...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Carica {selectedFiles.length > 0 ? \`(\${selectedFiles.length})\` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryUploadDialog;`;

    writeFileSync('src/components/admin/GalleryUploadDialog.tsx', stableDialogContent);
    console.log('✅ Stable GalleryUploadDialog created');
    
    console.log('🎉 GALLERY UPLOAD DIALOG FIXED COMPLETELY!');
    
  } catch (error) {
    console.error('💥 Error fixing dialog:', error.message);
  }
}

fixGalleryUploadDialog();
