module.exports = {
  // Temporarily disable ESLint due to plugin dependency issues
  // Prettify TS and JS files
  '**/*.(ts|tsx|js)': filenames => [
    // `npx eslint ${filenames.join(' ')}`,  // Commented out to bypass ESLint temporarily
    `npx prettier --write ${filenames.join(' ')}`,
  ],

  // Prettify only Markdown and JSON files
  '**/*.(md|json)': filenames => `npx prettier --write ${filenames.join(' ')}`,
};
