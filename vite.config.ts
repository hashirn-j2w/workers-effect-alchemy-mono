import "vite-plus/test/config";
import { defineConfig } from "vite-plus";

const GENERATED_AND_VENDORED = [
  ".repos/**",
  ".alchemy/**",
  ".tanstack/**",
  ".output/**",
  "dist/**",
  "node_modules/**",
  "pnpm-lock.yaml",
  "*.tsbuildinfo",
  "**/routeTree.gen.ts",
  "tools/oxlint/anti-slop/**",
];

const RESTRICTED_UI_VARIANT_PATTERNS = [
  {
    group: ["**/components/ui/*", "**/ui/*", "./ui/*"],
    importNames: ["buttonVariants", "badgeVariants"],
    message:
      "Render the components/ui export instead of borrowing its class recipe (render={<Button …/>}).",
  },
];

// Installed agent assets are not application source.
const AGENT_DIRS = [".agent/**", ".agents/**", ".claude/**", ".codex/**", ".cursor/**"];

const TEST_EXCLUDE = [
  "**/.repos/**",
  "**/.t3/**",
  "**/node_modules/**",
  "**/dist/**",
  "**/.{idea,git,cache,output,temp,alchemy}/**",
];

export default defineConfig({
  run: {
    cache: { scripts: false },
  },
  test: {
    environment: "node",
    exclude: TEST_EXCLUDE,
    hookTimeout: 60_000,
    testTimeout: 60_000,
    allowOnly: !process.env.CI,
    // Flaky tests are fixed, not retried.
    retry: 0,
    fakeTimers: {
      toFake: [
        "setTimeout",
        "clearTimeout",
        "setInterval",
        "clearInterval",
        "setImmediate",
        "clearImmediate",
        "Date",
        "performance",
        "requestAnimationFrame",
        "cancelAnimationFrame",
        "requestIdleCallback",
        "cancelIdleCallback",
      ],
    },
  },
  staged: {
    // In order, so lint reads the formatted file.
    "*": ["vp fmt --no-error-on-unmatched-pattern", "vp lint --no-error-on-unmatched-pattern"],
  },
  fmt: {
    ignorePatterns: [...GENERATED_AND_VENDORED, ...AGENT_DIRS],
    sortPackageJson: {},
  },
  lint: {
    ignorePatterns: [...GENERATED_AND_VENDORED, ...AGENT_DIRS],
    plugins: ["eslint", "oxc", "react", "unicorn", "typescript"],
    jsPlugins: [
      "./oxlint-plugin-repo/index.ts",
      { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
      { name: "anti-slop-effect", specifier: "./tools/oxlint/anti-slop/effect/index.ts" },
      "@shadcn/lint",
    ],
    settings: {
      shadcn: { ui: "~/components/ui" },
    },
    categories: {
      correctness: "warn",
      suspicious: "warn",
      perf: "warn",
    },
    rules: {
      "oxc/no-accumulating-spread": "error",
      "eslint/no-control-regex": "off",
      "eslint/no-shadow": "off",
      "eslint/no-await-in-loop": "off",
      "eslint/no-underscore-dangle": "off",
      "eslint/no-empty-pattern": "error",
      "eslint/no-new": "error",
      "eslint/no-unsafe-optional-chaining": "error",
      "eslint/no-unneeded-ternary": "error",
      "eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "react/memo-dependencies": "error",
      "react/purity": "error",
      "react/refs": "error",
      "react/exhaustive-effect-dependencies": "error",
      "react/set-state-in-effect": "error",
      "react/immutability": "error",
      "react/no-array-index-key": "error",
      "react/no-unstable-nested-components": "error",
      "react/static-components": "error",
      "react/capitalized-calls": "error",
      "react/no-object-type-as-default-prop": "off",
      "react/jsx-no-constructed-context-values": "off",
      "react-in-jsx-scope": "off",
      "react-hooks/exhaustive-deps": "off",
      "typescript/no-extraneous-class": "error",
      "typescript/no-this-alias": "off",
      "unicorn/no-useless-spread": "error",
      "unicorn/no-useless-fallback-in-spread": "error",
      "unicorn/require-module-specifiers": "error",
      "unicorn/consistent-function-scoping": "off",
      "unicorn/no-array-sort": "off",
      "unicorn/no-array-reverse": "off",
      "unicorn/no-new-array": "off",
      "unicorn/prefer-add-event-listener": "off",

      "repo/namespace-node-imports": "error",
      "repo/no-em-dash-copy": "error",
      "repo/no-hookless-use-function": "error",
      "repo/no-inline-schema-compile": "error",
      "repo/no-low-value-comments": "error",
      "repo/no-manual-effect-runtime-in-tests": "error",
      "repo/no-manual-memo": "error",
      "repo/no-native-title-tooltip": "error",
      "repo/no-outset-state-indicators": "error",
      "repo/no-polling-loop-in-tests": "error",
      "repo/no-raw-resize-observer": "error",
      "repo/no-real-time-wait-in-tests": "error",
      "repo/no-test-in-loop": "error",
      "repo/no-test-timeout-or-unreasoned-skip": "error",
      "repo/no-unreasoned-state-sync": "error",
      "repo/no-unscoped-has": "error",
      "repo/no-wall-clock-in-tests": "error",
      "repo/prefer-catch-tags": "error",
      "repo/prefer-effect-fn": "error",
      "repo/require-centered-scroll-gutter": "error",
      "repo/require-suppression-reason": "error",

      "anti-slop/no-array-filter-map": "error",
      "anti-slop/no-reduce-accumulator-copy": "error",
      "anti-slop/no-chained-type-assertions": "error",
      "anti-slop/no-conditional-empty-object-spread": "error",
      "anti-slop/no-known-value-widening": "error",
      "anti-slop/no-module-mocking": "error",
      "anti-slop/no-object-parameters": "error",
      "anti-slop/no-reflect-apply": "error",
      "anti-slop/no-reflect-get": "error",
      "anti-slop/no-runtime-typeof": "error",
      "anti-slop/no-shape-in-symbol-names": "error",
      "anti-slop/no-unknown-parameters": "error",
      "anti-slop/no-unknown-returns": "error",
      "anti-slop/no-unknown-type-aliases": "error",
      "anti-slop/no-unsafe-dictionary-type": "error",
      "anti-slop/no-widen-then-assert": "error",
      "anti-slop/require-readable-spacing": "error",
      "anti-slop/require-safety-comment-for-type-assertion": "error",

      "anti-slop-effect/no-manual-effect-error-tag": "error",
      "anti-slop-effect/no-manual-tag-comparison": "error",
      "anti-slop-effect/no-manual-tagged-construction": "error",
      "anti-slop-effect/no-service-constructor-imports": "error",
      "anti-slop-effect/prefer-effect-match": "error",
    },
    overrides: [
      {
        files: ["**/*.{test,spec}.{ts,tsx}", "**/{test,tests,testing,fixtures}/**"],
        rules: { "repo/prefer-effect-fn": "off" },
      },
      {
        // Lint rules walk untyped AST nodes, so narrowing raw values is their job.
        files: ["oxlint-plugin-repo/**"],
        rules: {
          "anti-slop/no-runtime-typeof": "off",
          "anti-slop/no-unknown-parameters": "off",
        },
      },
      {
        // Rule sources and fixtures contain the exact copy these rules reject.
        files: ["oxlint-plugin-repo/rules/**"],
        rules: {
          "repo/no-em-dash-copy": "off",
          "repo/no-outset-state-indicators": "off",
        },
      },
      {
        // The helper every other caller is pointed at.
        files: ["apps/web/src/lib/observeResize.ts"],
        rules: { "repo/no-raw-resize-observer": "off" },
      },
      {
        // components/ui owns the design tokens and class recipes; everything else consumes them.
        files: ["apps/web/src/**"],
        rules: {
          "shadcn/no-unknown-classes": "error",
          "shadcn/no-raw-colors": "error",
        },
      },
      {
        files: ["apps/web/src/**"],
        excludeFiles: ["apps/web/src/components/ui/**"],
        rules: {
          "eslint/no-restricted-imports": ["error", { patterns: RESTRICTED_UI_VARIANT_PATTERNS }],
          "shadcn/require-static-classes": "error",
          "shadcn/no-arbitrary-values": ["error", { allow: ["layout", "transition"] }],
          "shadcn/no-restyle": ["error", { allow: ["layout"] }],
        },
      },
    ],
  },
});
