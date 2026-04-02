import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Box } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";

interface ModelUploaderProps {
  name: string;
  label?: string;
  defaultValue?: string | null;
  onUploadComplete?: (objectPath: string) => void;
  accept?: string;
}

export function ModelUploader({ 
  name, 
  label = "3D Model", 
  defaultValue, 
  onUploadComplete,
  accept = ".glb,.gltf"
}: ModelUploaderProps) {
  const [modelUrl, setModelUrl] = useState<string>(defaultValue || "");
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      const path = response.objectPath;
      setModelUrl(path);
      onUploadComplete?.(path);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    await uploadFile(file);
  };

  const handleClear = () => {
    setModelUrl("");
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getDisplayName = () => {
    if (fileName) return fileName;
    if (modelUrl) {
      const parts = modelUrl.split("/");
      return parts[parts.length - 1];
    }
    return "";
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={modelUrl} />
      
      {modelUrl ? (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <Box className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-sm truncate">{getDisplayName()}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            data-testid="button-clear-model"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          className="w-full h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="text-sm text-muted-foreground">
              Uploading... {Math.round(progress)}%
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload 3D model (GLB/GLTF)</span>
            </>
          )}
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileSelect}
        data-testid={`input-file-${name}`}
      />
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Or enter URL:</span>
        <Input 
          type="text" 
          placeholder="https://example.com/model.glb"
          value={modelUrl}
          onChange={(e) => {
            setModelUrl(e.target.value);
            setFileName("");
          }}
          className="flex-1"
          data-testid={`input-url-${name}`}
        />
      </div>
    </div>
  );
}
