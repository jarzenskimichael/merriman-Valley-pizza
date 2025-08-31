"use client";
import { useEffect, useMemo, useRef, useState } from "react";
declare global { interface Window { Square?: any } }

const CART_KEY = "mvp_cart";
function loadCart(){ try{ if (typeof window==="undefined") return []; return JSON.parse(localStorage.getItem(CART_KEY)||"[]"); }catch{ return []; } }
function cartToLineItems(cart:any[]){ return (cart).map((l:any)=>({ name:l.name, quantity:String(l.quantity||1), basePriceMoney:l.basePriceMoney })); }
function cartTotalCents(cart:any[]){ return cart.reduce((s:number,l:any)=> s + Number(l.basePriceMoney?.amount||0)*Number(l.quantity||1), 0); }

export default function PaymentForm(){
  const [payments,setPayments]=useState<any>(null);
  const [card,setCard]=useState<any>(null);
  const [appleAvailable,setAppleAvailable]=useState(false);
  const [googleAvailable,setGoogleAvailable]=useState(false);
  const [secureContext,setSecureContext]=useState(false);
  const [pickupName,setPickupName]=useState(""); const [pickupPhone,setPickupPhone]=useState("");

  const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  const jsSrc = process.env.NEXT_PUBLIC_SQUARE_JS_SRC || "https://sandbox.web.squarecdn.com/v1/square.js";

  const [cart,setCart]=useState<any[]|null>(null);
  const total = useMemo(()=> cart? cartTotalCents(cart) : 0, [cart]);

  const scriptAddedRef = useRef(false);
  const cardMountedRef = useRef(false);
  const walletsMountedRef = useRef(false);

  useEffect(()=>{ setCart(loadCart()); if (typeof window!=="undefined") setSecureContext(window.isSecureContext===true); },[]);

  useEffect(()=>{
    if (typeof document==="undefined" || !appId || !locationId) return;

    // Add SDK once
    let script = document.querySelector('script[data-square-sdk="v1"]') as HTMLScriptElement | null;
    if (!script){
      script = document.createElement("script");
      script.src = jsSrc; script.async = true; script.setAttribute("data-square-sdk","v1");
      document.body.appendChild(script);
    }

    const mountOnce = async ()=>{
      const p = await window.Square?.payments(appId, locationId);
      setPayments(p);

      // Clear any accidental children before attach; then mount card ONCE
      const cc = document.getElementById("card-container");
      if (cc && cc.childElementCount>0) cc.innerHTML = "";
      if (!cardMountedRef.current){
        try{
          const c = await p.card();
          await c.attach("#card-container");
          setCard(c);
          cardMountedRef.current = true;
        }catch(e){ console.warn("card attach error", e); }
      }

      if (secureContext && !walletsMountedRef.current){
        try{
          const ap = await p.applePay(); const canAP = await ap?.canMakePayment(); setAppleAvailable(!!canAP);
          if (canAP){
            const req = await p.paymentRequest({ countryCode:"US", currencyCode:"USD", total:{ amount: ((total||0)/100).toFixed(2), label:"Merriman Valley Pizza" }});
            await ap.attach("#apple-pay-container", { paymentRequest: req });
            ap.addEventListener("tokenization", async (ev:any)=>{ if (ev?.status==="OK" && ev?.token) await complete(ev.token); });
          }
        }catch(e){ console.warn("applePay",e); }
        try{
          const gp = await p.googlePay(); const canGP = await gp?.canMakePayment(); setGoogleAvailable(!!canGP);
          if (canGP){
            const req = await p.paymentRequest({ countryCode:"US", currencyCode:"USD", total:{ amount: ((total||0)/100).toFixed(2), label:"Merriman Valley Pizza" }});
            await gp.attach("#google-pay-container", { paymentRequest: req });
            gp.addEventListener("tokenization", async (ev:any)=>{ if (ev?.status==="OK" && ev?.token) await complete(ev.token); });
          }
        }catch(e){ console.warn("googlePay",e); }
        try{
          const cap = await p.cashAppPay({ redirectURL: window.location.origin + "/checkout", referenceId: String(Date.now()) });
          await cap.attach("#cash-app-pay-container");
          cap.addEventListener("tokenization", async (ev:any)=>{ if (ev?.status==="OK" && ev?.token) await complete(ev.token); });
        }catch(e){ console.warn("cashAppPay",e); }
        walletsMountedRef.current = true;
      }
    };

    if (!scriptAddedRef.current){
      script.addEventListener("load", ()=>{ mountOnce(); }, { once:true });
      if ((script as any).readyState==="complete" || (window as any).Square) mountOnce();
      scriptAddedRef.current = true;
    } else if ((window as any).Square){
      mountOnce();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, locationId, jsSrc, secureContext]);

  async function complete(sourceId:string){
    const r = await fetch("/api/square/checkout",{ method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ sourceId, lineItems: cartToLineItems(cart || []), pickupName, pickupPhone, pickupWhen:"ASAP", note:"Order from /menu" }) });
    const data = await r.json();
    if (data.ok){ if (typeof window!=="undefined") localStorage.removeItem(CART_KEY); alert("Payment successful!"); try{ window.location.href="/kds"; }catch{} }
    else { alert(`Payment failed: ${data.error ?? ""}`); }
  }

  async function onPayCard(){
    if (!card) return;
    const res = await card.tokenize();
    if (res.status!=="OK"){ alert("Card tokenization failed"); return; }
    complete(res.token);
  }

  return (
    <div className="space-y-4">
      <div>
        <label style={{display:"block",fontWeight:600}}>Pickup Name</label>
        <input value={pickupName} onChange={e=>setPickupName(e.target.value)} placeholder="e.g., Michael" style={{width:"100%",padding:8,borderRadius:8,border:"1px solid #ddd"}}/>
      </div>
      <div>
        <label style={{display:"block",fontWeight:600}}>Phone</label>
        <input value={pickupPhone} onChange={e=>setPickupPhone(e.target.value)} placeholder="e.g., 3305551234" style={{width:"100%",padding:8,borderRadius:8,border:"1px solid #ddd"}}/>
      </div>

      <div id="card-container" className="border rounded p-4" />
      <button onClick={onPayCard} className="px-4 py-2 rounded bg-black text-white" disabled={!card}>Pay with Card</button>

      {secureContext && (
        <div style={{display:"grid",gap:10,marginTop:12}}>
          <div id="apple-pay-container" />
          {!appleAvailable && <div style={{fontSize:12,opacity:.7}}>Apple Pay not available on this device/browser.</div>}
          <div id="google-pay-container" />
          {!googleAvailable && <div style={{fontSize:12,opacity:.7}}>Google Pay not available on this device/browser.</div>}
          <div id="cash-app-pay-container" />
        </div>
      )}

      <div style={{opacity:.8}}>
        Order total (cart): $<span suppressHydrationWarning>{cart===null ? "—" : (total/100).toFixed(2)}</span>
      </div>
    </div>
  );
}
