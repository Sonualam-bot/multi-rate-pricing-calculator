/**
 * Domain errors, one per case that needs a specific HTTP status.
 * Thrown from services/*.ts, caught in exactly one place —
 * middleware/errorHandler.ts — so nothing in services/ or controllers/
 * ever touches res.status() directly.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class EmailAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(`An account with email "${email}" already exists`, 409);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Invalid email or password", 401);
  }
}

export class DocumentNotFoundError extends AppError {
  constructor() {
    super("Document not found", 404);
  }
}

export class DocumentNotEditableError extends AppError {
  constructor() {
    super("Cannot modify a finalized document", 409);
  }
}

export class LineItemNotFoundError extends AppError {
  constructor() {
    super("Line item not found", 404);
  }
}

export class DocumentAlreadyFinalizedError extends AppError {
  constructor() {
    super("Document is already finalized", 409);
  }
}

export class EmptyDocumentError extends AppError {
  constructor() {
    super("Cannot finalize a document with no line items", 400);
  }
}
