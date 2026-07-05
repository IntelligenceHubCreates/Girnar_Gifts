import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { brand } from '@/config/brand';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updatedLabel="Last updated: TBD">
      <p>
        {brand.legalName} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates {brand.url}. This
        policy explains what personal information we collect, how we use it, and the choices you have.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>Account details: name, email, phone number, delivery addresses.</li>
        <li>Order details: items purchased, payment status (payment card/UPI details are handled by our payment gateway, not stored by us).</li>
        <li>Usage data: pages visited, device/browser information, cookies.</li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To process and deliver your orders.</li>
        <li>To communicate order updates, offers, and support responses.</li>
        <li>To improve our website and product catalog.</li>
        <li>To comply with legal and tax obligations under Indian law.</li>
      </ul>

      <h2>Sharing of information</h2>
      <p>
        We share information with delivery/logistics partners, payment gateways, and cloud service
        providers strictly to fulfil your order. We do not sell your personal data.
      </p>

      <h2>Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data by writing to{' '}
        <a href={`mailto:${brand.email.support}`}>{brand.email.support}</a>.
      </p>

      <h2>Contact</h2>
      <p>
        {brand.legalName}
        <br />
        {brand.business.address}
        <br />
        GSTIN: {brand.business.gstin}
        <br />
        Email: <a href={`mailto:${brand.email.support}`}>{brand.email.support}</a>
      </p>

      <p>
        <em>
          This is placeholder policy text for the Girnar Gifts migration and has not been reviewed by a
          lawyer. Please have qualified legal counsel review this page before it is used to serve real
          customers.
        </em>
      </p>
    </LegalPageLayout>
  );
}
