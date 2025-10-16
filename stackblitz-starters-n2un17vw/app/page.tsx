// Edge-swipe to open/close mobile menu
useEffect(() => {
  if (!isTouch) return;

  let startX = 0, startY = 0, tracking = false, openedFromEdge = false;

  const onStart = (e: TouchEvent) => {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    // arm only if starting at left edge to open, or if menu is open (to close)
    openedFromEdge = !menuOpen && startX <= 24;   // 24px edge
    tracking = openedFromEdge || menuOpen;
  };

  const onMove = (e: TouchEvent) => {
    if (!tracking) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    // give up if vertical scroll dominates
    if (Math.abs(dy) > Math.abs(dx) + 10) {
      tracking = false;
      return;
    }
    // when opening from edge, prevent native gestures a bit
    if (openedFromEdge && Math.abs(dx) > 10 && Math.abs(dy) < 40) {
      e.preventDefault();
    }
  };

  const onEnd = (e: TouchEvent) => {
    if (!tracking) return;
    const t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
    if (!t) { tracking = false; return; }

    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const horizontalEnough = Math.abs(dx) >= 70 && Math.abs(dy) <= 40;

    if (!menuOpen && openedFromEdge && horizontalEnough && dx > 0) {
      setMenuOpen(true);     // swipe right from edge → open
    } else if (menuOpen && horizontalEnough && dx < 0) {
      setMenuOpen(false);    // swipe left while open → close
    }
    tracking = false;
  };

  // passive flags so we can preventDefault on move when needed
  window.addEventListener("touchstart", onStart, { passive: true });
  window.addEventListener("touchmove", onMove as unknown as EventListener, { passive: false });
  window.addEventListener("touchend", onEnd, { passive: true });

  return () => {
    window.removeEventListener("touchstart", onStart);
    window.removeEventListener("touchmove", onMove as unknown as EventListener);
    window.removeEventListener("touchend", onEnd);
  };
}, [menuOpen, isTouch]);
