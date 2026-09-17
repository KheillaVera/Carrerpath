import { safeUrl } from './url';

/**
 * Validation rules shared by every form, matching what the API enforces.
 *
 * The server is the authority — these exist so a person sees the problem while
 * they are still typing, instead of getting a rejected save back.
 */

export const urlRule = {
  validate: (value) =>
    !value || value.trim() === '' || safeUrl(value) !== null
      ? true
      : 'Enter a full link starting with http:// or https://',
  maxLength: { value: 255, message: 'Links must be 255 characters or fewer.' },
};

export const emailRule = {
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Enter a valid email address.',
  },
  maxLength: { value: 255, message: 'Email must be 255 characters or fewer.' },
};

export const requiredEmailRule = {
  required: 'Email is required.',
  ...emailRule,
};

export const phoneRule = {
  pattern: {
    value: /^[0-9+()\-.\s]{5,30}$/,
    message: 'Enter a valid phone number.',
  },
};

export const passwordRule = {
  required: 'Password is required.',
  minLength: { value: 8, message: 'At least 8 characters.' },
  maxLength: { value: 100, message: 'At most 100 characters.' },
  validate: (value) =>
    (/[A-Za-z]/.test(value) && /[0-9]/.test(value)) || 'Include a letter and a number.',
};

export function requiredText(label, { min = 1, max = 200 } = {}) {
  return {
    required: `${label} is required.`,
    minLength: { value: min, message: `${label} must be at least ${min} characters.` },
    maxLength: { value: max, message: `${label} must be ${max} characters or fewer.` },
  };
}

export function maxText(max, label = 'This field') {
  return { maxLength: { value: max, message: `${label} must be ${max} characters or fewer.` } };
}

/** Turns an API validation failure into a message per field for react-hook-form. */
export function applyServerErrors(error, setError) {
  if (!error?.details?.length) return false;
  let applied = false;
  for (const detail of error.details) {
    if (!detail.field) continue;
    setError(detail.field, { type: 'server', message: detail.message });
    applied = true;
  }
  return applied;
}
