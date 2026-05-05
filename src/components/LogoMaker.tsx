import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { toast } from "sonner";

const FONTS = [
  "Inter, sans-serif",
  "Georgia, serif",
  "'Courier New', monospace",
  "'Brush Script MT', cursive",
  "Impact, sans-serif",
  "'Trebuchet MS', sans-serif",
];

const GRADIENTS = [
  { name: "Sunset", from: "#ff6a00", to: "#ee0979" },
  { name: "Ocean", from: "#2193b0", to: "#6dd5ed" },
  { name: "Forest", from: "#11998e", to: "#38ef7d" },
  { name: "Royal", from: "#3a1c71", to: "#d76d77" },
  { name: "Mono", from: "#111827", to: "#374151" },
  { name: "Gold", from: "#f7971e", to: "#ffd200" },
];

const SHAPES = ["circle", "square", "rounded", "none"] as const;
type Shape = typeof SHAPES[number];

const LogoMaker = () => {
  const [text, setText] = useState("Lovable");
  const [initials, setInitials] = useState("LV");
  const [font, setFont] = useState(FONTS[0]);
  const [size, setSize] = useState(80);
  const [shape, setShape] = useState<Shape>("circle");
  const [gradIdx, setGradIdx] = useState(0);
  const [textColor, setTextColor] = useState("#ffffff");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const grad = GRADIENTS[gradIdx];
  const dim = 512;

  const draw = useMemo(() => () => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = dim; c.height = dim;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, dim, dim);

    // background shape
    const g = ctx.createLinearGradient(0, 0, dim, dim);
    g.addColorStop(0, grad.from);
    g.addColorStop(1, grad.to);
    ctx.fillStyle = g;
    if (shape === "circle") {
      ctx.beginPath(); ctx.arc(dim / 2, dim / 2, dim / 2, 0, Math.PI * 2); ctx.fill();
    } else if (shape === "square") {
      ctx.fillRect(0, 0, dim, dim);
    } else if (shape === "rounded") {
      const r = 80;
      ctx.beginPath();
      ctx.moveTo(r, 0); ctx.lineTo(dim - r, 0); ctx.quadraticCurveTo(dim, 0, dim, r);
      ctx.lineTo(dim, dim - r); ctx.quadraticCurveTo(dim, dim, dim - r, dim);
      ctx.lineTo(r, dim); ctx.quadraticCurveTo(0, dim, 0, dim - r);
      ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath(); ctx.fill();
    }

    ctx.fillStyle = textColor;
    ctx.font = `bold ${size * 4}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = initials.trim() || text.trim().slice(0, 2).toUpperCase();
    ctx.fillText(label, dim / 2, dim / 2 + 10);
  }, [font, size, shape, grad, textColor, initials, text]);

  useEffect(() => { draw(); }, [draw]);

  const download = (format: "png" | "jpeg") => {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob((b) => {
      if (!b) { toast.error("Export failed"); return; }
      const url = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = url; a.download = `logo.${format === "jpeg" ? "jpg" : "png"}`;
      a.click();
      URL.revokeObjectURL(url);
    }, format === "png" ? "image/png" : "image/jpeg", 0.95);
  };

  return (
    <Card className="p-6 md:p-8 grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <Label className="mb-2 block text-sm">Brand name</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Mark / initials</Label>
          <Input value={initials} onChange={(e) => setInitials(e.target.value)} maxLength={3} />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Font</Label>
          <Select value={font} onValueChange={setFont}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f.split(",")[0].replace(/'/g, "")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block text-sm">Shape</Label>
          <Select value={shape} onValueChange={(v) => setShape(v as Shape)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SHAPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block text-sm">Gradient</Label>
          <div className="grid grid-cols-3 gap-2">
            {GRADIENTS.map((g, i) => (
              <button
                key={g.name}
                onClick={() => setGradIdx(i)}
                className={`h-10 rounded-md border-2 ${i === gradIdx ? "border-primary" : "border-transparent"}`}
                style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                title={g.name}
                aria-label={g.name}
              />
            ))}
          </div>
        </div>
        <div>
          <Label className="mb-2 block text-sm">Text color</Label>
          <Input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-10 w-20 p-1" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Text size: {size}</Label>
          <Slider value={[size]} onValueChange={(v) => setSize(v[0])} min={20} max={140} step={1} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="rounded-lg border p-4 bg-[conic-gradient(at_top_left,_hsl(var(--muted)),_hsl(var(--background)),_hsl(var(--muted)))]">
          <canvas ref={canvasRef} className="max-w-full h-auto rounded-md" style={{ width: 320, height: 320 }} />
        </div>
        <div className="flex gap-2 w-full">
          <Button className="flex-1" onClick={() => download("png")}><Download className="mr-2 h-4 w-4" />PNG</Button>
          <Button variant="secondary" className="flex-1" onClick={() => download("jpeg")}><Download className="mr-2 h-4 w-4" />JPG</Button>
        </div>
      </div>
    </Card>
  );
};

export default LogoMaker;