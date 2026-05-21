"use client";
import { useCallback, useState, DragEvent, useRef } from "react";
import { Upload, FileText, AlertCircle, Download } from "lucide-react";
import { downloadSampleCsv } from "@/lib/csv";

type Props = {
  onParsed: (content: string) => void;
  preview: string[];
  error?: string;
};

export function CsvDropZone({ onParsed, preview, error }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => onParsed(e.target?.result as string);
      reader.readAsText(file, "UTF-8");
    },
    [onParsed]
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border border-dashed rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-200
          ${isDragging
            ? "border-fuchsia-500 bg-fuchsia-500/10"
            : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/8"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }}
        />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center shrink-0">
            <Upload className="text-fuchsia-400" size={20} />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-white text-sm font-medium">Importer un CSV</p>
            <p className="text-slate-400 text-xs">Glissez le fichier ou cliquez pour parcourir</p>
            <p className="text-slate-500 text-xs mt-1 truncate">Colonne prenom, nom ou name</p>
          </div>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); downloadSampleCsv(); }}
        className="flex items-center gap-2 text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        type="button"
      >
        <Download size={14} />
        Télécharger un exemple CSV
      </button>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {preview.length > 0 && !error && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <FileText size={16} />
            {preview.length} participant(s) détecté(s)
          </div>
          <div className="mt-2 max-h-24 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1">
            {preview.slice(0, 20).map((name, i) => (
              <div key={i} className="text-slate-300 text-xs px-2 py-1 rounded bg-white/5 truncate">
                {name}
              </div>
            ))}
            {preview.length > 20 && (
              <div className="text-slate-500 text-xs px-2 py-1">+{preview.length - 20} autres</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
