const focusAreas = [
  "Global map foundation (countries, routes, ports)",
  "CPU/GPU supply chains (fab -> packaging -> distribution)",
  "Raw materials (silicon, copper, lithium, rare earths)",
  "Food chains (vegetables, fruits, cold chain logistics)",
];

export default function HomePage() {
  return (
    <main className="container">
      <h1>Supply Chain Claw</h1>
      <p>
        A growing open project to map how goods move from raw materials to finished products.
        This is phase 1: a base website and roadmap.
      </p>

      <section className="card">
        <h2>Roadmap</h2>
        <ol>
          {focusAreas.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h2>Map placeholder</h2>
        <div className="mapPlaceholder">Interactive global supply map coming next.</div>
      </section>
    </main>
  );
}
