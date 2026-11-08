// Hand-drawn SVG book illustrations for the homepage. They're part of the
// code, so there are no image files to download or license.

const colors = {
  teal: "#0f766e",
  tealDark: "#115e59",
  rose: "#be123c",
  roseDark: "#9f1239",
  amber: "#d97706",
  amberDark: "#b45309",
  stone: "#44403c",
  stoneDark: "#292524",
  pages: "#fef3c7",
  paper: "#fffbeb",
  gold: "#fbbf24",
  line: "#d6d3d1",
};

// A stack of books with a mug of tea, an open book, and books on a shelf.
export function BookScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 240"
      role="img"
      aria-label="A stack of books with a cup of tea, an open book, and books standing on a shelf"
      className={className}
    >
      {/* Stack of books lying flat */}
      <FlatBook x={40} y={180} width={170} height={36} cover={colors.teal} band={colors.tealDark} />
      <FlatBook x={58} y={146} width={148} height={34} cover={colors.rose} band={colors.roseDark} />
      <FlatBook x={46} y={116} width={162} height={30} cover={colors.amber} band={colors.amberDark} />
      <FlatBook x={72} y={92} width={118} height={24} cover={colors.stone} band={colors.stoneDark} />

      {/* Mug of tea on top of the stack */}
      <path
        d="M140 66 h10 a10 10 0 0 1 0 20 h-10"
        fill="none"
        stroke={colors.stone}
        strokeWidth="4"
      />
      <rect x="104" y="58" width="38" height="34" rx="6" fill={colors.paper} stroke={colors.stone} strokeWidth="3" />
      <rect x="112" y="68" width="22" height="6" rx="3" fill={colors.rose} opacity="0.7" />
      <path d="M114 50 q-6 -8 0 -16 q6 -8 0 -16" fill="none" stroke={colors.line} strokeWidth="3" strokeLinecap="round" />
      <path d="M130 50 q-6 -8 0 -16 q6 -8 0 -16" fill="none" stroke={colors.line} strokeWidth="3" strokeLinecap="round" />

      {/* Open book */}
      <path d="M226 206 L226 130 Q264 120 302 136 Q340 120 378 130 L378 206 Q340 196 302 212 Q264 196 226 206 Z" fill={colors.amberDark} />
      <path d="M232 198 L232 132 Q268 124 302 140 L302 206 Q268 192 232 198 Z" fill={colors.paper} stroke={colors.line} strokeWidth="1.5" />
      <path d="M372 198 L372 132 Q336 124 302 140 L302 206 Q336 192 372 198 Z" fill={colors.paper} stroke={colors.line} strokeWidth="1.5" />
      {[148, 160, 172, 184].map((y) => (
        <g key={y} stroke={colors.line} strokeWidth="2.5" strokeLinecap="round">
          <path d={`M244 ${y - 4} Q268 ${y - 9} 292 ${y + 2}`} fill="none" />
          <path d={`M312 ${y + 2} Q336 ${y - 9} 360 ${y - 4}`} fill="none" />
        </g>
      ))}
      <path d="M296 206 L302 228 L308 206 Z" fill={colors.rose} />

      {/* Books standing on the right */}
      <StandingBook x={398} y={100} width={22} height={120} cover={colors.teal} band={colors.gold} />
      <StandingBook x={422} y={122} width={18} height={98} cover={colors.amber} band={colors.paper} />
      <StandingBook x={442} y={86} width={26} height={134} cover={colors.rose} band={colors.gold} />
      <g transform="rotate(16 470 220)">
        <StandingBook x={470} y={108} width={20} height={112} cover={colors.stone} band={colors.gold} />
      </g>

      {/* Shelf */}
      <rect x="20" y="218" width="480" height="8" rx="4" fill="#fcd34d" />
    </svg>
  );
}

function FlatBook({
  x,
  y,
  width,
  height,
  cover,
  band,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  cover: string;
  band: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx="4" fill={cover} />
      <rect x={x + width - 18} y={y + 4} width="14" height={height - 8} rx="2" fill={colors.pages} />
      <rect x={x + 12} y={y} width="6" height={height} fill={band} />
      <rect x={x + 26} y={y + height / 2 - 2} width={width * 0.35} height="4" rx="2" fill={colors.gold} opacity="0.8" />
    </g>
  );
}

function StandingBook({
  x,
  y,
  width,
  height,
  cover,
  band,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  cover: string;
  band: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx="3" fill={cover} />
      <rect x={x + 3} y={y + 14} width={width - 6} height="4" rx="2" fill={band} />
      <rect x={x + 3} y={y + height - 22} width={width - 6} height="4" rx="2" fill={band} />
    </g>
  );
}

// A row of book spines, used as a decorative bookshelf divider.
const spineColors = [
  colors.teal,
  colors.amber,
  colors.rose,
  colors.stone,
  colors.amberDark,
  colors.tealDark,
  colors.roseDark,
];
const SPINE_GAP = 3;
const books = Array.from({ length: 30 }, (_, i) => ({
  key: i,
  width: 18 + ((i * 7) % 12),
  height: 54 + ((i * 13) % 30),
  color: spineColors[(i * 3) % spineColors.length],
  x: 0,
}));
// Line the books up left to right.
for (let i = 1; i < books.length; i++) {
  books[i].x = books[i - 1].x + books[i - 1].width + SPINE_GAP;
}
const shelfWidth = books[books.length - 1].x + books[books.length - 1].width;

export function Bookshelf({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${shelfWidth} 96`}
      role="img"
      aria-label="A shelf of colorful books"
      className={className}
    >
      {books.map((book) => (
        <g key={book.key}>
          <rect
            x={book.x}
            y={88 - book.height}
            width={book.width}
            height={book.height}
            rx="2"
            fill={book.color}
          />
          <rect
            x={book.x + 3}
            y={88 - book.height + 10}
            width={book.width - 6}
            height="3"
            rx="1.5"
            fill={colors.gold}
            opacity="0.85"
          />
        </g>
      ))}
      <rect x="0" y="88" width={shelfWidth} height="8" rx="4" fill="#fcd34d" />
    </svg>
  );
}
