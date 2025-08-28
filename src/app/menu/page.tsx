"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

type Variation = { id: string; name: string; price: { amount: number; currency: string } };
type MenuItem = { id: string; name: string; description?: string; imageUrl?: string; variations: Variation[] };
type CartLine = { name: string; quantity: number; basePriceMoney: { amount: number; currency: string } };

const CART_KEY = "mvp_cart";
function loadCart(): CartLine[] { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } }
function saveCart(cart: CartLine[]) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function moneyFmt(cents: number) { return (cents/100).toLocaleString(undefined, { style: "currency", currency: "USD" }); }

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => { setCart(loadCart()); }, []);
  useEffect(() => { (async () => {
    try {
      const r = await fetch("/api/menu", { cache: "no-store" });
      const j = await r.json();
      setMenu(j.menu || []);
    } finally { setLoading(false); }
  })(); }, []);

  function addToCart(v: Variation, parentName: string) {
    const line: CartLine = {
      name: `${parentName} — ${v.name}`,
      quantity: 1,
      basePriceMoney: { amount: v.price.amount, currency: v.price.currency || "USD" },
    };
    const next = [...cart];
    const idx = next.findIndex(l => l.name === line.name && l.basePriceMoney.amount === line.basePriceMoney.amount);
    if (idx >= 0) next[idx].quantity += 1; else next.push(line);
    setCart(next); saveCart(next);
  }
  function inc(i: number) { const n=[...cart]; n[i].quantity++; setCart(n); saveCart(n); }
  function dec(i: number) { const n=[...cart]; n[i].quantity=Math.max(1,n[i].quantity-1); setCart(n); saveCart(n); }
  function remove(i: number) { const n=cart.filter((_,j)=>j!==i); setCart(n); saveCart(n); }
  const subtotal = cart.reduce((s,l)=> s + l.basePriceMoney.amount * l.quantity, 0);

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Menu</h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>Tap a variation to add it to your cart.</p>

      {loading && <div>Loading menu…</div>}
      {!loading && menu.length === 0 && (
        <div style={{ background:"#fff3cd", border:"1px solid #ffeeba", padding:12, borderRadius:8 }}>
          No items found in Square Catalog. Add items & photos in Square Sandbox → Items, then refresh.
        </div>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {menu.map((m) => (
          <div key={m.id} style={{ background:"#fff", borderRadius:12, padding:16, boxShadow:"0 2px 8px rgba(0,0,0,.08)" }}>
            {m.imageUrl && (
              <div style={{ position:"relative", width:"100%", height:220, marginBottom:10 }}>
                <Image
                  src={m.imageUrl}
                  alt={m.name}
                  fill
                  sizes="(max-width: 980px) 100vw, 980px"
                  style={{ objectFit:"cover", borderRadius:12 }}
                  priority={false}
                />
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: 18 }}>{m.name}</div>
            {m.description && <div style={{ opacity:.8, margin:"6px 0 8px" }}>{m.description}</div>}
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {m.variations.map(v => (
                <button
                  key={v.id}
                  onClick={()=>addToCart(v, m.name)}
                  style={{ padding:"8px 12px", borderRadius:10, border:"1px solid #ddd", background:"#fafafa", cursor:"pointer" }}
                >
                  {v.name} • {moneyFmt(v.price.amount)}
                </button>
              ))}
              {m.variations.length === 0 && <div style={{ opacity:.7 }}>No variations with price.</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Cart summary */}
      <div style={{ position:"sticky", bottom: 0, background:"#111", color:"#fff", marginTop: 24, borderRadius:12, padding:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <div style={{ fontWeight:700 }}>Cart • {cart.length} items • {moneyFmt(subtotal)}</div>
          <div><a href="/checkout" style={{ background:"#fff", color:"#111", padding:"8px 12px", borderRadius:8, textDecoration:"none" }}>Go to Checkout</a></div>
        </div>

        {cart.length > 0 && (
          <div style={{ marginTop:10, display:"grid", gap:8 }}>
            {cart.map((l, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#1b1b1b", borderRadius:8, padding:"8px 10px" }}>
                <div>
                  <div style={{ fontWeight:600 }}>{l.name}</div>
                  <div style={{ opacity:.8, fontSize:12 }}>{moneyFmt(l.basePriceMoney.amount)} each</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <button onClick={()=>dec(i)} style={{ background:"#333", color:"#fff", border:"none", borderRadius:6, padding:"4px 8px" }}>−</button>
                  <div>{l.quantity}</div>
                  <button onClick={()=>inc(i)} style={{ background:"#333", color:"#fff", border:"none", borderRadius:6, padding:"4px 8px" }}>+</button>
                  <button onClick={()=>remove(i)} style={{ background:"#ef4444", color:"#fff", border:"none", borderRadius:6, padding:"4px 8px" }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
