/* Wörter, Begriffe und Fragen für den Spieleabend.
   Einfach erweitern: neue Einträge in die Listen schreiben, fertig. */
(function (global) {
  'use strict';

  var imposter = {
    'Essen': ['Pizza', 'Döner', 'Sushi', 'Pommes', 'Lasagne', 'Pfannkuchen', 'Burger', 'Spaghetti', 'Currywurst', 'Tacos', 'Popcorn', 'Käsefondue', 'Brezel', 'Eis', 'Waffeln', 'Nutella', 'Falafel', 'Ramen'],
    'Orte': ['Flughafen', 'Freibad', 'Krankenhaus', 'Kino', 'Schule', 'Fitnessstudio', 'Supermarkt', 'Zoo', 'Kirmes', 'Bahnhof', 'Strand', 'Bibliothek', 'Friseur', 'Tankstelle', 'Hochzeit', 'Campingplatz', 'Skigebiet', 'Escape Room'],
    'Tiere': ['Pinguin', 'Giraffe', 'Hai', 'Katze', 'Faultier', 'Krake', 'Elefant', 'Kamel', 'Flamingo', 'Waschbär', 'Känguru', 'Eichhörnchen', 'Papagei', 'Delfin', 'Igel', 'Alpaka'],
    'Berufe': ['Pilot', 'Zahnarzt', 'Feuerwehr', 'Koch', 'Lehrerin', 'YouTuber', 'Polizist', 'Friseurin', 'Astronaut', 'DJ', 'Bäcker', 'Tierärztin', 'Fußballprofi', 'Busfahrer', 'Detektiv', 'Gamer'],
    'Filme & Serien': ['Harry Potter', 'Stranger Things', 'Squid Game', 'Titanic', 'Shrek', 'Star Wars', 'Die Eiskönigin', 'Spider-Man', 'Wednesday', 'Barbie', 'Minecraft Film', 'Toy Story', 'Avatar', 'Der König der Löwen', 'Findet Nemo'],
    'Sport & Games': ['Fußball', 'Tennis', 'Bowling', 'Schach', 'Minecraft', 'Fortnite', 'Mario Kart', 'Skifahren', 'Boxen', 'Basketball', 'Uno', 'Monopoly', 'Tischtennis', 'Surfen', 'Klettern', 'FIFA'],
    'Dinge': ['Handy', 'Regenschirm', 'Zahnbürste', 'Kühlschrank', 'Kopfhörer', 'Rucksack', 'Spiegel', 'Luftballon', 'Sonnenbrille', 'Fernbedienung', 'Kerze', 'Schlüssel', 'Wecker', 'Staubsauger', 'Powerbank', 'Trampolin'],
    'Internet & Trends': ['TikTok', 'Selfie', 'Emoji', 'Livestream', 'Meme', 'WhatsApp-Gruppe', 'Influencer', 'Podcast', 'Sprachnachricht', 'Hashtag', 'Filter', 'Unboxing', 'Dubai-Schokolade', 'Stanley Cup', 'Labubu']
  };

  var stirnraten = {
    'Tiere': ['Hund', 'Katze', 'Elefant', 'Giraffe', 'Pinguin', 'Löwe', 'Affe', 'Schlange', 'Frosch', 'Kuh', 'Hai', 'Adler', 'Krokodil', 'Känguru', 'Eule', 'Spinne', 'Pferd', 'Hase', 'Bär', 'Schildkröte', 'Qualle', 'Zebra', 'Nashorn', 'Biene', 'Wal', 'Huhn', 'Schwein', 'Faultier', 'Tintenfisch', 'Einhorn'],
    'Figuren & Stars': ['Super Mario', 'SpongeBob', 'Harry Potter', 'Batman', 'Pikachu', 'Elsa', 'Spider-Man', 'Shrek', 'Darth Vader', 'Homer Simpson', 'Taylor Swift', 'Cristiano Ronaldo', 'Messi', 'Albert Einstein', 'Micky Maus', 'Sonic', 'Pippi Langstrumpf', 'Der Grinch', 'Yoda', 'Minions', 'Barbie', 'Hulk', 'Goku', 'Mr. Bean', 'Sherlock Holmes', 'Rapunzel', 'Iron Man', 'Stitch', 'Kermit', 'Weihnachtsmann'],
    'Pantomime': ['Zähne putzen', 'Auto fahren', 'Schwimmen', 'Kochen', 'Gitarre spielen', 'Tanzen', 'Selfie machen', 'Angeln', 'Staubsaugen', 'Boxen', 'Skifahren', 'Schlafen', 'Zaubern', 'Reiten', 'Klettern', 'Niesen', 'Bowling', 'Surfen', 'Holz hacken', 'Rasen mähen', 'Pizza backen', 'Fotografieren', 'Tauchen', 'Eis essen', 'Jonglieren', 'Yoga', 'Kaugummi kauen', 'Fliegen', 'Joggen', 'Wäsche aufhängen'],
    'Filme & Serien': ['Titanic', 'Frozen', 'Star Wars', 'Stranger Things', 'Harry Potter', 'Squid Game', 'Shrek', 'Toy Story', 'Avatar', 'Jurassic Park', 'Der König der Löwen', 'Findet Nemo', 'Die Simpsons', 'Spider-Man', 'Wednesday', 'Minecraft', 'Pokémon', 'Barbie', 'Cars', 'Zoomania', 'Ich – Einfach unverbesserlich', 'Fluch der Karibik', 'Home Alone', 'Encanto', 'Vaiana', 'Avengers', 'Die Eiskönigin', 'Oben', 'Coco', 'Alles steht Kopf'],
    'Essen & Trinken': ['Pizza', 'Spaghetti', 'Sushi', 'Döner', 'Currywurst', 'Pommes', 'Burger', 'Brezel', 'Apfelstrudel', 'Gummibärchen', 'Popcorn', 'Pfannkuchen', 'Waffel', 'Banane', 'Wassermelone', 'Zitrone', 'Knoblauch', 'Käse', 'Schokolade', 'Kakao', 'Cola', 'Bubble Tea', 'Croissant', 'Hotdog', 'Nudelsuppe', 'Tacos', 'Donut', 'Müsli', 'Rührei', 'Kaiserschmarrn'],
    'Dinge & Orte': ['Kühlschrank', 'Regenschirm', 'Zahnbürste', 'Achterbahn', 'Flugzeug', 'Leuchtturm', 'Eiffelturm', 'Pyramide', 'Schneemann', 'Trampolin', 'Kerze', 'Wecker', 'Handy', 'Rakete', 'U-Boot', 'Zelt', 'Staubsauger', 'Schatzkiste', 'Tannenbaum', 'Kaktus', 'Vulkan', 'Iglu', 'Fahrrad', 'Brille', 'Luftballon', 'Hängematte', 'Burg', 'Aufzug', 'Rolltreppe', 'Karussell']
  };

  var bombe = [
    'Etwas, das man im Kühlschrank findet',
    'Ein Tier mit vier Beinen',
    'Eine Automarke',
    'Etwas, das rot ist',
    'Ein Land in Europa',
    'Eine Pizza-Zutat',
    'Ein Beruf',
    'Etwas, das man im Bad findet',
    'Eine Sportart',
    'Ein Disney-Film',
    'Eine Obst- oder Gemüsesorte',
    'Ein Vorname mit A',
    'Etwas, das man am Strand macht',
    'Ein Musikinstrument',
    'Eine Stadt in Deutschland',
    'Ein Kleidungsstück',
    'Etwas, das fliegen kann',
    'Ein Superheld',
    'Etwas, das man im Supermarkt kauft',
    'Ein Videospiel',
    'Eine Süßigkeit',
    'Etwas mit Rädern',
    'Ein Schulfach',
    'Etwas, das Geräusche macht',
    'Ein Wort mit Z',
    'Eine App auf dem Handy',
    'Ein Tier, das im Wasser lebt',
    'Etwas, das kalt ist',
    'Ein Möbelstück',
    'Ein Getränk',
    'Etwas, das man verschenken kann',
    'Ein Emoji',
    'Eine Farbe',
    'Ein Werkzeug',
    'Etwas, das man auf Reisen mitnimmt',
    'Ein Wort, das mit „Schnee“ anfängt',
    'Ein Fußballverein',
    'Etwas, das man in der Küche benutzt',
    'Ein Körperteil',
    'Ein Märchen'
  ];

  var werEher = {
    'Chillig': [
      'Wer würde eher beim Film einschlafen?',
      'Wer würde eher das letzte Stück Pizza essen, ohne zu fragen?',
      'Wer würde eher 12 Stunden am Stück zocken?',
      'Wer würde eher beim Fernsehquiz gewinnen?',
      'Wer würde eher mit Tieren sprechen?',
      'Wer würde eher im Urlaub den Pass vergessen?',
      'Wer würde eher einen Tanz auf TikTok viral machen?',
      'Wer würde eher zu spät zur eigenen Party kommen?',
      'Wer würde eher Millionär werden?',
      'Wer würde eher beim Horrorfilm schreien?',
      'Wer würde eher ein Buch schreiben?',
      'Wer würde eher im Supermarkt verloren gehen?',
      'Wer würde eher Weltmeister im Nichtstun werden?',
      'Wer würde eher heimlich Süßigkeiten verstecken?',
      'Wer würde eher 100 Jahre alt werden?',
      'Wer würde eher mit dem Handy in der Hand das Handy suchen?',
      'Wer würde eher auf einer einsamen Insel überleben?',
      'Wer würde eher Präsident oder Kanzlerin werden?',
      'Wer würde eher bei Karaoke das Mikro nicht mehr hergeben?',
      'Wer würde eher ein Haustier-Einhorn wollen?'
    ],
    'Mutig': [
      'Wer würde eher einen Bungee-Sprung machen?',
      'Wer würde eher einem Promi eine Nachricht schreiben?',
      'Wer würde eher eine Woche ohne Handy aushalten?',
      'Wer würde eher im Restaurant etwas völlig Unbekanntes bestellen?',
      'Wer würde eher einen Fremden auf der Straße zum Lachen bringen?',
      'Wer würde eher bei einer Castingshow mitmachen?',
      'Wer würde eher sich die Haare knallpink färben?',
      'Wer würde eher auswandern?',
      'Wer würde eher eine Spinne mit der Hand rausbringen?',
      'Wer würde eher eine peinliche Sprachnachricht an die falsche Person schicken?',
      'Wer würde eher auf einer Hochzeit spontan eine Rede halten?',
      'Wer würde eher allein durch die Welt reisen?',
      'Wer würde eher in einem Horrorhaus übernachten?',
      'Wer würde eher das schärfste Chili der Welt essen?',
      'Wer würde eher auf der Straße tanzen, wenn Musik läuft?',
      'Wer würde eher ein Geheimnis ausplaudern?',
      'Wer würde eher bei einer Mutprobe als Erstes „Ich!“ rufen?',
      'Wer würde eher Fallschirmspringen gehen?',
      'Wer würde eher einen Streit mit einem Lehrer gewinnen?',
      'Wer würde eher ins eiskalte Wasser springen?'
    ]
  };

  var api = { imposter: imposter, stirnraten: stirnraten, bombe: bombe, werEher: werEher };

  global.SA = global.SA || {};
  global.SA.woerter = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
