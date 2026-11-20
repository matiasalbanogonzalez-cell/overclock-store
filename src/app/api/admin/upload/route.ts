import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/auth";
import { MAX_IMAGES_PER_PRODUCT, saveImage, UploadError } from "@/lib/storage";

/** Subida de fotos de productos desde el panel (solo admins) */
export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const files = (form?.getAll("files") ?? []).filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "No se recibió ninguna imagen" }, { status: 400 });
  if (files.length > MAX_IMAGES_PER_PRODUCT) {
    return NextResponse.json({ error: `Podés subir hasta ${MAX_IMAGES_PER_PRODUCT} fotos a la vez` }, { status: 400 });
  }

  try {
    const urls = [];
    for (const file of files) urls.push(await saveImage(file));
    return NextResponse.json({ urls });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[upload]", err);
    return NextResponse.json({ error: "No se pudo guardar la imagen" }, { status: 500 });
  }
}
