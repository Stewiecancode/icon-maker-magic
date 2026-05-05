import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Upload, Download, X, Image as ImageIcon } from "lucide-react";

type Format = "png" | "jpeg" | "webp" | "bmp" | "gif" | "ico";
const FORMATS: { value: Format; label: string; mime: string; ext: string }[] = [
  { value: "png", label: "PNG", mime: "image/png", ext: "png" },
  { value: "jpeg", label: "JPG", mime: "image/jpeg", ext: "jpg" },
  { value: "webp", label: "WEBP", mime: "image/webp", ext: "webp" },
  { value: "bmp", label: "BMP", mime: "image/bmp", ext: "bmp" },
  { value: "gif", label: "GIF", mime: "image/gif", ext: "gif" },
  { value: "ico", label: "ICO", mime: "image/x-icon", ext: "ico" },
];

const ICO_SIZES = [16, 32, 48, 64, 128, 256];

async function buildIco(image: HTMLImageElement): Promise<Blob> {
  const pngs: Uint8Array[] = [];
  for (const size of ICO_SIZES) {
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, size, size);
    const b: Blob = await new Promise((r) => c.toBlob((x) => r(x!), "image/png"));
    pngs.push(new Uint8Array(await b.arrayBuffer()));
  }
  const headerSize = 6 + 16 * ICO_SIZES.length;
  let total = headerSize;
  for (const p of pngs) total += p.length;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, ICO_SIZES.length, true);
  let offset = headerSize;
  for (let i = 0; i < ICO_SIZES.length; i++) {
    const size = ICO_SIZES[i];
    const png = pngs[i];
    const e = 6 + i * 16;
    out[e] = size >= 256 ? 0 : size;
    out[e + 1] = size >= 256 ? 0 : size;
    view.setUint16(e + 4, 1, true);
    view.setUint16(e + 6, 32, true);
    view.setUint32(e + 8, png.length, true);
    view.setUint32(e + 12, offset, true);
    out.set(png, offset);
    offset += png.length;
  }
  return new Blob([out], { type: "image/x-icon" });
}

const FormatConverter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [target, setTarget] = useState<Format>("png");
  const [quality, setQuality] = useState(92);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outName, setOutName] = useState<string>("");
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

  const convert = async () => {
    if (!file || !previewUrl) return;
    setBusy(true);
    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("Load failed")); });
      const fmt = FORMATS.find((f) => f.value === target)!;
      let blob: Blob;
      if (target === "ico") {
        blob = await buildIco(img);
      } else {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        if (target === "jpeg" || target === "bmp") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, c.width, c.height);
        }
        ctx.drawImage(img, 0, 0);
        blob = await new Promise<Blob>((res, rej) => {
          c.toBlob((b) => b ? res(b) : rej(new Error("Encoding failed")), fmt.mime, target === "jpeg" || target === "webp" ? quality / 100 : undefined);
        });
        // Some browsers don't natively encode bmp/gif; fall back to png
        if (blob.type !== fmt.mime && (target === "bmp" || target === "gif")) {
          toast.message(`${fmt.label} not supported by browser, exported as PNG`);
        }
      }
      if (outUrl) URL.revokeObjectURL(outUrl);
      const url = URL.createObjectURL(blob);
      setOutUrl(url);
      const base = file.name.replace(/\.[^.]+$/, "");
      setOutName(`${base}.${fmt.ext}`);
      toast.success("Converted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

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
            <p className="text-sm">PNG, JPG, WEBP, GIF, BMP, SVG</p>
          </div>
        )}
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="mb-2 block text-sm">Output format</Label>
          <Select value={target} onValueChange={(v) => setTarget(v as Format)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FORMATS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {(target === "jpeg" || target === "webp") && (
          <div>
            <Label className="mb-2 block text-sm">Quality: {quality}%</Label>
            <Slider value={[quality]} onValueChange={(v) => setQuality(v[0])} min={10} max={100} step={1} />
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button onClick={convert} disabled={!file || busy} className="flex-1">
          <ImageIcon className="mr-2 h-4 w-4" />
          {busy ? "Converting..." : "Convert"}
        </Button>
        {outUrl && (
          <Button asChild variant="secondary" className="flex-1">
            <a href={outUrl} download={outName}><Download className="mr-2 h-4 w-4" />Download {outName}</a>
          </Button>
        )}
      </div>
    </Card>
  );
};

export default FormatConverter;