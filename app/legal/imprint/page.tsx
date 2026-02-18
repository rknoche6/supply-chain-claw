import { Container, Card, Pill } from "../../components";

const LAST_UPDATED = "2026-02-18";

export default function ImprintPage() {
  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Legal</Pill>
        <h1>Imprint</h1>
        <p>Last updated: {LAST_UPDATED}</p>
      </header>

      <Card>
        <h2>Service Provider</h2>
        <p>
          <strong>Supply Chain Claw</strong>
          <br />
          Operator: <em>[Insert legal entity or full name]</em>
          <br />
          Address: <em>[Insert registered address]</em>
          <br />
          Country: <em>[Insert country]</em>
        </p>

        <h2>Contact</h2>
        <p>
          Email: <em>[Insert legal/contact email]</em>
          <br />
          Phone: <em>[Optional: insert phone]</em>
        </p>

        <h2>Authorized Representative</h2>
        <p>
          <em>[Insert representative name, if applicable]</em>
        </p>

        <h2>Commercial Register / VAT</h2>
        <p>
          Register: <em>[Insert register + number, if applicable]</em>
          <br />
          VAT ID: <em>[Insert VAT ID, if applicable]</em>
        </p>

        <h2>Regulatory Information</h2>
        <p>
          Supervisory authority: <em>[Insert authority, if applicable]</em>
          <br />
          Professional rules: <em>[Insert if applicable]</em>
        </p>

        <h2>Dispute Resolution</h2>
        <p>
          We are not obliged and generally not willing to participate in dispute resolution
          proceedings before a consumer arbitration board unless mandatory law requires it.
        </p>

        <h2>Liability for Content and Links</h2>
        <p>
          We are responsible for our own content under applicable law. External links are provided
          for convenience; the operators of linked pages are solely responsible for their content.
        </p>

        <h2>Copyright Notice</h2>
        <p>
          Unless otherwise indicated, content and design on this site are protected by copyright.
          Reuse beyond legal exceptions requires prior permission.
        </p>

        <p className="sectionIntro">
          Note: Replace all placeholder fields in this Imprint before relying on it in production.
        </p>
      </Card>
    </Container>
  );
}
