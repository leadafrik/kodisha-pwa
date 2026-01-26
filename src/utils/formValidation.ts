/**
 * Form Field State Management
 * Tracks validation state for individual form fields
 */

export interface FieldState {
  value: string;
  touched: boolean;
  error?: string;
  isValid: boolean;
}

export interface FormFieldProps {
  state: FieldState;
  onChange: (value: string) => void;
  onBlur: () => void;
  label: string;
  placeholder?: string;
  type?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Email validation with real-time feedback
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true };
};

/**
 * Password validation with strength feedback
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string; strength?: "weak" | "fair" | "good" | "strong" } => {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < 6) {
    return { isValid: false, error: "Password must be at least 6 characters", strength: "weak" };
  }

  if (password.length < 8) {
    return { isValid: true, strength: "fair" };
  }

  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) {
    return { isValid: true, strength: "strong" };
  }

  return { isValid: true, strength: "good" };
};

/**
 * Password confirmation validation
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): { isValid: boolean; error?: string } => {
  if (!confirmPassword) {
    return { isValid: false, error: "Please confirm your password" };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: "Passwords do not match" };
  }

  return { isValid: true };
};

/**
 * Name validation
 */
export const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: "Name is required" };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters" };
  }

  return { isValid: true };
};

/**
 * Phone validation (Kenya)
 */
export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone) {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove non-numeric characters except + at the start
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  // Accept +254... or 0... or 254... formats
  const phoneRegex = /^(\+254|254|0)7\d{8}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: "Please enter a valid Kenyan phone number" };
  }

  return { isValid: true };
};

/**
 * Email or Phone validation (for login)
 */
export const validateEmailOrPhone = (value: string): { isValid: boolean; error?: string; type?: "email" | "phone" } => {
  if (!value) {
    return { isValid: false, error: "Email or phone is required" };
  }

  // Check if it looks like an email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(value)) {
    return { isValid: true, type: "email" };
  }

  // Check if it looks like a phone
  const phoneRegex = /^(\+254|254|0)7\d{8}$/;
  if (phoneRegex.test(value.replace(/[^\d+]/g, ""))) {
    return { isValid: true, type: "phone" };
  }

  return { isValid: false, error: "Please enter a valid email or phone number" };
};

/**
 * Create field state object
 */
export const createFieldState = (value: string = "", isValid: boolean = false, error?: string): FieldState => ({
  value,
  touched: false,
  error,
  isValid,
});

/**
 * Update field state on change
 */
export const updateFieldOnChange = (
  value: string,
  validator: (val: string) => { isValid: boolean; error?: string }
): FieldState => {
  const validation = validator(value);
  return {
    value,
    touched: true,
    error: validation.error,
    isValid: validation.isValid,
  };
};

/**
 * Update field state on blur
 */
export const updateFieldOnBlur = (state: FieldState): FieldState => ({
  ...state,
  touched: true,
});
