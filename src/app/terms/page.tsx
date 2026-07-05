import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { brand } from '@/config/brand';

export const metadata = { title: 'Terms & Conditions' };

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms & Conditions" updatedLabel="Last updated: TBD">
      <p>
        These Terms &amp; Conditions govern your use of {brand.url}, operated by {brand.legalName}
        (&quot;we&quot;, &quot;us&quot;). By placing an order with us, you agree to these terms.
      </p>

      <h2>Orders &amp; pricing</h2>
      <p>
        All prices are listed in {brand.currency.code} and include applicable GST unless stated
        otherwise. We reserve the right to correct pricing errors and to cancel orders placed at an
        incorrect price, with a full refund.
      </p>

      <h2>Payments</h2>
      <p>
        Payments are processed via Razorpay. We do not store your card, UPI, or net-banking
        credentials.
      </p>

      <h2>Shipping &amp; delivery</h2>
      <p>
        See our <a href="/shipping-policy">Shipping Policy</a> for delivery timelines and charges.
      </p>

      <h2>Returns &amp; refunds</h2>
      <p>
        See our <a href="/refund-policy">Refund Policy</a> for eligibility and process.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India, and disputes are subject to the jurisdiction of
        the courts local to {brand.legalName}&apos;s registered address.
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
