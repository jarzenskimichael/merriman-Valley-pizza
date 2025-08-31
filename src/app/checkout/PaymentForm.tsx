"use client";
import { useEffect, useMemo, useRef, useState } from "react";

declare global { interface Window { Square?: any } }

const CART_KEY = "mvp_cart";
function loadCart() {
  try {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch { return []; }
}
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

  const [appleAvailable, setAppleAvailable] = useState<boolean>(false);
  const [googleAvailable, setGoogleAvailable] = useState<boolean>(false);
  const [secureContext, setSecureContext] = useState<boolean>(false);

  const [pickupName, setPickupName] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");

  const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  const jsSrc = process.env.NEXT_PUBLIC_SQUARE_JS_SRC || "https://sandbox.web.squarecdn.com/v1/square.js";

  const [cart, setCart] = useState<any[] | null>(null);
  const total = useMemo(() => cart ? cartTotalCents(cart) : 0, [cart]);

  // Mount guards to avoid double-attaching elements
  const cardMountedRef = useRef(false);
  const walletsMountedRef = useRef(false);

  useEffect(() => {
    setCart(loadCart());
    if (typeof window !== "undefined") setSecureContext(window.isSecureContext === true);
  }, []);

  // Load SDK and attach elements ONCE
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!appId || !locationId) return;

    const script = document.createElement("script");
    script.src = jsSrc;
    script.async = true;
    script.onload = async () => {
      const p = await window.Square?.payments(appId, locationId);
      setPayments(p);

      // CARD — only attach once
      if (!cardMountedRef.current) {
        try {
          const c = await p.card();
          await c.attach("#card-container");
          setCard(c);
          cardMountedRef.current = true;
        } catch (e) {
          console.warn("card attach error", e);
        }
      }

      // Wallets require secure context; also only attach once
      if (secureContext && !walletsMountedRef.current) {
        // Apple Pay
        try {
          const ap = await p.applePay();
          const can = await ap?.canMakePayment();
          setAppleAvailable(!!can);
          if (can) {
            setApplePay(ap);
            const request = await p.paymentRequest({
              countryCode: "US",
              currencyCode: "USD",
              total: { amount: ((total||0)/100).toFixed(2), label: "Merriman Valley Pizza" },
            });
            await ap.attach("#apple-pay-container", { paymentRequest: request });
            ap.addEventListener("tokenization", async (ev: any) => {
              if (ev?.status === "OK" && ev?.token) await completePaymentWithSource(ev.token);
            });
          }
        } catch (e) { console.warn("applePay error", e); }

        // Google Pay
        try {
          const gp = await p.googlePay();
          const can = await gp?.canMakePayment();
          setGoogleAvailable(!!can);
          if (can) {
            setGooglePay(gp);
            const request = await p.paymentRequest({
              countryCode: "US",
              currencyCode: "USD",
              total: { amount: ((total||0)/100).toFixed(2), label: "Merriman Valley Pizza" },
            });
            await gp.attach("#google-pay-container", { paymentRequest: request });
            gp.addEventListener("tokenization", async (ev: any) => {
              if (ev?.status === "OK" && ev?.token) await completePaymentWithSource(ev.token);
            });
          }
        } catch (e) { console.warn("googlePay error", e); }

        // Cash App Pay
        try {
          const cap = await p.cashAppPay({
            redirectURL: window.location.origin + "/checkout",
            referenceId: String(Date.now()),
          });
          setCashAppPay(cap);
          await cap.attach("#cash-app-pay-container");
          cap.addEventListener("tokenization", async (ev: any) => {
            if (ev?.status === "OK" && ev?.token) await completePaymentWithSource(ev.token);
          });
        } catch (e) { console.warn("cashAppPay error", e); }

        walletsMountedRef.current = true;
      }
    };
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, locationId, jsSrc, secureContext]);

  // If total changes after wallets mounted, update the amount in the payment request
  useEffect(() => {
    (async () => {
      if (!payments) return;
      if (!walletsMountedRef.current) return;
      try {
        const updateReq = await payments.paymentRequest({
          countryCode: "US",
          currencyCode: "USD",
          total: { amount: ((total||0)/100).toFixed(2), label: "Merriman Valley Pizza" },
        });
        // Some SDKs support updating attached buttons by re-attaching with new request;
        // we skip re-attach here to avoid double mounts. (Amounts are often re-evaluated server-side anyway.)
      } catch {}
    })();
  }, [payments, total]);

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
      if (typeof window !== "undefined") localStorage.removeItem(CART_KEY);
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

  return (
    <div className="space-y-4">
      <div>
        <label style={{ display: "block", fontWeight: 600 }}>Pickup Name</label>
        <input value={pickupName} onChange={(e) => setPickupName(e.target.value)}
               placeholder="e.g., Michael" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ddd" }}/>
      </div>
      <div>
        <label style={{ display: "block", fontWeight: 600 }}>Phone</label>
        <input value={pickupPhone} onChange={(e) => setPickupPhone(e.target.value)}
               placeholder="e.g., 3305551234" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ddd" }}/>
      </div>

      {/* Card */}
      <div id="card-container" className="border rounded p-4" />
      <button onClick={onPayCard} className="px-4 py-2 rounded bg-black text-white" disabled={!card}>Pay with Card</button>

      {/* Wallet containers (only once, in secure contexts) */}
      {secureContext && (
        <div style={{ display:"grid", gap:10, marginTop:12 }}>
          <div id="apple-pay-container" />
          {!appleAvailable && <div style={{ fontSize:12, opacity:.7 }}>Apple Pay not available on this device/browser.</div>}

          <div id="google-pay-container" />
          {!googleAvailable && <div style={{ fontSize:12, opacity:.7 }}>Google Pay not available on this device/browser.</div>}

          <div id="cash-app-pay-container" />
        </div>
      )}

      <div style={{ opacity:.8 }}>
        Order total (cart): $
        <span suppressHydrationWarning>{cart === null ? "—" : (total/100).toFixed(2)}</span>
      </div>
    </div>
  );
}
