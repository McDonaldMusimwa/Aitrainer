import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Each frame reveals this share of the text still waiting, so the reveal slows into the
// end of each burst and never falls far behind a fast stream.
const backlogFrames = 8;

/** How many characters of `text` to show after one frame, when `shown` are visible now.
 * Reveals at least one character a frame, and never splits an emoji or other surrogate pair. */
export function revealLength(text: string, shown: number): number {
  let next = Math.min(text.length, shown + Math.max(1, Math.ceil((text.length - shown) / backlogFrames)));
  const last = text.charCodeAt(next - 1);
  if (last >= 0xd800 && last <= 0xdbff) next += 1;
  return Math.min(next, text.length);
}

/** Shows streamed text at a steady pace instead of in the bursts it arrives in.
 * Shows it all at once when the device asks for reduced motion. */
export function useStreamedText() {
  const [shown, setShown] = useState('');
  const received = useRef('');
  const length = useRef(0);
  const frame = useRef<number | null>(null);
  const waiting = useRef<(() => void)[]>([]);
  const reduceMotion = useRef(false);

  const settle = () => {
    frame.current = null;
    waiting.current.splice(0).forEach(resolve => resolve());
  };

  const tick = useCallback(() => {
    const text = received.current;
    length.current = reduceMotion.current ? text.length : revealLength(text, length.current);
    setShown(text.slice(0, length.current));
    if (length.current < text.length) frame.current = requestAnimationFrame(tick);
    else settle();
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(on => { reduceMotion.current = on; }).catch(() => {});
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current); };
  }, []);

  /** Adds newly streamed text to what will be shown. */
  const append = useCallback((text: string) => {
    received.current += text;
    if (frame.current === null) frame.current = requestAnimationFrame(tick);
  }, [tick]);

  /** Clears everything, ready for the next reply. */
  const reset = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    received.current = '';
    length.current = 0;
    setShown('');
    settle();
  }, []);

  /** Resolves once everything received so far is on screen. */
  const settled = useCallback(() => new Promise<void>(resolve => {
    if (frame.current === null) resolve();
    else waiting.current.push(resolve);
  }), []);

  return { shown, append, reset, settled };
}
