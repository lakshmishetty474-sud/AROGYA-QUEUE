/**
 * Injects the AROGYA QUEUE logo mark into Header.jsx (left of the page title).
 * Idempotent: re-running will not add a second mark.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/components/layout/Header.jsx';
let text = readFileSync(file, 'utf8');

if (text.includes('data-aq-brand-mark')) {
  console.log('  already present - nothing to do');
  process.exit(0);
}

const anchor = `      {/* Left section: mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileNav}`;

const replacement = `      {/* Left section: mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {/* AROGYA QUEUE logo mark */}
        <img
          data-aq-brand-mark="1"
          src="/arogya-logo.png"
          alt="AROGYA QUEUE"
          className="h-12 w-auto object-contain shrink-0 hidden sm:block"
        />
        <button
          onClick={onToggleMobileNav}`;

if (!text.includes(anchor)) {
  console.log('  ANCHOR MISS - header left section not found');
  process.exit(1);
}

text = text.replace(anchor, replacement);
writeFileSync(file, text, 'utf8');
console.log('  header logo mark added');