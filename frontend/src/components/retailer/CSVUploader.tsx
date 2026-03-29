"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Download, FileText, CheckCircle, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useBulkUpload } from "@/hooks/useProducts";
import { CSVUploadResponse } from "@/types/product";
import { cn } from "@/lib/utils";

const TEMPLATE_CSV = `name,category,mrp,cost_price,expiry_date,quantity,batch_number
Whole Wheat Bread,bakery,45.00,28.00,2026-04-05,20,BATCH001
Amul Butter 500g,grocery,280.00,240.00,2026-05-10,15,`;

export function CSVUploader({ onSuccess }: { onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [result, setResult] = useState<CSVUploadResponse | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkUpload = useBulkUpload();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) {
      setFile(f);
      setResult(null);
    }
  }, []);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.name.endsWith(".csv")) {
      setFile(f);
      setResult(null);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    try {
      const res = await bulkUpload.mutateAsync(file);
      setResult(res);
      if (res.created > 0) onSuccess?.();
    } catch {
      // error handled by mutation
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_upload_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          isDragOver
            ? "border-primary bg-orange-50"
            : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
        )}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-charcoal">
          Drag your CSV file here or{" "}
          <span className="text-primary">click to browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">Accepts .csv files only (max 200 rows)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleSelect}
          className="hidden"
        />
      </div>

      {/* Selected file */}
      {file && !result && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <FileText className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-charcoal truncate">{file.name}</p>
            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setFile(null); }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload button */}
      {file && !result && (
        <Button
          onClick={handleUpload}
          isLoading={bulkUpload.isPending}
          fullWidth
        >
          {bulkUpload.isPending ? "Uploading..." : "Upload Products"}
        </Button>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {result.created > 0 && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-medium text-emerald-800">
                ✓ {result.created} product{result.created > 1 ? "s" : ""} added successfully
              </p>
            </div>
          )}

          {result.skipped > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm font-medium text-amber-800">
                  {result.skipped} row{result.skipped > 1 ? "s" : ""} skipped
                </p>
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="ml-auto text-xs text-amber-600 hover:text-amber-800 font-medium"
                >
                  {showErrors ? "Hide" : "Show"} errors
                </button>
              </div>
              {showErrors && result.errors.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-amber-700">
                  {result.errors.map((err, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      {err}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Button
            variant="secondary"
            onClick={() => { setFile(null); setResult(null); }}
            fullWidth
          >
            Upload Another
          </Button>
        </div>
      )}

      {/* Error */}
      {bulkUpload.isError && !result && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            {(bulkUpload.error as any)?.response?.data?.detail || "Upload failed. Please try again."}
          </p>
        </div>
      )}

      {/* Template download */}
      <button
        onClick={downloadTemplate}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
      >
        <Download size={14} />
        Download CSV Template
      </button>
    </div>
  );
}

export default CSVUploader;
