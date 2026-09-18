export type Product = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  status: string;
  sample: number;
  created_at?: number;
};
export const categories = [
  'All finds',
  'Home & living',
  'Accessories',
  'Technology',
  'Art & objects',
];
export const sampleProducts: Product[] = [
  {
    id: 'sample-vase',
    title: 'The quiet form',
    description:
      'A softly sculpted ceramic vase for a considered corner. This is a sample listing for exploring the shop; it is not available to purchase.',
    category: 'Home & living',
    price: 6800,
    stock: 0,
    image:
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1000&q=85',
    status: 'published',
    sample: 1,
  },
  {
    id: 'sample-ring',
    title: 'A little brilliance',
    description:
      'A sculptural silver ring with delicate pink accents. Sample listing; materials and pricing are illustrative.',
    category: 'Accessories',
    price: 9500,
    stock: 0,
    image:
      'https://images.unsplash.com/photo-1775651966150-8a476032e612?auto=format&fit=crop&w=1000&q=85',
    status: 'published',
    sample: 1,
  },
  {
    id: 'sample-bag',
    title: 'Everywhere, everyday',
    description:
      'An understated black leather backpack with room for your daily essentials. Sample listing, not available for purchase.',
    category: 'Accessories',
    price: 14500,
    stock: 0,
    image:
      'https://images.unsplash.com/photo-1575024842588-7b2fb090ff24?auto=format&fit=crop&w=1000&q=85',
    status: 'published',
    sample: 1,
  },
  {
    id: 'sample-audio',
    title: 'Find your frequency',
    description:
      'Over-ear listening, with a clean black and silver finish. Sample listing; not an actual stocked product.',
    category: 'Technology',
    price: 18900,
    stock: 0,
    image:
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=85',
    status: 'published',
    sample: 1,
  },
  {
    id: 'sample-chair',
    title: 'Room to think',
    description:
      'An architectural white chair with an airy silhouette. Sample listing for the collection preview.',
    category: 'Home & living',
    price: 24000,
    stock: 0,
    image:
      'https://images.unsplash.com/photo-1547587091-f883cf8f0c12?auto=format&fit=crop&w=1000&q=85',
    status: 'published',
    sample: 1,
  },
  {
    id: 'sample-print',
    title: 'A different perspective',
    description:
      'Black and white framed artwork to bring a little character home. Sample listing; not available to order.',
    category: 'Art & objects',
    price: 4800,
    stock: 0,
    image:
      'https://images.unsplash.com/photo-1612435497555-37d9ea30676c?auto=format&fit=crop&w=1000&q=85',
    status: 'published',
    sample: 1,
  },
];
export const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100,
  );
export const journal = [
  {
    id: 'welcome',
    kind: 'news',
    title: 'Welcome to Signova Technology.',
    summary:
      'Accessible software, clear tech support, and events created with the Deaf community in mind.',
    body: 'Welcome to Signova Technology. We build practical tools around access, creativity, and clear communication.\n\nOur software works in the browser, our remote support form makes it easy to explain what is wrong, and our events bring Deaf community gatherings into one accessible place.\n\nThis is a growing platform. Follow the news page for product updates, technology guidance, and new community features.',
    image: '/hero.png',
    video: '',
    published: 1,
    date: '2026-09-10',
    location: '',
    sample: 0,
  },
  {
    id: 'accessible-tech',
    kind: 'news',
    title: 'Technology should be clear and accessible.',
    summary:
      'Good technology explains itself, respects your choices, and supports the way you communicate.',
    body: 'Accessible technology begins with clear language, visible controls, strong contrast, and more than one way to communicate. Those choices help everyone move with confidence.\n\nSignova Technology is building browser tools that keep those needs close to the center. We will keep improving the experience as the community uses it and shares feedback.',
    image: sampleProducts[0].image,
    video: '',
    published: 1,
    date: '2026-09-10',
    location: '',
    sample: 0,
  },
  {
    id: 'first-gathering',
    kind: 'event',
    title: 'Signova Deaf Technology Meetup.',
    summary:
      'A Deaf community gathering about useful technology, creative tools, and better digital access.',
    body: 'Join Signova Technology for an accessible community meetup focused on practical technology. We will share useful computer tips, demonstrate creative web tools, and make time for questions.\n\nASL access details, the final venue, and registration information will be published here as soon as they are confirmed.',
    image: '/hero.png',
    video: '',
    published: 1,
    date: '2026-10-17T19:00:00-04:00',
    location: 'Indianapolis · accessible venue details soon',
    sample: 1,
  },
];
