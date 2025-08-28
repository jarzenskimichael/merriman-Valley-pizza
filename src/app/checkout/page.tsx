export const dynamic = "force-dynamic"; // avoid SSG/ISR; wallets must run client-side

import PaymentForm from "./PaymentForm";

export default function CheckoutPage() {
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>Checkout</h1>
      <PaymentForm />
    </main>
  );
}
