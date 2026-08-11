import { request } from "./client";
import type {
  PricingDocument,
  CreateDocumentInput,
  UpdateDocumentMetaInput,
  LineItemInput,
} from "../types/document";

export function listDocuments() {
  return request<PricingDocument[]>("/documents");
}

export function getDocument(id: string) {
  return request<PricingDocument>(`/documents/${id}`);
}

export function createDocument(input: CreateDocumentInput) {
  return request<PricingDocument>("/documents", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDocumentMeta(
  id: string,
  updates: UpdateDocumentMetaInput,
) {
  return request<PricingDocument>(`/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function deleteDocument(id: string) {
  return request<void>(`/documents/${id}`, { method: "DELETE" });
}

export function addLineItem(documentId: string, input: LineItemInput) {
  return request<PricingDocument>(`/documents/${documentId}/line-items`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateLineItem(
  documentId: string,
  lineItemId: string,
  input: LineItemInput,
) {
  return request<PricingDocument>(
    `/documents/${documentId}/line-items/${lineItemId}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function deleteLineItem(documentId: string, lineItemId: string) {
  return request<PricingDocument>(
    `/documents/${documentId}/line-items/${lineItemId}`,
    { method: "DELETE" },
  );
}

export function finalizeDocument(id: string) {
  return request<PricingDocument>(`/documents/${id}/finalize`, {
    method: "POST",
  });
}

export function duplicateDocument(id: string) {
  return request<PricingDocument>(`/documents/${id}/duplicate`, {
    method: "POST",
  });
}
