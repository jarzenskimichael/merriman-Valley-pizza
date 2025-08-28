/** Temporary relaxed ESLint config for deployment; tighten later */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off"
  }
};
