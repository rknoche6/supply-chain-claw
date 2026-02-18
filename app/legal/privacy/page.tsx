import { Container, Card, Pill } from "../../components";

export default function PrivacyPage() {
  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Legal</Pill>
        <h1>Privacy Policy</h1>
        <p>How data is handled in Supply Chain Claw.</p>
      </header>

      <Card>
        <p>
          Supply Chain Claw displays source-cited trade and materials data. This page is a
          placeholder and should be replaced with your final legal policy text.
        </p>
      </Card>
    </Container>
  );
}
