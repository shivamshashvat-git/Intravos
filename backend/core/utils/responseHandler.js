/**
 * Standardized API Response Wrapper
 * Industrialized format: { success, data, message }
 */

export const success = (res, data = null, message = 'Success', code = 200) => {
  return res.status(code).json({
    success: true,
    message,
    data
  });
};

export const error = (res, message = 'Internal Server Error', code = 500, details = null) => {
  const response = {
    success: false,
    message,
    data: null
  };

  if (process.env.NODE_ENV !== 'production' && details) {
    response.debug = details;
  }

  return res.status(code).json(response);
};

export const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

export const badRequest = (res, message = 'Bad request') => {
  return error(res, message, 400);
};

export const unauthorized = (res, message = 'Unauthorized access') => {
  return error(res, message, 401);
};

const responseHandler = {
  success,
  error,
  notFound,
  badRequest,
  unauthorized
};

export default responseHandler;
