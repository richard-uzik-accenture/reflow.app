import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { TagInput } from './TagInput';
import { TimePicker } from './TimePicker';

interface TaskModalProps {
  mode: 'add' | 'edit';
  initial?: { title: string; tags?: string[]; due_time?: string | null };
  knownTags?: string[];
  onSubmit: (values: { title: string; tags: string[]; due_time?: string | null }) => void | Promise<boolean>;
  onClose: () => void;
}

export function TaskModal({ mode, initial, knownTags = [], onSubmit, onClose }: TaskModalProps) {
  const [value, setValue] = useState(initial?.title ?? '');
  const [tags, setTags] = useState(initial?.tags ?? []);
  const [dueTime, setDueTime] = useState(initial?.due_time ?? '');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const reducedMotion = useReducedMotion();
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const borderHeight = el.offsetHeight - el.clientHeight;
    el.style.height = `${el.scrollHeight + borderHeight}px`;
  }, [value]);

  function handleTitleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) {
      setTitleError('give this task a name');
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    const result = mode === 'edit'
      ? await onSubmit({ title, tags, due_time: dueTime || null })
      : await onSubmit({ title, tags });
    setSubmitting(false);
    if (result === false) {
      setSubmitError("couldn't save — try again");
    }
  }

  return (
    <motion.div
      className="modal-scrim"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.form
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } }}
        exit={{ opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.15 } }}
      >
        <label className="modal-label" htmlFor="task-modal-input">
          {mode === 'add' ? 'what needs doing?' : 'edit this'}
        </label>
        <textarea
          id="task-modal-input"
          ref={titleRef}
          className={titleError ? 'modal-input modal-input-error' : 'modal-input'}
          rows={1}
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (titleError) setTitleError(null);
          }}
          onKeyDown={handleTitleKeyDown}
          placeholder="e.g. call the plumber back"
          aria-invalid={titleError ? true : undefined}
        />
        {titleError && <p className="modal-field-error" role="alert">{titleError}</p>}
        <label className="modal-label" htmlFor="task-modal-tags">tags</label>
        <TagInput value={tags} known={knownTags} onChange={setTags} />
        {mode === 'edit' && (
          <>
            <label className="modal-label" htmlFor="task-modal-due-time">due time (optional)</label>
            <div className="due-time-field">
              <TimePicker id="task-modal-due-time" value={dueTime} onChange={setDueTime} />
            </div>
          </>
        )}
        {submitError && <p className="modal-field-error" role="alert">{submitError}</p>}
        <div className="modal-actions">
          <button type="button" className="modal-cancel" onClick={onClose}>cancel</button>
          <button type="submit" className="modal-submit" disabled={submitting}>
            {submitting ? 'saving…' : mode === 'add' ? 'add task' : 'save'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
