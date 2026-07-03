import { useEffect } from "react";

export const useReveal = () => {
  useEffect(() => {
    const selector = ".reveal, .reveal-left, .reveal-right, .reveal-up-lg";
    const els = document.querySelectorAll<HTMLElement>(selector);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
};
