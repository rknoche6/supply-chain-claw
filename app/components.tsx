export function Container({ children }: { children: React.ReactNode }) {
  return <main className="container">{children}</main>;
}

export function Card({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      {title ? <h2>{title}</h2> : null}
      {subtitle ? <p className="sectionIntro">{subtitle}</p> : null}
      {children}
    </section>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "success";
}) {
  return <span className={`pill pill--${tone}`}>{children}</span>;
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="statGrid">{children}</div>;
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="statCard">
      <p className="statLabel">{label}</p>
      <p className="statValue">{value}</p>
      {hint ? <p className="statHint">{hint}</p> : null}
    </article>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="sectionHeader">
      {eyebrow ? <p className="sectionEyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <p className="sectionIntro">{description}</p> : null}
    </header>
  );
}

export function TokenSwatch({
  label,
  token,
  value,
}: {
  label: string;
  token: string;
  value: string;
}) {
  return (
    <article className="tokenSwatch">
      <span
        className="swatchChip"
        style={{ backgroundColor: `var(${token})` }}
        aria-hidden="true"
      />
      <div>
        <p className="swatchLabel">{label}</p>
        <p className="swatchMeta">
          {token} · {value}
        </p>
      </div>
    </article>
  );
}
