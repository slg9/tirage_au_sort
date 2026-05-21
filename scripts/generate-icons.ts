import sharp from "sharp";
import { mkdirSync, readFileSync } from "fs";
import { join } from "path";

const svgSource = readFileSync(join(process.cwd(), "app/icon.svg"));
const appleSvg = readFileSync(join(process.cwd(), "app/apple-icon-source.svg"));

async function generate() {
  mkdirSync("public", { recursive: true });

  await sharp(svgSource).resize(192, 192).png().toFile("app/icon-192.png");
  await sharp(svgSource).resize(512, 512).png().toFile("app/icon-512.png");
  await sharp(appleSvg).resize(180, 180).png().toFile("app/apple-icon.png");
  await sharp(svgSource).resize(192, 192).png().toFile("public/icon-192.png");
  await sharp(svgSource).resize(512, 512).png().toFile("public/icon-512.png");
  await sharp(appleSvg).resize(180, 180).png().toFile("public/apple-icon.png");
  console.log("Icons generated");
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
