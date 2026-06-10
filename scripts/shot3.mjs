import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:4321/";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const box = await page.locator("canvas").boundingBox();
const sx = box.width / 1280, sy = box.height / 720;
const click = async (x, y) => { await page.mouse.click(box.x + x * sx, box.y + y * sy); await page.waitForTimeout(300); };
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(140); } };
const shot = async (name) => { await page.screenshot({ path: `/tmp/pitz-${name}.png` }); console.log("shot:", name); };

// Play Modern (centered ~640,420)
await click(640, 420);
await page.waitForTimeout(500);
await shot("v2-reveal");       // opening: whole board lit + beacon
await page.waitForTimeout(2600);
await shot("v2-fading");       // mid-fade
await page.keyboard.press(" "); // cut reveal -> dark
await page.waitForTimeout(500);
await shot("v2-dark");         // dark follow-spotlight

console.log("ERRORS:", errors.length ? JSON.stringify(errors.slice(0, 10), null, 2) : "none");
await browser.close();
