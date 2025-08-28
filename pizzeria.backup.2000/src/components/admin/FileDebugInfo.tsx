import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Upload, Info } from 'lucide-react';
import { validateImageFile, formatFileSize, isImageByContent } from '@/utils/fileValidation';

interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  extension: string;
  isValidImage: boolean;
  correctedMimeType: string;
  validationError?: string;
  contentValidation?: boolean;
}

const FileDebugInfo: React.FC = () => {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    
    try {
      const validation = validateImageFile(file);
      const contentCheck = await isImageByContent(file);
      
      const info: FileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        extension: file.name.split('.').pop()?.toLowerCase() || '',
        isValidImage: validation.isValid,
        correctedMimeType: validation.correctedMimeType,
        validationError: validation.error,
        contentValidation: contentCheck
      };
      
      setFileInfo(info);
    } catch (error) {
      console.error('Error analyzing file:', error);
    } finally {
      setIsAnalyzing(false);
    }
    
    // Reset input
    event.target.value = '';
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          File Debug Information
        </CardTitle>
        <CardDescription>
          Upload a file to analyze its properties and debug upload issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="relative"
            disabled={isAnalyzing}
          >
            <input
              type="file"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept="*/*"
            />
            <Upload className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Select File to Analyze'}
          </Button>
        </div>

        {fileInfo && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                File analysis complete. Review the information below to understand potential upload issues.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Basic Information</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Name:</strong> {fileInfo.name}</div>
                  <div><strong>Size:</strong> {formatFileSize(fileInfo.size)}</div>
                  <div><strong>Extension:</strong> .{fileInfo.extension}</div>
                  <div><strong>Last Modified:</strong> {new Date(fileInfo.lastModified).toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">MIME Type Information</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Detected Type:</strong> 
                    <Badge variant={fileInfo.type.startsWith('image/') ? 'default' : 'destructive'} className="ml-2">
                      {fileInfo.type || 'Unknown'}
                    </Badge>
                  </div>
                  <div><strong>Corrected Type:</strong> 
                    <Badge variant="secondary" className="ml-2">
                      {fileInfo.correctedMimeType}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Validation Results</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={fileInfo.isValidImage ? 'default' : 'destructive'}>
                    {fileInfo.isValidImage ? 'Valid Image' : 'Invalid Image'}
                  </Badge>
                  <Badge variant={fileInfo.contentValidation ? 'default' : 'secondary'}>
                    {fileInfo.contentValidation ? 'Content Verified' : 'Content Check Failed'}
                  </Badge>
                </div>
                
                {fileInfo.validationError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <strong>Validation Error:</strong> {fileInfo.validationError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Troubleshooting Tips</h4>
              <div className="text-sm space-y-1">
                {!fileInfo.type.startsWith('image/') && (
                  <Alert>
                    <AlertDescription>
                      ⚠️ The file's MIME type ({fileInfo.type}) doesn't indicate it's an image. 
                      This might cause upload issues. Try saving the file again or using a different image editor.
                    </AlertDescription>
                  </Alert>
                )}
                
                {!fileInfo.contentValidation && (
                  <Alert>
                    <AlertDescription>
                      ⚠️ The file content doesn't match expected image signatures. 
                      The file might be corrupted or not actually an image.
                    </AlertDescription>
                  </Alert>
                )}
                
                {fileInfo.size > 50 * 1024 * 1024 && (
                  <Alert>
                    <AlertDescription>
                      ⚠️ File size is very large ({formatFileSize(fileInfo.size)}). 
                      Consider compressing the image before upload.
                    </AlertDescription>
                  </Alert>
                )}
                
                {fileInfo.isValidImage && fileInfo.contentValidation && (
                  <Alert>
                    <AlertDescription>
                      ✅ This file should upload successfully. If you're still experiencing issues, 
                      check your internet connection or try refreshing the page.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileDebugInfo;
