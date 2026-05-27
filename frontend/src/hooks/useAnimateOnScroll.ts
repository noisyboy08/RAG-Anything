import { useEffect, useRef, useState } from 'react';

type AnimationType = 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right';

const classMap: Record<AnimationType, string> = {
  'fade-up': 'anim-fade-up',
  'fade-in': 'anim-fade-in',
  'slide-left': 'anim-slide-left',
  'slide-right': 'anim-slide-right',
};

export function useAnimateOnScroll<T extends HTMLElement>(
  type: AnimationType = 'fade-up',
  options: { threshold?: number; delay?: number } = {}
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const { threshold = 0.15, delay = 0 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.classList.add(classMap[type]);
    if (delay) el.style.transitionDelay = `${delay}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in-view');
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [type, threshold, delay]);

  return { ref, inView };
}

/** Attach anim class directly to an existing ref */
export function useAnimateRef<T extends HTMLElement>(
  ref: React.RefObject<T>,
  type: AnimationType = 'fade-up',
  options: { threshold?: number; delay?: number } = {}
) {
  const { threshold = 0.15, delay = 0 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add(classMap[type]);
    if (delay) el.style.transitionDelay = `${delay}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in-view');
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, type, threshold, delay]);
}
