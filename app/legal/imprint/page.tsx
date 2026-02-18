import { Container, Card, Pill } from "../../components";

export default function ImprintPage() {
  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Legal</Pill>
        <h1>Imprint</h1>
        <p>Provider and contact details.</p>
      </header>

      <Card>
        <p>
          This page is a placeholder for organization/company identification and contact details.
        </p>
      </Card>
    </Container>
  );
}
