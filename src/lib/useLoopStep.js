import { useEffect, useState } from 'react';
import { useInView } from 'framer-motion';

// Advances a step index on an interval, only while `ref` is on screen.
// With reduced motion it returns the last step, so demos show their complete state.
export function useLoopStep(ref, total, ms, reduce) {
  const inView = useInView(ref, { margin: '-60px 0px' });
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!inView || reduce) return;
    const id = setInterval(() => setStep(s => (s + 1) % total), ms);
    return () => clearInterval(id);
  }, [inView, reduce, total, ms]);
  return reduce ? total - 1 : step;
}
