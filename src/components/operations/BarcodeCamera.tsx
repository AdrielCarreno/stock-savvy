import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createScanGate } from "@/lib/scanRules";

export function BarcodeCamera({ onCode }: { onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<IScannerControls | null>(null);
  const generation = useRef(0);
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [device, setDevice] = useState("");
  const [error, setError] = useState("");
  const accept = useRef(createScanGate());
  const callback = useRef(onCode); callback.current = onCode;

  const stop = () => {
    generation.current++;
    controls.current?.stop(); controls.current = null;
    const stream = video.current?.srcObject;
    if (stream instanceof MediaStream) stream.getTracks().forEach(track => track.stop());
    setRunning(false); setStarting(false);
  };
  useEffect(() => () => { generation.current++; controls.current?.stop(); }, []);
  const start = async (deviceId = device) => {
    stop(); setStarting(true); setError("");
    const request = generation.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("La cámara necesita un navegador compatible y una conexión HTTPS.");
      const hints = new Map<DecodeHintType, unknown>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.QR_CODE]);
      const reader = new BrowserMultiFormatReader(hints);
      const next = await reader.decodeFromConstraints({ audio: false, video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: "environment" } } }, video.current ?? undefined, result => {
        if (generation.current !== request || !result) return;
        const code = result.getText();
        if (accept.current(code)) callback.current(code);
      });
      if (generation.current !== request) { next.stop(); return; }
      controls.current = next; setRunning(true);
      setCameras(await BrowserMultiFormatReader.listVideoInputDevices());
    } catch (err) {
      if (generation.current === request) {
        setError(err instanceof DOMException && err.name === "NotAllowedError" ? "Permiso de cámara denegado. Podés ingresar el código manualmente." : "No se pudo iniciar la cámara. Revisá los permisos o ingresá el código.");
        setRunning(false);
      }
    } finally { if (generation.current === request) setStarting(false); }
  };
  return <div className="space-y-3">
    <div className="flex flex-wrap items-end gap-3">
      <Button onClick={() => running || starting ? stop() : void start()} variant={running ? "outline" : "default"}>
        {running || starting ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
        {starting ? "Cancelar cámara" : running ? "Detener cámara" : "Activar cámara"}
      </Button>
      {cameras.length > 0 && <div className="min-w-0 flex-1"><Label htmlFor="camera">Cámara</Label><select id="camera" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={device} onChange={e => { setDevice(e.target.value); if (running) void start(e.target.value); }}><option value="">Trasera / automática</option>{cameras.map((c, i) => <option key={c.deviceId} value={c.deviceId}>{c.label || `Cámara ${i + 1}`}</option>)}</select></div>}
    </div>
    <div className={`aspect-video overflow-hidden rounded-md border border-border bg-muted ${running || starting ? "" : "hidden"}`}><video ref={video} muted playsInline className="h-full w-full object-cover" /></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}