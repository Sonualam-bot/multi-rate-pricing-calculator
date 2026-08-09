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

type LineItemInput = z.infer<typeof lineItemInputSchema>;

async function getOwnedDocument(documentId: string, userId: string) {
  const doc = await PricingDocument.findOne({ _id: documentId, owner: userId });
  if (!doc) throw new DocumentNotFoundError();
  return doc;
}

function assertEditable(doc: IPricingDocument) {
  if (doc.status === "finalized") throw new DocumentNotEditableError();
}

function buildLineItem(input: LineItemInput) {
  return { ...input, ...calcLine(input) };
}

function recalcTotals(doc: IPricingDocument) {
  doc.totals = calcDocumentTotals(doc.lineItems);
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

export async function finalizeDocument(userId: string, documentId: string) {
  const doc = await getOwnedDocument(documentId, userId);
  if (doc.status === "finalized") throw new DocumentAlreadyFinalizedError();
  if (doc.lineItems.length === 0) throw new EmptyDocumentError();

  doc.status = "finalized";
  doc.finalizedAt = new Date();
  await doc.save();
  return doc;
}
