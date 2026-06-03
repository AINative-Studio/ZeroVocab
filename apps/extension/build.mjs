import esbuild from "esbuild";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outdir = resolve(__dirname, "dist");
const watch = process.argv.includes("--watch");

const entryPoints = [
  { in: "background/service-worker.ts", out: "background/service-worker" },
  { in: "content-scripts/google-translate.ts", out: "content-scripts/google-translate" },
  { in: "content-scripts/selection-capture.ts", out: "content-scripts/selection-capture" },
  { in: "popup/popup.ts", out: "popup/popup" },
];

async function build() {
  ["background", "content-scripts", "popup", "icons"].forEach((dir) => {
    mkdirSync(resolve(outdir, dir), { recursive: true });
  });

  const ctx = await esbuild.context({
    entryPoints,
    outdir,
    bundle: true,
    platform: "browser",
    target: ["chrome112"],
    format: "esm",
    sourcemap: false,
    minify: !watch,
    logLevel: "info",
    outExtension: { ".js": ".js" },
  });

  if (watch) {
    await ctx.watch();
    console.log("[ZeroVocab] Watching for changes...");
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log("[ZeroVocab] Build complete =>", outdir);
  }

  copyStatic();
}

function copyStatic() {
  const copy = (src, dest) => {
    const srcPath = resolve(__dirname, src);
    const destPath = resolve(outdir, dest);
    if (existsSync(srcPath)) {
      mkdirSync(dirname(destPath), { recursive: true });
      copyFileSync(srcPath, destPath);
    } else {
      console.warn("[ZeroVocab] Skipping missing file:", src);
    }
  };

  copy("manifest.json", "manifest.json");
  copy("popup/popup.html", "popup/popup.html");
  copy("popup/popup.css", "popup/popup.css");
  copy("icons/icon-16.png", "icons/icon-16.png");
  copy("icons/icon-48.png", "icons/icon-48.png");
  copy("icons/icon-128.png", "icons/icon-128.png");

  console.log("[ZeroVocab] Static files copied");
}

build().catch((err) => {
  console.error("[ZeroVocab] Build failed:", err);
  process.exit(1);
});
