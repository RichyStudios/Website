import StoreApp from '@/components/store-app';

export default async function SoftwarePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <StoreApp section="software" softwareId={(await params).id} />;
}
