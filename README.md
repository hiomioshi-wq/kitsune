# Kitsune 狐

Read the manga you own, track your series, and read or listen to thousands of public-domain books.

## Run it

Locally (Node 18+, no installs):

```bash
node server.js
```

Open http://localhost:8787. Use your own manga folder with `node server.js --library ~/Manga`.

Deploy:

```bash
vercel deploy --prod
```

The static app is in `public/`, and the API runs as one Vercel function (`api/router.js`). The local server and Vercel share `lib/core.js`.

## Features

**Your library**
- Add CBZ, ZIP, PDF, EPUB (comic or prose), TXT, loose images or whole folders. Files stay in your browser (IndexedDB) and are never uploaded.
- Link pages you host yourself: image links with numbered ranges (`{001..196}`), IIIF manifests from libraries and museums, Internet Archive items, and OPDS servers (Komga, Kavita, Calibre-Web, Ubooquity) with page streaming (OPDS-PSE).
- Link volumes to AniList series to get covers, synopses and official store links. Group them by series, see which volumes you have, and record copies you own elsewhere (print, Kindle, BOOK☆WALKER and so on).
- Import your public AniList list.
- Statuses, ratings, notes, collections, bulk edits, filters and sorting.
- Backup and restore as a .zip, with or without files.

**Manga reader**: single page, two-page spread (with offset), long strip with auto-scroll; right-to-left or left-to-right per volume; fit height, width or original; zoom and pan; page thumbnails; bookmarks; brightness and warmth; next-volume handoff; swipe, tap and keyboard.

**Book reader**: scroll or page-turn layout; Paper, Sepia, Matcha, Night and Ink themes; Literata, Shippori Mincho, Atkinson Hyperlegible or sans; size, spacing and width; contents; search in the book; bookmarks; four highlight colors with notes; read-aloud; time left.

**Audiobooks**: LibriVox player that keeps playing while you browse, with chapters, speeds, ±15/30 s skips, sleep timer, lock-screen controls and resume.

**Discover**: AniList trending, popular, top rated and newest, filtered by genre, origin and status, plus recommendations. Classic manga: Hokusai's sketchbooks and Edo-period picture books (published before 1931).

**Books**: Project Gutenberg (14 languages, topics, author eras), Internet Archive scans from before 1931, LibriVox audiobooks, and your own files.

**Offline**: works without a connection once loaded (service worker). Save streamed volumes, archive.org scans and server-folder volumes to the device page by page.

**Up Next**: a reading queue you can reorder, shown on Home.

**Notebook**: every highlight, note and bookmark across your library, with search, color and title filters, and Markdown export.

**Look up**: select a word in a book to define it (Wiktionary, Free Dictionary) or look up names and places on Wikipedia. Gutenberg book pages show the author's biography and more of their books.

**Illustrated editions**: read Gutenberg's EPUB with the original pictures, or switch back to plain text without losing your place.

**Reader extras**: smart spreads keep two-page drawings whole; set any page as the cover; reading ruler; position scrubber; "Surprise me" picks for ebooks and classic manga; duplicate imports are skipped; ? shows every keyboard shortcut.

**Language tools**: translate any selection (MyMemory), save words to a vocabulary list with the sentence you found them in, review them with spaced-repetition flashcards, and export to Anki (CSV).

**Share**: turn a highlight into a square quote-card image.

**Read along**: play a LibriVox audiobook while reading the matching Gutenberg text.

**More linking**: import your MyAnimeList list export (.xml or .xml.gz), matched to AniList series.

**Goals**: a yearly reading challenge with pace tracking, on Home and Stats. Smart collections (favorites, in progress, finished, offline, public domain) alongside your own.

**Reader extras, round 2**: manga night colours (inverted), grayscale and paper modes, a magnifier loupe; book auto-scroll that follows your own measured reading speed, which also drives "time left".

**Where to read**: one search across your shelf, Project Gutenberg, Standard Ebooks, Wikisource, Internet Archive, Google Books, Europeana, DPLA (with a key), LibriVox, AniList official links, Open Library lending, your library card (Libby, Hoopla), your subscriptions and stores, grouped by how you can get each book.

**Subscriptions & accounts**: mark the services you use (VIZ, MANGA Plus, K MANGA, Azuki, Comikey, WEBTOON, Tapas, BOOK☆WALKER, Kindle, Kobo, Play Books, Everand, Libby, Hoopla, Audible, Spotify). They have no public sign-in APIs, so Kitsune deep-links into each one's search. Accounts it can actually read: AniList, MyAnimeList exports, Open Library reading logs, and OPDS servers.

**Google Books & Europeana**: search Google Books (free editions, previews, buy links) and Europeana's openly licensed scans.

**Optional API keys**: Google Books, Europeana and DPLA keys, stored on the device and sent straight from the browser to each service.

**Create**: publish your own comics or writing with your name and a licence (all rights reserved or Creative Commons), packaged as CBZ with ComicInfo.xml or as EPUB 3, shared through the device's share sheet or as a file. Kitsune shows the credit and licence when someone opens it.

**Wikisource**: volunteer-transcribed public-domain texts in 11 languages, including Japanese and Chinese classics; whole works are assembled from their chapter pages.

**More library scans**: the Library of Congress (pre-1931 books with page images) and Open Library (public scans; Kitsune skips borrow-only copies) alongside Internet Archive.

**Library links**: paste a link from Internet Archive, NDL Digital Collections (Japan), the Library of Congress, Gallica, Project Gutenberg, Wikisource or any IIIF manifest, and Kitsune works out how to load it.

**Read free & official**: a directory of legal free manga and webcomic sites (MANGA Plus, VIZ, K MANGA, WEBTOON, Tapas, library apps, public-domain comic archives). Links only.

**Standard Ebooks**: browse and search their carefully typeset public-domain editions. Downloads happen on standardebooks.org (their robots.txt asks automated tools not to fetch them); drop the EPUB into Kitsune to read it.

**Japanese & Chinese**: vertical text (tategaki) that reads right to left, and a furigana on/off switch for EPUBs with ruby.

**Recommendations**: "Because you read…" rows on Home from AniList recommendations and Gutenberg subjects.

**Open with Kitsune**: the installed app opens .cbz, .zip, .epub, .pdf and .txt files from your desktop, and appears in your phone's Share menu for files and links.

**More**: quick actions in ⌘K search, a reading-by-hour chart, a shareable year-in-review image (Wrapped), notes on bookmarks, and audiobook bookmarks that jump back to the exact second.

**Also**: reading stats (streak, daily goal, 30-day chart, year heatmap) and 16 achievements, ⌘K search everything, light/dark/system themes with six accent colors, installable as an app.

**Wikis**: read Wikipedia, Fandom, Miraheze (including Mental Block) or any MediaWiki site inside Kitsune, with search, random article, contents list, clean reading layout and licence credit. Paste any wiki's address to add it, open shared wiki links directly, and save articles to your library to read offline.

**Today on Home**: Wikipedia's featured article, a classic manga and a free book, picked fresh each day.

**Panel studio**: lay out comic pages from your own art with eight panel layouts, speech, thought, caption and sound-effect lettering, then save as an image or publish as a work. Manga scans also get a guided panel-by-panel view (G).

**More imports and reading**: Goodreads and StoryGraph CSV import, "Read as text" for Internet Archive scans, and the Lexend font for easier reading.

**Wiki extras**: a directory of over 60 wikis (Wikimedia projects, manga and anime Fandom wikis, games, film and TV, Miraheze, independent wikis like Bulbapedia and ArchWiki); read any article in another language; browse categories; read aloud; Wikipedia's "In the news", "On this day" and "Most read" on the Wikis page; recently read articles; and a "Fan wiki" button on manga in your library that finds the series' wiki.

**More free sources**: Japan's National Diet Library (classical and pre-1930 Japanese books), The Met and the Cleveland Museum of Art (public-domain illustrated books and prints, every page), eleven Internet Archive shelves (comics, pulp magazines, magazines, newspapers, children's books, fairy tales, genre fiction, Japanese books, sheet music, maps, cookbooks), PoetryDB poems, and the Open Textbook Library.

**Search everywhere** (⌘K, then "Search everywhere"): one search across your library, Project Gutenberg, Standard Ebooks, Wikisource, Internet Archive, classic manga, the National Diet Library, The Met, LibriVox, AniList, Wikipedia, poems and textbooks, with sources that found something listed first.

**Curated shelves** (Discover): twelve themed rows drawn live from the free sources, from Hokusai and pulp sci-fi to fairy-tale color plates, antique cookbooks and old maps.

**Source status** (Link & import → Custom sources): a live check of every built-in source with response times.

**Poem of the day** joins the Today section on Home.

**Your shelf, everywhere** (Link & import): scan the barcodes of the physical books and manga you own with your camera (or type ISBNs) to catalog them, with volumes grouped into series; import Kindle highlights and notes from My Clippings.txt into Notebook; and import your Libby borrowing history from its timeline export (JSON or CSV).

**Kitsune Originals** (Books → Originals & free): stories and manga made for Kitsune and shipped with the app, so they read offline. *Kitsu Delivers, Chapter 1* (a 9-page illustrated manga about a fox courier) four short stories (*The Lantern Courier*, *The Library Under the Lake*, *Nine Umbrellas* and *Page Zero*), and four long stories set in L. Frank Baum's public-domain Land of Oz (*The Color Thief of Oz*, *Madison of Oz*, *The Cephalotus of Oz* and *The Hiccup of Oz, The Glass Cat of Oz, Winter Post (the Lantern Courier sequel)*). Every new library starts with the manga chapter. All originals are released under Creative Commons Attribution 4.0. The manga pages and story covers are drawn by `tools/make-originals.mjs`. Plus six new Oz originals (*The Melody Bank*, *The Fourteenth Color*, *The Royal Weather*, *The Nine Windows*, *The Courthouse*, *The Migrating Meadow*), the Lantern Carnival story, and an original episodic series, *The Bureau of Small Delays* — six time-repair comedies from the clock town of Brask, where a clerk, a kettle and a filing cabinet that files by when handle the valley's lost minutes, surplus Tuesdays and borrowed hours.

**Original series** (Books → Originals & free, hidden on kids profiles): *Blackwood University* (the Horsemen Chronicles pilot, the pilot “One Cupcake”, Episodes 1, 2, 3, 5, 7, 10, 12, 13, 14, 15 and 18, the special “Eleven Seconds”, the Friendship Festival manga chapter, and the spinoff “Madison, Nomad”) *Incarnate: The Corruption Saga* (the prequel *The First War*, Book One, Act One, and the spinoffs *Ember*, *Mind*, *Unsaid*, *Adored*, *Leash*, *Hermitage*, *Hunger*, *Conquest* and *Void*), and *Backrooms: No Wind Resistance* (script draft 4, with its quoted song lyrics left out). Texts are kept word for word; scripts open in a screenplay layout. © their author, all rights reserved. Plus four darker spinoffs: Main Character (Calypso), Vessel (Siren), Relapse (Ena) and Experiment (Eri), then Static (Mark, a screenplay), Chalk (Raven), Plan B (Himo), Remade (Mark in Book One), Main Character: Encore (the Calypso sequel), the Calypso novel Main Character: Uncut, Only Child (Noor), Wall of String (Juniper), Last Rites (Chimera), Mermaid (Hattie), Sorry (Eri), Prophecy (Ena), Leftovers (Calypso), Margin Notes (Himo), Statue (Tim), Last Slice (Calypso), Best Friends (Brad) and Sponsor (Marguerite). Backrooms also has the prequel screenplay Fresh Meat and the spinoffs Base Beta (Hays), Inventory (Duke), Party Favor (Jonah) The Flock (Leo) and Spatial Shift (Mae), plus the next episode, Corbenic (a screenplay), and Sundays (the thing wearing Kevin).

**Free classics shelf**: 45 hand-picked public-domain books from Project Gutenberg on six themed shelves. Add one to read it, or add a whole shelf (or all of them) and keep the text offline.

**Moonwake Bay's east district**: catch 24 species of wandering bugs with four tiers of net, trade them to Marigold at the Butterfly Conservatory, bake timing-window pastries at the Mooncrumb Bakery, teach your critter six tricks at Seashell School, and collect the Gift Wagon's plushies — all of it counted in the Kitsune Museum, the World Codex and the Astral Arena's fifth champion, The Glasswing Sovereign.

**Browser compatibility, second pass**: consent walls and pop-ups swept before a page draws, 1990s markup (font/center/border tables) rendered properly, script-locked accordions opened, charsets from GB2312 to KS C 5601 decoded on the server, raw Markdown links opened as documents, vCard/subtitle/GeoJSON files shown as what they are, and same-app pages (`/compat/…`) openable in the in-app browser for end-to-end testing.

**The Lantern Carnival**: a walkable fairground of show tents and lantern strings — Ring Toss, High Striker, Shooting Gallery, Madam Fortuna's Wheel and a Prize Counter of hats and furniture, all on a daily allowance. The same wave expanded the Deep Mines (Opal, Amber, geodes, Cometfall Hollow), World Events (moth migrations, foxfire storms, lantern regattas), the Detective Agency (three new proven-solvable cases), the Fox Derby (Steeplechase Cup), Night Siege (sappers, wraiths, the Ward Beacon), the Lantern Guild (two expeditions, two perks), Moonwake Bay's Neighbour Board (bug, plushie and fish requests), and the browser's site adapters (Hacker News, BoardGameGeek, TVMaze), feeds (JSON Feed, podcast artwork) and instant answers (Morse, Roman, SHA-256, cron, colours).

## API

| Path | What it does |
| --- | --- |
| `GET /api/health` | Status and features |
| `GET /api/books?search=&topic=&languages=&sort=&author_year_start=&author_year_end=&page=` | Project Gutenberg search |
| `GET /api/books/:id`, `/api/books/:id/text` | Book details, plain text |
| `GET /api/scans?kind=manga\|books\|comics\|pulps\|magazines\|newspapers\|children\|folklore\|genre\|japanese\|music\|maps\|cookery&q=&sort=&page=` | Internet Archive scans published before 1931, by shelf |
| `GET /api/ia/:identifier` | One Internet Archive item and its page-image template |
| `GET /api/museum?src=met\|cma&q=&page=` | Public-domain museum books and prints with all page images |
| `GET /api/ndl?q=&page=` | Public-domain books from Japan's National Diet Library (IIIF) |
| `GET /api/ia/:identifier/text` | The recognized text of a scanned item |
| `GET /api/ia/:identifier/page/:n?w=` | One page image of a freely readable item (for offline saving) |
| `GET /api/books/:id/epub` | Gutenberg's illustrated EPUB edition |
| `GET /api/audio?q=`, `/api/audio/:id` | LibriVox search, audiobook with chapters |
| `GET /api/manga?q=&sort=&genre=&country=&status=&page=` | AniList browse and search |
| `GET /api/manga/:id` | Series details and recommendations |
| `GET /api/anilist/user/:name` | Someone's public AniList manga list |
| `GET /api/loc?q=&page=` | Library of Congress scanned books before 1931 |
| `GET /api/loc/:id` | One LoC item with its page images |
| `GET /api/ol/scan?ids=` | First freely readable Internet Archive copy of an Open Library work |
| `GET /api/standard?q=&sort=popular\|new&page=` | Standard Ebooks catalog search (links only) |
| `GET /api/anilist/mal?ids=` | Match up to 50 MyAnimeList manga ids to AniList series |
| `GET /api/library`, `POST /api/library/rescan`, `GET /api/library/:id/pages/:n` | Library folder (local only) |
| `GET /api/proxy?url=` | Private proxy for OPDS servers without CORS (local only) |

Kitsune doesn't search or download manga from scanlation or piracy sites. It shows what you add, plus public-domain works.
