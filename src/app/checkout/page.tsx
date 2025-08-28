import PaymentForm from "./PaymentForm";

export default function CheckoutPage() {
  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
      <PaymentForm />
    </main>
  );
}
