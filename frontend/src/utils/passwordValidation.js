export const getPasswordStrengthScore = (password) => [
  password.length >= 8,
  /[A-Z]/.test(password),
  /[0-9]/.test(password),
  /[^A-Za-z0-9]/.test(password),
].filter(Boolean).length;

export const isStrongPassword = (password) => getPasswordStrengthScore(password) === 4;
