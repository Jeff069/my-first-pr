import {
  CatalogResponse,
  ChannelItem,
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

interface DemoChannel {
  id: string;
  name: string;
  description: string;
  stream: string;
}

// Frei empfangbare Web-Livestreams öffentlicher Sender (HLS).
const DEMO_CHANNELS: DemoChannel[] = [
  {
    id: "dw-deutsch",
    name: "DW Deutsch",
    description: "Deutsche Welle — Nachrichten und Magazine auf Deutsch.",
    stream:
      "https://dwamdstream106.akamaized.net/hls/live/2015531/dwstream106/index.m3u8",
  },
  {
    id: "dw-english",
    name: "DW English",
    description: "Deutsche Welle — internationaler Nachrichtensender.",
    stream:
      "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
  },
  {
    id: "tagesschau24",
    name: "tagesschau24",
    description: "Der Nachrichtenkanal der ARD.",
    stream:
      "https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8",
  },
  {
    id: "redbull-tv",
    name: "Red Bull TV",
    description: "Sport, Musik und Abenteuer — frei empfangbar.",
    stream:
      "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
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

const toChannelItem = (channel: DemoChannel): ChannelItem => ({
  type: "channel",
  ids: { "blender.demo": channel.id },
  name: channel.name,
  description: channel.description,
});

export const blenderDemoAddon = createAddon({
  id: "blender.demo",
  name: "Blender Open Movies",
  version: "1.0.0",
  description:
    "Beispiel-Addon: frei lizenzierte Kurzfilme der Blender Foundation",
  itemTypes: ["movie", "channel"],
  actions: ["catalog", "item", "source"],
  catalogs: [
    {
      id: "blender-movies",
      name: "Blender Open Movies",
      features: {
        search: { enabled: true },
      },
    },
    {
      id: "tv-channels",
      name: "TV-Kanäle (Live)",
      features: {
        search: { enabled: true },
      },
    },
  ],
});

// Liefert die Kataloge; unterstützt auch die Suche in der App.
blenderDemoAddon.registerActionHandler(
  "catalog",
  async (input): Promise<CatalogResponse> => {
    const search = input.search?.toLowerCase();

    if (input.catalogId === "tv-channels") {
      const channels = search
        ? DEMO_CHANNELS.filter((c) => c.name.toLowerCase().includes(search))
        : DEMO_CHANNELS;
      return {
        items: channels.map(toChannelItem),
        nextCursor: null,
      };
    }

    const movies = search
      ? DEMO_MOVIES.filter((m) => m.name.toLowerCase().includes(search))
      : DEMO_MOVIES;
    return {
      items: movies.map(toMovieItem),
      nextCursor: null,
    };
  }
);

// Liefert die Detailansicht eines Films oder TV-Kanals.
blenderDemoAddon.registerActionHandler(
  "item",
  async (input): Promise<ItemResponse> => {
    const id = input.ids["blender.demo"];
    if (input.type === "channel") {
      const channel = DEMO_CHANNELS.find((c) => c.id === id);
      return channel ? toChannelItem(channel) : null;
    }
    const movie = DEMO_MOVIES.find((m) => m.id === id);
    return movie ? toMovieItem(movie) : null;
  }
);

// Liefert die Abspielquellen: MP4 für Filme, HLS-Livestream für Kanäle.
blenderDemoAddon.registerActionHandler(
  "source",
  async (input): Promise<SourceResponse> => {
    const id = input.ids["blender.demo"];

    if (input.type === "channel") {
      const channel = DEMO_CHANNELS.find((c) => c.id === id);
      if (!channel) return [];
      const source: Source = {
        type: "url",
        id: channel.id,
        name: "Livestream (HLS)",
        url: channel.stream,
        format: "hls",
      };
      return [source];
    }

    const movie = DEMO_MOVIES.find((m) => m.id === id);
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
