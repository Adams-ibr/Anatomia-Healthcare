import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";

interface ImageUploaderProps {
  name: string;
  label?: string;
  defaultValue?: string | null;
  onUploadComplete?: (objectPath: string) => void;
}

export function ImageUploader({ name, label = "Image", defaultValue, onUploadComplete }: ImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string>(defaultValue || "");
  const [previewUrl, setPreviewUrl] = useState<string>(defaultValue || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      const path = response.objectPath;
      setImageUrl(path);
      onUploadComplete?.(path);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    await uploadFile(file);
  };

  const handleClear = () => {
    setImageUrl("");
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={imageUrl} />
      
      {previewUrl ? (
        <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
          <img 
            src={previewUrl.startsWith("/objects/") ? previewUrl : previewUrl} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleClear}
            data-testid="button-clear-image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          className="w-full h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="text-sm text-muted-foreground">
              Uploading... {Math.round(progress)}%
            </div>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload image</span>
            </>
          )}
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        data-testid={`input-file-${name}`}
      />
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Or enter URL:</span>
        <Input 
          type="text" 
          placeholder="https://example.com/image.jpg"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setPreviewUrl(e.target.value);
          }}
          className="flex-1"
          data-testid={`input-url-${name}`}
        />
      </div>
    </div>
  );
}
