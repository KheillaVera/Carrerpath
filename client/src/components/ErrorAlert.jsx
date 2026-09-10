import { AlertCircle } from 'lucide-react';

export default function ErrorAlert({ message, className = '' }) {
  if (!message) return null;
  return (
    <div role="alert" className={`alert-danger animate-fade-in ${className}`}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span className="min-w-0">{message}</span>
    </div>
  );
}
