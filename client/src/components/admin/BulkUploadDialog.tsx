import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Upload, FileText, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  csvTemplate: string;
  jsonTemplate: object[];
  onUpload: (data: any[]) => Promise<void>;
  templateFileName: string;
}

export function BulkUploadDialog({
  open,
  onOpenChange,
  title,
  description,
  csvTemplate,
  jsonTemplate,
  onUpload,
  templateFileName,
}: BulkUploadDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("csv");
  const [csvData, setCsvData] = useState("");
  const [jsonData, setJsonData] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = (format: "csv" | "json") => {
    const content = format === "csv" 
      ? csvTemplate 
      : JSON.stringify(jsonTemplate, null, 2);
    
    const blob = new Blob([content], { 
      type: format === "csv" ? "text/csv" : "application/json" 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateFileName}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (csv: string): any[] => {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");
    
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        throw new Error(`Row ${i + 1} has ${values.length} values but expected ${headers.length}`);
      }
      
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        let value: any = values[index];
        if (value === "true") value = true;
        else if (value === "false") value = false;
        else if (!isNaN(Number(value)) && value !== "") value = Number(value);
        row[header] = value;
      });
      data.push(row);
    }
    
    return data;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result.map(v => v.replace(/^"|"$/g, ""));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith(".json")) {
        setActiveTab("json");
        setJsonData(content);
      } else {
        setActiveTab("csv");
        setCsvData(content);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccessCount(null);
    setIsUploading(true);

    try {
      let data: any[];
      
      if (activeTab === "csv") {
        if (!csvData.trim()) throw new Error("Please enter CSV data or upload a file");
        data = parseCSV(csvData);
      } else {
        if (!jsonData.trim()) throw new Error("Please enter JSON data or upload a file");
        data = JSON.parse(jsonData);
        if (!Array.isArray(data)) {
          throw new Error("JSON must be an array of items");
        }
      }

      if (data.length === 0) {
        throw new Error("No data to import");
      }

      await onUpload(data);
      setSuccessCount(data.length);
      
      setTimeout(() => {
        setCsvData("");
        setJsonData("");
        setSuccessCount(null);
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse data");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setCsvData("");
    setJsonData("");
    setError(null);
    setSuccessCount(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate("csv")}
              data-testid="button-download-csv-template"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate("json")}
              data-testid="button-download-json-template"
            >
              <Download className="h-4 w-4 mr-2" />
              Download JSON Template
            </Button>
          </div>

          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload a CSV or JSON file
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleFileUpload}
              data-testid="input-bulk-file"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="csv" data-testid="tab-csv">
                <FileText className="h-4 w-4 mr-2" />
                CSV Format
              </TabsTrigger>
              <TabsTrigger value="json" data-testid="tab-json">
                <FileText className="h-4 w-4 mr-2" />
                JSON Format
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="space-y-2">
              <Label>Paste CSV Data</Label>
              <Textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder={csvTemplate}
                rows={10}
                className="font-mono text-sm"
                data-testid="textarea-csv"
              />
            </TabsContent>

            <TabsContent value="json" className="space-y-2">
              <Label>Paste JSON Data</Label>
              <Textarea
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder={JSON.stringify(jsonTemplate, null, 2)}
                rows={10}
                className="font-mono text-sm"
                data-testid="textarea-json"
              />
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successCount !== null && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Success</AlertTitle>
              <AlertDescription className="text-green-600">
                Successfully imported {successCount} items
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isUploading}
            data-testid="button-bulk-import"
          >
            {isUploading ? "Importing..." : "Import Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
