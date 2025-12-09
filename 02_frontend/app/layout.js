import "./globals.css";

export const metadata = {
  title: "User Contact Form",
  description: "Simple user form with contacts"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}