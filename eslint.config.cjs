// Archivo: eslint.config.cjs

module.exports = {
  // Extiende las reglas recomendadas de Next.js (incluye Core Web Vitals y soporte TS)
  extends: ['next/core-web-vitals', 'next/typescript'],

  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },

  rules: {
    // Ajusta estas reglas al nivel que prefieras: "off" | "warn" | "error"
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
  },
}
