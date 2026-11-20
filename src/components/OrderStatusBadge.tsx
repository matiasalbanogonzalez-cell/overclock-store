import type { OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from "@/lib/format";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge ${ORDER_STATUS_STYLE[status]}`}>{ORDER_STATUS_LABEL[status]}</span>;
}
