/** Stricter on server, looser on UI */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  overrides: [
    {
      files: ["src/app/api/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}", "src/types/**/*.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-explicit-any": "error"
      }
    },
    {
      files: ["src/app/**/*.{ts,tsx}"],
      excludedFiles: ["src/app/api/**/*"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
};
