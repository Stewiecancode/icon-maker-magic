import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Download, Image as ImageIcon, X } from "lucide-react";

const ALL_SIZES = [16, 32, 48, 64, 128, 256];
const DEFAULT_SIZES = [16, 32, 48, 64, 128, 256];

async function buildIco(image: HTMLImageElement, sizes: number[]): Promise<Blob> {
  // Render each size to a PNG blob
  const pngs: Uint8Array[] = [];
  for (const size of sizes) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(image, 0, 0, size, size);
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), "image/png")
    );
    pngs.push(new Uint8Array(await blob.arrayBuffer()));
  }

  // ICONDIR (6) + ICONDIRENTRY (16) per image
  const headerSize = 6 + 16 * sizes.length;
  let totalSize = headerSize;
  for (const p of pngs) totalSize += p.length;

  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer);
  // ICONDIR
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type = icon
  view.setUint16(4, sizes.length, true); // count

  let offset = headerSize;
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const png = pngs[i];
    const entry = 6 + i * 16;
    out[entry + 0] = size >= 256 ? 0 : size; // width
    out[entry + 1] = size >= 256 ? 0 : size; // height
    out[entry + 2] = 0; // palette
    out[entry + 3] = 0; // reserved
    view.setUint16(entry + 4, 1, true); // color planes
    view.setUint16(entry + 6, 32, true); // bpp
    view.setUint32(entry + 8, png.length, true); // size of image
    view.setUint32(entry + 12, offset, true); // offset
    out.set(png, offset);
    offset += png.length;
  }

  return new Blob([out], { type: "image/x-icon" });
}

const IcoConverter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<number[]>(DEFAULT_SIZES);
  const [icoUrl, setIcoUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (icoUrl) URL.revokeObjectURL(icoUrl);
    setIcoUrl(null);
  };

  const handleFile = useCallback((f: File | undefined | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (icoUrl) URL.revokeObjectURL(icoUrl);
    setIcoUrl(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }, [icoUrl, previewUrl]);

  const toggleSize = (size: number) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size].sort((a, b) => a - b)
    );
  };

  const convert = async () => {
    if (!file || !previewUrl) return;
    if (selectedSizes.length === 0) {
      toast.error("Pick at least one size");
      return;
    }
    setIsConverting(true);
    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("Failed to load image"));
      });
      const blob = await buildIco(img, selectedSizes);
      if (icoUrl) URL.revokeObjectURL(icoUrl);
      setIcoUrl(URL.createObjectURL(blob));
      toast.success("ICO ready to download");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setIsConverting(false);
    }
  };

  const downloadName = file ? file.name.replace(/\.[^.]+$/, "") + ".ico" : "favicon.ico";

  return (
    <Card className="mx-auto max-w-2xl p-6 md:p-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
          dragActive ? "border-primary bg-accent" : "border-border hover:bg-accent/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {previewUrl ? (
          <div className="flex flex-col items-center gap-3">
            <img src={previewUrl} alt="Preview" className="max-h-40 rounded-md object-contain" />
            <p className="text-sm text-muted-foreground truncate max-w-xs">{file?.name}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
            >
              <X className="mr-1 h-4 w-4" /> Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-10 w-10" />
            <p className="font-medium text-foreground">Click or drag an image here</p>
            <p className="text-sm">PNG, JPG, WEBP, GIF, SVG</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Label className="mb-3 block text-sm font-medium">Sizes to include</Label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ALL_SIZES.map((size) => (
            <label
              key={size}
              className="flex items-center gap-2 rounded-md border border-border p-2 cursor-pointer hover:bg-accent"
            >
              <Checkbox
                checked={selectedSizes.includes(size)}
                onCheckedChange={() => toggleSize(size)}
              />
              <span className="text-sm">{size}px</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button onClick={convert} disabled={!file || isConverting} className="flex-1">
          <ImageIcon className="mr-2 h-4 w-4" />
          {isConverting ? "Converting..." : "Convert to ICO"}
        </Button>
        {icoUrl && (
          <Button asChild variant="secondary" className="flex-1">
            <a href={icoUrl} download={downloadName}>
              <Download className="mr-2 h-4 w-4" /> Download {downloadName}
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
};

export default IcoConverter;