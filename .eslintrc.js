module.exports = {
  env: { es2021: true, node: true, browser: true, jest: true },
  extends: ['.eslintrc-js.js'],
  ignorePatterns: ['**/.*/**/*', '**/node_modules', '**/dist', '**/lib'],
  overrides: [{ files: ['**/*.ts', '**/*.vue'], extends: ['.eslintrc-vue.js'] }],
  root: true
}
