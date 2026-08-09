import { Response } from "express";
import { AuthedRequest } from "../middleware/requireAuth";
import {
  createDocumentSchema,
  updateDocumentMetaSchema,
  lineItemInputSchema,
} from "../validation/document.schema";
import * as documentService from "../services/document.service";
import { asyncHandler } from "../utils/asyncHandler";

export const create = asyncHandler(
  async (req: AuthedRequest, res: Response) => {
    const input = createDocumentSchema.parse(req.body);
    const doc = await documentService.createDocument(req.userId!, input);
    res.status(201).json(doc);
  },
);

export const list = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const docs = await documentService.listDocuments(req.userId!);
  res.json(docs);
});

export const getOne = asyncHandler(
  async (req: AuthedRequest, res: Response) => {
    const doc = await documentService.getDocument(
      req.userId!,
      req.params.id as string,
    );
    res.json(doc);
  },
);

export const updateMeta = asyncHandler(
  async (req: AuthedRequest, res: Response) => {
    const updates = updateDocumentMetaSchema.parse(req.body);
    const doc = await documentService.updateDocumentMeta(
      req.userId!,
      req.params.id as string,
      updates,
    );
    res.json(doc);
  },
);

export const remove = asyncHandler(
  async (req: AuthedRequest, res: Response) => {
    await documentService.deleteDocument(req.userId!, req.params.id as string);
    res.status(204).send();
  },
);

export const addLineItem = asyncHandler(
  async (req: AuthedRequest, res: Response) => {
    const input = lineItemInputSchema.parse(req.body);
    const doc = await documentService.addLineItem(
      req.userId!,
      req.params.id as string,
      input,
    );
    res.status(201).json(doc);
  },
);

export const updateLineItem = asyncHandler(
  async (req: AuthedRequest, res: Response) => {
    const input = lineItemInputSchema.parse(req.body);
    const doc = await documentService.updateLineItem(
      req.userId!,
      req.params.id as string,
      req.params.lineItemId as string,
      input,
    );
    res.json(doc);
  },
);

export const removeLineItem = asyncHandler(
  async (req: AuthedRequest, res: Response) => {
    const doc = await documentService.deleteLineItem(
      req.userId!,
      req.params.id as string,
      req.params.lineItemId as string,
    );
    res.json(doc);
  },
);

export const finalize = asyncHandler(
  async (req: AuthedRequest, res: Response) => {
    const doc = await documentService.finalizeDocument(
      req.userId!,
      req.params.id as string,
    );
    res.json(doc);
  },
);
