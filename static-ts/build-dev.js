const { context } = require("esbuild");
const { sassPlugin } = require("esbuild-sass-plugin");
const { copy: copyPlugin } = require("esbuild-plugin-copy");

(async () => {
  const ctx = await context({
    entryPoints: ["src/js/client.tsx"],
    bundle: true,
    minify: true,
    sourcemap: "inline",
    target: "ES2021",
    outdir: "dist",
    platform: "browser",
    tsconfig: "tsconfig.json",
    logLevel: "info",
    loader: {
      ".png": "file",
    },
    plugins: [
      sassPlugin({
        type: "style",
        filter: /\.s(c|a)ss$/,
      }),
      copyPlugin({
        resolveFrom: "cwd",
        assets: [
          { from: "public/**/*", to: "dist/" }
        ]
      }),
      {
        name: 'on-end',
        setup(build) {
          build.onEnd((result) => {
          })
        }
      }
    ]
  });

  await ctx.watch();
  const { host, port } = await ctx.serve({
    servedir: "dist",
  });

})();