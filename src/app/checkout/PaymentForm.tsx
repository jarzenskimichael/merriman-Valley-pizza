"use client";
import { useEffect, useMemo, useState } from "react";

declare global { interface Window { Square?: any } }

const CART_KEY = "mvp_cart";
function loadCart() { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } }
function cartToLineItems(cart: any[]) {
  const arr = cart.length > 0 ? cart : [
    { name: "Large Pepperoni Pizza", quantity: 1, basePriceMoney: { amount: 1999, currency: "USD" } }
  ];
  return arr.map((l:any) => ({
    name: l.name,
    quantity: String(l.quantity || 1),
    basePriceMoney: l.basePriceMoney
  }));
}
function cartTotalCents(cart: any[]) {
  const arr = cart.length > 0 ? cart : [{ quantity: 1, basePriceMoney: { amount: 1999 } }];
  return arr.reduce((s:any, l:any) => s + (Number(l.basePriceMoney?.amount||0) * Number(l.quantity||1)), 0);
}

export default function PaymentForm() {
  const [payments, setPayments] = useState<any>(null);
  const [card, setCard] = useState<any>(null);
  const [applePay, setApplePay] = useState<any>(null);
  const [googlePay, setGooglePay] = useState<any>(null);
  const [cashAppPay, setCashAppPay] = useState<any>(null);

  const [pickupName, setPickupName] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");

  // Hydration-safe cart
  const [cart, setCart] = useState<any[] | null>(null);
  const total = useMemo(() => cart ? cartTotalCents(cart) : 0, [cart]);

  useEffect(() => { setCart(loadCart()); }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = process.env.NEXT_PUBLIC_SQUARE_JS_SRC || "https://sandbox.web.squarecdn.com/v1/square.js";
    script.async = true;
    script.onload = async () => {
      const p = await window.Square?.payments(
        process.env.NEXT_PUBLIC_SQUARE_APP_ID,
        process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
      );
      setPayments(p);

      // Card
      try {
        const c = await p.card();
        await c.attach("#card-container");
        setCard(c);
      } catch {}

      // Apple Pay
      try {
        const ap = await p.applePay();
        const can = await ap?.canMakePayment();
        if (can) {
          setApplePay(ap);
          const btn = document.getElementById("apple-pay-button");
          if (btn) btn.style.display = "inline-flex";
        }
      } catch {}

      // Google Pay
      try {
        const gp = await p.googlePay();
        const can = await gp?.canMakePayment();
        if (can) {
          setGooglePay(gp);
          const btn = document.getElementById("google-pay-button");
          if (btn) btn.style.display = "inline-flex";
        }
      } catch {}

      // Cash App Pay (generally available across browsers)
      try {
        const cap = await p.cashAppPay({
          redirectURL: window.location.origin + "/checkout",
          referenceId: String(Date.now()),
        });
        setCashAppPay(cap);
        const btn = document.getElementById("cash-app-pay-button");
        if (btn) btn.style.display = "inline-flex";
      } catch {}
    };
    document.body.appendChild(script);
  }, []);

  async function completePaymentWithSource(sourceId: string) {
    const r = await fetch("/api/square/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceId,
        lineItems: cartToLineItems(cart || []),
        pickupName,
        pickupPhone,
        pickupWhen: "ASAP",
        note: "Order from /menu",
      }),
    });
    const data = await r.json();
    if (data.ok) {
      localStorage.removeItem(CART_KEY);
      alert("Payment successful!");
      try { window.location.href = "/kds"; } catch {}
    } else {
      alert(`Payment failed: ${data.error ?? ""}`);
    }
  }

  async function onPayCard() {
    if (!card) return;
    const res = await card.tokenize();
    if (res.status !== "OK") { alert("Card tokenization failed"); return; }
    completePaymentWithSource(res.token);
  }

  async function onPayApple() {
    if (!applePay || !payments || cart == null) return;
    try {
      const request = await payments.paymentRequest({
        countryCode: "US",
        currencyCode: "USD",
        total: { amount: ((total||0)/100).toFixed(2), label: "Merriman Valley Pizza" },
      });
      const res = await applePay.tokenize({ paymentRequest: request });
      if (res.status !== "OK") { alert("Apple Pay failed"); return; }
      completePaymentWithSource(res.token);
    } catch (e:any) { alert("Apple Pay error: " + (e?.message || String(e))); }
  }

  async function onPayGoogle() {
    if (!googlePay || !payments || cart == null) return;
    try {
      const request = await payments.paymentRequest({
        countryCode: "US",
        currencyCode: "USD",
        total: { amount: ((total||0)/100).toFixed(2), label: "Merriman Valley Pizza" },
      });
      const res = await googlePay.tokenize({ paymentRequest: request });
      if (res.status !== "OK") { alert("Google Pay failed"); return; }
      completePaymentWithSource(res.token);
    } catch (e:any) { alert("Google Pay error: " + (e?.message || String(e))); }
  }

  async function onPayCashApp() {
    if (!cashAppPay || cart == null) return;
    try {
      const res = await cashAppPay.tokenize({ amount: { amount: total || 0, currencyCode: "USD" } as any });
      if (res.status !== "OK") { alert("Cash App Pay failed"); return; }
      completePaymentWithSource(res.token);
    } catch (e:any) { alert("Cash App Pay error: " + (e?.message || String(e))); }
  }

  return (
    <div className="space-y-4">
      {/* Pickup fields */}
      <div>
        <label style={{ display: "block", fontWeight: 600 }}>Pickup Name</label>
        <input
          value={pickupName}
          onChange={(e) => setPickupName(e.target.value)}
          placeholder="e.g., Michael"
          style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
        />
      </div>
      <div>
        <label style={{ display: "block", fontWeight: 600 }}>Phone</label>
        <input
          value={pickupPhone}
          onChange={(e) => setPickupPhone(e.target.value)}
          placeholder="e.g., 3305551234"
          style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
        />
      </div>

      {/* Card */}
      <div id="card-container" className="border rounded p-4" />

      {/* Wallet buttons */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <button onClick={onPayCard} className="px-4 py-2 rounded bg-black text-white">Pay with Card</button>

        <button id="apple-pay-button" onClick={onPayApple}
          style={{ display:"none", alignItems:"center", gap:6, padding:"8px 12px", borderRadius:8, border:"1px solid #ddd", background:"#fff" }}>
           Pay
        </button>

        <button id="google-pay-button" onClick={onPayGoogle}
          style={{ display:"none", alignItems:"center", gap:6, padding:"8px 12px", borderRadius:8, border:"1px solid #ddd", background:"#fff" }}>
          Google Pay
        </button>

        <button id="cash-app-pay-button" onClick={onPayCashApp}
          style={{ display:"none", alignItems:"center", gap:6, padding:"8px 12px", borderRadius:8, border:"1px solid #ddd", background:"#fff" }}>
          Cash App Pay
        </button>
      </div>

      {/* Hydration-safe total */}
      <div style={{ opacity:.8 }}>
        Order total (cart): $
        <span suppressHydrationWarning>
          {cart === null ? "—" : (total/100).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
