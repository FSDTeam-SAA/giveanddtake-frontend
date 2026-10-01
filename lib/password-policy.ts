// Password rules shared by sign-up, change password and reset password
// (the same rules the register and forgot-password forms enforce).
export const PASSWORD_MIN_LENGTH = 10;

export const PASSWORD_REQUIREMENT_MESSAGE =
  `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include an ` +
  "uppercase letter, a lowercase letter, a number and a special character.";

export function getPasswordRequirements(password: string) {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(password),
  };
}

export function isValidPassword(password: string): boolean {
  return Object.values(getPasswordRequirements(password)).every(Boolean);
}
