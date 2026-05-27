import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react';

interface FadeDivProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

/** Drop-in replacement for useScrollFade — no hooks-in-callbacks issues. */
export function FadeDiv({ children, delay = 0, className = '', style = {} }: FadeDivProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(32px)';
    el.style.transition = `opacity 0.7s ${delay}ms ease, transform 0.7s ${delay}ms ease`;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return <div ref={ref} className={className} style={style}>{children}</div>;
}
