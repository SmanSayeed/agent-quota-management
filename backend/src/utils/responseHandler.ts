import { Response } from 'express';

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T = any> extends SuccessResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

/**
 * Send a standardized success response
 */
export const sendSuccess = <T = any>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
};

/**
 * Send a standardized paginated success response
 */
export const sendPaginatedSuccess = <T = any>(
  res: Response,
  data: T,
  total: number,
  page: number,
  limit: number,
  message?: string,
  statusCode: number = 200
): void => {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
};

/**
 * Send a standardized error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string
): void => {
  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
    },
  };

  res.status(statusCode).json(response);
};
