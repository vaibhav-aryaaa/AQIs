import React from 'react';
import { motion } from 'framer-motion';

export default function SplitText({
  text = '',
  delay = 0,
  stagger = 0.04,
  by = 'chars',
  style = {},
  className = ''
}) {
  const items = by === 'words' ? text.split(' ') : Array.from(text);

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren: delay }
    }
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        damping: 16,
        stiffness: 140
      }
    },
    hidden: {
      opacity: 0,
      y: 12,
      filter: 'blur(4px)'
    }
  };

  return (
    <motion.span
      style={{ 
        display: 'inline-flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        ...style 
      }}
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {items.map((item, index) => (
        <motion.span
          variants={child}
          style={{ 
            display: 'inline-block',
            marginRight: by === 'words' ? '0.25em' : '0em',
            whiteSpace: (by === 'chars' && item === ' ') ? 'pre' : 'normal'
          }}
          key={index}
        >
          {item}
        </motion.span>
      ))}
    </motion.span>
  );
}
