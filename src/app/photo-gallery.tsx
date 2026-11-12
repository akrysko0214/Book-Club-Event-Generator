import Image from "next/image";

// Free stock photos from Unsplash (unsplash.com/license: free to use, no
// permission needed). Credit links go to each photo's Unsplash page.
const photos = [
  {
    id: "photo-1763896081109-ed6bf56ae955",
    alt: "Book club members holding open books around a table",
    caption: "Book club night",
    credit: "Bill Ringer",
    page: "https://unsplash.com/photos/hands-holding-open-books-around-a-table-7C2JUQRJ5hE",
  },
  {
    id: "photo-1758876201359-1d04e01f572f",
    alt: "A woman smiling while reading a book on her couch",
    caption: "Your next great read",
    credit: "Vitaly Gariev",
    page: "https://unsplash.com/photos/a-woman-smiles-while-reading-a-book-on-a-couch-8brlKaKqddg",
  },
  {
    id: "photo-1699730148440-22fc68a96752",
    alt: "Friends gathered around a table sharing a snack board and drinks",
    caption: "Themed snacks and drinks",
    credit: "OurWhisky Foundation",
    page: "https://unsplash.com/photos/a-group-of-people-sitting-around-a-table-with-food-and-drinks-Q7Ne0r8HE88",
  },
  {
    id: "photo-1764173039117-e1ef87b26ec4",
    alt: "Two friends laughing together over a book in a library",
    caption: "Stories worth sharing",
    credit: "Centre for Ageing Better",
    page: "https://unsplash.com/photos/two-women-looking-at-a-book-in-library-xlG0HM4RG6I",
  },
];

export default function PhotoGallery() {
  return (
    <section className="mt-16 w-full">
      <h2 className="text-2xl font-bold sm:text-3xl">Bring your book to life</h2>
      <p className="mx-auto mt-2 max-w-xl text-stone-600">
        From cozy nights in to full book club parties, every plan is built
        around the story you love.
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {photos.map((photo) => (
          <figure
            key={photo.id}
            className="overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-amber-100"
          >
            <div className="relative aspect-[3/2]">
              <Image
                src={`https://images.unsplash.com/${photo.id}?w=1200&q=80&fit=crop&auto=format`}
                alt={photo.alt}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="flex items-baseline justify-between gap-3 px-5 py-3">
              <span className="font-semibold">{photo.caption}</span>
              <a
                href={photo.page}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-stone-500 hover:underline"
              >
                Photo: {photo.credit} / Unsplash
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
