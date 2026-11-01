import { createWorker } from "tesseract.js";
import workerUrl from "tesseract.js/dist/worker.min.js?url";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export async function recognizeDocument(blob: Blob, onProgress: (progress: number) => void) {
  const worker = await createWorker("spa+eng", 1, {
    workerPath: workerUrl,
    workerBlobURL: false,
    logger: m => { if (m.status === "recognizing text") onProgress(m.progress); },
  });
  try {
    if (blob.type !== "application/pdf") return (await worker.recognize(blob)).data.text;
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
    try {
      const chunks: string[] = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const content = await page.getTextContent();
        const text = content.items.map(item => "str" in item ? item.str : "").join(" ");
        if (text.trim()) chunks.push(text);
        else {
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width; canvas.height = viewport.height;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("No se pudo leer el PDF.");
          await page.render({ canvasContext: context, canvas, viewport }).promise;
          chunks.push((await worker.recognize(canvas)).data.text);
          canvas.width = 0; canvas.height = 0;
        }
        page.cleanup();
        onProgress(n / pdf.numPages);
      }
      return chunks.join("\n\n");
    } finally { await pdf.destroy(); }
  } finally { await worker.terminate(); }
}