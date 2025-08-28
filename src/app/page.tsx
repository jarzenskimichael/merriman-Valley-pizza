export default function Home() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>Merriman Valley Pizza</h1>
      <p>Square-integrated Next.js demo.</p>

      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <a href="/menu" style={{ display:"inline-block", padding:"10px 14px", borderRadius:8, background:"#111", color:"#fff" }}>
          Browse Menu
        </a>
        <a href="/checkout" style={{ display:"inline-block", padding:"10px 14px", borderRadius:8, background:"#111", color:"#fff" }}>
          Go to Checkout
        </a>
        <a href="/admin/health" style={{ display:"inline-block", padding:"10px 14px", borderRadius:8, background:"#111", color:"#fff" }}>
          Open Health Checks
        </a>
      </div>
    </main>
  );
}
