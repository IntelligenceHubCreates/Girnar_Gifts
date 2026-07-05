import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { brand } from '@/config/brand';

export const metadata = { title: 'Refund & Returns Policy' };

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Refund & Returns Policy" updatedLabel="Last updated: TBD">
      <p>
        We want you to be happy with your order from {brand.legalName}. This policy explains how
        returns, replacements, and refunds work.
      </p>

      <h2>Return window</h2>
      <p>
        Most items can be returned within 7 days of delivery, provided they are unused, undamaged,
        and in their original packaging. Personalised/customised items may not be eligible for return
        unless received damaged or defective.
      </p>

      <h2>How to request a return</h2>
      <p>
        Sign in to <a href="/account/orders">My Orders</a> and select the order you&apos;d like to
        return, or email <a href={`mailto:${brand.email.support}`}>{brand.email.support}</a> with your
        order number.
      </p>

      <h2>Refunds</h2>
      <p>
        Once your returned item is received and inspected, refunds are issued to the original payment
        method within 5-7 business days.
      </p>

      <h2>Damaged or incorrect items</h2>
      <p>
        If your order arrives damaged or incorrect, contact us within 48 hours of delivery with
        photos of the item and packaging so we can arrange a replacement or refund at no extra cost.
      </p>

      <h2>Contact</h2>
      <p>
        {brand.legalName}
        <br />
        {brand.business.address}
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
