type ContainerProps = { children: React.ReactNode };

type CardProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

type PillProps = {
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "success";
};

export function Container({ children }: ContainerProps) {
  return <main className="container">{children}</main>;
}

export function Card({ title, subtitle, children }: CardProps) {
  return (
    <section className="card">
      {title ? <h2>{title}</h2> : null}
      {subtitle ? <p className="sectionIntro">{subtitle}</p> : null}
      {children}
    </section>
  );
}

export function Pill({ children, tone = "neutral" }: PillProps) {
  return <span className={`pill pill--${tone}`}>{children}</span>;
}
