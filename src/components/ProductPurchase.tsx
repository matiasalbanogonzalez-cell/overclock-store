"use client";

import { useState } from "react";
import { STORE } from "@/lib/config";
import type { CartItem } from "@/store/cart";
import { AddToCartButton } from "./AddToCartButton";
import { QuantityInput } from "./QuantityInput";

export function ProductPurchase({ product }: { product: Omit<CartItem, "quantity"> }) {
  const [qty, setQty] = useState(1);
  const max = Math.min(product.stock, STORE.maxQuantityPerItem);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {product.stock > 0 && <QuantityInput value={qty} max={max} onChange={setQty} />}
      <AddToCartButton product={product} quantity={qty} />
    </div>
  );
}
