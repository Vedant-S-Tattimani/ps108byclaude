import { useEffect } from "react";

const prefersReducedMotion = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Arms scroll reveals for every [data-reveal] element (including ones rendered later)
 * and feeds pointer position to CSS (--mx / --my, -1..1) for doodle parallax.
 */
export function useMotion(): void {
  useEffect(() => {
    const root = document.documentElement;
    if (prefersReducedMotion()) return;

    root.classList.add("reveal-armed");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add("in");
          el.addEventListener("animationend", () => el.classList.add("settled"), { once: true });
          observer.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    const watch = (scope: ParentNode) =>
      scope.querySelectorAll<HTMLElement>("[data-reveal]:not(.in)").forEach((el) => observer.observe(el));
    watch(document);
    const mutations = new MutationObserver(() => watch(document));
    mutations.observe(document.body, { childList: true, subtree: true });

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty("--mx", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        root.style.setProperty("--my", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
      root.classList.remove("reveal-armed");
    };
  }, []);
}
