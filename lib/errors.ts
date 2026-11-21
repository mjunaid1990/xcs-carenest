/** Typed application error used by API route handlers. */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(
    status: number,
    message: string,
    code = "error",
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = "Invalid request", details?: Record<string, unknown>) {
    return new ApiError(400, message, "bad_request", details);
  }
  static unauthorized(message = "You must be signed in.") {
    return new ApiError(401, message, "unauthorized");
  }
  static forbidden(message = "You do not have access to this resource.") {
    return new ApiError(403, message, "forbidden");
  }
  static notFound(message = "Not found") {
    return new ApiError(404, message, "not_found");
  }
  static conflict(message = "That action conflicts with existing data.") {
    return new ApiError(409, message, "conflict");
  }
  static tooMany(message = "Too many requests. Please slow down.") {
    return new ApiError(429, message, "rate_limited");
  }
  static paymentRequired(message = "This action requires a paid plan.") {
    return new ApiError(402, message, "payment_required");
  }
}
