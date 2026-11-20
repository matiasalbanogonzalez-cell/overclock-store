import Image from "next/image";
import { ProductArt } from "./ProductArt";

export function ProductImage({
  image,
  seed,
  category,
  alt,
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority,
}: {
  image: string | null;
  seed: string;
  category: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (image) {
    return <Image src={image} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />;
  }
  return <ProductArt seed={seed} category={category} label={alt} />;
}
