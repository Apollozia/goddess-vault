// ── Curated list ──────────────────────────────────────────────
// Add / edit entries here. Each entry:
//   handle  : Instagram handle without "@" (used for the profile link)
//   name    : display name
//   desc    : one-line description
//   tags    : array of category tags (used by the filter tabs)
//   img     : optional custom image URL. Leave "" and the avatar is fetched
//             automatically from Instagram (via oginstagram.com) — but only
//             when served from Cloudflare Pages, where /api/avatar exists.
//             On a local file:// preview the gradient initials show instead.
//   followers: optional static fallback; on the live site the real count is
//             fetched automatically from Instagram (/api/profile)
//   pinned  : true to always show in the spotlight rotation / top of list
const CREATORS = [
  {
    handle: "natgeo",
    name: "Natasha Aldridge",
    desc: "Travel & lifestyle photographer. Chasing golden hour in 40 countries.",
    tags: ["photography", "travel"],
    img: "",
    followers: 512000,
    pinned: true,
  },
  {
    handle: "example.yoga",
    name: "Mira Chen",
    desc: "Yoga instructor & wellness coach. Morning flows from Bali.",
    tags: ["fitness", "wellness"],
    img: "",
    followers: 284000,
    pinned: false,
  },
  {
    handle: "example.fashion",
    name: "Sofia Laurent",
    desc: "Paris-based stylist. Minimal wardrobe, maximal attitude.",
    tags: ["fashion"],
    img: "",
    followers: 980000,
    pinned: true,
  },
  {
    handle: "example.art",
    name: "Aiko Tanaka",
    desc: "Illustrator painting dreamy portraits and soft light.",
    tags: ["art", "photography"],
    img: "",
    followers: 132000,
    pinned: false,
  },
  {
    handle: "example.food",
    name: "Elena Rossi",
    desc: "Home cooking, Roman style. Every recipe tested twice.",
    tags: ["food"],
    img: "",
    followers: 76000,
    pinned: false,
  },
  {
    handle: "example.music",
    name: "Kaya Blues",
    desc: "Singer-songwriter. Studio sessions and tiny desk covers.",
    tags: ["music"],
    img: "",
    followers: 340000,
    pinned: false,
  },
];

const SITE = {
  title: "Goddess Vault",
  tagline: "A curated gallery of beautiful creators on Instagram.",
  curator: "@yourhandle", // credited in the header
};
