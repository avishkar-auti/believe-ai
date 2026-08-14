import { ERROR_CODES, type ErrorCode } from "@believe-ai/shared";

/**
 * Base class for all operational errors. The error middleware maps
 * AppError -> { statusCode, code, message } and everything else -> 500
 * INTERNAL_ERROR with no stack trace leaked to the client.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;

  constructor(statusCode: number, code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, ERROR_CODES.NOT_FOUND, message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request") {
    super(400, ERROR_CODES.VALIDATION_ERROR, message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(401, ERROR_CODES.UNAUTHENTICATED, message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Not authorized to access this resource") {
    super(403, ERROR_CODES.UNAUTHORIZED, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(409, ERROR_CODES.CONFLICT, message);
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(message = "Invalid state transition") {
    super(409, ERROR_CODES.INVALID_STATE_TRANSITION, message);
  }
}

export class IntegrationError extends AppError {
  constructor(message = "Integration error") {
    super(502, ERROR_CODES.INTEGRATION_ERROR, message);
  }
}

export class AiProviderError extends AppError {
  constructor(message = "AI provider error") {
    super(502, ERROR_CODES.AI_PROVIDER_ERROR, message);
  }
}

export class EmailProviderError extends AppError {
  constructor(message = "Email provider error") {
    super(502, ERROR_CODES.EMAIL_PROVIDER_ERROR, message);
  }
}

/** 402 Payment Required — the action is valid but exceeds the account's plan allowance. */
export class PlanLimitExceededError extends AppError {
  constructor(message = "Plan limit reached") {
    super(402, ERROR_CODES.PLAN_LIMIT_EXCEEDED, message);
  }
}
