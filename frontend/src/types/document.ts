export type DiscountType = "fixed" | "percent";

export interface Discount {
  type: DiscountType;
  value: number;
}

export interface LineItemInput {
  description: string;
  quantity: number;
  unitPriceCents: number;
  discount: Discount | null;
  taxPercent: number;
}

export interface LineItem extends LineItemInput {
  id: string;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  lineTotalCents: number;
}

export interface Totals {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  grandTotalCents: number;
}

export type DocumentStatus = "draft" | "finalized";

export interface PricingDocument {
  id: string;
  owner: string;
  title: string;
  customer: string;
  issueDate: string;
  status: DocumentStatus;
  lineItems: LineItem[];
  totals: Totals;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  title: string;
  customer: string;
  issueDate: string;
  lineItems: LineItemInput[];
}

export type UpdateDocumentMetaInput = Partial<
  Pick<CreateDocumentInput, "title" | "customer" | "issueDate">
>;
