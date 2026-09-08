import { readFile, writeFile } from "node:fs/promises";

const shopUrl = new URL("../app/shop/page.tsx", import.meta.url);
let source = await readFile(shopUrl, "utf8");

function replaceRequired(from, to, label) {
  if (source.includes(to)) return;
  if (!source.includes(from)) {
    throw new Error(`WAITLIST_MODAL: ${label} not found`);
  }
  source = source.replace(from, to);
}

replaceRequired(
  `  const closeModal = () => {\n    setSelectedBar(null);\n    setWaitlistEmail("");\n    setWaitlistStatus("idle");\n  };`,
  `  const modalRef = useRef<HTMLDivElement | null>(null);\n  const modalCloseRef = useRef<HTMLButtonElement | null>(null);\n  const previousFocusRef = useRef<HTMLElement | null>(null);\n\n  const closeModal = () => {\n    setSelectedBar(null);\n    setWaitlistEmail("");\n    setWaitlistStatus("idle");\n  };\n\n  useEffect(() => {\n    if (!selectedBar) return;\n\n    previousFocusRef.current = document.activeElement as HTMLElement | null;\n    lockScroll();\n\n    const focusModal = requestAnimationFrame(() => modalCloseRef.current?.focus());\n\n    const onKeyDown = (event: KeyboardEvent) => {\n      if (event.key === "Escape") {\n        event.preventDefault();\n        closeModal();\n        return;\n      }\n\n      if (event.key !== "Tab" || !modalRef.current) return;\n\n      const focusable = Array.from(\n        modalRef.current.querySelectorAll<HTMLElement>(\n          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'\n        )\n      ).filter((element) => element.offsetParent !== null);\n\n      if (!focusable.length) return;\n      const first = focusable[0];\n      const last = focusable[focusable.length - 1];\n\n      if (event.shiftKey && document.activeElement === first) {\n        event.preventDefault();\n        last.focus();\n      } else if (!event.shiftKey && document.activeElement === last) {\n        event.preventDefault();\n        first.focus();\n      }\n    };\n\n    document.addEventListener("keydown", onKeyDown);\n\n    return () => {\n      cancelAnimationFrame(focusModal);\n      document.removeEventListener("keydown", onKeyDown);\n      unlockScroll();\n      requestAnimationFrame(() => previousFocusRef.current?.focus());\n    };\n  }, [selectedBar]);`,
  "modal focus and scroll lifecycle"
);

replaceRequired(
  `<div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/40 backdrop-blur-sm">\n            <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-[#8C9A91]/30 p-6 relative mx-4">`,
  `<div\n            className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/40 backdrop-blur-sm"\n            onMouseDown={(event) => {\n              if (event.target === event.currentTarget) closeModal();\n            }}\n          >\n            <div\n              ref={modalRef}\n              role="dialog"\n              aria-modal="true"\n              aria-labelledby="waitlist-dialog-title"\n              className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-[#8C9A91]/30 p-6 relative mx-4"\n            >`,
  "dialog semantics"
);

replaceRequired(
  `              <button\n                type="button"\n                onClick={closeModal}`,
  `              <button\n                ref={modalCloseRef}\n                type="button"\n                onClick={closeModal}`,
  "close button focus ref"
);

replaceRequired(
  `<h2 className="mt-2 text-base font-semibold text-[#004642]">`,
  `<h2 id="waitlist-dialog-title" className="mt-2 text-base font-semibold text-[#004642]">`,
  "dialog title id"
);

replaceRequired(
  `                  name="email"\n                  required`,
  `                  name="email"\n                  autoComplete="email"\n                  inputMode="email"\n                  required`,
  "email autocomplete"
);

await writeFile(shopUrl, source, "utf8");
console.log("WAITLIST_MODAL_PREPARED", {
  scrollLock: true,
  escapeClose: true,
  focusTrap: true,
  focusRestore: true,
  backdropClose: true,
  dialogSemantics: true,
});
