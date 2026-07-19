import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import test from "node:test";

import { chromium } from "playwright-core";

const baseUrl = "http://localhost:5173";
const edgeCandidates = [
  process.env.PLAYWRIGHT_BROWSER_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/microsoft-edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

const executablePath = edgeCandidates.find((candidate) => existsSync(candidate));

async function isReady() {
  try {
    const response = await fetch(baseUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await isReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("EnergyCircle development server did not become ready.");
}

test(
  "the reference interaction updates every governed representation",
  { skip: !executablePath },
  async () => {
    let server;
    if (!(await isReady())) {
      server = spawn(
        process.execPath,
        ["./node_modules/vinext/dist/cli.js", "dev"],
        {
          cwd: new URL("..", import.meta.url),
          stdio: "ignore",
          windowsHide: true,
        },
      );
      await waitForServer();
    }

    const browser = await chromium.launch({
      executablePath,
      headless: true,
    });

    try {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1100 },
      });
      await page.goto(baseUrl, { waitUntil: "networkidle" });

      assert.equal(
        await page.locator(".property").getAttribute("data-view"),
        "property",
      );
      assert.equal(await page.locator(".physical-object--tank").count(), 1);
      assert.match(
        (await page.locator(".component__start").textContent()) ?? "",
        /Drag the tank uphill/i,
      );
      assert.equal(
        await page.locator(".verdict strong").textContent(),
        "FRAGILE",
      );
      assert.match(
        (await page.locator(".topbar__context").textContent()) ?? "",
        /Revision 1/,
      );

      const reservoir = page.getByRole("button", {
        name: /Upper reservoir\. Drag to reposition/,
      });
      const property = page.locator(".property");
      const [reservoirBox, propertyBox] = await Promise.all([
        reservoir.boundingBox(),
        property.boundingBox(),
      ]);
      assert.ok(reservoirBox);
      assert.ok(propertyBox);

      const startX = reservoirBox.x + reservoirBox.width / 2;
      const startY = reservoirBox.y + reservoirBox.height / 2;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(
        startX,
        propertyBox.y + propertyBox.height * 0.18,
        { steps: 8 },
      );
      await page.mouse.up();

      assert.equal(
        await page.locator(".verdict strong").textContent(),
        "VIABLE",
      );
      assert.match(
        (await page.locator(".topbar__context").textContent()) ?? "",
        /Revision 2/,
      );
      assert.match(
        (await page.locator(".insight p").textContent()) ?? "",
        /fragile to viable/i,
      );
      assert.equal(
        await page.locator(".warning--clear").count(),
        1,
      );
      assert.equal(await page.locator(".component__start").count(), 0);

      await page.getByRole("button", { name: "system" }).click();
      assert.equal(await property.getAttribute("data-view"), "system");
      await page.getByRole("button", { name: "blueprint" }).click();
      assert.equal(await property.getAttribute("data-view"), "blueprint");

      await page.getByRole("switch", {
        name: "Simulate intake obstruction",
      }).click();
      assert.equal(
        await page.locator(".verdict strong").textContent(),
        "INFEASIBLE",
      );
      assert.ok(await page.locator(".route--blocked").count() > 0);
      assert.match(
        (await page.locator(".insight p").textContent()) ?? "",
        /generation falls to zero/i,
      );
    } finally {
      await browser.close();
      if (server) server.kill();
    }
  },
);
