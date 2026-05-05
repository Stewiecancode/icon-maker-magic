import { useCallback, useRef, useState } from "react";
import { removeBackground } from "@imgly/background-removal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Download, X, Sparkles } from "lucide-react";

const BackgroundRemover = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (outUrl) URL.revokeObjectURL(outUrl);
    setOutUrl(null);
  };

  const handleFile = useCallback((f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Please choose an image"); return; }
    if (outUrl) URL.revokeObjectURL(outUrl);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setOutUrl(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }, [outUrl, previewUrl]);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    const tid = toast.loading("Removing background... (first run downloads model)");
    try {
      const blob = await removeBackground(file);
      if (outUrl) URL.revokeObjectURL(outUrl);
      setOutUrl(URL.createObjectURL(blob));
      toast.success("Background removed", { id: tid });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed", { id: tid });
    } finally {
      setBusy(false);
    }
  };

  const downloadName = file ? file.name.replace(/\.[^.]+$/, "") + "-no-bg.png" : "no-bg.png";

  return (
    <Card className="p-6 md:p-8">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${drag ? "border-primary bg-accent" : "border-border hover:bg-accent/50"}`}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        {previewUrl ? (
          <div className="flex flex-col items-center gap-3">
            <img src={previewUrl} alt="Preview" className="max-h-40 rounded-md object-contain" />
            <p className="text-sm text-muted-foreground truncate max-w-xs">{file?.name}</p>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); reset(); }}><X className="mr-1 h-4 w-4" />Remove</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-10 w-10" />
            <p className="font-medium text-foreground">Click or drag an image</p>
            <p className="text-sm">Runs locally in your browser</p>
          </div>
        )}
      </div>

      {outUrl && (
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-2">Result:</p>
          <div className="rounded-md border p-4 flex items-center justify-center bg-[conic-gradient(at_top_left,_hsl(var(--muted)),_hsl(var(--background)),_hsl(var(--muted)))]">
            <img src={outUrl} alt="No background" className="max-h-64 object-contain" />
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button onClick={run} disabled={!file || busy} className="flex-1">
          <Sparkles className="mr-2 h-4 w-4" />
          {busy ? "Working..." : "Remove background"}
        </Button>
        {outUrl && (
          <Button asChild variant="secondary" className="flex-1">
            <a href={outUrl} download={downloadName}><Download className="mr-2 h-4 w-4" />Download PNG</a>
          </Button>
        )}
      </div>
    </Card>
  );
};

export default BackgroundRemover;