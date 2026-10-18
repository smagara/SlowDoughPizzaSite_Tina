import React from 'react';

/**
 * Small styled primitives for the staff editor. They reuse the public site's palette
 * (cream #faf8f5, ink #24211e, terracotta #c85a32, parchment borders) so the editor feels like
 * a back room of the same pizzeria rather than a generic admin panel.
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md' }
> = ({ variant = 'secondary', size = 'md', className = '', children, ...rest }) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c85a32]';
  const sizes = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm';
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-[#24211e] text-[#faf8f5] hover:bg-[#38312b] shadow-sm',
    secondary: 'bg-[#f0e7dc] text-[#3d352e] hover:bg-[#e6dcce] border border-[#ded3c5]',
    ghost: 'bg-transparent text-[#5c5044] hover:bg-[#f0e8dc]',
    danger: 'bg-[#f7e6df] text-[#8c3d1e] hover:bg-[#f1d6ca] border border-[#e8c7b8]',
  };
  return (
    <button type="button" className={`${base} ${sizes} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...rest }) => (
  <div className={`bg-[#faf7f2] rounded-2xl border border-[#e2d6c7] shadow-xs ${className}`} {...rest}>
    {children}
  </div>
);

export const Badge: React.FC<{ tone?: 'neutral' | 'accent' | 'success' | 'warn'; children: React.ReactNode; className?: string }> = ({
  tone = 'neutral',
  children,
  className = '',
}) => {
  const tones = {
    neutral: 'bg-[#eee7dd] text-[#63574c]',
    accent: 'bg-[#f5e4dc] text-[#8c3d1e]',
    success: 'bg-[#e4ede1] text-[#335928]',
    warn: 'bg-[#fbeede] text-[#8a4224]',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
};

export const inputClass = (invalid?: boolean) =>
  `w-full rounded-lg border bg-[#fffdfa] px-3 py-2 text-sm text-[#24211e] placeholder:text-[#a69a8d] focus:outline-none focus:ring-2 focus:ring-[#c85a32]/60 focus:border-[#c85a32] transition-colors ${
    invalid ? 'border-[#c85a32] bg-[#fdf4f0]' : 'border-[#ded3c5]'
  }`;

export const FieldShell: React.FC<{
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  inline?: boolean;
}> = ({ id, label, description, error, required, children, inline }) => {
  const help = (
    <>
      {description && !error && <p className="text-xs text-[#8d7e70] leading-relaxed">{description}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-[#a84d2a] flex items-start gap-1">
          <span aria-hidden>✕</span>
          <span>{error}</span>
        </p>
      )}
    </>
  );
  if (inline) {
    return (
      <div className="flex items-start gap-3">
        {children}
        <div className="space-y-1">
          <label htmlFor={id} className="block text-sm font-medium text-[#3d352e] leading-5 cursor-pointer">
            {label}
          </label>
          {help}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-[#6e6052]">
        {label}
        {required && <span className="text-[#c85a32]"> *</span>}
      </label>
      {children}
      {help}
    </div>
  );
};

export const SectionHeading: React.FC<{ eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }> = ({
  eyebrow,
  title,
  description,
  actions,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-[#e2d6c7]">
    <div>
      {eyebrow && <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#c85a32]">{eyebrow}</span>}
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#24211e] mt-1">{title}</h2>
      {description && <p className="mt-1 text-sm text-[#615448] max-w-2xl">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

export const Notice: React.FC<{ tone?: 'info' | 'success' | 'error' | 'warn'; title?: string; children: React.ReactNode; className?: string }> = ({
  tone = 'info',
  title,
  children,
  className = '',
}) => {
  const tones = {
    info: 'bg-[#f2ebdf] border-[#ded3c5] text-[#5c5044]',
    success: 'bg-[#e9f0e5] border-[#c9dcc1] text-[#2f4f27]',
    error: 'bg-[#fbeae3] border-[#ebc8b9] text-[#7f3417]',
    warn: 'bg-[#fbf0df] border-[#ead5b6] text-[#6f4a1a]',
  };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border p-4 text-sm leading-relaxed ${tones[tone]} ${className}`}>
      {title && <strong className="block font-semibold mb-1 text-[#24211e]">{title}</strong>}
      {children}
    </div>
  );
};
