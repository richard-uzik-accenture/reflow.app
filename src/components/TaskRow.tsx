import { useEffect, useRef, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import type { Task } from '../lib/tasks';
import { useLongPressDrag, LONG_PRESS_MS } from '../hooks/useLongPressDrag';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { dueLabel, isPast } from '../lib/dueTime';
import { Check } from './icons/Check';
import { Close } from './icons/Close';
import { Pencil } from './icons/Pencil';

const DUE_TIME_TICK_MS = 60_000;

interface TaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
  onReorderCommit: () => void;
  onEdit?: (task: Task) => void;
  failed?: boolean;
}

export function TaskRow({ task, onComplete, onDrop, onReorderCommit, onEdit, failed }: TaskRowProps) {
  const { dragControls, charging, ref, onPointerDown } = useLongPressDrag();
  const [now, setNow] = useState(() => new Date());
  const reducedMotion = useReducedMotion();
  const titleRef = useRef<HTMLSpanElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  const measureTitleHeight = () => {
    const el = titleRef.current;
    if (el) el.style.setProperty('--title-expanded-height', `${el.scrollHeight}px`);
  };

  const handleTitleTap = () => {
    measureTitleHeight();
    setExpanded((prev) => !prev);
  };

  useEffect(() => {
    const el = titleRef.current;
    if (el) setTruncated(el.scrollHeight > el.clientHeight);
  }, [task.title]);

  useEffect(() => {
    if (!task.due_time) return;
    const tick = () => setNow(new Date());
    const interval = window.setInterval(tick, DUE_TIME_TICK_MS);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [task.due_time]);

  return (
    <Reorder.Item
      ref={ref}
      value={task}
      dragListener={false}
      dragControls={dragControls}
      onPointerDown={onPointerDown}
      onDragEnd={onReorderCommit}
      onMouseEnter={measureTitleHeight}
      onFocus={measureTitleHeight}
      className="task-row"
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{
        opacity: 1,
        height: 'auto',
        marginBottom: 8,
        scale: charging ? 0.98 : 1,
        backgroundColor: charging || failed ? 'var(--haze)' : 'var(--mist)',
        x: failed && !reducedMotion ? [0, -6, 6, -4, 4, 0] : 0,
      }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 12px 24px -10px rgba(23, 19, 53, 0.35)',
        transition: { boxShadow: { duration: 0.15 } },
      }}
      transition={{
        layout: { type: 'spring', stiffness: 300, damping: 30, mass: 0.9 },
        opacity: { duration: 0.2 },
        height: { duration: 0.2 },
        marginBottom: { duration: 0.2 },
        scale: { duration: LONG_PRESS_MS / 1000 },
        backgroundColor: { duration: LONG_PRESS_MS / 1000 },
        x: { duration: 0.4 },
      }}
    >
      <span className="rank" aria-hidden="true" />
      <motion.button
        aria-label="mark settled"
        onClick={() => onComplete(task.id)}
        className="check"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.88 }}
      >
        <Check width={12} height={12} />
      </motion.button>
      <span className="title-group">
        <span
          ref={titleRef}
          className={[
            'title',
            expanded && 'title-expanded',
            truncated && !expanded && 'title-truncated',
          ].filter(Boolean).join(' ')}
          aria-expanded={expanded}
          onClick={handleTitleTap}
        >
          {task.title}
        </span>
        {(task.tags.length > 0 || task.due_time) && (
          <span className="task-tags">
            {task.due_time && (
              <span className={isPast(task.due_time, now) ? 'due-chip due-chip-past' : 'due-chip'}>
                {dueLabel(task.due_time, now)}
              </span>
            )}
            {task.tags.map((tag) => (
              <span key={tag} className="tag-chip">{tag}</span>
            ))}
          </span>
        )}
      </span>
      {onEdit && (
        <motion.button
          aria-label="edit this"
          onClick={() => onEdit(task)}
          className="edit"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.88 }}
        >
          <Pencil width={14} height={14} />
        </motion.button>
      )}
      <motion.button
        aria-label="let it go"
        onClick={() => onDrop(task.id)}
        className="close"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.88 }}
      >
        <Close width={14} height={14} />
      </motion.button>
    </Reorder.Item>
  );
}
