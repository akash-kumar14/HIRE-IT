import "../styles/globals.css";

export const metadata = {
  title: "HIRE-IT",
  description: "AI-assisted services marketplace for Agra.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
