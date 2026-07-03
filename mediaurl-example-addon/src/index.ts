import {
  CatalogResponse,
  createAddon,
  ItemResponse,
  MovieItem,
  runCli,
  Source,
  SourceResponse,
} from "@mediaurl/sdk";

const VIDEO_BASE =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample";

interface DemoMovie {
  id: string;
  name: string;
  year: number;
  description: string;
  video: string;
  poster: string;
}

const DEMO_MOVIES: DemoMovie[] = [
  {
    id: "big-buck-bunny",
    name: "Big Buck Bunny",
    year: 2008,
    description:
      "Ein riesiges Kaninchen rächt sich auf liebenswerte Art an drei fiesen Nagetieren. Open Movie der Blender Foundation.",
    video: `${VIDEO_BASE}/BigBuckBunny.mp4`,
    poster: `${VIDEO_BASE}/images/BigBuckBunny.jpg`,
  },
  {
    id: "elephants-dream",
    name: "Elephants Dream",
    year: 2006,
    description:
      "Zwei Gestalten erkunden eine surreale Maschinenwelt. Der erste Open Movie der Blender Foundation.",
    video: `${VIDEO_BASE}/ElephantsDream.mp4`,
    poster: `${VIDEO_BASE}/images/ElephantsDream.jpg`,
  },
  {
    id: "sintel",
    name: "Sintel",
    year: 2010,
    description:
      "Ein Mädchen sucht nach ihrem verlorenen Drachenfreund. Fantasy-Kurzfilm der Blender Foundation.",
    video: `${VIDEO_BASE}/Sintel.mp4`,
    poster: `${VIDEO_BASE}/images/Sintel.jpg`,
  },
  {
    id: "tears-of-steel",
    name: "Tears of Steel",
    year: 2012,
    description:
      "Science-Fiction-Kurzfilm über Roboter und alte Wunden im Amsterdam der Zukunft.",
    video: `${VIDEO_BASE}/TearsOfSteel.mp4`,
    poster: `${VIDEO_BASE}/images/TearsOfSteel.jpg`,
  },
];

const toMovieItem = (movie: DemoMovie): MovieItem => ({
  type: "movie",
  ids: { "blender.demo": movie.id },
  name: movie.name,
  year: movie.year,
  description: movie.description,
  images: { poster: movie.poster },
});

export const blenderDemoAddon = createAddon({
  id: "blender.demo",
  name: "Blender Open Movies",
  version: "1.0.0",
  description:
    "Beispiel-Addon: frei lizenzierte Kurzfilme der Blender Foundation",
  itemTypes: ["movie"],
  actions: ["catalog", "item", "source"],
  catalogs: [
    {
      id: "blender-movies",
      name: "Blender Open Movies",
      features: {
        search: { enabled: true },
      },
    },
  ],
});

// Liefert den Katalog; unterstützt auch die Suche in der App.
blenderDemoAddon.registerActionHandler(
  "catalog",
  async (input): Promise<CatalogResponse> => {
    const search = input.search?.toLowerCase();
    const movies = search
      ? DEMO_MOVIES.filter((m) => m.name.toLowerCase().includes(search))
      : DEMO_MOVIES;
    return {
      items: movies.map(toMovieItem),
      nextCursor: null,
    };
  }
);

// Liefert die Detailansicht eines einzelnen Films.
blenderDemoAddon.registerActionHandler(
  "item",
  async (input): Promise<ItemResponse> => {
    const movie = DEMO_MOVIES.find((m) => m.id === input.ids["blender.demo"]);
    if (!movie) return null;
    return toMovieItem(movie);
  }
);

// Liefert die Abspielquellen (hier: ein direkter MP4-Stream).
blenderDemoAddon.registerActionHandler(
  "source",
  async (input): Promise<SourceResponse> => {
    const movie = DEMO_MOVIES.find((m) => m.id === input.ids["blender.demo"]);
    if (!movie) return [];
    const source: Source = {
      type: "url",
      id: movie.id,
      name: "Google Sample Videos (MP4, 1080p)",
      url: movie.video,
      format: "mp4",
    };
    return [source];
  }
);

runCli([blenderDemoAddon]);
