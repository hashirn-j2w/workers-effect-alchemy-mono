module.exports = {
  hooks: {
    // `typescript` is @tsc-rs/typescript (the catalog entry). Its 0.8.x version is outside
    // vite-plus-core's typescript peer range, so pnpm would hand vite-plus a second
    // typescript and tests would load a second vitest.
    readPackage(pkg) {
      if (pkg.name === "@voidzero-dev/vite-plus-core" && pkg.peerDependencies?.typescript) {
        pkg.peerDependencies.typescript = "*";
      }

      return pkg;
    },
  },
};
