import StoreApp from '@/components/store-app';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <StoreApp section="events" contentId={(await params).id} />;
}
