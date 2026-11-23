export const CARD_CLASS = "rounded-lg border border-border bg-surface p-6 shadow-sm";
export const LABEL_CLASS = "block text-sm font-medium text-ink";
export const INPUT_CLASS =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-ink";
export const BUTTON_CLASS =
  "inline-flex w-full justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-surface disabled:opacity-60";
export const ERROR_CLASS = "rounded-md border border-danger px-3 py-2 text-sm text-danger";
export const NOTICE_CLASS = "rounded-md border border-success px-3 py-2 text-sm text-success";

export function FormCard({ title, description, children, footer }) {
  return (
    <section className={CARD_CLASS}>
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
      </div>
      <div className="mt-6">{children}</div>
      {footer ? <p className="mt-5 text-sm text-ink-muted">{footer}</p> : null}
    </section>
  );
}

export function FormError({ message }) {
  if (!message) return null;

  return (
    <p role="alert" className={ERROR_CLASS}>
      {message}
    </p>
  );
}

export function FormNotice({ children }) {
  if (!children) return null;

  return (
    <p role="status" className={NOTICE_CLASS}>
      {children}
    </p>
  );
}
