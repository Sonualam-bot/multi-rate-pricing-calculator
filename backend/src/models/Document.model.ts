import mongoose, {
  Schema,
  Document as MongooseDocument,
  Types,
} from "mongoose";

/**
 * The pricing document — metadata, embedded line items, and a persisted
 * totals summary. All writes go through services/document.service.ts,
 * which is the only thing that calls calc/calc.ts and saves the result
 * here; nothing recomputes totals on read. services/report.service.ts
 * aggregates the `totals` field directly for that reason.
 * Shapes below deliberately mirror calc/calc.ts's types.
 */
export interface IDiscount {
  type: "fixed" | "percent";
  value: number;
}

export interface ILineItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
  discount: IDiscount | null;
  taxPercent: number;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  lineTotalCents: number;
}

export interface ITotals {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  grandTotalCents: number;
}

export interface IPricingDocument extends MongooseDocument {
  owner: Types.ObjectId;
  title: string;
  customer: string;
  issueDate: Date;
  status: "draft" | "finalized";
  /** DocumentArray, not a plain array — that's what gives us .id() in document.service.ts */
  lineItems: Types.DocumentArray<ILineItem>;
  totals: ITotals;
  finalizedAt: Date | null;
}

const discountSchema = new Schema<IDiscount>(
  {
    type: {
      type: String,
      enum: ["fixed", "percent"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const lineItemSchema = new Schema<ILineItem>({
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPriceCents: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: discountSchema,
    default: null,
  },
  taxPercent: {
    type: Number,
    default: 0,
  },
  subtotalCents: {
    type: Number,
    required: true,
  },
  discountCents: {
    type: Number,
    required: true,
  },
  taxCents: {
    type: Number,
    required: true,
  },
  lineTotalCents: {
    type: Number,
    required: true,
  },
});

const totalsSchema = new Schema<ITotals>(
  {
    subtotalCents: {
      type: Number,
      required: true,
      default: 0,
    },
    discountCents: {
      type: Number,
      required: true,
      default: 0,
    },
    taxCents: {
      type: Number,
      required: true,
      default: 0,
    },
    grandTotalCents: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false },
);

const documentSchema = new Schema<IPricingDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    customer: {
      type: String,
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "finalized"],
      default: "draft",
    },
    lineItems: {
      type: [lineItemSchema],
      default: [],
    },
    totals: {
      type: totalsSchema,
      default: () => ({}),
    },
    finalizedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

documentSchema.index({ owner: 1, issueDate: 1 });

export const PricingDocument = mongoose.model<IPricingDocument>(
  "Document",
  documentSchema,
);
