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
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200 text-center
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
        <Upload className="mx-auto mb-3 text-fuchsia-400" size={32} />
        <p className="text-white font-medium mb-1">Glissez votre fichier CSV ici</p>
        <p className="text-slate-400 text-sm">ou cliquez pour parcourir</p>
        <p className="text-slate-500 text-xs mt-2">Format : une colonne "prenom" (ou nom/name), une ligne par participant</p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); downloadSampleCsv(); }}
        className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
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
          <div className="flex items-center gap-2 mb-2 text-emerald-400 text-sm font-medium">
            <FileText size={16} />
            {preview.length} participant(s) détecté(s)
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {preview.slice(0, 20).map((name, i) => (
              <div key={i} className="text-slate-300 text-xs px-2 py-0.5 rounded bg-white/5">
                {name}
              </div>
            ))}
            {preview.length > 20 && (
              <div className="text-slate-500 text-xs px-2">... et {preview.length - 20} autres</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
