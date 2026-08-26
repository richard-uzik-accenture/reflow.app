import { useState, type FormEvent } from 'react';
import { TITLE_MAX_LENGTH, validateTitle } from '../lib/validation';

interface BrainDumpProps {
  onAdd: (title: string) => void;
  onDone: () => void;
}

export function BrainDump({ onAdd, onDone }: BrainDumpProps) {
  const [value, setValue] = useState('');
  const [entries, setEntries] = useState<string[]>([]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = validateTitle(value);
    if (!result.ok) return;
    onAdd(result.value);
    setEntries((prev) => [...prev, result.value]);
    setValue('');
  }

  return (
    <div className="braindump-shell">
      <p className="braindump-sub">what's new today? add as many as you want, in any order — you'll sort them next.</p>
      <form onSubmit={handleSubmit} className="braindump-form">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="add a task"
          className="braindump-input"
          maxLength={TITLE_MAX_LENGTH}
        />
        <button type="submit" className="braindump-add">add</button>
      </form>
      <ul className="braindump-list">
        {entries.length === 0 ? (
          <li className="braindump-entry-placeholder">nothing added yet</li>
        ) : (
          entries.map((title, i) => (
            <li key={i} className="braindump-entry">{title}</li>
          ))
        )}
      </ul>
      <button className="braindump-done" onClick={onDone}>done adding — sort the day</button>
    </div>
  );
}
