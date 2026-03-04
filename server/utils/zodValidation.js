import { isIP } from 'node:net';
import { z } from 'zod';
import AppError from './AppError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasValue(value) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  return true;
}

function toNumber(value) {
  return typeof value === 'number' ? value : Number(value);
}

function isIntegerLike(value) {
  if (typeof value === 'number') {
    return Number.isInteger(value);
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number.isInteger(Number(value));
  }

  return false;
}

function getFirstIssueMessage(error) {
  return error?.issues?.[0]?.message || 'Datos inválidos';
}

export const zRequiredField = (message) =>
  z.any().refine((value) => hasValue(value), { message });

export const zRequiredString = (message) =>
  z.any().refine(
    (value) => typeof value === 'string' && value.trim().length > 0,
    { message }
  );

export const zOptionalString = (message) =>
  z.any().optional().refine(
    (value) => value === undefined || typeof value === 'string',
    { message }
  );

export const zOptionalNullableString = (message) =>
  z.any().optional().refine(
    (value) => value === undefined || value === null || typeof value === 'string',
    { message }
  );

export const zOptionalNonEmptyField = (message) =>
  z.any().optional().refine(
    (value) => value === undefined || hasValue(value),
    { message }
  );

export const zRequiredInt = (message, { min, max } = {}) =>
  z.any().refine((value) => {
    if (!hasValue(value) || !isIntegerLike(value)) {
      return false;
    }

    const parsed = toNumber(value);

    if (min !== undefined && parsed < min) {
      return false;
    }

    if (max !== undefined && parsed > max) {
      return false;
    }

    return true;
  }, { message });

export const zOptionalInt = (
  message,
  { min, max, nullable = false, allowEmptyString = true } = {}
) =>
  z.any().optional().refine((value) => {
    if (value === undefined) {
      return true;
    }

    if (nullable && value === null) {
      return true;
    }

    if (allowEmptyString && value === '') {
      return true;
    }

    if (!isIntegerLike(value)) {
      return false;
    }

    const parsed = toNumber(value);

    if (min !== undefined && parsed < min) {
      return false;
    }

    if (max !== undefined && parsed > max) {
      return false;
    }

    return true;
  }, { message });

export const zRequiredEnum = (values, requiredMessage, invalidMessage) =>
  z.any()
    .refine((value) => hasValue(value), { message: requiredMessage })
    .refine((value) => values.includes(value), {
      message: invalidMessage || requiredMessage
    });

export const zOptionalEnum = (
  values,
  invalidMessage,
  { nullable = false, allowEmptyString = true } = {}
) =>
  z.any().optional().refine((value) => {
    if (value === undefined) {
      return true;
    }

    if (nullable && value === null) {
      return true;
    }

    if (allowEmptyString && value === '') {
      return true;
    }

    return values.includes(value);
  }, { message: invalidMessage });

export const zEmail = (message) =>
  z.any().refine(
    (value) => typeof value === 'string' && EMAIL_REGEX.test(value.trim()),
    { message }
  );

export const zOptionalIP = (
  message,
  { nullable = false, allowEmptyString = true } = {}
) =>
  z.any().optional().refine((value) => {
    if (value === undefined) {
      return true;
    }

    if (nullable && value === null) {
      return true;
    }

    if (allowEmptyString && value === '') {
      return true;
    }

    if (typeof value !== 'string') {
      return false;
    }

    return isIP(value.trim()) !== 0;
  }, { message });

export const zOptionalDate = (
  message,
  { nullable = false, allowEmptyString = true } = {}
) =>
  z.any().optional().refine((value) => {
    if (value === undefined) {
      return true;
    }

    if (nullable && value === null) {
      return true;
    }

    if (allowEmptyString && value === '') {
      return true;
    }

    if (value instanceof Date) {
      return !Number.isNaN(value.getTime());
    }

    if (typeof value !== 'string') {
      return false;
    }

    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
  }, { message });

export const parseWithZod = (schema, value) => {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new AppError(
      getFirstIssueMessage(result.error),
      400,
      'VALIDATION_ERROR',
      result.error.issues
    );
  }

  return result.data;
};

export const validateZod = ({ params, query, body, assignParsed = false } = {}) =>
  (req, _res, next) => {
    try {
      const parsed = {};

      if (params) {
        parsed.params = parseWithZod(params, req.params || {});
      }

      if (query) {
        parsed.query = parseWithZod(query, req.query || {});
      }

      if (body) {
        parsed.body = parseWithZod(body, req.body || {});
      }

      if (assignParsed) {
        if (parsed.params) req.params = parsed.params;
        if (parsed.query) req.query = parsed.query;
        if (parsed.body) req.body = parsed.body;
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };

export { z };
