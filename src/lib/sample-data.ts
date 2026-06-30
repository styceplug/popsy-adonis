export type Post = {
  title: string;
  slug: string;
  type: "Article" | "Music Release" | "Trend Update";
  excerpt: string;
  body: string[];
  coverImage: string;
  mediaType: "video" | "audio" | "editorial";
  publishedAt: string;
  category: string;
};

export type Event = {
  id: string;
  title: string;
  slug: string;
  venue: string;
  city: string;
  startsAt: string;
  displayDate?: string;
  heroImage: string;
  summary?: string;
  gallery?: string[];
  status: "upcoming" | "past";
  recapVideoUrl?: string;
  tiers: Array<{
    id: string;
    name: "Early Bird" | "Regular" | "VIP" | "VVIP";
    priceKobo: number;
    perks: string[];
  }>;
  addOns?: Array<{
    id: string;
    name: string;
    priceKobo: number;
    remaining: number;
    description?: string | null;
  }>;
};

export type Artist = {
  name: string;
  slug: string;
  role: string;
  city: string;
  image: string;
  bio: string;
  genres: string[];
  stats: Array<{ label: string; value: string }>;
  socials: Array<{ label: string; href: string }>;
};

export type Song = {
  title: string;
  date: string;
  artists: string;
};

export type Product = {
  id: string;
  defaultVariantId: string;
  name: string;
  slug: string;
  description: string;
  priceKobo: number;
  images: string[];
  colors: string[];
  sizes: string[];
  variants: Array<{
    id: string;
    size: string;
    color: string;
    priceKobo: number;
    stock: number;
  }>;
  tag: string;
};

export const brand = {
  siteName: "Popsy Adonis",
  merchName: "PA FLUX",
  email: "adonistv.001@gmail.com",
  phone: "+234 707 640 1108",
  whatsapp: "+234 707 640 1108",
  whatsappHref: "https://wa.me/2347076401108",
  address: "Ekiti, Nigeria",
  socials: [
    { label: "TikTok", href: "https://www.tiktok.com/@popsyadonis?_r=1&_t=ZS-97QiYPG83SW" },
    { label: "Instagram", href: "https://www.instagram.com/popsyadonis" },
    { label: "X", href: "https://x.com/popsyadonis?s=11" },
    { label: "Telegram", href: "https://t.me/adonistvchannel" },
    { label: "Facebook", href: "https://www.facebook.com/share/1CiZwqenYQ/?mibextid=wwXIfr" },
  ],
};

export const aboutCopy = [
  "Behind one of EKSU's most influential and engaging media platforms is the enigmatic Popsy Adonis. Since launching his TV on October 28, 2021, he has remained an anonymous blogger whose impact continues to speak louder than his identity.",
  "A graduate of Ekiti State University, Popsy Adonis is known for delivering timely school updates, entertaining content, and keeping thousands informed both within and beyond the EKSU community. His witty sarcasm, interactive approach, and consistency have earned him a loyal audience that genuinely loves and engages with his platform.",
  "Beyond blogging, he is a musician passionate about supporting and promoting fellow EKSU artists. He is also the mastermind behind some of the campus's most talked-about events, including two successful editions of EKSU Fest.",
  "Through giveaways, business promotions, and brand influence, Popsy Adonis has built a reputation as a creator who gives back to his community. His growing influence recently earned him an ambassadorial deal with Tripple Cravings.",
];

export const songs: Song[] = [
  { title: "ABINIBI", date: "26 Mar 2026", artists: "Emmey Boy, Popsy Adonis and Rusky The Great" },
  { title: "LETTER TO AISHA", date: "25 May 2025", artists: "Popsy Adonis featuring Crux, Drekiss" },
  { title: "MSN (Money Stops Nonsense)", date: "19 Feb 2025", artists: "Popsy Adonis featuring Blaizeman and Teazyand99others" },
  { title: "OLD TAKER", date: "10 Dec 2024", artists: "Popsy Adonis, Diamond Boy, Rusky The Great, Pili Chara" },
];

export const posts: Post[] = [
  {
    title: "Summer Time in Ekiti is the next chapter after EKSU Fest 2.0",
    slug: "summer-time-in-ekiti-next-chapter",
    type: "Trend Update",
    excerpt:
      "Free swimming, piercing, tattoo sessions, music, and a new summer-party experience built for Ekiti's youth culture.",
    body: [
      "After the success of EKSU Fest 2.0, Popsy Adonis is setting up a new kind of campus lifestyle experience: Summer Time in Ekiti.",
      "The party is built around daytime fun, nightlife energy, and youth-culture extras that feel fresh for Ekiti: free swimming, free piercing, free tattoo sessions, music, performances, and a crowd ready to make memories.",
      "Early bird tickets are ₦3,000 and VIP tickets are ₦20,000. Date and venue details will be announced officially by Popsy Adonis.",
    ],
    coverImage: "/POPSY%20ADONIS%20FLUX%20PARTY.png",
    mediaType: "video",
    publishedAt: "June 2026",
    category: "Events",
  },
  {
    title: "Popsy Adonis Selects: songs shaping the EKSU circle",
    slug: "popsy-adonis-selects-eksu-circle",
    type: "Music Release",
    excerpt:
      "From Old Taker to MSN, Letter to Aisha, and ABINIBI, these collaborations amplify rising artists around the EKSU community.",
    body: [
      "Popsy Adonis has grown beyond media updates into music discovery and artist amplification. His recent collaborations connect EKSU-linked voices with street-pop, Afrobeats, and campus-culture audiences.",
      "The current catalogue includes ABINIBI with Emmey Boy and Rusky The Great, Letter to Aisha with Crux and Drekiss, MSN with Blaizeman and Teazyand99others, and Old Taker with Diamond Boy, Rusky The Great, and Pili Chara.",
      "The catalogue section gives fans a clearer route into the artists around the movement, while the culture feed keeps each release tied to the larger Popsy Adonis story.",
    ],
    coverImage: "/EVENTS/MSN.png.PNG",
    mediaType: "audio",
    publishedAt: "June 2026",
    category: "Music",
  },
  {
    title: "How EKSU Fest became a student entertainment signal",
    slug: "eksu-fest-student-entertainment-signal",
    type: "Article",
    excerpt:
      "Two editions, headline performances, vendors, sponsors, giveaways, and the kind of crowd energy that creates campus memory.",
    body: [
      "EKSU Fest has become one of the strongest proofs of the Popsy Adonis event engine: a student-first platform that brings performances, vendors, sponsors, giveaways, awards, and campus celebrities into one shared room.",
      "The first edition introduced the format with Rybeena, Kidbaby, DJ Horlait, Gosoro of Ekiti, student talents, and community participation. EKSU Fest 2.0 pushed the scale higher with Kidd Carder, stronger sponsor presence, and a bigger campus turnout.",
      "That momentum is the reason Summer Time in Ekiti can arrive with bigger ambition. The audience already knows the standard.",
    ],
    coverImage: "/EVENTS/EKSU%20FEST%2B%2B%2B%2B.jpg",
    mediaType: "editorial",
    publishedAt: "May 2026",
    category: "Campus Culture",
  },
  {
    title: "Inside the Popsy Adonis house-party circuit",
    slug: "inside-popsy-adonis-house-party-circuit",
    type: "Article",
    excerpt:
      "House parties, hangouts, and after-exam sessions show how the brand builds intimate culture before scaling up to festivals.",
    body: [
      "Not every Popsy Adonis moment is a festival. The house-party and hangout circuit is where the community gets closer, new music gets tested, and the brand keeps its street-level connection alive.",
      "From House Party Vol. 1 to after-exam listening sessions and Adonite get-togethers, these smaller rooms help Popsy Adonis understand what the crowd actually responds to.",
      "That feedback loop now informs larger experiences like EKSU Fest and Summer Time in Ekiti.",
    ],
    coverImage: "/EVENTS/HOUSE%20PARTEYY%20MAKA2.jpg",
    mediaType: "editorial",
    publishedAt: "April 2026",
    category: "Events",
  },
  {
    title: "Beyond parties: football, giveaways, and student influence",
    slug: "football-giveaways-student-influence",
    type: "Trend Update",
    excerpt:
      "The Popsy Adonis platform keeps culture wide: sports activations, birthday moments, giveaways, and community promotions.",
    body: [
      "Popsy Adonis has never been only about nightlife. The platform also shows up through football competitions, birthday activations, giveaways, brand promotions, and student-led community moments.",
      "That wider footprint matters because it turns entertainment into everyday campus presence. The audience meets the brand at events, online updates, music releases, business promotions, and social moments.",
      "The result is a platform that can promote culture, host culture, and document culture at the same time.",
    ],
    coverImage: "/EVENTS/ADONIS%20FOOTBALL%20COMPETITION%20DP.jpg",
    mediaType: "video",
    publishedAt: "March 2026",
    category: "Campus Culture",
  },
];

export const events: Event[] = [
  {
    id: "event-summer-time-ekiti",
    title: "Summer Time in Ekiti",
    slug: "summer-time-in-ekiti",
    venue: "Location to be announced soon",
    city: "Ekiti",
    startsAt: "2026-08-16T17:00:00.000Z",
    displayDate: "Date to be announced soon",
    heroImage: "/POPSY%20ADONIS%20FLUX%20PARTY.png",
    summary:
      "After the success of EKSU Fest 2.0, Popsy Adonis returns with a first-of-its-kind summer party in Ekiti. Expect free swimming, free piercing, free tattoo sessions, music, entertainment, and a crowd built for unforgettable campus memories.",
    status: "upcoming",
    tiers: [
      {
        id: "tier-summer-time-ekiti-early-bird",
        name: "Early Bird",
        priceKobo: 300000,
        perks: ["Early bird access", "Free swimming", "Free piercing", "Free tattoo sessions"],
      },
      {
        id: "tier-summer-time-ekiti-vip",
        name: "VIP",
        priceKobo: 2_000_000,
        perks: ["VIP access", "Priority entry", "Free Water Gun", "Free swimming", "Free piercing", "Free tattoo sessions"],
      },
    ],
  },
  {
    id: "event-house-party-vol-1",
    title: "Popsy Adonis House Party Vol. 1",
    slug: "popsy-adonis-house-party-vol-1",
    venue: "Secret Warehouse",
    city: "Lagos",
    startsAt: "2026-04-12T19:00:00.000Z",
    heroImage: "/EVENTS/HOUSE%20PARTEYY%20MAKA2.jpg",
    summary:
      "A high-energy house-party experience from the Popsy Adonis event circuit, built around campus nightlife, music discovery, and close-community party culture.",
    status: "past",
    recapVideoUrl: "https://video.example.com/adonis-house-party-recap",
    tiers: [],
  },
  {
    id: "event-mainland-link-up",
    title: "EKSU Fest 1.0",
    slug: "eksu-fest-1",
    venue: "Ekiti State University",
    city: "Ekiti",
    startsAt: "2026-02-22T18:00:00.000Z",
    heroImage: "/EVENTS/EKSU%20FEST%2B400.jpg",
    summary:
      "EKSU Fest 1.0 brought the EKSU community together with performances from Rybeena, Kidbaby, DJ Horlait, Gosoro of Ekiti, student talents, vendor stands, giveaways, and awards.",
    gallery: [
      "/EKSU%20FEST%201.0/WhatsApp%20Image%202026-06-19%20at%206.31.24%E2%80%AFAM.jpeg",
      "/EKSU%20FEST%201.0/WhatsApp%20Image%202026-06-19%20at%206.31.27%E2%80%AFAM.jpeg",
      "/EKSU%20FEST%201.0/WhatsApp%20Image%202026-06-19%20at%206.31.25%E2%80%AFAM.jpeg",
      "/EKSU%20FEST%201.0/WhatsApp%20Image%202026-06-19%20at%206.31.20%E2%80%AFAM.jpeg",
    ],
    status: "past",
    recapVideoUrl: "https://video.example.com/mainland-link-up-recap",
    tiers: [],
  },
  {
    id: "event-alte-garden-session",
    title: "EKSU Fest 2.0",
    slug: "eksu-fest-2",
    venue: "Ekiti State University",
    city: "Ekiti",
    startsAt: "2025-12-14T17:00:00.000Z",
    heroImage: "/EVENTS/EKSU%20FEST%2B%2B%2B%2B.jpg",
    summary:
      "EKSU Fest 2.0 built on the first edition with a larger turnout, headline energy from Kidd Carder, sponsors, vendors, giveaways, and a bigger campus entertainment atmosphere.",
    gallery: [
      "/EKSU%20FEST%202.0/WhatsApp%20Image%202026-06-19%20at%206.31.48%E2%80%AFAM.jpeg",
      "/EKSU%20FEST%202.0/WhatsApp%20Image%202026-06-19%20at%206.31.57%E2%80%AFAM.jpeg",
      "/EKSU%20FEST%202.0/WhatsApp%20Image%202026-06-19%20at%206.31.56%E2%80%AFAM.jpeg",
      "/EKSU%20FEST%202.0/WhatsApp%20Image%202026-06-19%20at%206.31.54%E2%80%AFAM.jpeg",
    ],
    status: "past",
    recapVideoUrl: "https://video.example.com/alte-garden-session-recap",
    tiers: [],
  },
  {
    id: "event-campus-rave-tour",
    title: "After Exam Listening Party",
    slug: "after-exam-listening-party",
    venue: "EKSU",
    city: "Ekiti",
    startsAt: "2025-10-18T18:00:00.000Z",
    heroImage: "/EVENTS/AFTER%20EXAMxLISTENING%20PARTY%2B.jpg",
    summary: "A campus music and lifestyle hangout built around post-exam energy, community, and music discovery, giving students a place to unwind after academic pressure.",
    status: "past",
    recapVideoUrl: "https://video.example.com/campus-rave-tour-recap",
    tiers: [],
  },
  {
    id: "event-adonite-get-together",
    title: "Adonite Get Together Hangout Party",
    slug: "adonite-get-together-hangout-party",
    venue: "EKSU",
    city: "Ekiti",
    startsAt: "2025-08-30T17:00:00.000Z",
    heroImage: "/EVENTS/ADONITE%20GET%20TOGETHER_HANGOUT%20PARTY%2B.jpg",
    summary:
      "A community hangout for Adonites, built as a relaxed meet-up with music, social energy, and the close-knit feel that keeps the Popsy Adonis audience active beyond major events.",
    status: "past",
    recapVideoUrl: "https://video.example.com/adonite-get-together-recap",
    tiers: [],
  },
  {
    id: "event-adonis-birthday-party",
    title: "Popsy Adonis Birthday Party",
    slug: "popsy-adonis-birthday-party",
    venue: "EKSU",
    city: "Ekiti",
    startsAt: "2025-07-18T18:00:00.000Z",
    heroImage: "/EVENTS/ADONIS%20BIRTHDAY%20PARTY2.jpg",
    summary:
      "A birthday celebration turned community nightlife moment, gathering friends, fans, artists, and campus personalities around the Popsy Adonis brand.",
    status: "past",
    recapVideoUrl: "https://video.example.com/adonis-birthday-party-recap",
    tiers: [],
  },
  {
    id: "event-adonis-football-competition",
    title: "Adonis Football Competition",
    slug: "adonis-football-competition",
    venue: "EKSU Sports Ground",
    city: "Ekiti",
    startsAt: "2025-06-14T14:00:00.000Z",
    heroImage: "/EVENTS/ADONIS%20FOOTBALL%20COMPETITION%20BOARD1.jpg",
    summary:
      "A sport and community activation that brought students together outside the usual party format, showing the brand's reach across entertainment, lifestyle, and campus competition.",
    status: "past",
    recapVideoUrl: "https://video.example.com/adonis-football-competition-recap",
    tiers: [],
  },
  {
    id: "event-val-2",
    title: "VAL 2.0",
    slug: "val-2",
    venue: "EKSU",
    city: "Ekiti",
    startsAt: "2025-02-14T18:00:00.000Z",
    heroImage: "/EVENTS/VAL%202.0%2B.jpg",
    summary:
      "A Valentine-themed Popsy Adonis social experience with music, games, lifestyle content, and the kind of playful crowd interaction the platform is known for.",
    status: "past",
    recapVideoUrl: "https://video.example.com/val-2-recap",
    tiers: [],
  },
];

export const artists: Artist[] = [
  {
    name: "Popsy Adonis",
    slug: "popsy-adonis",
    role: "Artist / media personality",
    city: "EKSU",
    image: "/TEAM%20PICTURES/WhatsApp%20Image%202026-06-19%20at%206.40.10%E2%80%AFAM.jpeg",
    bio: "Popsy Adonis is a musician, anonymous campus media force, and culture builder supporting rising EKSU artists through events, collaborations, promotions, and community influence.",
    genres: ["Afrobeats", "Campus Pop", "Street Pop"],
    stats: [
      { label: "Platform launched", value: "2021" },
      { label: "Known for", value: "EKSU TV" },
      { label: "Home base", value: "EKSU" },
    ],
    socials: [
      { label: "Spotify", href: "https://open.spotify.com/artist/17AXu8iavpMfXerr8b6F3S?si=FCpaweqbR8G9xbAqXJgoqA" },
    ],
  },
  {
    name: "Crux",
    slug: "crux",
    role: "Afro-fusion storyteller",
    city: "EKSU",
    image: "/ARTISTS/crux.jpeg",
    bio: "Crux is a Nigerian artist and EKSU graduate whose music blends raw emotion with Afrobeats, Afro-fusion, and street-inspired melodies.",
    genres: ["Afrobeats", "Afro-fusion", "Street Pop"],
    stats: [
      { label: "Featured on", value: "Letter to Aisha" },
      { label: "Tone", value: "Emotional" },
      { label: "Home base", value: "EKSU" },
    ],
    socials: [
      { label: "Spotify", href: "https://open.spotify.com/artist/6MpQ4nyeMskwPhlBq9jz2t?si=-uHIlUwmTomd3iCTlKgAiA" },
    ],
  },
  {
    name: "Diamond Boy",
    slug: "diamond-boy",
    role: "Afro / Amapiano / Gqom artist",
    city: "Ondo / Lagos",
    image: "/ARTISTS/diamond-boy.jpeg",
    bio: "Diamond Boy is a rising Afro, Amapiano, and Gqom artist with heartfelt lyrics, spiritual rhythms, and a growing Spotify audience.",
    genres: ["Afro", "Amapiano", "Gqom"],
    stats: [
      { label: "Monthly listeners", value: "226K+" },
      { label: "Featured on", value: "Old Taker" },
      { label: "Raised in", value: "Lagos" },
    ],
    socials: [
      { label: "Spotify", href: "https://open.spotify.com/artist/2Mr8ln1UwCpIFb1KeeS5TE?si=sqi2ef6tQJqt7OJWw51SiQ" },
    ],
  },
  {
    name: "Rusky The Great",
    slug: "rusky-the-great",
    role: "Versatile Nigerian artist",
    city: "Lagos",
    image: "/TEAM%20PICTURES/WhatsApp%20Image%202026-06-19%20at%206.40.11%E2%80%AFAM.jpeg",
    bio: "Rusky The Great is an EKSU graduate known for emotionally driven music, deep melodies, and expressive storytelling across genres.",
    genres: ["Afrobeats", "Melodic Pop", "Street Pop"],
    stats: [
      { label: "Recording since", value: "16" },
      { label: "Featured on", value: "Old Taker" },
      { label: "Home base", value: "Lagos" },
    ],
    socials: [
      { label: "Spotify", href: "https://open.spotify.com/artist/7iytXs099fUDr48QZg0cBX?si=5Xb9lN5RQfOUPyAEth_8HA" },
    ],
  },
  {
    name: "Blaizeman",
    slug: "blaizeman",
    role: "Afrobeats artist",
    city: "EKSU",
    image: "/ARTISTS/blaizeman.jpeg",
    bio: "Blaizeman is an Afrobeats artist known for smooth melodies, relatable songwriting, and collaborations across Nigeria's independent scene.",
    genres: ["Afrobeats", "Pop", "Afro-fusion"],
    stats: [
      { label: "Known releases", value: "Money" },
      { label: "Featured on", value: "MSN" },
      { label: "Home base", value: "EKSU" },
    ],
    socials: [
      { label: "Spotify", href: "https://open.spotify.com/artist/1CDwTmfz3HIGI6hvv3mUYi?si=kZGmPd1GQ-KAZC_L_8uITA" },
    ],
  },
  {
    name: "Emmey Boy",
    slug: "emmey-boy",
    role: "Afrobeat artist",
    city: "Lagos",
    image: "/ARTISTS/Emmey%20boy.jpeg",
    bio: "Emmey Boy channels the pulse of Lagos into Afrobeat records with infectious grooves, storytelling, and collaborative energy.",
    genres: ["Afrobeat", "Afropop", "Dance"],
    stats: [
      { label: "Known for", value: "ABINIBI" },
      { label: "Standouts", value: "Explain" },
      { label: "Home base", value: "Lagos" },
    ],
    socials: [
      { label: "Spotify", href: "https://open.spotify.com/artist/7Mp1JIAk1aS25Af222uWt2?si=M4Ct1BqzSUmxhujXRYxz9g" },
    ],
  },
  {
    name: "Teazyand99others",
    slug: "teazyand99others",
    role: "Afrobeats / Amapiano artist",
    city: "EKSU",
    image: "/ARTISTS/teazy.jpeg",
    bio: "Teazyand99others blends Afrobeats, Amapiano, and street-inspired sounds into a distinct independent style.",
    genres: ["Afrobeats", "Amapiano", "Street Pop"],
    stats: [
      { label: "Spotify debut", value: "2025" },
      { label: "Featured on", value: "MSN" },
      { label: "Home base", value: "EKSU" },
    ],
    socials: [
      { label: "Spotify", href: "https://open.spotify.com/artist/3RmI7ezPZ3mDU9mGL4bkKM?si=gk-_1YbbS1Sw7_7K2A4brQ" },
    ],
  },
  {
    name: "Pili Chara",
    slug: "pili-chara",
    role: "Afrobeats collaborator",
    city: "EKSU",
    image: "/ARTISTS/Pilichara.jpeg",
    bio: "Pili Chara is part of the Popsy Adonis collaborator circle, bringing campus pop energy and a featured presence on Old Taker.",
    genres: ["Afrobeats", "Campus Pop", "Street Pop"],
    stats: [
      { label: "Featured on", value: "Old Taker" },
      { label: "Scene", value: "EKSU" },
      { label: "Format", value: "Live + studio" },
    ],
    socials: [],
  },
];

export const products: Product[] = [
  {
    id: "product-pa-flux-white-tee-becoming",
    defaultVariantId: "variant-pa-flux-white-tee-m",
    name: "White FLUX Tee - The Becoming",
    slug: "white-flux-tee-the-becoming",
    description:
      "After surviving the darkness, you don't return the same. You return renewed. The White Tee represents clarity, confidence, and new beginnings. It reminds you that growth isn't about being perfect; it's about becoming better every day. Stay in Flux. Evolve without limits.",
    priceKobo: 3500000,
    images: [
      "/PA%20FLUX/White%20FLUX%20Tee%20%E2%80%94%20The%20Becoming/front.jpeg",
      "/PA%20FLUX/White%20FLUX%20Tee%20%E2%80%94%20The%20Becoming/back.jpeg",
    ],
    colors: ["White"],
    sizes: ["M", "L", "XL"],
    variants: [
      { id: "variant-pa-flux-white-tee-m", size: "M", color: "White", priceKobo: 3500000, stock: 100 },
      { id: "variant-pa-flux-white-tee-l", size: "L", color: "White", priceKobo: 3500000, stock: 100 },
      { id: "variant-pa-flux-white-tee-xl", size: "XL", color: "White", priceKobo: 3500000, stock: 100 },
    ],
    tag: "Launch Drop",
  },
  {
    id: "product-pa-flux-black-tee-beginning",
    defaultVariantId: "variant-pa-flux-black-tee-m",
    name: "Black FLUX Tee - The Beginning",
    slug: "black-flux-tee-the-beginning",
    description:
      "Before every breakthrough, there's a season nobody applauds. The Black Tee represents the nights of doubt, discipline, and silent growth. Every setback leaves a mark, but every mark becomes part of the story. You don't wait for the light, you become it. Stay in Flux. Keep moving.",
    priceKobo: 3500000,
    images: [
      "/PA%20FLUX/Black%20Flux%20Tee%20%E2%80%94%20The%20Beginning/front.jpeg",
      "/PA%20FLUX/Black%20Flux%20Tee%20%E2%80%94%20The%20Beginning/back.jpeg",
    ],
    colors: ["Black"],
    sizes: ["M", "L", "XL"],
    variants: [
      { id: "variant-pa-flux-black-tee-m", size: "M", color: "Black", priceKobo: 3500000, stock: 100 },
      { id: "variant-pa-flux-black-tee-l", size: "L", color: "Black", priceKobo: 3500000, stock: 100 },
      { id: "variant-pa-flux-black-tee-xl", size: "XL", color: "Black", priceKobo: 3500000, stock: 100 },
    ],
    tag: "Launch Drop",
  },
  {
    id: "product-pa-flux-joggers-crisp-white",
    defaultVariantId: "variant-pa-flux-joggers-white-m",
    name: "FLUX Joggers - Crisp White",
    slug: "flux-joggers-crisp-white",
    description:
      "Untouched, Yet Unstoppable. Crisp White isn't weakness, it's possibility. The FLUX joggers represent the beginning of every journey: clean ambition, bold vision, and the courage to step into the unknown. The ghost graphics symbolize the fearless side of you that refuses to disappear, while the Flux identity reminds you that growth comes through constant movement. Every stain tells a story. Every step adds character. Stay in Flux. Stay Becoming.",
    priceKobo: 3500000,
    images: [
      "/PA%20FLUX/FLUX%20JOGGERS%20Crisp%20white%20Edition%3A%20%E2%80%9CUntouched%2C%20Yet%20Unstoppable.%E2%80%9D/front-side.jpg",
    ],
    colors: ["Crisp White"],
    sizes: ["M", "L", "XL"],
    variants: [
      { id: "variant-pa-flux-joggers-white-m", size: "M", color: "Crisp White", priceKobo: 3500000, stock: 100 },
      { id: "variant-pa-flux-joggers-white-l", size: "L", color: "Crisp White", priceKobo: 3500000, stock: 100 },
      { id: "variant-pa-flux-joggers-white-xl", size: "XL", color: "Crisp White", priceKobo: 3500000, stock: 100 },
    ],
    tag: "Launch Drop",
  },
];
