/**
 * Standardized API response helper functions
 * All endpoints should use these for consistency
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  statusCode: number;
}

export function success<T>(
  data: T,
  message = 'Success',
  statusCode = 200
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    statusCode,
  };
}

export function error(
  message = 'An error occurred',
  statusCode = 400,
  data?: any
): ApiResponse {
  return {
    success: false,
    message,
    statusCode,
    data,
  };
}

export function created<T>(
  data: T,
  message = 'Resource created successfully'
): ApiResponse<T> {
  return success(data, message, 201);
}
