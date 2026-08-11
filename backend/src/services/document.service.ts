import { z } from "zod";
import { PricingDocument, IPricingDocument } from "../models/Document.model";
import { calcLine, calcDocumentTotals } from "../calc/calc";
import {
  lineItemInputSchema,
  updateDocumentMetaSchema,
} from "../validation/document.schema";
import {
  DocumentNotFoundError,
  DocumentNotEditableError,
  LineItemNotFoundError,
  DocumentAlreadyFinalizedError,
  EmptyDocumentError,
} from "../errors";

/**
 * All document + line-item business logic: ownership checks, the
 * draft-only edit guard, and persisting calc/calc.ts's results onto
 * models/Document.model.ts. Called from controllers/document.controller.ts,
 * routed from routes/document.routes.ts (mounted at /documents in index.ts).
 * Every mutation below ends in recalcTotals()+save() — that's what lets
 * services/report.service.ts trust doc.totals without ever recomputing it.
 */

type LineItemInput = z.infer<typeof lineItemInputSchema>;

/**
 * 404 whether the document is missing or just belongs to someone else —
 * same response either way, so a document ID can't be used to probe
 * whether it exists for another user.
 */
async function getOwnedDocument(documentId: string, userId: string) {
  const doc = await PricingDocument.findOne({ _id: documentId, owner: userId });
  if (!doc) throw new DocumentNotFoundError();
  return doc;
}

/** The one guard every mutating function below calls first. */
function assertEditable(doc: IPricingDocument) {
  if (doc.status === "finalized") throw new DocumentNotEditableError();
}

/**
 * Runs the raw input through calc/calc.ts and merges the result back in —
 * this is the only place a line item's persisted numbers get produced.
 */
function buildLineItem(input: LineItemInput) {
  return { ...input, ...calcLine(input) };
}

function recalcTotals(doc: IPricingDocument) {
  doc.totals = calcDocumentTotals(doc.lineItems);
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strips a trailing " <number>" so duplicating an already-numbered
 * duplicate ("Sugar 1") continues the same sequence ("Sugar 2") instead
 * of stacking a second number onto it ("Sugar 1 1").
 */
function baseTitleOf(title: string): string {
  return title.replace(/\s+\d+$/, "");
}

/**
 * Looks at every document this user owns titled exactly `base` or
 * `base <number>`, and returns one higher than the largest number found
 * (1 if there are none yet). This is what keeps repeated duplication
 * numbered — "Sugar" -> "Sugar 1" -> "Sugar 2" -> ... — instead of
 * stacking a fixed suffix every time ("Sugar (Copy) (Copy) (Copy)").
 */
async function nextDuplicateNumber(
  userId: string,
  base: string,
): Promise<number> {
  const pattern = new RegExp(`^${escapeRegExp(base)}(?: (\\d+))?$`);
  const docs = await PricingDocument.find(
    { owner: userId, title: pattern },
    { title: 1 },
  );
  let max = 0;
  for (const doc of docs) {
    const match = doc.title.match(pattern);
    const num = match?.[1] ? parseInt(match[1], 10) : 0;
    if (num > max) max = num;
  }
  return max + 1;
}

export async function createDocument(
  userId: string,
  input: {
    title: string;
    customer: string;
    issueDate: Date;
    lineItems: LineItemInput[];
  },
) {
  const lineItems = input.lineItems.map(buildLineItem);
  return PricingDocument.create({
    owner: userId,
    title: input.title,
    customer: input.customer,
    issueDate: input.issueDate,
    lineItems,
    totals: calcDocumentTotals(lineItems),
  });
}

/**
 * Copies a document's input fields into a brand-new draft via
 * createDocument() itself, rather than duplicating its persistence logic
 * here — only the raw inputs are copied (description/quantity/
 * unitPriceCents/discount/taxPercent per line), never the computed cents
 * fields, since createDocument already recomputes those through calc/calc.ts.
 * Works on a document of any status, not just finalized ones — there's no
 * real reason to forbid duplicating a draft too, it's the same operation.
 * issueDate resets to now rather than copying the original's, since the
 * duplicate is a new document being created today, not a historical
 * record. Title gets a numbered suffix ("Sugar" -> "Sugar 1" -> "Sugar 2")
 * rather than a fixed "(Copy)" tag, so repeatedly duplicating the same
 * document (or one of its duplicates) never compounds into something like
 * "Sugar (Copy) (Copy) (Copy)" — see baseTitleOf/nextDuplicateNumber above.
 */
export async function duplicateDocument(userId: string, documentId: string) {
  const original = await getOwnedDocument(documentId, userId);
  const base = baseTitleOf(original.title);
  const nextNumber = await nextDuplicateNumber(userId, base);
  return createDocument(userId, {
    title: `${base} ${nextNumber}`,
    customer: original.customer,
    issueDate: new Date(),
    lineItems: original.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      discount: item.discount,
      taxPercent: item.taxPercent,
    })),
  });
}

export function listDocuments(userId: string) {
  return PricingDocument.find({ owner: userId }).sort({ issueDate: -1 });
}

export function getDocument(userId: string, documentId: string) {
  return getOwnedDocument(documentId, userId);
}

export async function updateDocumentMeta(
  userId: string,
  documentId: string,
  updates: z.infer<typeof updateDocumentMetaSchema>,
) {
  const doc = await getOwnedDocument(documentId, userId);
  assertEditable(doc);
  Object.assign(doc, updates);
  await doc.save();
  return doc;
}

export async function deleteDocument(userId: string, documentId: string) {
  const doc = await getOwnedDocument(documentId, userId);
  assertEditable(doc);
  await doc.deleteOne();
}

export async function addLineItem(
  userId: string,
  documentId: string,
  input: LineItemInput,
) {
  const doc = await getOwnedDocument(documentId, userId);
  assertEditable(doc);
  doc.lineItems.push(buildLineItem(input));
  recalcTotals(doc);
  await doc.save();
  return doc;
}

export async function updateLineItem(
  userId: string,
  documentId: string,
  lineItemId: string,
  input: LineItemInput,
) {
  const doc = await getOwnedDocument(documentId, userId);
  assertEditable(doc);
  const item = doc.lineItems.id(lineItemId);
  if (!item) throw new LineItemNotFoundError();
  Object.assign(item, buildLineItem(input));
  recalcTotals(doc);
  await doc.save();
  return doc;
}

export async function deleteLineItem(
  userId: string,
  documentId: string,
  lineItemId: string,
) {
  const doc = await getOwnedDocument(documentId, userId);
  assertEditable(doc);
  const item = doc.lineItems.id(lineItemId);
  if (!item) throw new LineItemNotFoundError();
  item.deleteOne();
  recalcTotals(doc);
  await doc.save();
  return doc;
}

/**
 * No recompute here on purpose — every path above already keeps
 * doc.totals correct, so finalize just flips status and stamps a time.
 */
export async function finalizeDocument(userId: string, documentId: string) {
  const doc = await getOwnedDocument(documentId, userId);
  if (doc.status === "finalized") throw new DocumentAlreadyFinalizedError();
  if (doc.lineItems.length === 0) throw new EmptyDocumentError();

  doc.status = "finalized";
  doc.finalizedAt = new Date();
  await doc.save();
  return doc;
}
