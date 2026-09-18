import StoreApp from '@/components/store-app';
import { notFound } from 'next/navigation';
const sections = [
  'shop',
  'software',
  'game',
  'events',
  'news',
  'login',
  'support',
  'account',
  'cart',
  'admin',
  'policies',
];
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();
  return <StoreApp section={section} />;
}
