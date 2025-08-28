import React from "react";

export const metadata = {
  title: "Merriman Valley Pizza",
  description: "Square-integrated demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#fafafa",
          color: "#111",
        }}
      >
        {/* Extra wrapper also suppresses any extension-injected attributes */}
        <div suppressHydrationWarning>{children}</div>
      </body>
    </html>
  );
}
