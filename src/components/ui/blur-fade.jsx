import { useRef } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';

export function BlurFade({
  children,
  className,
  duration = 0.4,
  delay = 0,
  offset = 6,
  direction = 'down',
  inView = false,
  blur = '6px',
  style,
  ...props
}) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: '-50px' });
  const isInView = !inView || inViewResult;

  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const sign = direction === 'right' || direction === 'down' ? -offset : offset;

  const variants = {
    hidden: { [axis]: sign, opacity: 0, filter: `blur(${blur})` },
    visible: { [axis]: 0,   opacity: 1, filter: 'blur(0px)' },
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        exit="hidden"
        variants={variants}
        transition={{ delay: 0.04 + delay, duration, ease: 'easeOut' }}
        className={className}
        style={style}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
