"use client";
import { useEffect, useState } from "react";

type EnvResp = { env: Record<string, boolean>, values: Record<string,string|undefined>, now: string };
type CatalogVar = {
  id: string, name?: string, itemId?: string,
  trackInventory: boolean|null,
  overrideForLocation: { locationId: string, soldOut: boolean|null, soldOutUntil: string|null, trackInventory: boolean|null }
};
type CatalogResp = { locationId: string, variations: CatalogVar[] };
type InvResp = { inv: Record<string, { quantity: number }>, count: number, now: string };
type MenuVariation = { id: string, name: string, price: { amount:number, currency:string }, quantity?: number, available?: boolean, soldOut?: boolean };
type MenuItem = { id: string, name: string, variations: MenuVariation[] };
type MenuResp = { menu: MenuItem[], updatedAt: string };

export default function DebugPage() {
  const [env, setEnv] = useState<EnvResp|null>(null);
  const [catalog, setCatalog] = useState<CatalogResp|null>(null);
  const [inventory, setInventory] = useState<InvResp|null>(null);
  const [menu, setMenu] = useState<MenuResp|null>(null);
  const [sdkCheck, setSdkCheck] = useState<{loaded:boolean; duplicates:number}>({loaded:false, duplicates:0});

  useEffect(() => {
    (async () => {
      const [e,c,i,m] = await Promise.allSettled([
        fetch("/api/debug/env", { cache: "no-store" }).then(r=>r.json()),
        fetch("/api/debug/catalog", { cache: "no-store" }).then(r=>r.json()),
        fetch("/api/debug/inventory", { cache: "no-store" }).then(r=>r.json()),
        fetch("/api/menu", { cache: "no-store" }).then(r=>r.json()),
      ]);
      if (e.status === "fulfilled") setEnv(e.value);
      if (c.status === "fulfilled") setCatalog(c.value);
      if (i.status === "fulfilled") setInventory(i.value);
      if (m.status === "fulfilled") setMenu(m.value);
      // client-side Square SDK check
      const scripts = Array.from(document.querySelectorAll("script[src*='squarecdn.com/v1/square.js']"));
      setSdkCheck({ loaded: !!(window as any).Square, duplicates: scripts.length });
    })();
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin:"0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Debug: Square Integration</h1>

      {/* ENV */}
      <section style={cardStyle}>
        <h2 style={h2}>Environment</h2>
        {!env ? <div>Loading…</div> : (
          <div style={grid2}>
            {Object.entries(env.env).map(([k,v]) => (
              <div key={k} style={pill(v)}>{k}: {v ? "present" : "MISSING"}</div>
            ))}
          </div>
        )}
        {env?.values && (
          <pre style={preStyle}>{JSON.stringify(env.values, null, 2)}</pre>
        )}
      </section>

      {/* SDK */}
      <section style={cardStyle}>
        <h2 style={h2}>Web Payments SDK (Client)</h2>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={pill(sdkCheck.loaded)}>window.Square loaded: {String(sdkCheck.loaded)}</div>
          <div style={pill(sdkCheck.duplicates <= 1)}>script tags found: {sdkCheck.duplicates}</div>
        </div>
        <div style={{ opacity:.8, fontSize:12, marginTop:8 }}>
          If <code>script tags found</code> &gt; 1, the SDK may have been added twice — which can cause duplicate card fields.
        </div>
      </section>

      {/* Catalog overrides */}
      <section style={cardStyle}>
        <h2 style={h2}>Catalog — Location Overrides</h2>
        {!catalog ? <div>Loading…</div> : (
          <table style={table}>
            <thead>
              <tr>
                <th>Variation</th><th>Var ID</th><th>Item ID</th><th>trackInventory</th><th>override.soldOut</th><th>override.trackInventory</th>
              </tr>
            </thead>
            <tbody>
              {catalog.variations.map(v => (
                <tr key={v.id}>
                  <td>{v.name || "—"}</td>
                  <td><code>{v.id}</code></td>
                  <td><code>{v.itemId}</code></td>
                  <td>{String(v.trackInventory)}</td>
                  <td style={{ color: v.overrideForLocation.soldOut ? "#b91c1c" : "inherit" }}>
                    {String(v.overrideForLocation.soldOut)}{v.overrideForLocation.soldOutUntil ? ` (until ${v.overrideForLocation.soldOutUntil})` : ""}
                  </td>
                  <td>{String(v.overrideForLocation.trackInventory)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Inventory */}
      <section style={cardStyle}>
        <h2 style={h2}>Inventory — Counts</h2>
        {!inventory ? <div>Loading…</div> : (
          <div>
            <div style={{ marginBottom:8 }}>Entries: {inventory.count}</div>
            <table style={table}>
              <thead><tr><th>Variation ID</th><th>Quantity</th></tr></thead>
              <tbody>
                {Object.entries(inventory.inv).map(([vid, v]) => (
                  <tr key={vid}><td><code>{vid}</code></td><td>{v.quantity}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Menu (computed availability) */}
      <section style={cardStyle}>
        <h2 style={h2}>Menu API — Computed Availability</h2>
        {!menu ? <div>Loading…</div> : (
          <table style={table}>
            <thead>
              <tr><th>Item</th><th>Variation</th><th>Var ID</th><th>Qty</th><th>SoldOut</th><th>Available</th><th>Price</th></tr>
            </thead>
            <tbody>
              {menu.menu.flatMap(item =>
                item.variations.map(v => (
                  <tr key={v.id}>
                    <td>{item.name}</td>
                    <td>{v.name}</td>
                    <td><code>{v.id}</code></td>
                    <td>{v.quantity ?? "—"}</td>
                    <td style={{ color: v.soldOut ? "#b91c1c" : "inherit" }}>{String(v.soldOut ?? false)}</td>
                    <td style={{ color: v.available ? "#065f46" : "#b91c1c" }}>{String(v.available ?? false)}</td>
                    <td>{(v.price.amount/100).toLocaleString(undefined, { style:"currency", currency: v.price.currency || "USD" })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

const cardStyle: React.CSSProperties = { background:"#fff", borderRadius:12, padding:16, boxShadow:"0 2px 8px rgba(0,0,0,.06)", marginBottom:16 };
const h2: React.CSSProperties = { fontSize:18, marginBottom:8 };
const grid2: React.CSSProperties = { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:8, marginBottom:8 };
const preStyle: React.CSSProperties = { background:"#0b1020", color:"#e2e8f0", padding:12, borderRadius:8, overflow:"auto" };
const table: React.CSSProperties = { width:"100%", borderCollapse:"collapse" };
function pill(ok: boolean): React.CSSProperties {
  return {
    background: ok ? "#ecfdf5" : "#fff7ed",
    border: `1px solid ${ok ? "#a7f3d0" : "#fed7aa"}`,
    color: ok ? "#065f46" : "#9a3412",
    padding: "6px 10px", borderRadius: 999, fontSize: 13
  };
}
