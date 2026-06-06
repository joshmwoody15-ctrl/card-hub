import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { Camera, Upload, X } from "lucide-react";

type Props = {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
};

export function ScanCapture({ label, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handle(file: File | null) {
    onChange(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="aspect-[3/4] overflow-hidden rounded-lg border border-dashed border-border bg-card">
        {preview ? (
          <div className="relative h-full w-full">
            <img src={preview} alt="" className="h-full w-full object-contain" />
            <button
              type="button"
              onClick={() => handle(null)}
              className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-foreground shadow"
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-sm text-muted-foreground">
            <Camera className="h-8 w-8 opacity-50" />
            <p>No image yet</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0] ?? null)}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0] ?? null)}
        />
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" /> Upload
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => cameraRef.current?.click()}>
          <Camera className="mr-2 h-4 w-4" /> Camera
        </Button>
      </div>
      {value && (
        <p className="text-xs text-muted-foreground tabular">
          {value.name} · {(value.size / 1024).toFixed(0)} KB
        </p>
      )}
    </div>
  );
}
