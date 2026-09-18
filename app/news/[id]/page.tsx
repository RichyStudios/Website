import StoreApp from '@/components/store-app';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <StoreApp section="news" contentId={(await params).id} />;
}
