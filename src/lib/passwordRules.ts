export interface PasswordRules {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  digit: boolean
  special: boolean
}

export function checkPasswordRules(value: string): PasswordRules {
  return {
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    digit: /[0-9]/.test(value),
    special: /[!@#$%*=]/.test(value),
  }
}

export function allPasswordRulesMet(value: string): boolean {
  const rules = checkPasswordRules(value)
  return Object.values(rules).every(Boolean)
}
