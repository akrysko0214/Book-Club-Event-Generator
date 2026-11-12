// Hand-drawn SVG bookshelf illustration for the homepage. They're part of the
// code, so there are no image files to download or license.

const colors = {
  teal: "#0f766e",
  tealDark: "#115e59",
  rose: "#be123c",
  roseDark: "#9f1239",
  amber: "#d97706",
  amberDark: "#b45309",
  stone: "#44403c",
  gold: "#fbbf24",
};

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
