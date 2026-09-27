"use client";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / non-secure contexts.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

/**
 * Copies text that is still being fetched. Passing a promise to ClipboardItem
 * keeps the click's user-gesture (needed by Safari); falls back to writeText.
 */
export async function copyWhenReady(text: Promise<string>): Promise<boolean> {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "text/plain": text.then((t) => new Blob([t], { type: "text/plain" })) }),
      ]);
      return true;
    } catch {
      /* fall through */
    }
  }
  try {
    return await copyText(await text);
  } catch {
    return false;
  }
}
