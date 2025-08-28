"use client";
import { useEffect, useState } from "react";

type Check = { name: string; ok: boolean; detail?: string };

export default function HealthPage() {
  const [server, setServer] = useState<{ ok: boolean; checks: Check[] } | null>(null);
  const [clientCheck, setClientCheck] = useState<Check | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/health/square", { cache: "no-store" });
        const ct = r.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          const text = await r.text();
          setServer({ ok: false, checks: [{ name: "server:fetch", ok: false, detail: "Non-JSON response: " + text.slice(0, 200) + "..." }] });
          return;
        }
        const j = await r.json();
        setServer(j);
      } catch (e: any) {
        setServer({ ok: false, checks: [{ name: "server:fetch", ok: false, detail: e?.message || String(e) }] });
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const src = process.env.NEXT_PUBLIC_SQUARE_JS_SRC || "https://sandbox.web.squarecdn.com/v1/square.js";
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = src;
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load Square JS"));
          document.body.appendChild(s);
        });
        const Square: any = (window as any).Square;
        if (!Square?.payments) {
          setClientCheck({ name: "client:web-payments-sdk", ok: false, detail: "Square.payments unavailable" });
          return;
        }
        const payments = await Square.payments(process.env.NEXT_PUBLIC_SQUARE_APP_ID, process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID);
        await payments.card();
        setClientCheck({ name: "client:web-payments-sdk", ok: true, detail: "Initialized payments() OK" });
      } catch (e: any) {
        setClientCheck({ name: "client:web-payments-sdk", ok: false, detail: e?.message || String(e) });
      }
    })();
  }, []);

  return (
    <main className="p-6" style={{ maxWidth: 960, margin: "0 auto" }}>
      <h1 className="text-2xl font-semibold mb-4">Square Integration Health</h1>

      <section className="mb-6">
        <h2 className="font-semibold">Server checks</h2>
        {!server && <div>Loading server checks…</div>}
        {server && (
          <div className="mt-2 space-y-1">
            {server.checks?.map((c, i) => (
              <div key={i} style={{padding:"8px 12px", borderRadius:8, background: c.ok ? "#d1fae5" : "#fee2e2"}}>
                <div style={{fontFamily:"monospace"}}>{c.name}</div>
                {c.detail && <div style={{opacity:.8, whiteSpace:"pre-wrap"}}>{c.detail}</div>}
              </div>
            ))}
            <div style={{marginTop:12, padding:8, borderRadius:8, background: server.ok ? "#bbf7d0" : "#fecaca"}}>
              Overall: {server.ok ? "✅ OK" : "❌ Issues found"}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold">Client check (Web Payments SDK)</h2>
        {!clientCheck && <div>Loading client check…</div>}
        {clientCheck && (
          <div style={{marginTop:8, padding:"8px 12px", borderRadius:8, background: clientCheck.ok ? "#d1fae5" : "#fee2e2"}}>
            <div style={{fontFamily:"monospace"}}>{clientCheck.name}</div>
            {clientCheck.detail && <div style={{opacity:.8}}>{clientCheck.detail}</div>}
          </div>
        )}
      </section>
    </main>
  );
}
