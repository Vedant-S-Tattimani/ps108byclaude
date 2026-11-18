import { useEffect, useRef, useState } from "react";

/** How far the eyes trail behind the pointer, and how they behave. */
const FOLLOW = 0.085; // share of the remaining distance covered per frame (lower = lazier trail)
const OFFSET_X = 26; // eyes sit up and to the right of the pointer
const OFFSET_Y = -34;
const IDLE_MS = 650; // fade out after the pointer has been still this long
const PUPIL_TRAVEL = 4.5; // px a pupil can move inside its eye
const INTERACTIVE = "a, button, [role='button'], select, summary, label, input[type='file'], .case, .lib-card, .allied-item";

function shouldRun(): boolean {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return fine && !calm;
}

/**
 * A pair of googly eyes that trails the mouse, looks where it is heading, widens over
 * things you can click, blinks on click, and fades away when the pointer rests.
 * Decorative only: hidden from assistive tech, never intercepts the pointer.
 */
export function CursorEyes() {
  const [enabled] = useState(shouldRun);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!enabled || !el) return;
    const pupils = el.querySelectorAll<HTMLElement>(".ce-pupil");

    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let seen = false;
    let idleTimer = 0;
    let frame = 0;

    const setState = (name: string, on: boolean) => el.classList.toggle(name, on);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target.x = e.clientX + OFFSET_X;
      target.y = e.clientY + OFFSET_Y;
      if (!seen) {
        pos.x = target.x;
        pos.y = target.y;
        seen = true;
      }
      setState("is-awake", true);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setState("is-awake", false), IDLE_MS);

      const over = e.target instanceof Element && e.target.closest(INTERACTIVE) !== null;
      setState("is-curious", over);

      // Pupils look from the eyes toward the real pointer.
      pupils.forEach((pupil) => {
        const eye = pupil.parentElement?.getBoundingClientRect();
        if (!eye) return;
        const dx = e.clientX - (eye.left + eye.width / 2);
        const dy = e.clientY - (eye.top + eye.height / 2);
        const angle = Math.atan2(dy, dx);
        const reach = Math.min(PUPIL_TRAVEL, Math.hypot(dx, dy) / 12);
        pupil.style.transform = `translate(${(Math.cos(angle) * reach).toFixed(2)}px, ${(Math.sin(angle) * reach).toFixed(2)}px)`;
      });
    };

    const onDown = () => {
      setState("is-blinking", true);
      window.setTimeout(() => setState("is-blinking", false), 160);
    };
    const onLeave = () => setState("is-awake", false);

    const tick = () => {
      pos.x += (target.x - pos.x) * FOLLOW;
      pos.y += (target.y - pos.y) * FOLLOW;
      const tilt = Math.max(-14, Math.min(14, (target.x - pos.x) * 0.06));
      el.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0) rotate(${tilt.toFixed(1)}deg)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div ref={root} className="cursor-eyes" aria-hidden data-testid="cursor-eyes">
      <div className="ce-inner">
        <span className="ce-eye"><span className="ce-pupil" /></span>
        <span className="ce-eye ce-right"><span className="ce-pupil" /></span>
      </div>
    </div>
  );
}
