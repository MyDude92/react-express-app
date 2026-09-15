/** One delegated listener set for page, dialogs, editors and nested scrollers. */
export function installScrollbarActivity() {
  let active: Element | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let frame = 0;
  let dragging = false;
  let target: EventTarget | null = null;
  const hide = () => {
    active?.removeAttribute('data-scroll-active');
    active = null;
  };
  const reveal = (element: Element | null) => {
    clearTimeout(timer);
    if (active !== element) hide();
    active = element;
    active?.setAttribute('data-scroll-active', 'true');
    if (!dragging) timer = setTimeout(hide, 1100);
  };
  const findScroller = (start: EventTarget | null): Element | null => {
    let element = start instanceof Element ? start : document.scrollingElement;
    while (element) {
      if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) {
        const style = getComputedStyle(element);
        if (element === document.scrollingElement || /(auto|scroll|overlay)/.test(`${style.overflowY} ${style.overflowX}`)) return element;
      }
      element = element.parentElement;
    }
    return null;
  };
  const move = (event: PointerEvent) => {
    target = event.target;
    if (!frame) frame = requestAnimationFrame(() => {
      frame = 0;
      reveal(findScroller(target));
    });
  };
  const scroll = (event: Event) => reveal(findScroller(event.target));
  const key = (event: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) reveal(findScroller(event.target));
  };
  const down = (event: PointerEvent) => { dragging = true; reveal(findScroller(event.target)); };
  const up = () => { dragging = false; reveal(active); };
  const leave = () => { if (!dragging) hide(); };
  document.addEventListener('pointermove', move, {passive:true});
  document.addEventListener('scroll', scroll, {capture:true, passive:true});
  document.addEventListener('keydown', key);
  document.addEventListener('pointerdown', down, {passive:true});
  document.addEventListener('pointerup', up, {passive:true});
  document.addEventListener('pointercancel', up, {passive:true});
  document.documentElement.addEventListener('pointerleave', leave);
  window.addEventListener('blur', up);
  return () => {
    hide();
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    document.removeEventListener('pointermove', move);
    document.removeEventListener('scroll', scroll, true);
    document.removeEventListener('keydown', key);
    document.removeEventListener('pointerdown', down);
    document.removeEventListener('pointerup', up);
    document.removeEventListener('pointercancel', up);
    document.documentElement.removeEventListener('pointerleave', leave);
    window.removeEventListener('blur', up);
  };
}
