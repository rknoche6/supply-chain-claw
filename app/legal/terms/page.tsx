import { Container, Card, Pill } from "../../components";

export default function TermsPage() {
  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Legal</Pill>
        <h1>Terms of Service</h1>
        <p>Usage terms for Supply Chain Claw.</p>
      </header>

      <Card>
        <p>
          This page is a placeholder for final terms. Replace with your legal terms and conditions
          before production use.
        </p>
      </Card>
    </Container>
  );
}
