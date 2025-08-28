export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import dynamic from "next/dynamic";
const PaymentForm = dynamic(() => import("./PaymentForm"), { ssr: false });

export default function CheckoutPage() {
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>Checkout</h1>
      <PaymentForm />
    </main>
  );
}
