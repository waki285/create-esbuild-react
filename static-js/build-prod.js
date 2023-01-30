const { build, transform } = require("esbuild");
const { sassPlugin } = require("esbuild-sass-plugin");
const { copy:copyPlugin } = require("esbuild-plugin-copy");

build({
  entryPoints: ["src/js/client.jsx"],
  bundle: true,
  minify: true,
  sourcemap: false,
  target: "ES2021",
  outdir: "dist",
  platform: "browser",
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
  ]
});