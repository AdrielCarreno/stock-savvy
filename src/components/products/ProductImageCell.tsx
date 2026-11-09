import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function useProductImageUrl(value: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!value) { setUrl(null); return; }
    if (/^https?:\/\//i.test(value)) { setUrl(value); return; }
    supabase.storage.from(BUCKET).createSignedUrl(value, 3600).then(({ data }) => {
      if (active) setUrl(data?.signedUrl ?? null);
    });
    return () => { active = false; };
  }, [value]);
  return url;
}

type Props = {
  productId: string;
  companyId: string;
  name: string;
  value: string | null | undefined;
  onSaved: (path: string) => Promise<unknown>;
};

export function ProductImageCell({ productId, companyId, name, value, onSaved }: Props) {
  const url = useProductImageUrl(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) { toast.error("Usá una imagen JPG, PNG o WebP"); return; }
    if (file.size > MAX_BYTES) { toast.error("La imagen no puede superar 5 MB"); return; }
    setUploading(true);
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${companyId}/${productId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (error) {
      toast.error("No se pudo subir la imagen");
    } else {
      await onSaved(path);
      if (value && !/^https?:\/\//i.test(value)) {
        await supabase.storage.from(BUCKET).remove([value]);
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        aria-label={url ? `Cambiar imagen de ${name}` : `Agregar imagen a ${name}`}
        title={url ? "Cambiar imagen" : "Agregar imagen"}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : url ? (
          <img src={url} alt={name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </>
  );
}
