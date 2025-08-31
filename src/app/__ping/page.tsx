export const dynamic = "force-dynamic";
export default function Ping() {
  return (
    <pre style={{padding:20, fontSize:16}}>
{`PING OK
ts: ${new Date().toISOString()}

If you can see this on production, Vercel is deploying THIS repo/branch.
If you *can’t* see it, Vercel is deploying something else (different repo/branch/root).`}
    </pre>
  );
}
