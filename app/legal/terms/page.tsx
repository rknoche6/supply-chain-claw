import { Container, Card, Pill } from "../../components";

const LAST_UPDATED = "2026-02-18";

export default function TermsPage() {
  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Legal</Pill>
        <h1>Terms of Service</h1>
        <p>Last updated: {LAST_UPDATED}</p>
      </header>

      <Card>
        <h2>1. Scope</h2>
        <p>
          These Terms govern your use of Supply Chain Claw (the “Service”), including the website,
          data views, compare tools, and related features.
        </p>

        <h2>2. No Professional Advice</h2>
        <p>
          The Service provides informational data and analytics. It does not constitute legal,
          financial, investment, trade compliance, tax, or other professional advice. You are
          responsible for independent verification before making business or legal decisions.
        </p>

        <h2>3. Data and Accuracy</h2>
        <p>
          We aim to provide source-cited and structured information. However, datasets may contain
          delays, omissions, estimation differences, or source inconsistencies. We do not guarantee
          completeness, uninterrupted availability, or fitness for a particular purpose.
        </p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>use the Service for unlawful activity;</li>
          <li>attempt unauthorized access, disruption, or abuse of infrastructure;</li>
          <li>automate excessive scraping that degrades service performance;</li>
          <li>misrepresent sourced data as your own without proper attribution where required.</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>
          The Service UI, code, and original presentation are protected by applicable IP laws.
          Third-party data and trademarks remain the property of their respective owners and may be
          subject to separate licenses.
        </p>

        <h2>6. Availability and Changes</h2>
        <p>
          We may modify, suspend, or discontinue parts of the Service at any time, including data
          fields, features, routes, and legal documents.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, the Service is provided “as is” and “as
          available.” We are not liable for indirect, incidental, special, consequential, or
          punitive damages, or for lost profits/revenue/data resulting from use of the Service.
        </p>

        <h2>8. Indemnity</h2>
        <p>
          You agree to indemnify and hold harmless the Service operator from claims arising out of
          your misuse of the Service, your violation of these Terms, or your violation of applicable
          law.
        </p>

        <h2>9. Governing Law</h2>
        <p>
          Unless otherwise required by mandatory law, these Terms are governed by the law stated in
          the Imprint. Venue and jurisdiction follow the registered operator details listed there.
        </p>

        <h2>10. Contact</h2>
        <p>
          Legal and contact details are provided on the <a href="/legal/imprint">Imprint</a> page.
        </p>
      </Card>
    </Container>
  );
}
