"use client";

import "../../honeybadger.browser.config.js";

/**
 * Ensures Honeybadger browser configuration loads under Turbopack,
 * where the official webpack entry injection may not run.
 */
export function HoneybadgerInit() {
  return null;
}
