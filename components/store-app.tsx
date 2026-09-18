'use client';
import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  type FormEvent,
} from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Home,
  ShoppingBag,
  Gamepad2,
  CalendarDays,
  Newspaper,
  UserRound,
  Search,
  Heart,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  Package,
  Settings,
  LogOut,
  Loader2,
  RefreshCw,
  Mail,
  MapPin,
  Clock,
  LockKeyhole,
  Diamond,
  Sun,
  Moon,
  Leaf,
  Flower2,
  Music2,
  Star,
  SlidersHorizontal,
  X,
  Upload,
  ExternalLink,
  Pencil,
  Eye,
  Truck,
  Headphones,
  MonitorCog,
  Wifi,
  Laptop,
  Send,
  CircleHelp,
  Code2,
  Play,
  Store,
  Trophy,
  Phone,
  PanelTop,
  Users,
  Share2,
  Accessibility,
  Download,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { sampleProducts, categories, money, type Product } from '@/lib/catalog';

const softwareApps = [
  {
    id: 'signova-connect',
    name: 'Signova Connect',
    label: 'SUPPORT COMPANION',
    description: 'An accessible desktop-ready web app that helps you organize computer problems and prepare a clear support request.',
    longDescription: 'Signova Connect gives you a simple offline workspace for recording the device, symptoms, error messages, and communication preferences for a support request. Save the package on your computer, open the included app in a browser, and bring the generated summary to Signova Tech Support.',
    version: '1.0.0',
    platform: 'Windows, macOS, and Linux',
    format: 'Offline web app · ZIP',
    download: '/downloads/signova-connect.zip',
    tone: 'blue',
    icon: MonitorCog,
    features: ['Step-by-step issue organizer', 'ASL and communication preference field', 'Copy-ready support summary', 'Works locally in a modern browser'],
  },
  {
    id: 'signova-play-starter',
    name: 'Signova Play Starter',
    label: 'GAME DEVELOPMENT KIT',
    description: 'A downloadable starter project with connected HTML, CSS, JavaScript, and Python files.',
    longDescription: 'Start making your own browser game with a clean project that already connects the page, visual style, game logic, and a small Python development server. The package includes instructions and a working keyboard-controlled game you can change.',
    version: '1.0.0',
    platform: 'Windows, macOS, and Linux',
    format: 'Source project · ZIP',
    download: '/downloads/signova-play-starter.zip',
    tone: 'violet',
    icon: Code2,
    features: ['Connected HTML, CSS, and JavaScript', 'Python local server', 'Keyboard and touch controls', 'Editable beginner-friendly source'],
  },
  {
    id: 'event-access-kit',
    name: 'Event Access Kit',
    label: 'ACCESSIBLE EVENT TEMPLATE',
    description: 'A ready-to-edit event page for Deaf community gatherings, workshops, and meetups.',
    longDescription: 'Event Access Kit helps organizers publish the details people need before attending. The template includes date and location, organizer information, ASL access, captions, mobility access, contact details, and a clear registration action.',
    version: '1.0.0',
    platform: 'Windows, macOS, and Linux',
    format: 'Website template · ZIP',
    download: '/downloads/event-access-kit.zip',
    tone: 'green',
    icon: CalendarDays,
    features: ['Deaf access information section', 'Responsive light design', 'Accessible semantic HTML', 'Simple event registration form'],
  },
] as const;

type User = { name: string; email: string; admin: boolean };
async function api(path: string, data?: unknown) {
  const response = await fetch('/api/store/' + path, {
    method: data === undefined ? 'GET' : 'POST',
    headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result: any = await response.json();
  if (!response.ok) throw new Error(result.error || 'Please try again.');
  return result;
}
const Context = createContext<{
  user: User | null;
  authLoading: boolean;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
}>({
  user: null,
  authLoading: true,
  refresh: async () => {},
  notify: () => {},
});
function useStore() {
  return useContext(Context);
}
function useData(path: string) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const result = await api(path);
      setData(result);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [path]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { data, error, refresh };
}
function Loading() {
  return (
    <div className="loading" role="status">
      <Loader2 className="spin" size={20} /> Loading your world…
    </div>
  );
}
function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="notice error" role="alert">
      {message}
      {retry && (
        <button onClick={retry}>
          Try again <RefreshCw size={14} />
        </button>
      )}
    </div>
  );
}
function Empty({
  icon: Icon = ShoppingBag,
  title,
  body,
  href,
  label,
}: {
  icon?: any;
  title: string;
  body: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <Icon size={34} />
      <h3>{title}</h3>
      <p>{body}</p>
      {href && (
        <a className="button" href={href}>
          {label}
          <ArrowUpRight size={16} />
        </a>
      )}
    </div>
  );
}
function Heading({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{kicker}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
function SignIn({ returnTo = '/account' }: { returnTo?: string }) {
  return <ProviderButtons returnTo={returnTo} />;
}
function ProviderButtons({ returnTo = '/account' }: { returnTo?: string }) {
  const query = encodeURIComponent(returnTo);
  return (
    <div className="provider-buttons">
      <a className="provider-button google" href={`/api/auth/google/start?return_to=${query}`}>
        <span className="provider-mark">G</span> Continue with Google
      </a>
      <a className="provider-button facebook" href={`/api/auth/facebook/start?return_to=${query}`}>
        <span className="provider-mark">f</span> Continue with Facebook
      </a>
      <a className="provider-button outlook" href={`/api/auth/outlook/start?return_to=${query}`}>
        <span className="provider-mark"><Mail size={17} /></span> Continue with Outlook
      </a>
    </div>
  );
}
function RequireAccount({
  children,
  admin = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const { user, authLoading } = useStore();
  if (authLoading) return <Loading />;
  if (!user)
    return (
      <div className="auth-gate">
        <LockKeyhole size={32} />
        <h2>A little more personal.</h2>
        <p>
          Sign in to save your favorites, manage your orders, and make yourself
          at home.
        </p>
        <SignIn returnTo={admin ? '/admin' : '/account'} />
      </div>
    );
  if (admin && !user.admin)
    return (
      <Empty
        icon={LockKeyhole}
        title="The owner’s studio"
        body="This dashboard is reserved for the shop owner."
        href="/account"
        label="Back to your account"
      />
    );
  return <>{children}</>;
}
function Picker({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => v !== null && onChange(v)}>
      <SelectTrigger aria-label={label} className="picker">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function StoreApp({
  section,
  productId,
  contentId,
  softwareId,
}: {
  section: string;
  productId?: string;
  contentId?: string;
  softwareId?: string;
}) {
  const [user, setUser] = useState<User | null>(null),
    [authLoading, setAuthLoading] = useState(true),
    [, setCartCount] = useState(0),
    [message, setMessage] = useState('');
  const refresh = useCallback(async () => {
    try {
      const d = await api('me');
      setUser(d.user);
      setCartCount(d.cartCount);
    } finally {
      setAuthLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(t);
  }, [message]);
  const nav = [
    { Icon: Home, label: 'Home', href: '/', key: 'home' },
    { Icon: Laptop, label: 'Software', href: '/software', key: 'software' },
    { Icon: Gamepad2, label: 'Game', href: '/game', key: 'game' },
    { Icon: CalendarDays, label: 'Events', href: '/events', key: 'events' },
    { Icon: Newspaper, label: 'News', href: '/news', key: 'news' },
    { Icon: Headphones, label: 'Support', href: '/support', key: 'support' },
    {
      Icon: UserRound,
      label: user ? 'Account' : 'Login',
      href: user ? '/account' : '/login',
      key: user ? 'account' : 'login',
    },
  ];
  return (
    <Context.Provider
      value={{ user, authLoading, refresh, notify: setMessage }}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-actions">
          {user?.admin && (
            <a className="studio-link" href="/admin">
              Your studio <ArrowUpRight size={14} />
            </a>
          )}
          <a className="header-support-link" href="/support">
            <Headphones size={17} /> Get tech support
          </a>
        </div>
      </header>
      <main id="main" className="page">
        {section === 'home' ? (
          <HomeView />
        ) : section === 'software' ? (
          softwareId ? <SoftwareDetail id={softwareId} /> : <Software />
        ) : section === 'shop' ? (
          productId ? (
            <ProductView id={productId} />
          ) : (
            <Shop />
          )
        ) : section === 'cart' ? (
          <Cart />
        ) : section === 'game' ? (
          <Game />
        ) : section === 'events' || section === 'news' ? (
          contentId ? <ContentDetail kind={section} id={contentId} /> : <ContentView kind={section} />
        ) : section === 'login' ? (
          <Login />
        ) : section === 'support' ? (
          <Support />
        ) : section === 'account' ? (
          <RequireAccount>
            <Account />
          </RequireAccount>
        ) : section === 'admin' ? (
          <RequireAccount admin>
            <Admin />
          </RequireAccount>
        ) : (
          <Policies />
        )}
        <footer className="footer">
          <a href="/" className="footer-brand">
            SIGNOVA TECHNOLOGY<span>Access. Create. Connect.</span>
          </a>
          <div>
            <a href="/software">Software</a>
            <a href="/events">Deaf events</a>
            <a href="/support">Tech support</a>
            <a href="/admin">Owner studio</a>
          </div>
          <span>© {new Date().getFullYear()} Signova Technology</span>
        </footer>
      </main>
      <nav className="dock" aria-label="Main navigation">
        <a className="dock-brand" href="/" aria-label="Signova Technology home">
          <Wifi size={19} />
          <span>SIGNOVA<small>TECHNOLOGY FOR EVERYONE</small></span>
        </a>
        <span className="dock-divider" aria-hidden="true" />
        {nav.map(({ Icon, label, href, key }) => (
          <a
            className={section === key ? 'active' : ''}
            aria-current={section === key ? 'page' : undefined}
            href={href}
            key={key}
          >
            <Icon size={20} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
      {message && (
        <div className="feedback" role="status">
          <Check size={17} />
          {message}
          <button
            aria-label="Dismiss notification"
            onClick={() => setMessage('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
function HomeView() {
  const { data } = useData('content');
  const events = (data?.posts || [])
    .filter((post: any) => post.kind === 'event')
    .slice(0, 3);
  return (
    <div className="signova-home">
      <section className="signal-hero">
        <div className="signal-orbit orbit-one" />
        <div className="signal-orbit orbit-two" />
        <div className="signal-hero-copy">
          <span className="signal-kicker"><span className="live-dot" /> SIGNOVA TECHNOLOGY</span>
          <h1>Technology that<br /><em>keeps us connected.</em></h1>
          <p>Accessible software, practical computer help, and Deaf community events—built around clear communication.</p>
          <div className="signal-actions">
            <a className="button signal-primary" href="/software">Explore software <ArrowUpRight size={18} /></a>
            <a className="button signal-secondary" href="/support"><Headphones size={18} /> Get tech support</a>
          </div>
          <div className="signal-trust">
            <span><Accessibility size={17} /> Deaf centered</span>
            <span><MonitorCog size={17} /> Remote repair</span>
            <span><ShieldCheck size={17} /> Clear and secure</span>
          </div>
        </div>
        <div className="signal-console" aria-label="Signova connection status">
          <div className="console-top"><span>LIVE ACCESS</span><span className="console-status">● CONNECTED</span></div>
          <div className="console-symbol"><Accessibility size={72} /><span className="pulse-ring" /></div>
          <div className="console-grid">
            <span><small>SUPPORT</small><strong>Remote + ASL</strong></span>
            <span><small>SOFTWARE</small><strong>Built for the web</strong></span>
            <span><small>COMMUNITY</small><strong>Events near you</strong></span>
            <span><small>ACCESS</small><strong>Simple by design</strong></span>
          </div>
        </div>
      </section>

      <section className="tech-paths">
        <div className="tech-section-head">
          <span className="eyebrow">WHAT WE DO</span>
          <h2>Tools that help you create, connect, and get things fixed.</h2>
        </div>
        <div className="tech-path-grid">
          <a href="/software" className="tech-path blue"><Laptop size={30} /><span>01</span><h3>Accessible software</h3><p>Browser tools for support, events, and creative projects.</p><strong>See the software <ArrowUpRight size={16} /></strong></a>
          <a href="/support" className="tech-path mint"><MonitorCog size={30} /><span>02</span><h3>Remote tech support</h3><p>Send a support request with your contact details and ASL preference.</p><strong>Request help <ArrowUpRight size={16} /></strong></a>
          <a href="/events" className="tech-path lime"><CalendarDays size={30} /><span>03</span><h3>Deaf community events</h3><p>Find accessible gatherings, workshops, and technology meetups.</p><strong>Browse events <ArrowUpRight size={16} /></strong></a>
        </div>
      </section>

      <section className="deaf-events-home">
        <div className="events-home-head">
          <div><span className="eyebrow">DEAF COMMUNITY</span><h2>Events made to bring people together.</h2></div>
          <a className="text-link" href="/events">View every event <ArrowRight size={17} /></a>
        </div>
        <div className="events-home-grid">
          {events.length ? events.map((event: any) => (
            <a href={`/events/${event.id}`} className="home-event-card" key={event.id}>
              <div className="home-event-date"><strong>{new Date(event.date).toLocaleDateString('en-US', { day: '2-digit' })}</strong><span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span></div>
              <div><span className="event-tag">ACCESSIBLE EVENT</span><h3>{event.title}</h3><p>{event.summary}</p><small><MapPin size={14} /> {event.location || 'Details coming soon'}</small></div>
              <ArrowUpRight size={20} />
            </a>
          )) : (
            <div className="home-event-empty"><CalendarDays size={32} /><h3>New Deaf events are coming soon.</h3><p>Visit the events page for announcements and full event details.</p><a className="button" href="/events">Open events</a></div>
          )}
        </div>
      </section>
    </div>
  );
}

function Software() {
  return (
    <div className="software-page">
      <section className="software-hero">
        <div><span className="signal-kicker"><Wifi size={15} /> SIGNOVA SOFTWARE</span><h1>Useful technology.<br /><em>Clear access.</em></h1><p>Simple web software designed for communication, creativity, and the Deaf community.</p></div>
        <div className="software-terminal" aria-hidden="true"><span className="terminal-dots">● ● ●</span><code><b>signova</b> / access<br /><i>status:</i> ready<br /><i>connection:</i> secure<br /><i>language:</i> your choice<span>_</span></code></div>
      </section>
      <section className="software-library">
        <div className="tech-section-head"><span className="eyebrow">SOFTWARE LIBRARY</span><h2>Open the tool you need.</h2><p>Every Signova tool works in your browser, so there is nothing to install.</p></div>
        <div className="software-grid">
          {softwareApps.map(({ id, icon: Icon, name, label, description, format, tone }) => (
            <a className={`software-card ${tone}`} href={`/software/${id}`} key={name}><div className="software-icon"><Icon size={31} /></div><span>{label}</span><h2>{name}</h2><p>{description}</p><div className="software-meta"><small><Download size={14} /> {format}</small><small><Accessibility size={14} /> Accessibility first</small></div><span className="button">View app <ArrowUpRight size={16} /></span></a>
          ))}
        </div>
      </section>
      <section className="software-help"><div><span className="eyebrow">NEED HELP?</span><h2>A real support request takes only a few minutes.</h2><p>Share your name, email, phone number, device, problem, and ASL code. The request is sent with the subject “DeafTech Support.”</p></div><a className="button signal-primary" href="/support"><Headphones size={18} /> Start a support request</a></section>
    </div>
  );
}

function SoftwareDetail({ id }: { id: string }) {
  const app = softwareApps.find((item) => item.id === id);
  if (!app) return <Empty icon={Laptop} title="Software not found." body="This app is not in the Signova library." href="/software" label="Back to software" />;
  const Icon = app.icon;
  return (
    <div className="software-detail-page">
      <a className="detail-back" href="/software"><ArrowLeft size={16} /> All software</a>
      <section className={`software-detail-hero ${app.tone}`}>
        <div className="software-detail-copy">
          <span className="signal-kicker"><Wifi size={15} /> SIGNOVA DOWNLOAD</span>
          <div className="software-detail-title"><div className="software-detail-icon"><Icon size={40} /></div><div><span>{app.label}</span><h1>{app.name}</h1></div></div>
          <p>{app.longDescription}</p>
          <div className="software-detail-actions">
            <a className="button signal-primary" href={app.download} download><Download size={18} /> Download version {app.version}</a>
            <a className="button signal-secondary" href="/support"><Headphones size={18} /> Ask for help</a>
          </div>
          <small className="download-note">The download is a ZIP package. Extract it, then read the included README file.</small>
        </div>
        <div className="app-preview" aria-label={`${app.name} preview`}>
          <div className="app-preview-bar"><span>● ● ●</span><small>{app.name}</small></div>
          <div className="app-preview-body"><Icon size={55} /><span>READY TO DOWNLOAD</span><strong>{app.name}</strong><p>Accessible tools from Signova Technology</p></div>
        </div>
      </section>
      <section className="software-detail-info">
        <div className="app-facts">
          <div><span>VERSION</span><strong>{app.version}</strong></div>
          <div><span>WORKS ON</span><strong>{app.platform}</strong></div>
          <div><span>PACKAGE</span><strong>{app.format}</strong></div>
          <div><span>LICENSE</span><strong>Free Signova starter</strong></div>
        </div>
        <div className="app-about">
          <div><span className="eyebrow">WHAT IS INCLUDED</span><h2>Everything you need to get started.</h2></div>
          <ul>{app.features.map((feature) => <li key={feature}><Check size={17} /> {feature}</li>)}</ul>
        </div>
        <div className="app-download-panel"><Package size={34} /><div><span className="eyebrow">DOWNLOAD APP</span><h2>{app.name} {app.version}</h2><p>Download the ZIP, extract the folder, and follow its README instructions.</p></div><a className="button signal-primary" href={app.download} download><Download size={18} /> Download</a></div>
      </section>
    </div>
  );
}
function ProductCard({
  product: p,
  saved = false,
  onSave,
}: {
  product: Product;
  saved?: boolean;
  onSave?: (p: Product) => void;
}) {
  return (
    <article className="product-card">
      <div className="product-photo">
        <a href={'/shop/' + p.id} aria-label={'View ' + p.title}>
          <img
            src={p.image}
            alt={p.title}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.opacity = '.15';
            }}
          />
        </a>
        <span className="product-label">
          {p.sample
            ? 'THE SAMPLE EDIT'
            : p.stock
              ? 'JUST DISCOVERED'
              : 'SOLD OUT'}
        </span>
        {onSave && (
          <button
            className={'save-button ' + (saved ? 'saved' : '')}
            onClick={() => onSave(p)}
            aria-label={(saved ? 'Unsave ' : 'Save ') + p.title}
            aria-pressed={saved}
          >
            <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
          </button>
        )}
        <a
          className="product-arrow"
          href={'/shop/' + p.id}
          aria-label={'Discover ' + p.title}
        >
          <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="product-info">
        <span>{p.category}</span>
        <a href={'/shop/' + p.id}>
          <h3>{p.title}</h3>
        </a>
        <strong>{money(p.price)}</strong>
        <small className="product-shopline">Signova Technology studio</small>
      </div>
    </article>
  );
}
function Shop() {
  const { data, error, refresh } = useData('catalog');
  const { user, notify } = useStore();
  const [category, setCategory] = useState('All finds'),
    [query, setQuery] = useState(''),
    [sort, setSort] = useState('Curated order'),
    [saved, setSaved] = useState<string[]>([]),
    [onlySaved, setOnlySaved] = useState(false);
  const categorySpotlights = [
    { name: 'Home & living', Icon: Home, tone: 'sun' },
    { name: 'Accessories', Icon: Diamond, tone: 'rose' },
    { name: 'Technology', Icon: MonitorCog, tone: 'blue' },
    { name: 'Art & objects', Icon: Flower2, tone: 'mint' },
  ];
  useEffect(() => {
    if (user)
      api('favorites')
        .then(setSaved)
        .catch(() => {});
  }, [user]);
  const save = async (p: Product) => {
    if (!user) {
      notify('Sign in to save your favorites.');
      return;
    }
    try {
      const value = !saved.includes(p.id);
      await api('favorite', { productId: p.id, saved: value });
      setSaved(value ? [...saved, p.id] : saved.filter((id) => id !== p.id));
      notify(value ? 'Saved to your favorites.' : 'Removed from favorites.');
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const items = (data?.products || [])
    .filter(
      (p: Product) =>
        (category === 'All finds' || p.category === category) &&
        (!onlySaved || saved.includes(p.id)) &&
        (p.title + ' ' + p.description + ' ' + p.category)
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a: Product, b: Product) =>
      sort === 'Price: low to high'
        ? a.price - b.price
        : sort === 'Price: high to low'
          ? b.price - a.price
          : 0,
    );
  return (
    <>
      <section className="marketplace-head">
        <div className="marketplace-title">
          <span className="eyebrow">THE SIGNOVA MARKET</span>
          <h1>Find something made to feel like yours.</h1>
          <p>Original objects, thoughtful gifts, and useful things from an independent studio.</p>
        </div>
        <div className="marketplace-categories" aria-label="Shop popular categories">
          {categorySpotlights.map(({ name, Icon, tone }) => (
            <button key={name} onClick={() => setCategory(name)} aria-pressed={category === name}>
              <span className={`category-orb ${tone}`}><Icon size={25} /></span>
              <strong>{name}</strong>
            </button>
          ))}
        </div>
      </section>
      <div className="shop-tools">
        <label className="search-field">
          <Search size={18} />
          <input
            placeholder="Search your next favorite…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </label>
        <Picker
          value={sort}
          onChange={setSort}
          options={[
            'Curated order',
            'Price: low to high',
            'Price: high to low',
          ]}
          label="Sort products"
        />
        <button
          className={'button favorites-filter ' + (onlySaved ? 'selected' : '')}
          aria-pressed={onlySaved}
          onClick={() => {
            if (!user) {
              notify('Sign in to see your favorites.');
              return;
            }
            setOnlySaved(!onlySaved);
          }}
        >
          <Heart size={17} /> Saved
        </button>
      </div>
      <div className="category-row" aria-label="Filter products">
        {categories.map((c) => (
          <button
            className={category === c ? 'selected' : ''}
            key={c}
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
          >
            {c}
          </button>
        ))}
        <span>{items.length} finds</span>
      </div>
      {error ? (
        <ErrorBox message={error} retry={refresh} />
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <div className="shop-intro-card">
            <div>
              <span className="eyebrow">THE SAMPLE EDIT · 01</span>
              <h2>Objects with a point of view.</h2>
              <p>
                Start with the shapes, textures, and small details that make a
                room feel like yours.
              </p>
            </div>
            <a className="button" href="/news">
              Read the journal <ArrowUpRight size={16} />
            </a>
          </div>
          {data.preview && (
            <div className="notice">
              <Sparkles size={17} /> You’re browsing the sample edit. These
              pieces are inspiration and cannot be purchased.
            </div>
          )}
          {items.length ? (
            <div className="product-grid shop-grid">
              {items.map((p: Product) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  saved={saved.includes(p.id)}
                  onSave={save}
                />
              ))}
            </div>
          ) : (
            <Empty
              icon={Search}
              title="No finds just yet."
              body="Try a different search or category, or save a few favorites."
            />
          )}
        </>
      )}
    </>
  );
}
function ProductView({ id }: { id: string }) {
  const { data, error, refresh: reload } = useData('catalog');
  const { user, refresh, notify } = useStore();
  const [quantity, setQuantity] = useState(1),
    [busy, setBusy] = useState(false);
  const p: Product | undefined = data?.products.find(
    (p: Product) => p.id === id,
  );
  if (error) return <ErrorBox message={error} retry={reload} />;
  if (!data) return <Loading />;
  if (!p)
    return (
      <Empty
        title="This find has moved on."
        body="It may be unpublished or no longer available."
        href="/shop"
        label="Explore the shop"
      />
    );
  async function add() {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setBusy(true);
    try {
      const cart = await api('cart');
      const existing = cart.items.find((v: any) => v.id === id)?.quantity || 0;
      await api('cart', { productId: id, quantity: quantity + existing });
      await refresh();
      notify('Added to your bag.');
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <a href="/shop" className="back-link">
        <ArrowLeft size={16} /> Back to the collection
      </a>
      <section className="product-detail">
        <div className="detail-photo">
          <img src={p.image} alt={p.title} />
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{p.category}</span>
          <h1>{p.title}</h1>
          <span className="detail-price">{money(p.price)}</span>
          <p>{p.description}</p>
          <span className="stock-status">
            {p.sample
              ? 'Sample piece · not for sale'
              : p.stock
                ? `${p.stock} available`
                : 'Currently sold out'}
          </span>
          {!p.sample && p.stock > 0 && (
            <div className="purchase-row">
              <div className="quantity">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity === 1}
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(20, p.stock, quantity + 1))
                  }
                  disabled={quantity >= Math.min(20, p.stock)}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                className="button button-light"
                onClick={add}
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="spin" size={18} />
                ) : (
                  <ShoppingBag size={18} />
                )}
                Add to bag
              </button>
            </div>
          )}
          <div className="detail-notes">
            <p>
              <ShieldCheck size={18} /> Checkout securely through Stripe
            </p>
            <p>
              <Truck size={18} />{' '}
              {data.shipping
                ? money(data.shipping) + ' standard US shipping'
                : 'Shipping details shown at checkout'}
            </p>
            <a href="/policies">
              Shipping, returns & shop information <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
function Login() {
  const { user } = useStore();
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [newForm, setNewForm] = useState({ username: '', email: '', password: '', confirm: '' });
  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get('error');
    if (error === 'provider_not_configured') setAuthError('That sign-in provider is not configured yet. Ask the shop owner to add its OAuth keys.');
    if (error === 'oauth_failed') setAuthError('Sign-in was not completed. Please choose a provider and try again.');
  }, []);
  async function submitPassword(event: FormEvent, create: boolean) {
    event.preventDefault();
    setAuthError('');
    if (create && newForm.password !== newForm.confirm) {
      setAuthError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/auth/password/${create ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(create ? {
          username: newForm.username,
          email: newForm.email,
          password: newForm.password,
        } : loginForm),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Please try again.');
      window.location.href = '/account';
    } catch (error) {
      setAuthError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="login-layout">
      <div className="login-art">
        <img src="/hero.png" alt="Amber glass study" />
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>
            A world
            <br />
            with <em>you</em>
            <br />
            in it.
          </h1>
        </div>
      </div>
      <div className="login-card">
        <Sparkles size={32} />
        <h2>{user ? 'Welcome back.' : 'Your next chapter.'}</h2>
        {user ? (
          <>
            <p>You’re signed in as {user.email}.</p>
            <a className="button button-light" href="/account">
              Go to your account <ArrowRight size={17} />
            </a>
          </>
        ) : (
          <Tabs defaultValue="login">
            <TabsList className="wide-tabs">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="new">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <p>
                Keep your favorite finds, orders, and upcoming plans in one
                place.
              </p>
              {authError && <div className="notice error login-error">{authError}</div>}
              <form className="credential-form" onSubmit={(event) => submitPassword(event, false)}>
                <label>
                  Username or email
                  <input
                    required
                    autoComplete="username"
                    value={loginForm.identifier}
                    onChange={(event) => setLoginForm({ ...loginForm, identifier: event.target.value })}
                  />
                </label>
                <label>
                  Password
                  <input
                    required
                    type="password"
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  />
                </label>
                <button className="button button-light" disabled={busy}>
                  {busy ? <Loader2 className="spin" size={17} /> : <LockKeyhole size={17} />}
                  Sign in
                </button>
              </form>
              <div className="auth-divider"><span>or use a provider</span></div>
              <SignIn />
              <p className="auth-note">
            Your account and saved items are stored securely with Signova Technology.
              </p>
            </TabsContent>
            <TabsContent value="new">
              <p>
            Create your Signova Technology account to save projects and events.
              </p>
              {authError && <div className="notice error login-error">{authError}</div>}
              <form className="credential-form" onSubmit={(event) => submitPassword(event, true)}>
                <label>
                  Username
                  <input
                    required
                    minLength={3}
                    maxLength={30}
                    autoComplete="username"
                    value={newForm.username}
                    onChange={(event) => setNewForm({ ...newForm, username: event.target.value })}
                  />
                </label>
                <label>
                  Email
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={newForm.email}
                    onChange={(event) => setNewForm({ ...newForm, email: event.target.value })}
                  />
                </label>
                <label>
                  Password
                  <input
                    required
                    type="password"
                    minLength={10}
                    maxLength={128}
                    autoComplete="new-password"
                    value={newForm.password}
                    onChange={(event) => setNewForm({ ...newForm, password: event.target.value })}
                  />
                  <small>Use at least 10 characters with a letter and a number.</small>
                </label>
                <label>
                  Confirm password
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    value={newForm.confirm}
                    onChange={(event) => setNewForm({ ...newForm, confirm: event.target.value })}
                  />
                </label>
                <button className="button button-light" disabled={busy}>
                  {busy ? <Loader2 className="spin" size={17} /> : <Sparkles size={17} />}
                  Create account
                </button>
              </form>
              <div className="auth-divider"><span>or create with a provider</span></div>
              <SignIn />
              <p className="auth-note">
                Passwords are protected with a one-way security hash and are never saved in GitHub.
              </p>
            </TabsContent>
          </Tabs>
        )}
        <div className="login-benefits">
          <span>
            <Heart size={17} /> Keep your favorites
          </span>
          <span>
            <Package size={17} /> Follow every order
          </span>
          <span>
            <CalendarDays size={17} /> Save your spot
          </span>
        </div>
      </div>
    </section>
  );
}
function Support() {
  const { user } = useStore();
  const { data } = useData('support');
  const userNames = (user?.name || '').trim().split(/\s+/);
  const [form, setForm] = useState({
    firstName: userNames[0] || '',
    lastName: userNames.slice(1).join(' '),
    email: user?.email || '',
    phone: '',
    device: 'Windows computer',
    issue: '',
    aslCode: '',
    consent: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState('');
  const [notification, setNotification] = useState('');
  useEffect(() => {
    if (user) {
      const names = user.name.trim().split(/\s+/);
      setForm((current) => ({
        ...current,
        firstName: current.firstName || names[0] || '',
        lastName: current.lastName || names.slice(1).join(' '),
        email: current.email || user.email,
      }));
    }
  }, [user]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api('support', form);
      setRequestId(result.id);
      setNotification(result.notification || 'pending');
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="support-hero">
        <div>
          <span className="support-availability"><span /> ASL REMOTE SUPPORT</span>
          <h1>Computer help,<br />right when you need it.</h1>
          <p>Request a secure remote session for troubleshooting, cleanup, setup, and everyday computer problems.</p>
        </div>
        <div className="support-hero-icon" aria-hidden="true"><MonitorCog size={70} /><Wifi size={34} /></div>
      </section>
      <div className="support-services">
        <article><Laptop size={22} /><div><strong>Computer repair</strong><span>Errors, slowdowns, updates, and setup</span></div></article>
        <article><Wifi size={22} /><div><strong>Remote diagnosis</strong><span>Guided help through an ASL session</span></div></article>
        <article><CircleHelp size={22} /><div><strong>Clear answers</strong><span>Know what will happen before access begins</span></div></article>
      </div>
      <section className="support-layout">
        <div className="support-copy">
          <span className="eyebrow">HOW IT WORKS</span>
          <h2>Three careful steps.</h2>
          <ol className="support-steps">
            <li><span>1</span><div><strong>Tell us what is wrong</strong><p>Share the device and a short description. Never include a password.</p></div></li>
            <li><span>2</span><div><strong>Open ASL together</strong><p>A technician confirms the request before the remote session starts.</p></div></li>
            <li><span>3</span><div><strong>You stay in control</strong><p>You can watch the work and end the session at any time.</p></div></li>
          </ol>
          {data?.aslUrl ? (
            <a className="button button-light support-launch" href={data.aslUrl} target="_blank" rel="noreferrer">
              Open ASL remote support <ExternalLink size={17} />
            </a>
          ) : (
            <p className="support-link-note">The ASL connection link is provided after your request is confirmed.</p>
          )}
        </div>
        <div className="support-form-card glass-panel">
          {requestId ? (
            <div className="support-success" role="status">
              <Check size={30} />
              <span className="eyebrow">REQUEST RECEIVED</span>
              <h2>We have your support request.</h2>
              <p>Reference <strong>{requestId.slice(0, 8).toUpperCase()}</strong>. A technician will contact you at {form.email}.</p>
              <p className={`support-delivery ${notification}`}>
                {notification === 'sent'
                  ? 'Your request was emailed to richynoble75@live.com with the subject “DeafTech Support”.'
                  : 'Your request is saved in the support inbox. Email delivery is not confirmed yet.'}
              </p>
              {user && <a className="text-link" href="/account?tab=support">View this request in My Account <ArrowRight size={16} /></a>}
              <button className="button" onClick={() => { setRequestId(''); setNotification(''); setForm({ ...form, issue: '', aslCode: '', consent: false }); }}>
                Send another request
              </button>
            </div>
          ) : (
            <form className="editor-form" onSubmit={submit}>
              <div><span className="eyebrow">REQUEST TECH SUPPORT</span><h2>What can we fix?</h2></div>
              {error && <ErrorBox message={error} />}
              <div className="form-row">
                <label>First name<input required autoComplete="given-name" maxLength={60} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
                <label>Last name<input required autoComplete="family-name" maxLength={60} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
              </div>
              <div className="form-row">
                <label>Email<input required type="email" autoComplete="email" maxLength={320} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
                <label>Phone number<input required type="tel" autoComplete="tel" maxLength={30} placeholder="(555) 555-0123" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
              </div>
              <label>Device<Picker label="Device type" value={form.device} options={['Windows computer', 'Mac computer', 'Chromebook', 'Phone or tablet', 'Other device']} onChange={(device) => setForm({ ...form, device })} /></label>
              <label>What is happening?<textarea required maxLength={3000} rows={5} placeholder="Describe the problem and any error message you see." value={form.issue} onChange={(event) => setForm({ ...form, issue: event.target.value })} /></label>
              <label>ASL session code <span className="optional-label">Optional</span><input maxLength={100} placeholder="Add it if ASL already gave you a code" value={form.aslCode} onChange={(event) => setForm({ ...form, aslCode: event.target.value })} /></label>
              <label className="check-label support-consent">
                <Checkbox checked={form.consent} onCheckedChange={(value) => setForm({ ...form, consent: !!value })} />
                I authorize a technician to contact me about a remote support session. I understand that I can end access at any time.
              </label>
              <p className="support-safety"><ShieldCheck size={17} /> Never send your password, banking password, or verification code.</p>
              <button className="button button-light" disabled={busy || !form.consent}>
                {busy ? <Loader2 className="spin" size={17} /> : <Send size={17} />} Send support request
              </button>
              {data?.support && <p className="form-hint">Prefer email? Contact {data.support}</p>}
            </form>
          )}
        </div>
      </section>
    </>
  );
}
function Cart() {
  return (
    <>
      <Heading kicker="A FEW GOOD FINDS" title="Your shopping bag." />
      <RequireAccount>
        <CartBody />
      </RequireAccount>
    </>
  );
}
function CartBody() {
  const { data, error, refresh } = useData('cart');
  const { refresh: refreshUser, notify } = useStore();
  const [busy, setBusy] = useState(false),
    [cancelId, setCancelId] = useState('');
  useEffect(()=>{if(data?.pendingOrder)setCancelId(data.pendingOrder)},[data?.pendingOrder]);
  useEffect(() => {
    setCancelId(
      new URLSearchParams(window.location.search).get('cancelled') || '',
    );
  }, []);
  async function update(id: string, quantity: number) {
    setBusy(true);
    try {
      await api('cart', { productId: id, quantity });
      await refresh();
      await refreshUser();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function checkout() {
    setBusy(true);
    try {
      const d = await api('checkout', {});
      window.location.assign(d.url);
    } catch (e) {
      notify((e as Error).message);
      setBusy(false);
    }
  }
  async function cancel() {
    setBusy(true);
    try {
      const d = await api('cancel', { orderId: cancelId });
      notify(
        d.status === 'paid'
          ? 'Payment was already completed. See your orders.'
          : 'Checkout cancelled. Your items are still in your bag.',
      );
      setCancelId('');
      await refresh();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (error) return <ErrorBox message={error} retry={refresh} />;
  if (!data) return <Loading />;
  if (!data.items.length)
    return (
      <Empty
        title="A little room for something good."
        body="Your bag is empty. Start with the collection and see what catches your eye."
        href="/shop"
        label="Explore the shop"
      />
    );
  const subtotal = data.items.reduce(
    (n: number, p: any) => n + p.price * p.quantity,
    0,
  );
  return (
    <>
      {cancelId && (
        <div className="notice">
          Payment wasn’t completed. You can return to checkout or release your
          reserved items.
          <button onClick={cancel} disabled={busy}>
            Cancel reservation
          </button>
        </div>
      )}
      <div className="cart-layout">
        <div className="cart-items">
          {data.items.map((p: any) => (
            <div className="cart-item" key={p.id}>
              <a href={'/shop/' + p.id}>
                <img src={p.image} alt={p.title} />
              </a>
              <div className="cart-item-copy">
                <span className="eyebrow">{p.category}</span>
                <a href={'/shop/' + p.id}>
                  <h3>{p.title}</h3>
                </a>
                <span>{money(p.price)}</span>
                <button
                  className="remove-link"
                  disabled={busy}
                  onClick={() => update(p.id, 0)}
                >
                  Remove
                </button>
              </div>
              <div className="quantity">
                <button
                  aria-label={'Decrease ' + p.title}
                  disabled={busy || p.quantity <= 1}
                  onClick={() => update(p.id, p.quantity - 1)}
                >
                  <Minus size={15} />
                </button>
                <span>{p.quantity}</span>
                <button
                  aria-label={'Increase ' + p.title}
                  disabled={busy || p.quantity >= 20 || p.quantity >= p.stock}
                  onClick={() => update(p.id, p.quantity + 1)}
                >
                  <Plus size={15} />
                </button>
              </div>
              <strong>{money(p.price * p.quantity)}</strong>
            </div>
          ))}
        </div>
        <aside className="glass-panel order-summary">
          <span className="eyebrow">THE GOOD PART</span>
          <h2>Order summary</h2>
          <div>
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div>
            <span>Standard US shipping</span>
            <span>{money(data.shipping)}</span>
          </div>
          <p>Any applicable tax is calculated at checkout.</p>
          <div className="total">
            <span>Before tax</span>
            <strong>{money(subtotal + data.shipping)}</strong>
          </div>
          {data.mode === 'test' && (
            <div className="notice">Stripe test mode · no real payments</div>
          )}
          <button
            className="button button-light"
            disabled={busy || !data.ready}
            onClick={checkout}
          >
            {busy ? (
              <Loader2 className="spin" size={17} />
            ) : (
              <LockKeyhole size={17} />
            )}{' '}
            Secure checkout <ArrowRight size={17} />
          </button>
          {!data.ready && (
            <p className="payment-note">
              Checkout opens when the owner connects Stripe and activates
              selling.
            </p>
          )}
          <a className="text-link" href="/policies">
            Shipping & returns <ArrowUpRight size={14} />
          </a>
        </aside>
      </div>
    </>
  );
}
function Account() {
  const { user, refresh: refreshUser, notify } = useStore();
  const { data, error, refresh } = useData('account');
  const [name, setName] = useState(user?.name || ''),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [accountTab, setAccountTab] = useState('orders'),
    [verification, setVerification] = useState('');
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested && ['orders', 'saved', 'events', 'support', 'profile', ...(user?.admin ? ['news'] : [])].includes(requested)) setAccountTab(requested);
  }, [user?.admin]);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('order');
    if (id) {
      setVerification('Checking your payment…');
      api('verify', { orderId: id })
        .then((d) => {
          setVerification(
            d.status === 'paid'
              ? 'Payment confirmed. Thank you for your order.'
              : 'Your order is ' +
                  d.status +
                  '. No payment is assumed until Stripe confirms it.',
          );
          return refresh();
        })
        .catch((e) => setVerification(e.message));
    }
  }, [refresh]);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('profile', { name });
      await refreshUser();
      notify('Profile updated.');
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const initials = (user?.name || 'N N')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <>
      <section className="account-hero">
        <div className="account-identity">
          <span className="account-avatar">{initials}</span>
          <div>
            <span className="eyebrow">MY SIGNOVA</span>
            <h1>Welcome back, {user?.name.split(' ')[0] || 'friend'}.</h1>
            <p>{user?.email}</p>
          </div>
        </div>
        <div className="account-hero-actions">
          {user?.admin && (
            <>
              <a className="button button-light" href="/account?tab=support"><Headphones size={17} /> IT Support inbox</a>
              <a className="button button-light" href="/admin"><PanelTop size={17} /> Creator studio</a>
            </>
          )}
          <a className="button button-quiet" href="/api/auth/signout?return_to=%2Flogin">
            <LogOut size={16} /> Sign out
          </a>
        </div>
      </section>
      {verification && (
        <div className="notice">
          <ShieldCheck size={18} />
          {verification}
        </div>
      )}
      {data && (
        <section className="account-summary" aria-label="Account summary">
          <article><ShoppingBag size={20} /><div><strong>{data.orders.length}</strong><span>Orders</span></div></article>
          <article><Heart size={20} /><div><strong>{data.savedProducts?.length || 0}</strong><span>Saved finds</span></div></article>
          <article><CalendarDays size={20} /><div><strong>{data.rsvps.length}</strong><span>Events</span></div></article>
          <article><Trophy size={20} /><div><strong>{data.score ? `${data.score.moves} moves` : '—'}</strong><span>Game best</span></div></article>
        </section>
      )}
      {user?.admin && <CreatorAccountHub />}
      <Tabs value={accountTab} onValueChange={(value) => setAccountTab(String(value))}>
        <TabsList className={`account-section-nav ${user?.admin ? 'has-news' : ''}`}>
          <TabsTrigger value="orders"><Package /><span><strong>Orders</strong><small>Purchases and tracking</small></span></TabsTrigger>
          <TabsTrigger value="saved"><Heart /><span><strong>Saved</strong><small>Your favorite finds</small></span></TabsTrigger>
          <TabsTrigger value="events"><CalendarDays /><span><strong>Events</strong><small>RSVPs and plans</small></span></TabsTrigger>
          <TabsTrigger value="support"><Headphones /><span><strong>IT Support</strong><small>{user?.admin ? 'Client inbox' : 'My requests'}</small></span></TabsTrigger>
          {user?.admin && <TabsTrigger value="news"><Newspaper /><span><strong>News editor</strong><small>Write and publish</small></span></TabsTrigger>}
          <TabsTrigger value="profile"><UserRound /><span><strong>Profile</strong><small>Name and sign-in</small></span></TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          {error ? (
            <ErrorBox message={error} retry={refresh} />
          ) : !data ? (
            <Loading />
          ) : data.orders.length ? (
            <div className="order-list">
              {data.orders.map((o: any) => (
                <button
                  className="order-row"
                  key={o.id}
                  onClick={() => setSelected(o.id)}
                >
                  <Package />
                  <div>
                    <strong>Order {o.id.slice(0, 8).toUpperCase()}</strong>
                    <span>
                      {new Date(o.created_at * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={'status ' + o.status}>{o.status}</span>
                  <strong>{money(o.total)}</strong>
                  <ArrowUpRight size={17} />
                </button>
              ))}
            </div>
          ) : (
            <Empty
              icon={Package}
              title="The start of a good collection."
              body="Your orders will appear here after you check out."
              href="/shop"
              label="Discover the collection"
            />
          )}
        </TabsContent>
        <TabsContent value="saved">
          {data?.savedProducts?.length ? (
            <div className="account-saved-grid">
              {data.savedProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Empty icon={Heart} title="Save the things you love." body="Tap the heart on any product and it will appear here." href="/shop" label="Browse the shop" />
          )}
        </TabsContent>
        <TabsContent value="events">
          {data?.rsvps.length ? (
            <div className="event-list">
              {data.rsvps.map((p: any) => (
                <div className="glass-panel" key={p.id}>
                  <span className="eyebrow">YOU’RE ON THE LIST</span>
                  <h3>{p.title}</h3>
                  <p>
                    {new Date(p.date).toLocaleString()} · {p.location}
                  </p>
                  <button
                    className="button"
                    onClick={async () => {
                      try {
                        await api('rsvp', { postId: p.id, attending: false });
                        await refresh();
                        notify('Your RSVP was cancelled.');
                      } catch (e) {
                        notify((e as Error).message);
                      }
                    }}
                  >
                    Cancel RSVP
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              icon={CalendarDays}
              title="Make room for a good time."
              body="Your saved events will appear here."
              href="/events"
              label="Explore events"
            />
          )}
        </TabsContent>
        <TabsContent value="support"><SupportDesk /></TabsContent>
        {user?.admin && <TabsContent value="news"><AccountNewsEditor /></TabsContent>}
        <TabsContent value="profile">
          <form className="glass-panel profile-form" onSubmit={save}>
            <h2>A little about you.</h2>
            <label>
              Display name
              <input
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Email address
              <input value={user?.email || ''} readOnly />
            </label>
            <p className="muted">
              Your email and sign-in security are managed by your sign-in provider.
            </p>
            <button className="button button-light" disabled={busy}>
              Save profile <Check size={16} />
            </button>
            <a
              className="text-link"
              href="/api/auth/signout?return_to=%2Flogin"
              target="_top"
            >
              <LogOut size={16} /> Sign out
            </a>
          </form>
        </TabsContent>
      </Tabs>
      <OrderDetail id={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function toLocalDateTime(value: string) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function SupportDesk() {
  const { user, notify } = useStore();
  const { data, error, refresh } = useData('support-tickets');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<any>(null);
  const [threadError, setThreadError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('new');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [deliveryNotice, setDeliveryNotice] = useState('');
  const owner = !!user?.admin;
  const tickets: any[] = data?.tickets || [];
  const open = tickets.filter((ticket) => ticket.status !== 'resolved').length;
  useEffect(() => {
    if (!tickets.length) setActiveId(null);
    else if (!activeId || !tickets.some((ticket) => ticket.id === activeId)) setActiveId(tickets[0].id);
  }, [data, activeId]);
  const loadThread = useCallback(async (id: string) => {
    try {
      const result = await api('support-ticket/' + encodeURIComponent(id));
      setThread(result);
      setStatus(result.ticket.status);
      setNote(result.ticket.note || '');
      setThreadError('');
    } catch (reason) {
      setThreadError((reason as Error).message);
    }
  }, []);
  useEffect(() => {
    setThread(null);
    setDeliveryNotice('');
    if (activeId) void loadThread(activeId);
  }, [activeId, loadThread]);
  useEffect(() => {
    const timer = window.setInterval(() => { void refresh(); if (activeId) void loadThread(activeId); }, 30000);
    return () => window.clearInterval(timer);
  }, [activeId, loadThread, refresh]);
  async function updateTicket() {
    if (!activeId) return;
    setBusy(true);
    try {
      await api('admin/support', { id: activeId, status, note });
      await Promise.all([refresh(), loadThread(activeId)]);
      notify('Support request updated.');
    } catch (reason) { notify((reason as Error).message); }
    finally { setBusy(false); }
  }
  async function sendReply(event: FormEvent) {
    event.preventDefault();
    if (!activeId || !reply.trim()) return;
    setBusy(true);
    try {
      const result = await api('support-message', { id: activeId, message: reply.trim() });
      setReply('');
      setDeliveryNotice(result.delivery === 'sent' ? 'Message saved and email sent.' : 'Message saved in this conversation. Email delivery is not connected; use your email app to contact the client if needed.');
      await Promise.all([refresh(), loadThread(activeId)]);
    } catch (reason) { notify((reason as Error).message); }
    finally { setBusy(false); }
  }
  const visible = tickets.filter((ticket) => {
    if (filter !== 'all' && ticket.status !== filter) return false;
    const text = `${ticket.first_name} ${ticket.last_name} ${ticket.email || ''} ${ticket.device} ${ticket.issue} ${ticket.id}`.toLowerCase();
    return text.includes(search.toLowerCase().trim());
  });
  const ticket = thread?.ticket;
  const emailSubject = ticket ? `DeafTech Support · ${ticket.id.slice(0, 8).toUpperCase()}` : '';
  const emailBody = ticket ? `Hello ${ticket.first_name},\n\n\n\nReference: ${ticket.id.slice(0, 8).toUpperCase()}` : '';
  return (
    <section className="support-desk" aria-label={owner ? 'IT Support inbox' : 'My IT Support requests'}>
      <header className="support-desk-heading">
        <div><span className="eyebrow">{owner ? 'OWNER WORKSPACE' : 'YOUR SUPPORT'}</span><h2>{owner ? 'IT Support inbox' : 'My support requests'}</h2><p>{owner ? 'Every client request and conversation, in one place.' : 'Follow your requests and write to the technician here.'}</p></div>
        <div className="support-desk-heading-actions"><span className="support-desk-open"><Headphones size={17} /> {open} open</span><button className="button" type="button" onClick={() => { void refresh(); if (activeId) void loadThread(activeId); }}><RefreshCw size={16} /> Refresh</button></div>
      </header>
      {error && <ErrorBox message={error} retry={refresh} />}
      {!data ? <Loading /> : !tickets.length ? (
        <div className="support-desk-empty"><Headphones size={37} /><h3>{owner ? 'Your inbox is clear.' : 'No support requests yet.'}</h3><p>{owner ? 'New client requests will appear here as soon as they are sent.' : 'Send a request and your conversation will appear here.'}</p>{!owner && <a className="button button-light" href="/support">Request tech support <ArrowRight size={16} /></a>}</div>
      ) : (
        <div className="support-desk-layout">
          <aside className="support-desk-list" aria-label="Support requests">
            <div className="support-desk-tools"><label className="support-desk-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests" aria-label="Search requests" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter requests"><option value="all">All requests</option><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></div>
            <div className="support-desk-results">{visible.length ? visible.map((item) => <button key={item.id} type="button" className={`support-desk-item ${activeId === item.id ? 'selected' : ''}`} onClick={() => setActiveId(item.id)} aria-current={activeId === item.id ? 'true' : undefined}><span className="support-desk-item-top"><strong>{owner ? `${item.first_name} ${item.last_name}` : item.device}</strong><time>{new Date(item.updated_at).toLocaleDateString()}</time></span><span className="support-desk-item-issue">{item.issue}</span><span className="support-desk-item-bottom"><span className={`status ${item.status}`}>{item.status.replace('_', ' ')}</span><small>#{item.id.slice(0, 8).toUpperCase()}</small></span></button>) : <p className="support-desk-no-match">No requests match this search.</p>}</div>
          </aside>
          <div className="support-desk-detail">
            {threadError ? <ErrorBox message={threadError} retry={() => activeId && void loadThread(activeId)} /> : !ticket || ticket.id !== activeId ? <Loading /> : <>
              <div className="support-desk-detail-head"><div><span className="eyebrow">REQUEST #{ticket.id.slice(0, 8).toUpperCase()}</span><h3>{ticket.device}</h3><p>Opened {new Date(ticket.created_at).toLocaleString()}</p></div><span className={`status ${ticket.status}`}>{ticket.status.replace('_', ' ')}</span></div>
              <div className="support-desk-contact"><span><UserRound size={16} /> {ticket.first_name} {ticket.last_name}</span>{owner && <><a href={`mailto:${ticket.email}`}><Mail size={16} /> {ticket.email}</a>{ticket.phone && <a href={`tel:${ticket.phone}`}><Phone size={16} /> {ticket.phone}</a>}</>}{ticket.asl_code && <span><Wifi size={16} /> ASL code: {ticket.asl_code}</span>}</div>
              <div className="support-desk-thread"><div className="support-desk-message client"><div className="support-desk-message-meta"><strong>{ticket.first_name} {ticket.last_name}</strong><time>{new Date(ticket.created_at).toLocaleString()}</time></div><p>{ticket.issue}</p></div>{thread.messages.map((message: any) => <div className={`support-desk-message ${message.sender === 'owner' ? 'technician' : 'client'}`} key={message.id}><div className="support-desk-message-meta"><strong>{message.sender === 'owner' ? 'Signova Support' : `${ticket.first_name} ${ticket.last_name}`}</strong><time>{new Date(message.created_at).toLocaleString()}</time></div><p>{message.body}</p>{owner && message.sender === 'owner' && <small className={`support-desk-delivery ${message.delivery_status}`}>Email {message.delivery_status}</small>}</div>)}</div>
              {owner && <div className="support-desk-manage"><div><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></label><label>Private technician note<input maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Only you can see this" /></label></div><button className="button" type="button" disabled={busy} onClick={updateTicket}><Check size={16} /> Save details</button></div>}
              <form className="support-desk-compose" onSubmit={sendReply}><label htmlFor="support-desk-reply">{owner ? 'Reply to client' : 'Add a message'}</label><textarea id="support-desk-reply" required maxLength={3000} rows={4} value={reply} onChange={(event) => setReply(event.target.value)} placeholder={owner ? 'Write a clear next step for the client…' : 'Tell us what changed or ask a follow-up question…'} /><div><span>{reply.length}/3000</span><button className="button button-light" disabled={busy || !reply.trim()}>{busy ? <Loader2 className="spin" size={16} /> : <Send size={16} />} Send message</button></div></form>
              {deliveryNotice && <p className="support-desk-delivery-note" role="status">{deliveryNotice}</p>}
              {owner && <div className="support-desk-footer"><a href={`mailto:${ticket.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}><Mail size={16} /> Open email app</a>{ticket.notification_status !== 'sent' && <span>Original request email: {ticket.notification_status}</span>}</div>}
            </>}
          </div>
        </div>
      )}
    </section>
  );
}

function AccountNewsEditor() {
  const { data, error, refresh } = useData('admin');
  const { notify } = useStore();
  const fresh = () => ({ ...emptyPost, kind: 'news', date: toLocalDateTime(new Date().toISOString()), published_at: Date.now() });
  const [post, setPost] = useState<any>(fresh), [busy, setBusy] = useState(false), [formError, setFormError] = useState(''), [showPreview, setShowPreview] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setFormError('');
    try {
      await api('admin/post', { ...post, kind: 'news', date: new Date(post.date).toISOString(), end_date: '', location: '', capacity: 0 });
      await refresh(); notify(post.published ? 'News story published.' : 'News draft saved.'); setPost(fresh());
    } catch (reason) { setFormError((reason as Error).message); } finally { setBusy(false); }
  }
  async function uploadNews(file: File | undefined, kind: 'image' | 'video') {
    if (!file) return; setBusy(true); setFormError('');
    try {
      const form = new FormData(); form.set('file', file); if (kind === 'video') form.set('kind', 'video');
      const response = await fetch('/api/upload', { method: 'POST', body: form }); const result: any = await response.json();
      if (!response.ok) throw new Error(result.error); setPost((current: any) => ({ ...current, [kind]: result.url })); notify(`${kind === 'video' ? 'Video' : 'Image'} uploaded.`);
    } catch (reason) { setFormError((reason as Error).message); } finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (!window.confirm('Delete this news story? This cannot be undone.')) return;
    setBusy(true); setFormError('');
    try { await api('admin/post-delete', { id }); await refresh(); if (post.id === id) setPost(fresh()); notify('News story deleted.'); }
    catch (reason) { setFormError((reason as Error).message); } finally { setBusy(false); }
  }
  if (error) return <ErrorBox message={error} retry={refresh} />;
  if (!data) return <Loading />;
  const news = data.posts.filter((item: any) => item.kind === 'news');
  return (
    <section className="account-news-editor">
      <div className="account-news-head"><div><span className="eyebrow">MY NEWSROOM</span><h2>Write news with video and text.</h2><p>Create a draft, preview it, and publish it to the News page.</p></div><button className="button" onClick={() => { setPost(fresh()); setFormError(''); setShowPreview(false); }}><Plus size={16} /> New story</button></div>
      <div className="account-news-layout">
        <form className="account-news-form" onSubmit={save}>
          {formError && <ErrorBox message={formError} />}
          <div className="form-row"><label>Story title<input required maxLength={160} value={post.title} onChange={(event) => setPost({ ...post, title: event.target.value })} placeholder="A clear, useful headline" /></label><label>Author<input required maxLength={100} value={post.author} onChange={(event) => setPost({ ...post, author: event.target.value })} /></label></div>
          <label>Short introduction<textarea required rows={3} maxLength={400} value={post.summary} onChange={(event) => setPost({ ...post, summary: event.target.value })} placeholder="Tell readers what this story is about." /></label>
          <label>Full article text<textarea required rows={9} maxLength={12000} value={post.body} onChange={(event) => setPost({ ...post, body: event.target.value })} placeholder="Write the full story. Separate paragraphs with a blank line." /></label>
          <div className="form-row"><label>Article date<input required type="datetime-local" value={post.date} onChange={(event) => setPost({ ...post, date: event.target.value })} /></label><label>Date posted<input required type="date" value={new Date(post.published_at || Date.now()).toISOString().slice(0, 10)} onChange={(event) => setPost({ ...post, published_at: new Date(`${event.target.value}T12:00:00`).getTime() })} /></label></div>
          <label>Cover image URL<input required value={post.image} onChange={(event) => setPost({ ...post, image: event.target.value })} /></label>
          <label className="upload-field"><Upload size={18} /> Upload cover image<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => uploadNews(event.target.files?.[0], 'image')} /></label>
          <label>Video URL <span className="optional-label">YouTube, Vimeo, MP4, or WebM</span><input type="text" maxLength={1500} placeholder="https://…" value={post.video || ''} onChange={(event) => setPost({ ...post, video: event.target.value })} /></label>
          <label className="upload-field"><Play size={18} /> Upload video up to 50 MB<input type="file" accept="video/mp4,video/webm" disabled={busy} onChange={(event) => uploadNews(event.target.files?.[0], 'video')} /></label>
          <div className="news-publish-row"><label className="check-label"><Checkbox checked={!!post.published} onCheckedChange={(value) => setPost({ ...post, published: !!value })} /> Publish on News</label><label className="check-label"><Checkbox checked={!!post.featured} onCheckedChange={(value) => setPost({ ...post, featured: !!value })} /> Feature story</label></div>
          <div className="news-editor-actions"><button type="button" className="button" onClick={() => setShowPreview((value) => !value)}><Eye size={17} /> {showPreview ? 'Hide preview' : 'Preview story'}</button><button className="button button-light" disabled={busy}>{busy ? <Loader2 className="spin" size={17} /> : <Check size={17} />} {post.id ? 'Update story' : 'Save story'}</button></div>
        </form>
        <aside className="account-news-side">
          {showPreview && <div className="account-news-preview"><span className="eyebrow">STORY PREVIEW</span>{post.image && <img className="account-news-preview-cover" src={post.image} alt="Story cover preview" />}<h3>{post.title || 'Your headline'}</h3><p>{post.summary || 'Your introduction will appear here.'}</p>{post.video && <NewsVideo post={post} />}<div className="account-news-preview-body">{String(post.body || '').split(/\n\s*\n/).filter(Boolean).map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}</div></div>}
          <div className="account-news-list"><div className="account-news-list-head"><span className="eyebrow">YOUR STORIES</span><strong>{news.length}</strong></div>{news.length ? news.map((item: any) => <article key={item.id}><img src={item.image} alt="" /><div><span className={`status ${item.published ? 'published' : 'draft'}`}>{item.published ? 'published' : 'draft'}</span><h3>{item.title}</h3><small>{item.video ? 'Video + text' : 'Text article'} · {new Date(item.published_at || item.date).toLocaleDateString()}</small><div><button onClick={() => { setPost({ ...item, date: toLocalDateTime(item.date) }); setShowPreview(false); }}><Pencil size={14} /> Edit</button>{item.published ? <a href={`/news/${item.id}`}><Eye size={14} /> View</a> : null}<button className="delete-news" disabled={busy} onClick={() => remove(item.id)}><X size={14} /> Delete</button></div></div></article>) : <div className="news-list-empty"><Newspaper size={27} /><p>Your saved news stories will appear here.</p></div>}</div>
        </aside>
      </div>
    </section>
  );
}
function CreatorAccountHub() {
  const { data, error } = useData('admin');
  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading />;
  const publishedProducts = data.products.filter((product: any) => product.status === 'published').length;
  const publishedPosts = data.posts.filter((post: any) => post.published).length;
  const publishedGames = data.games.filter((game: any) => game.published).length;
  const openSupport = data.supportRequests.filter((request: any) => request.status !== 'resolved').length;
  const selling = data.connected && data.settings.selling === 'true';
  return (
    <section className="account-business-hub">
      <div className="account-business-head">
        <div><span className="eyebrow">OWNER CONTROL CENTER</span><h2>Your business, all in one place.</h2><p>Publish, sell, collect payments, host events, build games, and answer customers.</p></div>
        <a className="button button-light" href="/admin"><PanelTop size={17} /> Full studio</a>
      </div>
      <div className="account-business-grid">
        <article className="business-card products"><Store /><div><span>SELLING</span><strong>{publishedProducts} live products</strong><small>Create listings, upload pictures, set prices, and control stock.</small></div><div className="business-actions"><a href="/admin?tab=products&new=product"><Plus size={15} /> Add product</a><a href="/admin?tab=products">Manage</a></div></article>
        <article className="business-card payments"><LockKeyhole /><div><span>PAYMENTS</span><strong>{selling ? 'Selling is active' : data.connected ? 'Stripe connected' : 'Connect Stripe'}</strong><small>Secure checkout, taxes, orders, shipping, and refunds.</small></div><div className="business-actions"><a href="/admin?tab=settings">{data.connected ? 'Payment settings' : 'Set up payments'} <ArrowRight size={15} /></a></div></article>
        <article className="business-card content"><Newspaper /><div><span>POSTS & EVENTS</span><strong>{publishedPosts} published</strong><small>Share news or publish a complete event page with RSVPs.</small></div><div className="business-actions"><a href="/admin?tab=stories&new=event"><Plus size={15} /> New event</a><a href="/admin?tab=stories&new=news">New post</a></div></article>
        <article className="business-card games"><Gamepad2 /><div><span>GAMES</span><strong>{publishedGames} live games</strong><small>Build with HTML, CSS, JavaScript, and Python.</small></div><div className="business-actions"><a href="/admin?tab=games&new=game"><Plus size={15} /> Create game</a><a href="/admin?tab=games">Manage</a></div></article>
        <article className="business-card support"><Headphones /><div><span>DEAFTECH SUPPORT</span><strong>{openSupport} open requests</strong><small>Read client messages, reply, manage status, and keep private notes.</small></div><div className="business-actions"><a href="/account?tab=support">Open IT Support inbox <ArrowRight size={15} /></a></div></article>
      </div>
    </section>
  );
}
function OrderDetail({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState('');
  useEffect(() => {
    setData(null);
    setError('');
    if (id)
      api('order/' + id)
        .then(setData)
        .catch((e) => setError(e.message));
  }, [id]);
  return (
    <Sheet open={!!id} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="order-sheet">
        <SheetTitle>Order details</SheetTitle>
        <SheetDescription>{id?.slice(0, 8).toUpperCase()}</SheetDescription>
        {error ? (
          <ErrorBox message={error} />
        ) : !data ? (
          <Loading />
        ) : (
          <>
            <span className={'status ' + data.order.status}>
              {data.order.status}
            </span>
            {data.items.map((p: any, i: number) => (
              <div className="mini-product" key={i}>
                <img src={p.image} alt={p.title} />
                <div>
                  <strong>{p.title}</strong>
                  <p>
                    {p.quantity} × {money(p.price)}
                  </p>
                </div>
              </div>
            ))}
            <div className="total">
              <strong>Order total</strong>
              <strong>{money(data.order.total)}</strong>
            </div>
            {data.order.tracking && (
              <div>
                <h3>Tracking</h3>
                <p>{data.order.tracking}</p>
              </div>
            )}
            {data.order.address && data.order.address !== '{}' && (
              <div>
                <h3>Shipping information</h3>
                <Address value={data.order.address} />
              </div>
            )}
            {data.order.status === 'pending' && (
              <p className="muted">Payment has not yet been confirmed.</p>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
function Address({ value }: { value: string }) {
  try {
    const d = JSON.parse(value);
    const a = d.address || {};
    return (
      <p className="address">
        {d.name}
        <br />
        {a.line1}
        <br />
        {a.line2 && (
          <>
            {a.line2}
            <br />
          </>
        )}
        {a.city} {a.state} {a.postal_code}
        <br />
        {a.country}
      </p>
    );
  } catch {
    return null;
  }
}
function gameScript(value: string) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}
function gameDocument(game: any) {
  const html = String(game.html || '');
  const css = String(game.css || '').replaceAll('</style', '<\\/style');
  const javascript = gameScript(String(game.javascript || ''));
  const python = gameScript(String(game.python || ''));
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; connect-src https://cdn.jsdelivr.net; font-src data: https:; form-action 'none'"><base target="_blank"><style>html,body{margin:0;min-height:100%;font-family:system-ui,sans-serif}${css}</style></head><body>${html}<div id="python-status" role="status"></div><script>try{new Function(${javascript})()}catch(error){document.getElementById('python-status').textContent='JavaScript: '+error.message}const pythonSource=${python};if(pythonSource.trim()){const loader=document.createElement('script');loader.src='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js';loader.onload=async()=>{const status=document.getElementById('python-status');try{status.textContent='Loading Python…';const py=await loadPyodide();await py.runPythonAsync(pythonSource);status.textContent=''}catch(error){status.textContent='Python: '+error.message}};loader.onerror=()=>document.getElementById('python-status').textContent='Python needs an internet connection to load.';document.head.appendChild(loader)}<\/script></body></html>`;
}
function GameFrame({ game, title = true }: { game: any; title?: boolean }) {
  return (
    <section className="creator-game-player">
      {title && (
        <div className="creator-game-player-head">
          <div><span>{game.category}</span><h2>{game.title}</h2></div>
          <span className="instant-badge">HTML · CSS · JS · Python</span>
        </div>
      )}
      <iframe
        title={`${game.title} game`}
        sandbox="allow-scripts"
        srcDoc={gameDocument(game)}
      />
    </section>
  );
}
const symbols = [Diamond, Sun, Moon, Leaf, Flower2, Music2, Star, Heart];
function Game() {
  const { user, notify } = useStore();
  const { data: gameData } = useData('games');
  const [deck, setDeck] = useState<number[]>([]),
    [flipped, setFlipped] = useState<number[]>([]),
    [matched, setMatched] = useState<number[]>([]),
    [moves, setMoves] = useState(0),
    [seconds, setSeconds] = useState(0),
    [running, setRunning] = useState(false),
    [round, setRound] = useState(0),
    [best, setBest] = useState<any>(null),
    [activeGame, setActiveGame] = useState<any>(null);
  const won = matched.length === 8;
  useEffect(() => {
    if (user)
      api('account')
        .then((d) => setBest(d.score))
        .catch(() => {});
  }, [user]);
  useEffect(() => {
    if (!running || won) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [running, won]);
  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    const match = deck[a] === deck[b];
    const timer = setTimeout(
      () => {
        if (match) setMatched((v) => [...v, deck[a]]);
        setFlipped([]);
      },
      match ? 250 : 800,
    );
    return () => clearTimeout(timer);
  }, [flipped, deck]);
  useEffect(() => {
    if (won && running) {
      setRunning(false);
      if (user) {
        api('score', { moves, seconds: Math.max(1, seconds) })
          .then(() => {
            if (
              !best ||
              moves < best.moves ||
              (moves === best.moves && seconds < best.seconds)
            )
              setBest({ moves, seconds });
            notify('Your game is saved. Nicely matched.');
          })
          .catch((e) => notify(e.message));
      }
    }
  }, [won, running, user, moves, seconds, best, notify]);
  function start() {
    const cards = [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7];
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    setDeck(cards);
    setMatched([]);
    setFlipped([]);
    setMoves(0);
    setSeconds(0);
    setRunning(true);
    setRound((r) => r + 1);
  }
  function flip(i: number) {
    if (
      !running ||
      flipped.length === 2 ||
      flipped.includes(i) ||
      matched.includes(deck[i])
    )
      return;
    if (flipped.length === 1) setMoves((m) => m + 1);
    setFlipped((v) => [...v, i]);
  }
  return (
    <>
      <section className="game-hub-header">
        <div>
          <span className="game-kicker"><Gamepad2 size={18} /> SIGNOVA PLAY</span>
          <h1>Small games.<br />Bright breaks.</h1>
          <p>Play instantly in your browser. No download, no interruption.</p>
        </div>
        <div className="game-feature-orb" aria-hidden="true">
          <Sparkles size={50} />
          <span>PLAY</span>
        </div>
      </section>
      <div className="game-category-strip" aria-label="Game categories">
        <span className="selected"><Star size={15} /> Featured</span>
        <span><Diamond size={15} /> Puzzle</span>
        <span><Flower2 size={15} /> Memory</span>
        <span><Sun size={15} /> Relaxing</span>
        <span className="game-count">{1 + (gameData?.games?.length || 0)} games · play instantly</span>
      </div>
      <section className="game-library" aria-label="Choose a game">
        <button className={!activeGame ? 'selected' : ''} onClick={() => setActiveGame(null)}>
          <span className="game-library-art default"><Heart size={25} /></span>
          <span><strong>Perfect Pairs</strong><small>Memory · Featured</small></span>
          <Play size={18} />
        </button>
        {gameData?.games?.map((game: any) => (
          <button key={game.id} className={activeGame?.id === game.id ? 'selected' : ''} onClick={() => setActiveGame(game)}>
            <span className="game-library-art"><img src={game.thumbnail} alt="" /></span>
            <span><strong>{game.title}</strong><small>{game.category}</small></span>
            <Play size={18} />
          </button>
        ))}
      </section>
      {activeGame ? (
        <div className="published-game-layout">
          <GameFrame game={activeGame} />
          <aside className="game-aside">
            <span className="eyebrow">CREATED IN SIGNOVA PLAY</span>
            <h2>{activeGame.title}</h2>
            <p>{activeGame.description}</p>
            <div className="personal-best"><Code2 size={19} /><div>Built with<strong>HTML · CSS · JavaScript · Python</strong></div></div>
            {user?.admin && <a className="button" href="/admin?tab=games"><Pencil size={16} /> Edit this game</a>}
          </aside>
        </div>
      ) : (
      <div className="game-layout">
        <section className="game-board glass-panel">
          <div className="game-titlebar">
            <span className="game-thumbnail"><Heart size={22} /></span>
            <div><small>FEATURED GAME</small><strong>Perfect Pairs</strong></div>
            <span className="instant-badge">Instant play</span>
          </div>
          <div className="game-stats">
            <span>
              Moves<strong>{moves.toString().padStart(2, '0')}</strong>
            </span>
            <span>
              Matched<strong>{matched.length} / 8</strong>
            </span>
            <span>
              Time
              <strong>
                {Math.floor(seconds / 60)}:
                {(seconds % 60).toString().padStart(2, '0')}
              </strong>
            </span>
          </div>
          {!deck.length ? (
            <div className="game-start">
              <Diamond size={55} />
              <h2>Find your match.</h2>
              <p>
                Turn over two cards. Remember what you see.
                <br />
                Match every pair to finish the collection.
              </p>
              <button className="button button-light" onClick={start}>
                Let’s play <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="memory-grid" key={round}>
              {deck.map((v, i) => {
                const Icon = symbols[v],
                  open = flipped.includes(i) || matched.includes(v);
                return (
                  <button
                    key={i}
                    className={
                      'memory-card ' +
                      (open ? 'flipped ' : '') +
                      (matched.includes(v) ? 'matched' : '')
                    }
                    onClick={() => flip(i)}
                    disabled={!running || open || flipped.length === 2}
                    aria-label={
                      open
                        ? `${['Diamond', 'Sun', 'Moon', 'Leaf', 'Flower', 'Music', 'Star', 'Heart'][v]}${matched.includes(v) ? ', matched' : ''}`
                        : `Turn over card ${i + 1}`
                    }
                  >
                    {open ? <Icon size={35} /> : <Sparkles size={25} />}
                  </button>
                );
              })}
            </div>
          )}
          {won && (
            <div className="game-win" role="status">
              <Check size={24} />
              <h3>A perfect collection.</h3>
              <p>
                All eight pairs in {moves} moves and {seconds} seconds.
              </p>
              <button className="button button-light" onClick={start}>
                Play again <RefreshCw size={16} />
              </button>
            </div>
          )}
        </section>
        <aside className="game-aside">
          <span className="eyebrow">A LITTLE FOCUS GOES A LONG WAY</span>
          <h2>
            Take a breath.
            <br />
            <em>Trust your eye.</em>
          </h2>
          <ol>
            <li>Choose any two cards.</li>
            <li>Matching symbols stay face up.</li>
            <li>Find all eight pairs in as few moves as you can.</li>
          </ol>
          {best && (
            <div className="personal-best">
              <Star size={19} />
              <div>
                Your personal best
                <strong>
                  {best.moves} moves · {best.seconds}s
                </strong>
              </div>
            </div>
          )}
          {!user && (
            <p className="muted">
              <a href="/login">Sign in</a> to save your personal best.
            </p>
          )}
          {deck.length > 0 && !won && (
            <button className="button" onClick={start}>
              <RefreshCw size={16} /> Start a new game
            </button>
          )}
          <span className="game-footnote">
            Just for the joy of it. No purchases, prizes, or stakes.
          </span>
        </aside>
      </div>
      )}
    </>
  );
}
function ContentView({ kind }: { kind: string }) {
  const { data, error, refresh } = useData('content');
  const { user } = useStore();
  const events = kind === 'events';
  const posts =
    data?.posts.filter((p: any) => p.kind === (events ? 'event' : 'news')) ||
    [];
  return (
    <>
      <Heading
        kicker={
          events ? 'GOOD COMPANY. GREAT MOMENTS.' : 'NOTES FROM OUR WORLD'
        }
        title={events ? 'Deaf events and community.' : 'Signova technology news.'}
        description={
          events
            ? 'Gatherings, creative sessions, and things worth showing up for.'
            : 'Video stories, practical technology guidance, and updates from Signova.'
        }
      />
      {error ? (
        <ErrorBox message={error} retry={refresh} />
      ) : !data ? (
        <Loading />
      ) : !posts.length ? (
        <div className="events-empty">
          <CalendarDays size={40} />
          <span className="eyebrow">GOOD THINGS ARE IN THE MAKING</span>
          <h2>
            Our next gathering
            <br />
            is <em>taking shape.</em>
          </h2>
          <p>
            There are no events announced yet. Check back for the first
            invitation.
          </p>
          {user?.admin && (
            <a href="/admin?tab=stories" className="button">
              Create your first event <Plus size={16} />
            </a>
          )}
        </div>
      ) : (
        <div className={events ? 'event-list' : 'journal-grid'}>
          {posts.map((p: any) => (
            <article
              className={events ? 'event-card' : 'journal-card'}
              key={p.id}
            >
              <a
                className="story-image"
                href={`/${kind}/${p.id}`}
                aria-label={'Open ' + p.title}
              >
                <img src={p.image} alt={p.title} loading="lazy" />
                {!events && p.video ? <span className="story-video-badge"><Play size={13} /> VIDEO</span> : null}
              </a>
              <div className="story-copy">
                <span className="eyebrow">
                  {events
                    ? 'THE GATHERING'
                    : p.id === 'welcome'
                      ? 'A NEW CHAPTER'
                      : 'TECHNOLOGY STORY'}
                  <span>
                    {new Date(p.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </span>
                <a className="story-title" href={`/${kind}/${p.id}`}>
                  <h2>{p.title}</h2>
                </a>
                <p>{p.summary}</p>
                <span className="story-byline">By {p.author || 'Signova Technology'} · Posted {new Date(p.published_at || p.date).toLocaleDateString()}</span>
                {events && (
                  <div className="event-meta">
                    <span>
                      <MapPin size={16} />
                      {p.location}
                    </span>
                    <span>
                      <Clock size={16} />
                      {new Date(p.date).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                <a className="text-link" href={`/${kind}/${p.id}`}>
                  {events ? 'View full event' : 'Read the full story'}{' '}
                  <ArrowUpRight size={17} />
                </a>
                {events && p.sample ? (
                  <span className="status pending event-preview-label">
                    Preview · details soon
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
function newsVideoSource(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value, 'https://signova.local');
    if (url.hostname === 'youtu.be') return { type: 'embed', src: `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}` };
    if (url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com')) {
      const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
      if (id) return { type: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (url.hostname === 'vimeo.com' || url.hostname.endsWith('.vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return { type: 'embed', src: `https://player.vimeo.com/video/${id}` };
    }
    return { type: 'video', src: value };
  } catch { return null; }
}
function NewsVideo({ post }: { post: any }) {
  const source = newsVideoSource(post.video || '');
  if (!source) return null;
  return (
    <section className="news-video-section">
      <div className="news-video-heading"><span className="eyebrow"><Play size={13} /> WATCH THE STORY</span><span>Video from {post.author || 'Signova Technology'}</span></div>
      <div className="news-video-frame">
        {source.type === 'embed' ? <iframe src={source.src} title={`${post.title} video`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : <video controls preload="metadata" poster={post.image}><source src={source.src} />Your browser does not support this video.</video>}
      </div>
    </section>
  );
}
function NewsArticle({ post, onShare }: { post: any; onShare: () => void }) {
  const paragraphs = String(post.body || '').split(/\n\s*\n/).filter(Boolean);
  const posted = new Date(post.published_at || post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <article className="news-article">
      <a className="detail-back" href="/news"><ArrowLeft size={16} /> All news</a>
      <header className="news-article-head">
        <div className="news-article-intro"><span className="eyebrow">SIGNOVA TECHNOLOGY NEWS {post.featured ? '· FEATURED' : ''}</span><h1>{post.title}</h1><p>{post.summary}</p><div className="news-article-meta"><span><UserRound size={16} /> {post.author || 'Signova Technology'}</span><span><CalendarDays size={16} /> {posted}</span>{post.video && <span><Play size={16} /> Video story</span>}</div></div>
        <img src={post.image} alt={post.title} />
      </header>
      <div className="news-article-layout">
        <div className="news-article-main">
          {post.video && <NewsVideo post={post} />}
          <div className="news-article-text">{paragraphs.map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}</div>
          <div className="content-share-row"><span>Share this story</span><button className="button" onClick={onShare}><Share2 size={16} /> Share</button></div>
        </div>
        <aside className="news-article-side"><span className="eyebrow">THE STORY</span><h2>{post.title}</h2><p>Published by {post.author || 'Signova Technology'} on {posted}.</p><a className="button" href="/news">More news <ArrowUpRight size={16} /></a></aside>
      </div>
    </article>
  );
}
function calendarFile(post: any) {
  const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const text = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Signova Technology//Events//EN',
    'BEGIN:VEVENT',
    `UID:${post.id}@noble-new`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(post.date)}`,
    post.end_date ? `DTEND:${stamp(post.end_date)}` : '',
    `SUMMARY:${String(post.title).replaceAll(',', '\\,')}`,
    `LOCATION:${String(post.location || '').replaceAll(',', '\\,')}`,
    `DESCRIPTION:${String(post.summary || '').replaceAll('\n', '\\n').replaceAll(',', '\\,')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(text)}`;
}
function ContentDetail({ kind, id }: { kind: string; id: string }) {
  const { data, error, refresh } = useData('content/' + encodeURIComponent(id));
  const { user, notify } = useStore();
  const [attending, setAttending] = useState(false);
  const [busy, setBusy] = useState(false);
  const event = kind === 'events';
  useEffect(() => {
    if (user && event) api('account').then((account) => setAttending(account.rsvps.some((post: any) => post.id === id))).catch(() => {});
  }, [user, event, id]);
  if (error) return <ErrorBox message={error} retry={refresh} />;
  if (!data) return <Loading />;
  const post = data.post;
  if (post.kind !== (event ? 'event' : 'news')) return <ErrorBox message="This post is not available here." />;
  const start = new Date(post.date);
  const ended = start < new Date();
  const count = Number(post.rsvp_count || 0);
  const remaining = post.capacity > 0 ? Math.max(0, post.capacity - count) : null;
  async function rsvp() {
    if (!user) {
      window.location.href = `/login?return_to=${encodeURIComponent(`/${kind}/${id}`)}`;
      return;
    }
    setBusy(true);
    try {
      await api('rsvp', { postId: post.id, attending: !attending });
      setAttending(!attending);
      await refresh();
      notify(attending ? 'Your RSVP was cancelled.' : 'You’re on the list. See you there.');
    } catch (reason) {
      notify((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    const details = { title: post.title, text: post.summary, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(details);
      else {
        await navigator.clipboard.writeText(window.location.href);
        notify('Event link copied.');
      }
    } catch {}
  }
  if (!event) return <NewsArticle post={post} onShare={share} />;
  return (
    <article className="content-detail">
      <a className="detail-back" href={`/${kind}`}><ArrowLeft size={16} /> Back to {event ? 'events' : 'news'}</a>
      <header className="content-detail-hero">
        <img src={post.image} alt={post.title} />
        <div className="content-detail-overlay">
          <div className="content-detail-badges">
            <span>{event ? 'EVENT' : 'JOURNAL'}</span>
            {post.featured ? <span>FEATURED</span> : null}
          </div>
          <h1>{post.title}</h1>
          <p>{post.summary}</p>
          <div className="content-detail-byline">
            <span>By {post.author || 'Signova Technology'}</span>
            <span>Posted {new Date(post.published_at || post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </header>
      <div className="content-detail-layout">
        <div className="content-detail-main">
          {event && (
            <section className="event-facts">
              <div><CalendarDays /><span><small>Date</small><strong>{start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong></span></div>
              <div><Clock /><span><small>Time</small><strong>{start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}{post.end_date ? ` – ${new Date(post.end_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}</strong></span></div>
              <div><MapPin /><span><small>Location</small><strong>{post.location}</strong></span></div>
              <div><Users /><span><small>Attendance</small><strong>{post.capacity > 0 ? `${count} attending · ${remaining} spots left` : `${count} attending · open capacity`}</strong></span></div>
            </section>
          )}
          {!event && post.video ? <NewsVideo post={post} /> : null}
          <section className="content-detail-body">
            {post.body.split('\n').filter(Boolean).map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}
          </section>
          {event && post.accessibility && (
            <section className="accessibility-card"><Accessibility size={24} /><div><span className="eyebrow">ACCESSIBILITY</span><h2>Everyone is welcome.</h2><p>{post.accessibility}</p></div></section>
          )}
          <div className="content-share-row">
            <span>Share this {event ? 'event' : 'story'}</span>
            <button className="button" onClick={share}><Share2 size={16} /> Share</button>
          </div>
        </div>
        <aside className="event-action-card glass-panel">
          {event ? (
            <>
              <span className="eyebrow">JOIN THE GATHERING</span>
              <h2>{ended ? 'This event has ended.' : remaining === 0 ? 'This event is full.' : 'Save your place.'}</h2>
              <p>{post.sample ? 'Registration details are coming soon.' : 'Your event appears in My Account after you RSVP.'}</p>
              {!post.sample && (
                <button className="button button-light" disabled={busy || ended || (remaining === 0 && !attending)} onClick={rsvp}>
                  {attending ? 'Cancel my RSVP' : 'Save my spot'} <CalendarDays size={17} />
                </button>
              )}
              <a className="button" href={calendarFile(post)} download={`${post.id}.ics`}><CalendarDays size={16} /> Add to calendar</a>
              {post.registration_url && <a className="text-link" href={post.registration_url} target="_blank" rel="noreferrer">Official registration <ExternalLink size={15} /></a>}
              {post.contact_email && <a className="text-link" href={`mailto:${post.contact_email}`}><Mail size={15} /> Contact organizer</a>}
              <div className="event-host"><span>Hosted by</span><strong>{post.author || 'Signova Technology'}</strong></div>
            </>
          ) : (
            <><span className="eyebrow">ABOUT THE AUTHOR</span><h2>{post.author || 'Signova Technology'}</h2><p>Published {new Date(post.published_at || post.date).toLocaleDateString()}.</p><a className="button" href="/news">More stories</a></>
          )}
        </aside>
      </div>
    </article>
  );
}
function Policies() {
  const { data, error, refresh } = useData('catalog');
  return (
    <>
      <Heading kicker="THE DETAILS MATTER" title="Shop information." />
      <div className="policy-layout">
        <section className="glass-panel">
          <h2>Shipping & returns</h2>
          {error ? (
            <ErrorBox message={error} retry={refresh} />
          ) : !data ? (
            <Loading />
          ) : (
            <>
              <p>
                Orders currently ship within the United States. Shipping is{' '}
                {money(data.shipping)} per order. Any applicable tax is
                calculated at checkout.
              </p>
              <h3>Return policy</h3>
              <p className="preserve-lines">
                {data.returns ||
                  'The shop is preparing its shipping and return policy. Purchases are not open yet.'}
              </p>
              <h3>Contact the shop</h3>
              {data.support ? (
                <a className="text-link" href={'mailto:' + data.support}>
                  <Mail size={17} />
                  {data.support}
                </a>
              ) : (
                <p>Contact information will be added before selling begins.</p>
              )}
            </>
          )}
        </section>
        <section className="glass-panel">
          <h2>Your account & privacy</h2>
          <p>
            Google, Facebook, or Outlook handles sign-in. Signova Technology stores
            your profile name and email, favorites, bag, orders, event RSVPs,
            and personal game best in its database.
          </p>
          <p>
            Card details are entered directly on Stripe’s hosted checkout. They
            are never entered or stored on this website.
          </p>
          <p>
            Contact the shop to request help with your account or deletion of
            your profile data. Order records may need to be retained for
            bookkeeping.
          </p>
          <h3>About the sample edit</h3>
          <p>
            Sample products are illustrative and cannot be bought. Original hero
            artwork was created for Signova Technology. Sample product photos are from
            Unsplash.
          </p>
        </section>
      </div>
    </>
  );
}
const emptyProduct = {
  title: '',
  description: '',
  category: 'Home & living',
  price: 0,
  stock: 1,
  image: '',
  status: 'draft',
};
const emptyPost = {
  kind: 'news',
  title: '',
  summary: '',
  body: '',
  date: '',
  end_date: '',
  location: '',
  author: 'Signova Technology',
  published_at: Date.now(),
  capacity: 0,
  contact_email: '',
  registration_url: '',
  accessibility: '',
  featured: false,
  image: '/hero.png',
  video: '',
  published: false,
};
const emptyGame = {
  title: 'My first game',
  description: 'A small original game made in the Signova Play creator.',
  category: 'Arcade',
  thumbnail: '/hero.png',
  html: '<main>\n  <h1 id="score">Score: 0</h1>\n  <button id="play">Tap me</button>\n  <p id="message">HTML creates the game world.</p>\n</main>',
  css: 'body {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  color: #17213b;\n  background: linear-gradient(135deg, #dff6ff, #f7e8ff);\n}\nmain { text-align: center; }\nbutton {\n  border: 0;\n  border-radius: 999px;\n  padding: 16px 28px;\n  color: white;\n  background: #5b45e0;\n  font: inherit;\n  cursor: pointer;\n}',
  javascript: "let score = 0;\ndocument.querySelector('#play').addEventListener('click', () => {\n  score += 1;\n  document.querySelector('#score').textContent = `Score: ${score}`;\n});",
  python: "from js import document\ndocument.querySelector('#message').textContent = 'Python is connected too!'",
  published: false,
};
function Admin() {
  const { data, error, refresh } = useData('admin');
  const { notify } = useStore();
  const [tab, setTab] = useState('overview'),
    [product, setProduct] = useState<any>(null),
    [post, setPost] = useState<any>(null),
    [game, setGame] = useState<any>(null),
    [selectedOrder, setSelectedOrder] = useState<string | null>(null),
    [fulfill, setFulfill] = useState<any>(null),
    [refund, setRefund] = useState<any>(null),
    [tracking, setTracking] = useState(''),
    [busy, setBusy] = useState(false),
    [formError, setFormError] = useState('');
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const requested = search.get('tab');
    if (requested && ['overview', 'products', 'orders', 'stories', 'games', 'support', 'settings'].includes(requested)) setTab(requested);
    const create = search.get('new');
    if (create === 'product') setProduct({ ...emptyProduct });
    if (create === 'game') setGame({ ...emptyGame });
    if (create === 'event' || create === 'news') {
      const nextDate = new Date(Date.now() + 7 * 86400000);
      nextDate.setMinutes(nextDate.getMinutes() - nextDate.getTimezoneOffset());
      setPost({ ...emptyPost, kind: create === 'event' ? 'event' : 'news', date: nextDate.toISOString().slice(0, 16) });
    }
  }, []);
  async function run(path: string, payload: any, done?: () => void) {
    setBusy(true);
    setFormError('');
    try {
      await api(path, payload);
      await refresh();
      notify('Saved successfully.');
      done?.();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File | undefined, target: 'product' | 'post' | 'postVideo' | 'game') {
    if (!file) return;
    setBusy(true);
    setFormError('');
    try {
      const form = new FormData();
      form.set('file', file);
      if (target === 'postVideo') form.set('kind', 'video');
      const r = await fetch('/api/upload', { method: 'POST', body: form });
      const d: any = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (target === 'product')
        setProduct((p: any) => ({ ...p, image: d.url }));
      else if (target === 'post') setPost((p: any) => ({ ...p, image: d.url }));
      else if (target === 'postVideo') setPost((p: any) => ({ ...p, video: d.url }));
      else setGame((current: any) => ({ ...current, thumbnail: d.url }));
      notify('Image uploaded.');
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (error) return <ErrorBox message={error} retry={refresh} />;
  if (!data) return <Loading />;
  const paid = data.orders.filter((o: any) =>
      ['paid', 'shipped'].includes(o.status),
    ),
    revenue = paid.reduce((n: number, o: any) => n + o.total, 0);
  return (
    <>
      <Heading
        kicker="THE OWNER’S STUDIO"
        title="Make it your own."
        description="Your collection, your stories, your independent world."
      >
        <a className="button" href="/shop">
          <Eye size={17} /> View your shop
        </a>
      </Heading>
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <TabsList className="page-tabs admin-tabs">
          {['overview', 'products', 'orders', 'stories', 'games', 'support', 'settings'].map(
            (t) => (
              <TabsTrigger key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ),
          )}
        </TabsList>
        <TabsContent value="overview">
          <div className="stat-grid">
            <div className="glass-panel">
              <span>Collected sales</span>
              <strong>{money(revenue)}</strong>
              <small>Paid & shipped orders · including tax and shipping</small>
            </div>
            <div className="glass-panel">
              <span>Published products</span>
              <strong>
                {
                  data.products.filter((p: any) => p.status === 'published')
                    .length
                }
              </strong>
              <small>Your live collection</small>
            </div>
            <div className="glass-panel">
              <span>Ready to pack</span>
              <strong>
                {data.orders.filter((o: any) => o.status === 'paid').length}
              </strong>
              <small>Paid orders awaiting shipment</small>
            </div>
          </div>
          <div className="admin-overview">
            <section className="glass-panel">
              <span className="eyebrow">YOUR SHOP, STEP BY STEP</span>
              <h2>Let’s open the doors.</h2>
              <div className="setup-step">
                <span className={data.products.length ? 'complete' : ''}>
                  {data.products.length ? <Check size={17} /> : '01'}
                </span>
                <div>
                  <h3>Add your first product</h3>
                  <p>Upload photos, set a price, and choose your stock.</p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Add a product"
                  onClick={() => {
                    setFormError('');
                    setProduct({ ...emptyProduct });
                  }}
                >
                  <Plus size={17} />
                </button>
              </div>
              <div className="setup-step">
                <span className={data.connected ? 'complete' : ''}>
                  {data.connected ? <Check size={17} /> : '02'}
                </span>
                <div>
                  <h3>Connect Stripe</h3>
                  <p>Link your payment account in shop settings.</p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Payment settings"
                  onClick={() => setTab('settings')}
                >
                  <ArrowRight size={17} />
                </button>
              </div>
              <div className="setup-step">
                <span
                  className={data.settings.selling === 'true' ? 'complete' : ''}
                >
                  {data.settings.selling === 'true' ? (
                    <Check size={17} />
                  ) : (
                    '03'
                  )}
                </span>
                <div>
                  <h3>Make the details yours</h3>
                  <p>Add support, shipping, and returns. Activate selling.</p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Shop settings"
                  onClick={() => setTab('settings')}
                >
                  <ArrowRight size={17} />
                </button>
              </div>
            </section>
            <section className="glass-panel studio-note">
              <Sparkles size={32} />
              <h2>
                Small beginnings.
                <br />
                <em>Big possibility.</em>
              </h2>
              <p>
                Start with one product you love. Draft it, check the details,
                and publish when it’s ready.
              </p>
              <span
                className={
                  'status ' +
                  (data.settings.selling === 'true' ? 'paid' : 'pending')
                }
              >
                {data.settings.selling === 'true'
                  ? 'Selling activated'
                  : 'Shop setup in progress'}
              </span>
              {data.settings.mode && (
                <p>Stripe is in {data.settings.mode} mode.</p>
              )}
            </section>
          </div>
        </TabsContent>
        <TabsContent value="products">
          <div className="panel-toolbar">
            <h2>
              Your collection{' '}
              <span className="muted">({data.products.length})</span>
            </h2>
            <button
              className="button button-light"
              onClick={() => {
                setProduct({ ...emptyProduct });
                setFormError('');
              }}
            >
              <Plus size={17} /> Add product
            </button>
          </div>
          {data.products.length ? (
            <div className="table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Available stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.products.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="table-product">
                          <img src={p.image} alt="" />
                          <strong>{p.title}</strong>
                        </div>
                      </TableCell>
                      <TableCell>{money(p.price)}</TableCell>
                      <TableCell>{p.stock}</TableCell>
                      <TableCell>
                        <span className={'status ' + p.status}>{p.status}</span>
                      </TableCell>
                      <TableCell>
                        <button
                          className="icon-button"
                          onClick={() => {
                            setProduct({ ...p, expectedStock: p.stock });
                            setFormError('');
                          }}
                          aria-label={'Edit ' + p.title}
                        >
                          <Pencil size={16} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty
              title="Your collection starts here."
              body="Add a product to replace the sample edit with your own shop."
            />
          )}
        </TabsContent>
        <TabsContent value="orders">
          <div className="panel-toolbar">
            <h2>Customer orders</h2>
            <button className="button" onClick={refresh}>
              <RefreshCw size={16} /> Refresh payments
            </button>
          </div>
          {formError && <ErrorBox message={formError} />}
          <div className="order-list">
            {data.orders.length ? (
              data.orders.map((o: any) => (
                <div className="admin-order" key={o.id}>
                  <button
                    className="order-main"
                    onClick={() => setSelectedOrder(o.id)}
                  >
                    <Package size={21} />
                    <div>
                      <strong>{o.id.slice(0, 8).toUpperCase()}</strong>
                      <span>{o.email}</span>
                    </div>
                    <span className={'status ' + o.status}>{o.status}</span>
                    <strong>{money(o.total)}</strong>
                  </button>
                  <div className="order-actions">
                    {o.status === 'paid' && (
                      <button
                        className="button"
                        onClick={() => {
                          setTracking('');
                          setFormError('');
                          setFulfill(o);
                        }}
                      >
                        <Truck size={16} /> Mark shipped
                      </button>
                    )}
                    {['paid', 'shipped'].includes(o.status) && (
                      <button
                        className="button"
                        onClick={() => {
                          setRefund(o);
                          setFormError('');
                        }}
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <Empty
                icon={Package}
                title="Ready for your first order."
                body="Paid orders appear here with the details you need to pack and ship them."
              />
            )}
          </div>
        </TabsContent>
        <TabsContent value="stories">
          <div className="panel-toolbar">
            <h2>News & events</h2>
            <button
              className="button button-light"
              onClick={() => {
                setPost({ ...emptyPost });
                setFormError('');
              }}
            >
              <Plus size={17} /> Create a post
            </button>
          </div>
          {data.posts.length ? (
            <div className="order-list">
              {data.posts.map((p: any) => (
                <button
                  className="order-row"
                  key={p.id}
                  onClick={() => {
                    const localDate = (value: string) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
                    setPost({ ...p, date: localDate(p.date), end_date: localDate(p.end_date) });
                    setFormError('');
                  }}
                >
                  {p.kind === 'event' ? <CalendarDays /> : <Newspaper />}
                  <div>
                    <strong>{p.title}</strong>
                    <span>
                      {p.kind} · {new Date(p.date).toLocaleDateString()}
                    </span>
                    <span>By {p.author || 'Signova Technology'} · posted {new Date(p.published_at || p.date).toLocaleDateString()}</span>
                  </div>
                  <span className="status">
                    {p.published ? 'published' : 'draft'}
                  </span>
                  <Pencil size={17} />
                </button>
              ))}
            </div>
          ) : (
            <Empty
              icon={Newspaper}
              title="What’s your next story?"
              body="Publish news or invite your community to an event."
            />
          )}
        </TabsContent>
        <TabsContent value="games">
          <div className="panel-toolbar">
            <div><span className="eyebrow">SIGNOVA PLAY CREATOR</span><h2>Your games <span className="muted">({data.games.length})</span></h2></div>
            <button className="button button-light" onClick={() => { setGame({ ...emptyGame }); setFormError(''); }}>
              <Plus size={17} /> Create a game
            </button>
          </div>
          <div className="game-admin-intro glass-panel">
            <Code2 size={28} />
            <div><strong>Four files, one playable game.</strong><p>HTML builds the scene, CSS styles it, JavaScript adds interaction, and Python runs in the browser through Pyodide.</p></div>
          </div>
          {data.games.length ? (
            <div className="game-admin-grid">
              {data.games.map((item: any) => (
                <article className="glass-panel" key={item.id}>
                  <img src={item.thumbnail} alt="" />
                  <div><span className="eyebrow">{item.category}</span><h3>{item.title}</h3><p>{item.description}</p></div>
                  <span className={`status ${item.published ? 'paid' : 'pending'}`}>{item.published ? 'published' : 'draft'}</span>
                  <button className="button" onClick={() => { setGame({ ...item }); setFormError(''); }}><Pencil size={16} /> Edit game</button>
                </article>
              ))}
            </div>
          ) : (
            <Empty icon={Gamepad2} title="Build your first browser game." body="Start from the working template, change the four code files, preview it, and publish when ready." />
          )}
        </TabsContent>
        <TabsContent value="support">
          <SupportDesk />
        </TabsContent>
        <TabsContent value="settings">
          <AdminSettings data={data} refresh={refresh} />
        </TabsContent>
      </Tabs>
      <Dialog
        open={!!product}
        onOpenChange={(v) => {
          if (!v && !busy) setProduct(null);
        }}
      >
        <DialogContent className="editor-dialog">
          <DialogTitle>
            {product?.id ? 'Edit your find' : 'Add a new find'}
          </DialogTitle>
          <DialogDescription>
            Draft, refine, and publish a product in your collection.
          </DialogDescription>
          {product && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run('admin/product', product, () => setProduct(null));
              }}
              className="editor-form"
            >
              {formError && <ErrorBox message={formError} />}
              <label>
                Product name
                <input
                  required
                  maxLength={140}
                  value={product.title}
                  onChange={(e) =>
                    setProduct({ ...product, title: e.target.value })
                  }
                />
              </label>
              <label>
                Description
                <textarea
                  required
                  rows={4}
                  maxLength={6000}
                  value={product.description}
                  onChange={(e) =>
                    setProduct({ ...product, description: e.target.value })
                  }
                  placeholder="Materials, dimensions, what makes it special…"
                />
              </label>
              <div className="form-row">
                <label>
                  Price (USD)
                  <input
                    type="number"
                    required
                    min="0.01"
                    max="100000"
                    step="0.01"
                    value={product.price === 0 ? '' : product.price / 100}
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        price: Math.round(Number(e.target.value) * 100),
                      })
                    }
                  />
                </label>
                <label>
                  Available stock
                  <input
                    type="number"
                    required
                    min="0"
                    max="100000"
                    value={product.stock}
                    onChange={(e) =>
                      setProduct({ ...product, stock: Number(e.target.value) })
                    }
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Category
                  <Picker
                    label="Product category"
                    value={product.category}
                    options={categories.slice(1)}
                    onChange={(v) => setProduct({ ...product, category: v })}
                  />
                </label>
                <label>
                  Status
                  <Picker
                    label="Product status"
                    value={product.status}
                    options={['draft', 'published', 'archived']}
                    onChange={(v) => setProduct({ ...product, status: v })}
                  />
                </label>
              </div>
              <label>
                Product photo
                <input
                  required
                  value={product.image}
                  placeholder="https://… or upload an image below"
                  onChange={(e) =>
                    setProduct({ ...product, image: e.target.value })
                  }
                />
              </label>
              <label className="upload-field">
                <Upload size={18} /> Upload JPG, PNG, or WebP · up to 5 MB
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => upload(e.target.files?.[0], 'product')}
                  disabled={busy}
                />
              </label>
              {post.kind === 'news' && (
                <>
                  <label>
                    Video URL <span className="optional-label">YouTube, Vimeo, MP4, or WebM</span>
                    <input type="text" maxLength={1500} placeholder="https://…" value={post.video || ''} onChange={(e) => setPost({ ...post, video: e.target.value })} />
                  </label>
                  <label className="upload-field">
                    <Play size={18} /> Upload a story video up to 50 MB
                    <input type="file" accept="video/mp4,video/webm" onChange={(e) => upload(e.target.files?.[0], 'postVideo')} disabled={busy} />
                  </label>
                </>
              )}
              {product.image && (
                <img
                  className="upload-preview"
                  src={product.image}
                  alt="Product photo preview"
                />
              )}
              <p className="form-hint">
                Available stock excludes items already reserved in checkout.
                Archive a product to remove it from the shop while retaining its
                order history.
              </p>
              <button className="button button-light" disabled={busy}>
                {busy ? (
                  <Loader2 size={17} className="spin" />
                ) : (
                  <Check size={17} />
                )}{' '}
                Save product
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!post}
        onOpenChange={(v) => {
          if (!v && !busy) setPost(null);
        }}
      >
        <DialogContent className="editor-dialog">
          <DialogTitle>
            {post?.id ? 'Edit your story' : 'Something worth sharing'}
          </DialogTitle>
          <DialogDescription>
            Create news or an event for your community.
          </DialogDescription>
          {post && (
            <form
              className="editor-form"
              onSubmit={(e) => {
                e.preventDefault();
                run('admin/post', {
                  ...post,
                  date: new Date(post.date).toISOString(),
                  end_date: post.end_date ? new Date(post.end_date).toISOString() : '',
                }, () => setPost(null));
              }}
            >
              {formError && <ErrorBox message={formError} />}
              <label>
                Post type
                <Picker
                  label="Post type"
                  value={post.kind}
                  options={['news', 'event']}
                  onChange={(v) => setPost({ ...post, kind: v })}
                />
              </label>
              <label>
                Title
                <input
                  required
                  maxLength={160}
                  value={post.title}
                  onChange={(e) => setPost({ ...post, title: e.target.value })}
                />
              </label>
              <div className="form-row">
                <label>
                  Author or host
                  <input required maxLength={100} value={post.author || ''} onChange={(e) => setPost({ ...post, author: e.target.value })} />
                </label>
                <label>
                  Date posted
                  <input
                    required
                    type="date"
                    value={new Date(post.published_at || Date.now()).toISOString().slice(0, 10)}
                    onChange={(e) => setPost({ ...post, published_at: new Date(`${e.target.value}T12:00:00`).getTime() })}
                  />
                </label>
              </div>
              <label>
                Short introduction
                <textarea
                  required
                  maxLength={400}
                  value={post.summary}
                  onChange={(e) =>
                    setPost({ ...post, summary: e.target.value })
                  }
                />
              </label>
              <label>
                Full story or event details
                <textarea
                  required
                  rows={5}
                  maxLength={12000}
                  value={post.body}
                  onChange={(e) => setPost({ ...post, body: e.target.value })}
                />
              </label>
              <label>
                Date and time (your local time)
                <input
                  required
                  type="datetime-local"
                  value={
                    post.date.length > 16 ? post.date.slice(0, 16) : post.date
                  }
                  onChange={(e) => setPost({ ...post, date: e.target.value })}
                />
              </label>
              {post.kind === 'event' && (
                <>
                  <label>
                    Ending date and time <span className="optional-label">Optional</span>
                    <input type="datetime-local" value={post.end_date || ''} onChange={(e) => setPost({ ...post, end_date: e.target.value })} />
                  </label>
                  <label>
                    Location or meeting details
                    <input required maxLength={200} value={post.location} onChange={(e) => setPost({ ...post, location: e.target.value })} />
                  </label>
                  <div className="form-row">
                    <label>
                      Capacity <span className="optional-label">0 means unlimited</span>
                      <input type="number" min="0" max="100000" value={post.capacity || 0} onChange={(e) => setPost({ ...post, capacity: Number(e.target.value) })} />
                    </label>
                    <label>
                      Organizer email <span className="optional-label">Optional</span>
                      <input type="email" maxLength={320} value={post.contact_email || ''} onChange={(e) => setPost({ ...post, contact_email: e.target.value })} />
                    </label>
                  </div>
                  <label>
                    Registration URL <span className="optional-label">Optional HTTPS link</span>
                    <input type="url" maxLength={1500} placeholder="https://…" value={post.registration_url || ''} onChange={(e) => setPost({ ...post, registration_url: e.target.value })} />
                  </label>
                  <label>
                    Accessibility information <span className="optional-label">Optional</span>
                    <textarea rows={3} maxLength={2000} placeholder="ASL interpretation, wheelchair access, parking, captions, or other accommodations." value={post.accessibility || ''} onChange={(e) => setPost({ ...post, accessibility: e.target.value })} />
                  </label>
                </>
              )}
              <label>
                Image URL
                <input
                  required
                  value={post.image}
                  onChange={(e) => setPost({ ...post, image: e.target.value })}
                />
              </label>
              <label className="upload-field">
                <Upload size={18} /> Upload a story image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => upload(e.target.files?.[0], 'post')}
                  disabled={busy}
                />
              </label>
              <label className="check-label">
                <Checkbox
                  checked={!!post.published}
                  onCheckedChange={(v) => setPost({ ...post, published: v })}
                />{' '}
                Publish this post
              </label>
              <label className="check-label">
                <Checkbox checked={!!post.featured} onCheckedChange={(v) => setPost({ ...post, featured: !!v })} />{' '}
                Feature this post at the top
              </label>
              <button className="button button-light" disabled={busy}>
                Save post <Check size={16} />
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!game}
        onOpenChange={(value) => {
          if (!value && !busy) setGame(null);
        }}
      >
        <DialogContent className="game-editor-dialog">
          <DialogTitle>{game?.id ? 'Edit your game' : 'Create a browser game'}</DialogTitle>
          <DialogDescription>
            Write the four connected files, test the live preview, and publish it to Signova Play.
          </DialogDescription>
          {game && (
            <form
              className="game-editor"
              onSubmit={(event) => {
                event.preventDefault();
                run('admin/game', game, () => setGame(null));
              }}
            >
              {formError && <ErrorBox message={formError} />}
              <div className="game-editor-details">
                <label>Game title<input required maxLength={120} value={game.title} onChange={(event) => setGame({ ...game, title: event.target.value })} /></label>
                <label>Category<Picker label="Game category" value={game.category} options={['Arcade', 'Puzzle', 'Memory', 'Adventure', 'Educational', 'Relaxing']} onChange={(category) => setGame({ ...game, category })} /></label>
                <label className="game-description-field">Description<textarea required maxLength={500} rows={2} value={game.description} onChange={(event) => setGame({ ...game, description: event.target.value })} /></label>
                <label>Thumbnail URL<input required value={game.thumbnail} onChange={(event) => setGame({ ...game, thumbnail: event.target.value })} /></label>
                <label className="upload-field"><Upload size={17} /> Upload thumbnail<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event.target.files?.[0], 'game')} disabled={busy} /></label>
              </div>
              <div className="code-editor-grid">
                <label><span><Code2 size={15} /> HTML</span><textarea required spellCheck={false} maxLength={12000} value={game.html} onChange={(event) => setGame({ ...game, html: event.target.value })} /></label>
                <label><span><Code2 size={15} /> CSS</span><textarea spellCheck={false} maxLength={12000} value={game.css} onChange={(event) => setGame({ ...game, css: event.target.value })} /></label>
                <label><span><Code2 size={15} /> JavaScript</span><textarea spellCheck={false} maxLength={12000} value={game.javascript} onChange={(event) => setGame({ ...game, javascript: event.target.value })} /></label>
                <label><span><Code2 size={15} /> Python</span><textarea spellCheck={false} maxLength={12000} value={game.python} onChange={(event) => setGame({ ...game, python: event.target.value })} /></label>
              </div>
              <div className="game-editor-preview">
                <div><span className="eyebrow">LIVE PREVIEW</span><small>Python needs internet access the first time it loads.</small></div>
                <GameFrame game={game} title={false} />
              </div>
              <div className="game-editor-publish">
                <label className="check-label"><Checkbox checked={!!game.published} onCheckedChange={(value) => setGame({ ...game, published: !!value })} /> Publish this game on Signova Play</label>
                <button className="button button-light" disabled={busy}>{busy ? <Loader2 className="spin" size={16} /> : <Check size={16} />} Save game</button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!fulfill}
        onOpenChange={(v) => !v && !busy && setFulfill(null)}
      >
        <DialogContent>
          <DialogTitle>Send something good.</DialogTitle>
          <DialogDescription>
            Add the carrier and tracking number for this order.
          </DialogDescription>
          <form
            className="editor-form"
            onSubmit={(e) => {
              e.preventDefault();
              run('admin/ship', { orderId: fulfill.id, tracking }, () =>
                setFulfill(null),
              );
            }}
          >
            {formError && <ErrorBox message={formError} />}
            <label>
              Carrier and tracking number
              <input
                required
                maxLength={300}
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="USPS · tracking number"
              />
            </label>
            <button className="button button-light" disabled={busy}>
              Mark shipped <Truck size={16} />
            </button>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!refund}
        onOpenChange={(v) => !v && !busy && setRefund(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Refund this order?</AlertDialogTitle>
          <AlertDialogDescription>
            This sends a full refund of {money(refund?.total || 0)} through
            Stripe to the original payment method. Stock is not automatically
            restored.
          </AlertDialogDescription>
          {formError && <ErrorBox message={formError} />}
          <div className="form-row">
            <AlertDialogCancel disabled={busy}>Keep order</AlertDialogCancel>
            <button
              className="button button-light"
              disabled={busy}
              onClick={() =>
                run('admin/refund', { orderId: refund.id }, () =>
                  setRefund(null),
                )
              }
            >
              {busy ? 'Processing…' : 'Issue full refund'}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <OrderDetail id={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </>
  );
}
function SupportRequestRow({ request, busy, onSave, onNotify }: { request: any; busy: boolean; onSave: (payload: any) => void; onNotify: (payload: any) => void }) {
  const [status, setStatus] = useState(request.status);
  const [note, setNote] = useState(request.note || '');
  useEffect(() => { setStatus(request.status); setNote(request.note || ''); }, [request.status, request.note]);
  return (
    <article className="support-admin-card glass-panel">
      <div className="support-admin-head">
        <div>
          <span className={`status ${request.status}`}>{request.status.replace('_', ' ')}</span>
          <h3>{request.first_name || request.name} {request.last_name || ''}</h3>
          <a href={`mailto:${request.email}`}>{request.email}</a>
        </div>
        <time>{new Date(request.created_at).toLocaleString()}</time>
      </div>
      <div className="support-admin-meta">
        <span><Laptop size={16} /> {request.device}</span>
        {request.phone && <a href={`tel:${request.phone}`}><Phone size={16} /> {request.phone}</a>}
        {request.asl_code && <span><Wifi size={16} /> ASL: {request.asl_code}</span>}
        <span>Ref: {request.id.slice(0, 8).toUpperCase()}</span>
        <span className={`notification-state ${request.notification_status}`}><Mail size={16} /> Email {request.notification_status}</span>
      </div>
      <p>{request.issue}</p>
      <div className="support-admin-actions">
        <Picker label="Support status" value={status} options={['new', 'in_progress', 'resolved']} onChange={setStatus} />
        <input maxLength={2000} placeholder="Private technician note" value={note} onChange={(event) => setNote(event.target.value)} />
        <button className="button button-light" disabled={busy} onClick={() => onSave({ id: request.id, status, note })}>
          <Check size={16} /> Save
        </button>
      </div>
      {request.notification_status !== 'sent' && (
        <button className="text-link support-resend" disabled={busy} onClick={() => onNotify({ id: request.id })}>
          <Send size={15} /> Send “DeafTech Support” email now
        </button>
      )}
    </article>
  );
}
function AdminSettings({
  data,
  refresh,
}: {
  data: any;
  refresh: () => Promise<void>;
}) {
  const { notify } = useStore();
  const [form, setForm] = useState({
      shop_name: data.settings.shop_name || 'Signova Technology',
      support: data.settings.support || '',
      returns: data.settings.returns || '',
      shipping: Number(data.settings.shipping || 0),
      selling: data.settings.selling === 'true',
      automatic_tax: data.settings.automatic_tax === 'true',
      asl_url: data.settings.asl_url || '',
      support_notification_email: data.settings.support_notification_email || 'richynoble75@live.com',
      support_subject: data.settings.support_subject || 'DeafTech Support',
    }),
    [key, setKey] = useState(''),
    [webhook, setWebhook] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(path: string, payload: any) {
    setBusy(true);
    setError('');
    try {
      await api(path, payload);
      setKey('');
      setWebhook('');
      await refresh();
      notify('Your shop settings are saved.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="settings-grid">
      <form
        className="glass-panel editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit('admin/settings', form);
        }}
      >
        <span className="eyebrow">THE FINISHING DETAILS</span>
        <h2>Your shop</h2>
        {error && <ErrorBox message={error} />}
        <label>
          Shop name
          <input
            required
            maxLength={80}
            value={form.shop_name}
            onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
          />
        </label>
        <label>
          Customer support email
          <input
            type="email"
            required
            value={form.support}
            onChange={(e) => setForm({ ...form, support: e.target.value })}
          />
        </label>
        <label>
          ASL remote support link
          <input
            type="url"
            placeholder="https://…"
            value={form.asl_url}
            onChange={(e) => setForm({ ...form, asl_url: e.target.value })}
          />
        </label>
        <div className={`notice ${data.emailReady ? '' : 'warning'}`}>
          <Mail size={17} />
          {data.emailReady ? 'Support email delivery is connected.' : 'Support requests are saved, but email delivery needs a RESEND_API_KEY secret.'}
        </div>
        <div className="form-row">
          <label>
            Support notification inbox
            <input type="email" required maxLength={320} value={form.support_notification_email} onChange={(e) => setForm({ ...form, support_notification_email: e.target.value })} />
          </label>
          <label>
            Support email subject
            <input required maxLength={160} value={form.support_subject} onChange={(e) => setForm({ ...form, support_subject: e.target.value })} />
          </label>
        </div>
        <label>
          Standard US shipping (USD)
          <input
            required
            type="number"
            min="0"
            max="1000"
            step="0.01"
            value={form.shipping / 100}
            onChange={(e) =>
              setForm({
                ...form,
                shipping: Math.round(Number(e.target.value) * 100),
              })
            }
          />
        </label>
        <label>
          Shipping time & return policy
          <textarea
            required
            maxLength={6000}
            rows={5}
            value={form.returns}
            onChange={(e) => setForm({ ...form, returns: e.target.value })}
            placeholder="Explain processing times, shipping, returns, and how customers can contact you."
          />
        </label>
        <label className="check-label">
          <Checkbox
            checked={form.automatic_tax}
            onCheckedChange={(v) => setForm({ ...form, automatic_tax: !!v })}
          />{' '}
          Use Stripe Tax (configure registrations in Stripe first)
        </label>
        <label className="check-label">
          <Checkbox
            checked={form.selling}
            onCheckedChange={(v) => setForm({ ...form, selling: !!v })}
            disabled={!data.connected}
          />{' '}
          Activate selling
        </label>
        <p className="form-hint">
          Selling requires a connected Stripe account. Set up your applicable
          tax collection settings before accepting real orders.
        </p>
        <button className="button button-light" disabled={busy}>
          Save shop settings <Check size={16} />
        </button>
      </form>
      <form
        className="glass-panel editor-form payment-settings"
        onSubmit={(e) => {
          e.preventDefault();
          submit('admin/connect', { key, webhookSecret: webhook });
        }}
      >
        <span className="eyebrow">LET’S MAKE IT OFFICIAL</span>
        <h2>Connect Stripe</h2>
        <div className="payment-brand">
          stripe
          <span className={'status ' + (data.connected ? 'paid' : 'pending')}>
            {data.connected
              ? `${data.settings.mode} mode connected`
              : 'Not connected'}
          </span>
        </div>
        <p>
          Start with a test secret key. Complete a test checkout before
          connecting your live key.
        </p>
        <a
          className="text-link"
          href="https://dashboard.stripe.com/apikeys"
          target="_blank"
          rel="noreferrer"
        >
          Open Stripe API keys <ExternalLink size={15} />
        </a>
        <label>
          Stripe secret key
          <input
            required
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="sk_test_… or sk_live_…"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </label>
        <label>
          Webhook signing secret (optional for private testing)
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="whsec_…"
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
          />
        </label>
        <p className="form-hint">
          Keys are encrypted on the server and never displayed after saving.
        </p>
        {!data.vaultReady && (
          <div className="notice">
            Payment encryption needs to be configured before keys can be saved.
          </div>
        )}
        <button
          className="button button-light"
          disabled={busy || !data.vaultReady}
        >
          {busy ? (
            <Loader2 className="spin" size={16} />
          ) : (
            <LockKeyhole size={16} />
          )}{' '}
          Save Stripe connection
        </button>
        <div className="webhook-info">
          <h3>Automatic payment updates</h3>
          <p>When the site is public, add this endpoint in Stripe:</p>
          <code>
            https://noble-new-studio.richynoble90.chatgpt.site/api/stripe/webhook
          </code>
          <p>
            Subscribe to checkout.session.completed and
            checkout.session.expired. Paste the signing secret above. Private
            sites verify payments when customers return or you refresh orders.
          </p>
          <span className="status">
            {data.webhookConnected
              ? 'Signing secret saved'
              : 'Signing secret not added'}
          </span>
        </div>
      </form>
    </div>
  );
}

