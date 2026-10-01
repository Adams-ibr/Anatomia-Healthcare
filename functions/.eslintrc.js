module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files except during build
  ],
  plugins: ["@typescript-eslint"],
  rules: {
    "quotes": ["error", "double"],
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
