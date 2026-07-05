import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { brand } from '@/config/brand';

export const metadata = { title: 'Shipping Policy' };

export default function ShippingPolicyPage() {
  return (
    <LegalPageLayout title="Shipping Policy" updatedLabel="Last updated: TBD">
      <p>
        {brand.legalName} ships across India. This policy explains delivery timelines, charges, and
        tracking.
      </p>

      <h2>Delivery timelines</h2>
      <p>
        Orders are typically dispatched within 1-2 business days and delivered within 3-7 business
        days depending on your location. Personalised/customised items may take longer to prepare
        before dispatch.
      </p>

      <h2>Shipping charges</h2>
      <p>
        Shipping charges (if any) are calculated at checkout based on your delivery address and order
        value. Orders above a threshold displayed at checkout may qualify for free shipping.
      </p>

      <h2>Order tracking</h2>
      <p>
        Once your order ships, you&apos;ll receive a tracking link by email/SMS. You can also track
        your order from the <a href="/track-order">Track Order</a> page.
      </p>

      <h2>Delivery issues</h2>
      <p>
        If your order is delayed, missing, or delivered to the wrong address, contact us at{' '}
        <a href={`mailto:${brand.email.support}`}>{brand.email.support}</a> with your order number.
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
