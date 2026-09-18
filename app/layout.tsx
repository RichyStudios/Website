import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Signova Technology — Access. Create. Connect.',
  description:
    'Accessible software, remote computer support, and Deaf community events from Signova Technology.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
