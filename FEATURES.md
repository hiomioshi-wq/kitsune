# Kitsune: complete feature reference

Live build: kitsune-v292. Game content below is generated directly from the app's data files.

## 1. App shell and navigation

- **Installable PWA** with a web manifest, app icon and service worker that caches the app shell for offline use
- **File handling**: the installed app opens .cbz, .zip, .epub, .pdf and .txt files from the desktop
- **Share target**: appears in the phone Share menu for files and links
- **Sidebar pages**: Home, Library, Discover, Comics, Browser, Feeds, Books, Wikis, Visual novels, Story games, Winterfest, Kitsune World, Fox Shrine, Originals wiki, Where to read, Link & import, Create, Ask AI, Notebook, Stats, Library tools, Den, Atlas, Settings
- **Phone tab bar**: Home, Library, Discover, Books, Link
- **Global number keys**: 1–5 open Home, Library, Discover, Books and Link. 6 and 7 open Den and Atlas. ? opens help
- **Search everything** with ⌘K, Ctrl+K or /: library, pages, quick actions and a jump to Search everywhere
- **First-run welcome** in three short steps
- **Now reading pill**: floating shortcut to your latest unfinished book from any page
- **Focus timer**: small countdown that stays visible across every view and reader
- **Reading reminders**: creates a calendar event that works while Kitsune is closed, plus a gentle nudge while it is open

### Profiles, privacy and data

- **Profiles**: several people on one device, each with their own library, progress, notes and settings
- **Kids profiles**: hide Discover, manga browsing, Ask AI, Feeds and the mature realms and series
- **Parent PIN**: optional PIN required to leave a kids profile
- **Incognito reading**: nothing you open is recorded
- **App lock**: PIN screen that keeps casual eyes out. It does not encrypt browser storage
- **Local-first storage**: library, files, progress and settings live in IndexedDB on the device
- **Sync without an account**: a sync file in iCloud Drive, Dropbox, OneDrive or Google Drive, or a pasted sync code
- **Sync merge rules**: newest reading position wins, highlights and bookmarks combine, reading days keep the larger count, deletions are remembered so they do not come back
- **Synced data**: progress, bookmarks, highlights, stats, vocabulary, reading speed, Den fur, series preferences, queue, wishlist, page notes, page dwell, journal, loans, smart shelves, reading plans, cast notes, gamebooks, visual novel saves, fortune, title clash, first lines, bingo, World, Winterfest and Foxhold
- **Backup and restore** as a .zip, with or without the files
- **Storage on this device** report and full Kitsune reset

### Appearance, accessibility and sound

- **Themes**: light, dark, system, dark at night, accent colors
- **Theme studio**: pick or build a theme, choose a cursor, share themes as codes
- **Cursor collection**: original cursors by group, search, favorites, size control and a separate link cursor
- **Cursor effects**: mouse trails and click bursts
- **Wallpapers**: quiet patterns drawn in the current theme's colors
- **Typography**: interface font, text size and your own uploaded reading font
- **Accessibility**: motion control, strong focus outlines, underlined links, Atkinson Hyperlegible, Lexend and OpenDyslexic
- **Sound effects**: synthesized interface sound packs with a choice of what makes a sound. Off by default
- **Soundscapes**: live-generated Rain, Fire, Waves, Night and Deep, working offline

## 2. Library


### Adding things

- **Local files**: CBZ, ZIP, PDF, EPUB (comic or prose), TXT, loose images and whole folders, never uploaded
- **Linked pages**: numbered image ranges such as `{001..196}`
- **IIIF manifests** from libraries and museums
- **Internet Archive items** by link
- **OPDS servers** with page streaming (OPDS-PSE): Komga, Kavita, Calibre-Web, Ubooquity
- **Server library**: `node server.js --library ~/Manga` serves a local manga folder
- **Smart paste**: links from Internet Archive, NDL Digital Collections, Library of Congress, Gallica, Project Gutenberg, Wikisource or any IIIF manifest are recognized
- **Duplicate protection** on import

### Organizing

- Reading statuses, star ratings, notes, tags and collections
- Smart collections: favorites, in progress, finished, offline, public domain
- Bulk edit, filters and sorting
- Series grouping with owned-volume view and records of print, Kindle, BOOK☆WALKER and other copies
- AniList series linking for covers, synopsis and official store links
- Set any page as the cover
- Wishlist of series to buy
- Up Next reorderable queue, shown on Home
- 3D cover flow view
- Shareable reading lists stored entirely inside a link
- Save streamed volumes, archive.org scans and server-folder volumes offline page by page
- Fan wiki button that finds a manga's wiki

### Importing and tracking

- AniList public list
- MyAnimeList export (.xml, .xml.gz) matched to AniList
- Goodreads and StoryGraph CSV
- Kindle My Clippings.txt highlights and notes
- Libby timeline export (JSON or CSV)
- Open Library reading logs
- Camera barcode scanner or typed ISBNs for physical books, grouped into series
- Trackers: link series to MyAnimeList, Kitsu and MangaUpdates, compare scores, export in MyAnimeList format

### Library tools

- **Pick for me**
- **Almost done**: titles nearest to finished
- **Gone quiet**: titles you stopped reading
- **Up next**
- **Reading plan**: daily plan with a Home card
- **Series gaps**: missing volumes
- **Duplicates**
- **Tidy up**
- **Bulk tags** and **Tag manager**
- **All my notes**
- **Resurface**: old highlights return a few at a time
- **Top shelf**
- **Backlog maths**: how long your unread pile will take
- **Library report**
- **Export**
- **Reading bingo**
- **Reading journal**
- **Lending log**
- **Smart shelves**
- **Release radar**
- **Series progress**
- **Cast notebook**: your own who's-who per series
- **Reading timeline**
- **For you**

## 3. Manga and comic reader

- **Layouts**: single, two-page spread with offset, smart spreads that keep double-page art whole, long strip/webtoon
- **Direction**: right-to-left or left-to-right per volume
- **Fit**: screen height, width, original, cycled with W
- **Page turns**: instant, fade, curl and page-edge tap zones
- **Viewing**: zoom (Z, + and −), pan, rotate (E), magnifier loupe (M), full screen (F)
- **Color**: brightness, warmth, night invert (N), grayscale, paper mode
- **Guided view (G)**: panel by panel
- **Navigation**: slider with preview, bookmark marks, all pages (T), all volumes (V), contact sheet (X), go to page (J), first/last (Home/End), previous/next volume ([ ]), next-volume handoff, random read page (R)
- **Auto modes**: auto-scroll (A) with speed control, hands-free auto-turn, sleep timer (S), auto-hide controls (H)
- **Saving**: bookmark (B), save page (D), save spread (Y), clip a panel (C) to save, copy or share
- **Notes**: page notes (K), notes and bookmarks list (L), pages you lingered on (P), rating and short review
- **Stats**: your pace (I), goal for this sitting (U)
- **Page text (O)**: on-device Tesseract OCR reads bubbles and captions, overlays selectable text, translates in place, enables comic search and feeds vocabulary
- **Touch**: swipe, tap, long-press menu
- **Quick menu (/)** and welcome-back note
- **Cast notebook (Q)**

## 4. Book reader

- **Layouts**: scroll or page turn, justified or left aligned
- **Themes**: Paper, Sepia, Matcha, Night, Ink
- **Fonts**: Literata, Shippori Mincho, Atkinson Hyperlegible, Lexend, OpenDyslexic, sans, your own
- **Controls**: text size (+ −), spacing and width
- **Navigation**: contents (T), chapter map (V), search (/), go to percentage (G), position slider with preview and marks
- **Marking**: bookmarks (B), four highlight colors, notes, highlights sheet (H), quote-card images (Q)
- **Read aloud (R)** with each word lighting up
- **Audiobook pairing (K)**: play or pause a matching LibriVox book
- **Auto-scroll (A)** at your measured reading speed, with [ ] speed keys and time left
- **Reading ruler (L)**, soundscape toggle (M), settings (S), about this book (W), quick menu (K)
- **X-Ray (X)**: people and places found on the device, spoiler-safe by default
- **Lookup (D)**: Wiktionary, Free Dictionary and Wikipedia
- **Translate** any selection through MyMemory
- **Language study**: save words with their sentence, spaced-repetition flashcards (1 Didn't know, 2 Knew it, Space shows meaning), Anki CSV export
- **Japanese and Chinese**: vertical tategaki reading and furigana on/off
- **Illustrated editions**: switch Gutenberg between pictures and plain text without losing your place
- **Read as text** for Internet Archive scans

## 5. Audiobooks

- LibriVox search and persistent player while browsing
- Chapters, speed control, ±15 and ±30 second skips
- Sleep timer, lock-screen controls and resume
- Bookmarks that jump to the exact second
- Read along with matching Gutenberg text

## 6. Discover, Books and free sources

- **AniList Discover**: trending, popular, top rated, newest, filters for genre, origin and status, series pages and recommendations
- **Project Gutenberg**: 14 languages, topics and author eras
- **Standard Ebooks**: browse and search, downloads on their site
- **Wikisource**: 11 languages with whole works assembled from chapters
- **Internet Archive shelves**: comics, pulps, magazines, newspapers, children's books, fairy tales, genre fiction, Japanese books, sheet music, maps, cookbooks
- **Library of Congress** pre-1931 books with page images
- **Open Library** public scans, skipping borrow-only copies
- **Google Books**: free editions, previews and buy links
- **Europeana**, **DPLA** with a key
- **National Diet Library** classical and pre-1930 Japanese books
- **The Met** and **Cleveland Museum of Art** public-domain books and prints
- **PoetryDB** poems and **Open Textbook Library**
- **Classic manga**: Hokusai's sketchbooks and Edo-period picture books
- **Free classics shelf**: 45 hand-picked books on six shelves
- **Curated shelves**: twelve themed Discover rows
- **Today on Home**: featured Wikipedia article, classic manga, free book and poem
- **Where to read**: one search grouped by how you can get each book, across free sources, library cards (Libby, Hoopla), subscriptions and stores
- **Search everywhere**: one query across the library and all free sources
- **Read free and official**: directory of legal free manga and webcomic sites
- **Subscription deep links**: VIZ, MANGA Plus, K MANGA, Azuki, Comikey, WEBTOON, Tapas, BOOK☆WALKER, Kindle, Kobo, Play Books, Everand, Libby, Hoopla, Audible, Spotify
- **Custom sources**: describe a source once, no code runs, then browse it
- **Source status**: live check with response times
- **Optional API keys**: Google Books, Europeana and DPLA, stored on the device

## 7. Comics, Feeds and Wikis

- **Comics**: webcomics from artists' feeds, the whole xkcd archive with hover text, Pepper&Carrot in 70+ languages, favorite strips, strip reader
- **Feeds**: RSS, Atom and JSON Feed, folders, unread, starred, OPML import/export, full-article loading, read-aloud, sidebar unread badge, quiet background refresh
- **Wikis**: Wikipedia, Wikibooks, Fandom, Miraheze including Mental Block, or any MediaWiki address
- **Wiki reading**: search, random article, contents, clean layout, license credit, language switching, categories, read aloud, recently read, offline save
- **Wiki directory**: 60+ wikis across Wikimedia, manga, anime, games, film, TV and independent sites
- **Wikipedia home**: In the news, On this day and Most read

## 8. Kitsune Browser


### Tabs and sessions

- Tab switcher
- tab overview cards
- vertical tabs
- hover previews
- colors
- rename
- duplicate
- move
- group by site
- close other/right/duplicate/colored tabs
- recently closed (⌘⇧T)
- history of a tab
- earlier sets of tabs
- saved sessions
- reload all
- copy all tab links
- tabs as Markdown
- reuse a tab that already has the page

### Address bar and navigation

- Commands with >
- search shortcuts
- default search engine (Brave
- Bing
- DuckDuckGo
- Mojeek
- Qwant
- Baidu
- Naver
- Seznam
- Sogou
- Yahoo! JAPAN
- Wikipedia and Wiktionary variants)
- paste and go
- open several links
- open clipboard links
- voice search and spoken commands
- swipe back/forward
- pull to reload
- next/previous page keys
- load next pages onto this one
- heading keys
- page outline
- sentence links (#:~:text=)

### Instant answers

- Weather
- local time
- currency conversion
- dice
- coin
- random number
- UUID
- today's date
- days until a date

### Reading comfort

- Reader appearance
- bigger/smaller text
- text-only mode
- focus mode
- paragraph focus
- speed reader
- bilingual paragraphs
- translate page
- spoiler and word filter
- night light
- page color filters
- reading ruler
- easy-reading spacing
- emphasized links
- footnote pop-ups
- minutes left
- back to top
- full screen
- touch-friendly targets
- reduced motion
- break reminder
- battery saver

### Saving

- Bookmarks with tags
- HTML/CSV/Markdown bookmark import and export
- duplicate bookmark cleanup
- read later
- offline pages
- page cache
- pin to start page
- start-page shortcuts
- continue reading
- save as file
- print/PDF
- save to library
- make a book from a reading list
- Wayback archive
- older versions
- compare with saved copy
- watch a page for changes

### Annotation and study

- Highlights
- marginalia
- sticky notes
- page notes
- marked places
- scratchpad
- snippets
- fill-in-the-blank flashcards
- Anki export
- highlight resurfacing on the start page

### Page intelligence

- Page statistics
- most-used words
- every match with context
- regex find
- word highlighter
- links list
- emails/phones/prices/dates finder
- tables to CSV or Markdown
- citations in APA
- MLA
- Chicago and BibTeX
- quick summary without AI
- Ask AI about page
- publication age
- About this site (Wikidata
- Wikipedia
- RDAP)
- related pages
- fact-check links
- price/temperature/measure conversion

### Structured page views

- Just the recipe with servings scaler and timers
- events to calendar (.ics or Google)
- products
- FAQs
- how-to checklists
- job postings
- places with hours and map
- books with free or library copies

### Media

- Video
- music
- map and post embeds with privacy-friendly players
- floating mini player
- picture-in-picture
- video speed
- image viewer
- picture gallery
- picture magnifier
- reverse image search on TinEye
- download all pictures as ZIP
- text in pictures by OCR
- listening queue
- playback speed

### Comics and ebooks on the web

- Read a page's pictures as a comic
- save them to the library or as CBZ
- add a page's ebook
- add all linked ebooks
- find manga or anime on AniList

### Sharing

- Copy link
- Markdown link
- rich link
- selection as a sourced quote
- QR code
- scan QR or barcode
- email
- Bluesky
- Mastodon
- Threads
- Reddit
- Hacker News
- LinkedIn
- WhatsApp
- Telegram

### Developer tools

- Requests and errors panel
- page source with colors and line numbers
- syntax-highlighted code blocks with copy
- JavaScript sandbox
- regex tester
- text diff
- compare two tabs
- Markdown preview
- JWT/URL/Base64/timestamp decoder
- copy as curl or fetch
- tech detection
- link-preview metadata
- broken link checker
- page weight
- accessibility check
- contrast checker
- eyedropper
- sitemap and robots.txt browsing
- text toolbox
- unit converter
- date tools
- stopwatch
- password generator

### Extending the browser

- Greasemonkey/Tampermonkey-format userscripts in a sealed sandbox
- user styles
- extensions import/export
- daemons that watch pages and feeds or run sandboxed scripts

### Compatibility and rescue

- Live mode sandbox
- Try another way
- layout repair
- styles on/off
- reveal hidden content
- element zapper
- lazy-image fixes
- canonical and AMP links
- RSS/Atom/OPML/sitemap views
- CSV/TSV tables
- calendar lists
- oEmbed
- WordPress
- MediaWiki
- PeerTube
- Lemmy
- Gitea/Forgejo
- GitLab
- Shopify
- Blogger
- Ghost
- Substack and Medium through public interfaces
- progressive rendering for huge pages
- compatibility report
- blocked sites
- cookies and site data
- per-site settings

### Site adapters

- Stack Overflow
- npm
- Internet Archive
- GitHub and gists
- Discourse
- Google Docs/Sheets/Slides
- Mastodon
- Telegram
- YouTube channels and playlists
- Flickr
- Fandom
- Wikimedia
- AniList
- IMDb
- Substack
- Tumblr
- Apple Podcasts
- Google News
- MangaUpdates
- Bangumi
- Shikimori
- pixiv
- Lemmy
- Misskey
- Telegraph
- PeerTube
- Dailymotion
- Deezer
- Mixcloud
- Apple Music
- bioRxiv
- medRxiv
- ORCID
- Zenodo
- crates.io
- Bitbucket
- Lichess
- Chess.com
- Scratch
- Discogs
- Sefaria
- OpenStreetMap
- Pinterest
- Open Library
- Modrinth

### The second compatibility pass (v142)

- Consent walls, cookie banners (OneTrust, Cookiebot, Osano, CookieScript, IAB CMP and ~40 more patterns), newsletter pop-ups, exit-intent boxes and age gates are removed before any view draws the page, in reader and page mode alike
- Pop-up overlays styled inline (`position:fixed` covering the viewport, high z-index, dialog shrouds) are swept away unless they hold the page's own article
- Scroll locks (`body[style*=overflow:hidden]`) and frozen scroll-reveal animations (inline `opacity:0` / `visibility:hidden` on reveal classes) are undone
- Accordions and tabs that never opened because their script didn't run: `<details>` are opened, and hidden panels with real text are shown
- 1990s/2000s pages render properly: `<font color/size/face>`, `<center>`, `bgcolor`/`text`/`link` body colours, `border`/`cellpadding`/`cellspacing`/`background` tables, `<marquee>` as a calm block, `img border/align/hspace/vspace`, `<hr size/color/noshade>`
- Charset engine on the server: WHATWG label aliases (GB2312→GBK, KS C 5601→EUC-KR, 31J→Shift_JIS, TIS-620, KOI8-R, MacRoman and more), a 64 KB window for `<meta charset>` deep in heavy heads, and a safe fallback chain (declared → windows-1252 → latin-1)
- Regression suite in `public/compat/`: nine new pages plus an index (`index.html`) covering consent walls, 1997 pages, accordions, `<picture>`/srcset/placeholders, structured tables, ruby, scriptless forms and `<base>`; GB2312-encoded `gbk.html` joins `sjis.html`
- Raw Markdown on the web (`.md` and `.markdown` links — READMEs, changelogs, author notes) opens as the formatted document it is: headings, quotes, fenced code and lists styled, relative links and images resolved against the page's own address, and a Raw button for the source (`readme.md` in the compat suite)
- Plain-text files that are really something else open as that something: **vCard contacts** as a readable list with working mail/tel/site links, **`.srt`/`.vtt` subtitles** as a timed transcript, and **GeoJSON** as a list of places with OpenStreetMap links; the local server labels all of them with their real content types
- Same-app pages (paths like `/compat/rem.html`, and anything else Kitsune itself serves) open inside the Kitsune browser instead of being sent to a search engine — fetched directly, so the private-network guard never gets in the way, and the whole compatibility suite can be exercised end to end on the device

## 9. Create and AI

- **Publish works** with your name and all-rights-reserved or Creative Commons license, packaged as CBZ with ComicInfo.xml or EPUB 3, shared by file or share sheet
- **Panel studio**: eight layouts, speech, thought, caption and sound-effect lettering, image save or publish
- **Ink studio**: pressure brushes with taper and stabilizer, layers with blend modes, flood fill under line art, screentones, focus and speed lines, symmetry, undo, self-saving drafts
- **Writing studio**: reorderable chapters, outline corkboard, story bible, word goals, sprints, chapter snapshots, one-tap publishing and EPUB export
- **Ask AI**: Pollinations, Puter, on-device WebGPU model or Chrome's built-in model, nothing sent until you choose an engine
- **Imagine**: picture generation through Pollinations

## 10. Stats, Notebook and playful reading

- **Stats**: streak, daily goal, 30-day chart, year heatmap, reading-by-hour, yearly challenge with pace tracking, 16 achievements, 1080×1350 share image
- **Kitsune Wrapped**: full-screen year-in-review slides with tap, hold, keyboard and shareable image
- **Notebook**: every highlight, note and bookmark, search, color and title filters, Markdown export
- **Den**: reading grows a fox, each level adds a tail up to nine, daily quests, unlockable coats
- **Atlas**: library as a night sky, titles as stars, series and authors as constellations, gold finished stars, pan, pinch, zoom and fly-to search
- **Fox Shrine**: Night Sky, Daily fortune, Blind date, Title clash and First lines

## 11. Kitsune Originals

102 built-in entries, readable offline.
- Kitsu Delivers · Ch. 1: The Letter With No Name
- Kitsu Delivers · Ch. 2: The Reply
- Kitsu Delivers · Ch. 3: The Night Market
- The Last Sleigh to Hollow Pine
- The Tea Shop at the End of the Line
- Moth Radio
- The Snow Postman
- The Clockmaker's Apprentice
- The Lantern Courier
- Winter Post
- The Library Under the Lake
- Nine Umbrellas
- The Color Thief of Oz
- Madison of Oz
- The Cephalotus of Oz
- The Hiccup of Oz
- The Glass Cat of Oz
- The Night Market Bookbinder
- The Sleeper Train to Tsukimi
- The Weather Cartographer
- Page Zero
- Blackwood University
- Horsemen Chronicles · Episode One: Have It Your Way
- Horsemen Chronicles · Episode Two: Pay Your Respects
- Horsemen Chronicles · Episode Three: The Seventh Floor Is Not a Floor
- Horsemen Chronicles · Episode Four: Everybody Gets a Body Bag
- Horsemen Chronicles · Episode Five: Dead Air
- One Cupcake
- Welcome to Blackwood
- The Friendship Festival
- Soul Possession
- Canon Event
- Vote Bestie
- Seconds
- Do Not Reply All
- Finders Keepers
- Still Accredited
- Give Me a Fucking L
- Hot Girl Hazard
- Eleven Seconds
- Kevin in Space
- Last Stop Rewrite
- Arrest the Survivors
- One Star
- Answer in Pen
- Your Best Years Are Nonrefundable
- Out of Office
- What Do You Want (non-canon)
- A Chair for You
- The Hundred and Forty-Four
- The Outside
- Madison, Nomad
- Kevin Slides · Episode One: Return to Sender
- Kevin Slides · Episode Two: The Dead Letter Office
- Kevin Slides · Episode Three: Hell’s Peak Estates
- Sasha: Fine Print
- Lux & Velvette: Nine Courses
- Kevin Slides · Episode Four: Forwarding Address
- Incarnate · The Corruption Saga
- Incarnate: The First War
- Incarnate: Book One, Act One
- Incarnate: Ember
- Incarnate: Mind
- Incarnate: Unsaid
- Incarnate: Adored
- Incarnate: Leash
- Incarnate: Hermitage
- Incarnate: Hunger
- Incarnate: Conquest
- Incarnate: Void
- Incarnate: Main Character
- Incarnate: Vessel
- Incarnate: Relapse
- Incarnate: Experiment
- Incarnate: Static
- Incarnate: Chalk
- Incarnate: Plan B
- Incarnate: Remade
- Incarnate: Main Character, Encore
- Incarnate: Main Character, Uncut
- Incarnate: Only Child
- Incarnate: Wall of String
- Incarnate: Last Rites
- Incarnate: Mermaid
- Incarnate: Best Friends
- Incarnate: Sponsor
- Incarnate: Sorry
- Incarnate: Prophecy
- Incarnate: Leftovers
- Incarnate: Margin Notes
- Incarnate: Statue
- Incarnate: Last Slice
- Backrooms: No Wind Resistance
- No Wind Resistance
- Fresh Meat
- Base Beta
- Inventory
- Party Favor
- The Flock
- Spatial Shift
- Corbenic
- Sundays

### Interactive originals

- **Visual novels** for every story: code-drawn backgrounds and portraits, chapters, speaker detection, branching choices, saves, backlog, auto-play, skip, voice and chapter select
- **Story games**: The Midwinter Parcel and The Thirteenth Letter, with saved choices, inventory and endings
- **Originals wiki**: articles, appearances and line counts across the original series

## 12. Winterfest

- Full event page with Snowbells currency, seasonal unlock from Nov 15, daily gift, 25-door advent calendar, daily quests, season goals, Wishing Well with 1× and 10× wishes, shop, tree decorating, Snow Catch, pet hatching, feeding, patting and levels

### Winter pets

- **Snow Kit** (Common)
- **Frost Bunny** (Common)
- **Waddle** (Common)
- **Pip the Robin** (Common)
- **Little Ermine** (Common)
- **Bramble Fawn** (Rare)
- **Polar Cub** (Rare)
- **Hush Owl** (Rare)
- **Ginger Biscuit** (Rare)
- **Baby Yeti** (Epic)
- **Crumb** (Epic)
- **Ice Dragonling** (Epic)
- **Star Spirit** (Legendary)
- **Midwinter Kitsune** (Legendary)

### Treats

- **Sugar cookie**
- **Hot cocoa**
- **Candy cane**
- **Midwinter feast**

### Shop catalog

- **Common egg**
- **Rare egg**
- **Epic egg**
- **Silent Night theme**
- **Candy Cane theme**
- **Evergreen theme**
- **Aurora theme**
- **Candy cane cursor**
- **Holly cursor**
- **Present cursor**
- **Mitten cursor**
- **Sleigh bell cursor**
- **Gingerbread cursor**
- **Tree star cursor**
- **Snowflake wallpaper**
- **Holly wallpaper**
- **Pine forest wallpaper**
- **Sleigh bells sounds**
- **Music box sounds**
- **Santa hat (World)**
- **Reindeer antlers (World)**
- **Earmuffs (World)**
- **Holly crown (World)**
- **Tiny fir tree (house)**
- **Snowman (house)**
- **Stocking (house)**
- **Pile of presents (house)**

### Ornaments

- **Red bauble**
- **Gold bauble**
- **Ice bauble**
- **Green bauble**
- **Plum bauble**
- **Silver bauble**
- **Sugar bauble**
- **Fox bauble**

### Daily quest pool

- Read 20 pages
- Read for 10 minutes
- Make a wish at the Wishing Well
- Feed your pet
- Pet your pet 3 times
- Play a round of Snow Catch
- Visit Kitsune World
- Catch a fish in Kitsune World
- Find a present in Kitsune World
- Open a visual novel
- Open a story game
- Visit the Fox Shrine
- Visit your Den
- Browse your library
- Open the browser
- Check your reading stats
- Hang an ornament on your tree
- Play an Arcade game
- Deliver a toy order
- Hit a resident with a snowball
- Build a snowman in Kitsune World
- Craft something in the Workshop
- Start a Frostbound run

### Season goals

- Read 500 pages this Winterfest (500)
- Read for 5 hours (300)
- Finish 3 titles (3)
- Open 12 advent doors (12)
- Open all 25 advent doors (25)
- Make 50 wishes (50)
- Hatch 3 pets (3)
- Collect all 14 pets (14)
- Raise a pet to level 12 (12)
- Find all 25 World presents (25)
- Catch 20 fish in Kitsune World (20)
- Fill your tree with 24 ornaments (24)
- Play Snow Catch 15 times (15)
- Finish 30 daily quests (30)
- Play 40 Arcade games (40)
- Deliver 25 toy orders (25)
- Craft 40 things in the Workshop (40)
- Land 50 snowballs (50)
- Build 12 snowmen (12)
- Start 10 Frostbound runs (10)
- Beat the Long Night (1)

### Arcade games, each with its own page and scoreboard

- Sled Run
- Snowball Showdown
- Carol Hero
- Chimney Drop
- Frozen Lake Skate
- Tree Stacker
- Wrapping Rush
- Ornament Match
- Cookie Copy
- Carol Scramble

### Workshop and Winter Pass

- Five materials: Pine wood, Ribbon, Brass gears, Stardust, Frost shards
- Toy crafting and daily toy orders
- 40-tier Winter Pass
- Toy: Toy sled
- Toy: Spinning top
- Toy: Rag doll
- Toy: Clockwork train
- Toy: Clockwork robin
- Toy: Snow globe
- Toy: Winter kite
- Toy: Paper fox lantern
- Toy: Music box
- Toy: Nine-tailed plushie

### Frostbound

- Roguelike campaign for Winterfest pets with loaner pets, a run that saves after every move, enrage after round 9

## 13. Kitsune World: the overworld

- 240×180 tile walkable map with keyboard, touch joystick, Shift sprint, ride cart, minimap, big map, day/night, snow and rain, region banners
- Controls: J journal, M map, B bag, E interact, R ride, G dig, C cards, V Derby, H Siege, N Seas, Y Bay, K Activities, L World Events, T snowball, P snowman, X Winterfest

### Regions

- Hollow Pine
- Saltwick Shore
- The Drowned Reservoir
- The High Post
- Brask
- The Night Market
- Platform Zero
- The Land of Oz
- The Whiteback Range
- Bamboo Hollow
- The Sakura Terraces
- The Sunfall Dunes
- Mirewater
- The Ember Caldera
- The Cloudmere Isles
- The Old Capital

### Buildings

- Your house
- The Great Shelf
- Foxfire Goods
- The Lantern Shrine
- The Tea Shop
- Moth Radio
- The High Post Office
- The Great Clock
- Tamba's Umbrellas
- The Bookbinder
- Platform Zero
- The Weather Office
- Haru's Studio
- The Emerald Palace
- The Wizard's Glasshouse
- The Library Under the Lake
- Whiteback Lodge
- The Bamboo Dojo
- The Petal Teahouse
- Caravanserai
- The Stilt Inn
- The Caldera Forge
- Cloudmere Light
- The Drowned Archive

### Residents

- **Kitsu** (duel signature: Reveal: draw a card. The post gets through.)
- **Ponzu** (duel signature: Reveal: a card in hand gets +3. It's steeped too long.)
- **Wren** (duel signature: +3 if played in round 5 or 6. It's nearly two.)
- **Fennick** (duel signature: Reveal: walks to your weakest other lantern.)
- **Tibb** (duel signature: Gains +1 each round, three seconds late.)
- **Mina** (duel signature: Reveal: draw a card. It's only twenty years overdue.)
- **The Librarian** (duel signature: Reveal: enemy cards here get -2. There is a fine.)
- **Tamba** (duel signature: Reveal: an umbrella opens at each other lantern.)
- **Pell** (duel signature: Your other cards here have +1. She mends things.)
- **Haru** (duel signature: Reveal: +2 energy next round. No tickets.)
- **Odo** (duel signature: Reveal: enemy cards here get -1. A cold front.)
- **Wren of Saltwick** (duel signature: Reveal: draw a card. She notices things.)
- **Haru the artist** (duel signature: Reveal: gains the power of your strongest card here.)
- **Bungle** (duel signature: -3 if there's an enemy card here. Careful, it's glass.)
- **Scraps** (duel signature: +2 for each other card of yours here.)
- **Tam** (duel signature: Reveal: a card in hand gets +2. He carries the eggs.)
- **Wren Tallowmere** (duel signature: Reveal: your other cards here get +1.)
- **Cephalotus** (duel signature: Reveal: eats your weakest other card here and gains its power +3.)
- **Billina** (duel signature: +3 while alone here. She has opinions.)
- **Madison** (duel signature: Reveal: takes 2 power from the strongest enemy card here.)
- **Glinda** (duel signature: Your other cards here have +2.)
- **Sorrel the Guide** (duel signature: Reveal: leads the way to your weakest other lantern.)
- **Old Bram** (duel signature: Costs you 2 energy next round. He'll get there.)
- **Sensei Kuro** (duel signature: Reveal: all enemy cards get -1.)
- **Mei** (duel signature: Gains +1 each round. She can hear it growing.)
- **Hana** (duel signature: Reveal: your other cards here get +2.)
- **Ren the Poet** (duel signature: +9 if played in round 5 or 6. He's been saving it.)
- **Zaira of the Caravan** (duel signature: Reveal: +2 energy next round. Water is money.)
- **Tumble the Scout** (duel signature: Reveal: scouts your weakest other lantern.)
- **Auntie Moss** (duel signature: Reveal: enemy cards here get -2. Mind the plank.)
- **Fen the Ferryman** (duel signature: +4 while alone here.)
- **Ignis the Smith** (duel signature: Reveal: enemy cards here get -2.)
- **Little Cinder** (duel signature: Loses 1 power at the end of each round.)
- **Marin the Keeper** (duel signature: Reveal: draw two cards. She leaves the light on.)
- **Captain Gull** (duel signature: -2 if there's an enemy card here. No ship.)
- **Archivist Vesper** (duel signature: Reveal: your other cards here get +2. Filed.)
- **The Last Emperor's Cat** (duel signature: Reveal: all enemy cards get -2. It wants fish.)

### Main quests

- Relight the Nine Lanterns: Hollow Pine, Saltwick Shore, Brask, The Reservoir, The High Post, The Night Market, Platform Zero, The Emerald City, then The Lantern Shrine
- 8 mail deliveries
- Far Beacon, **Whiteback**: The beacon up here went dark the same night the Nine did. It burns on snowcap oil. Three flowers, and don't pick the ones the goats are looking at.
- Far Beacon, **Bamboo Hollow**: A beacon is lit with patience and three bamboo shoots. I have the patience.
- Far Beacon, **The Terraces**: Ours is lit with three fresh petals, every year, before they fall. This year nobody remembered. Would you?
- Far Beacon, **Sunfall**: Three dates for the beacon-tender's shrine. It's tradition. Also the tender's hungry and he's been dead for a while.
- Far Beacon, **Mirewater**: Beacon's wick has rotted. Frogbell reed makes a good wick. Three should do. Mind the third plank.
- Far Beacon, **The Caldera**: The beacon's bowl cracked. Bring me three pieces of obsidian and I'll cast a new one.
- Far Beacon, **Cloudmere**: The big lens has three panes missing. Sea glass will do it, if you find the right blue.
- Far Beacon, **The Old Capital**: By statute the capital's beacon may only be relit on payment of three imperial coins. I don't make the rules. They're just filed here.

### Side quests

- **The Other Boot**: Somebody left a right boot on the little train in 1974. It's on my shelf. It's lonely. There's a left boot in the water somewhere, there always is. Fish it out?
- **Dead Air**: The Belgian part's gone. Don't ask what it did. Tibb in Brask might have something that ticks in the right key.
- **Grossly Overdue**: One of our fish has been checked out since 1971. A pike. It's in the reservoir, refusing to return itself. Mina saw it last.
- **The Seventh Umbrella**: The seventh umbrella has a tear in it and it keeps opening indoors. Bring three lengths of umbrella silk from the market to Pell, and she can stitch it.
- **A Front Moving East**: There's a fog on my chart that isn't in any of my other charts. It's sitting over the Whiteback. I'm too old for mountains. Go and look at it, and ask Sorrel what it's doing.
- **A Letter for the Postman**: I've got one for old Bram up at the Whiteback Lodge. Thirty years I've been meaning to walk it up. My knees say no. Would you?
- **My Good Side**: Observe my magnificent glass. Now do not observe that crack. I require two pieces of sea glass from the Cloudmere Isles to have it, ahem, enhanced.
- **Patch and Stitch**: I've got a hole in my middle and it's making me whistle! Four patchwork scraps ought to do it! Ooh, and don't pick the plaid, I'm saving the plaid!
- **Eggs Have Opinions**: Tam dropped a dozen of my eggs because a butterfly surprised him. I want that butterfly and all its relatives caught and spoken to. Three should send a message.
- **A Polite Appetite**: I am small and I am so hungry and I'm trying very hard. Could you bring me some of those little fluttering things? Five. I'll be polite about it. I'll say grace.
- **Remember When**: Remember when I saved your life? No? Give me a second. Actually, here's a thing: Glinda's been writing about me in the Great Book. I'd love to know what it says. For fun.
- **One True Story**: No tickets on the half-moon train. You pay with one true story. Go and dig something up. Literally, if you like. Bring back what you find and tell me about it.
- **Goat Trouble**: The goats have got into the lodge wool again and now we're three blankets short before the cold snap. Three bundles of mountain wool, and don't make eye contact.
- **Sweep the Yard**: You wish to learn? Sweep the yard. No, the other yard. It is all of Bamboo Hollow. Gather ten things that don't belong to it.
- **The Lunch Thief**: A panda has stolen my lunch every day for a month. I respect it. I'd like to stop feeding it. If I had a couple of reed shiners, I could lure it off the path.
- **Nine Days**: The blossoms last nine days, and Ren has been promising me a poem about them for eleven years. Bring him five fresh petals. Maybe that will do it.
- **Something Worth Rhyming**: I can't write another word about this terrace. Go somewhere I've never been and tell me what it's like. The desert. Then the sea.
- **Never Buy That Camel**: I bought a camel that was making eye contact. It ate my map to the old wells. You've got a nose for buried things. Dig me up two caches and I'll stop crying about it.
- **The Edge of the Dunes**: There's a market under the sand. I heard it once, at night, people haggling. Nobody believes me. Go down the Buried Bazaar and see who's still collecting rent.
- **Mind the Third Plank**: I've told every guest for forty years to mind the third plank. It's time someone found out why. Down the Drowned Stairs with you, dear.
- **What's Under the Boat**: Everyone wants to cross and nobody asks. There's a thing that's been bumping my hull. I want it gone before someone checks how deep it is.
- **The Big Hammer**: I'm allowed to use the big hammer if someone proves it's safe. Ignis says nobody can. Would you do a proper strike at the forge so he has to admit it?
- **The First Ship**: If the light's going to bring anyone, there ought to be someone on the dock who remembers how to tie up a ship. Ask Captain Gull. Try to get him to stop talking.
- **These Islands Move**: These islands move when you're not looking! I've got charts! Catch me a cloud ray and I'll prove it, they only swim where the isles were yesterday.
- **Filed Under Fox**: I've found a file with your name on it, which is odd, as this archive closed nine hundred years ago. To open it, the statute requires three imperial coins and the Cat's approval.
- **It Wants Fish**: The Last Emperor's Cat sits on your foot. It has outlived a dynasty. It would like an Imperial carp, which no one has caught in living memory, and it isn't going to say please.

### Bounties

- **Bramblemaw** (level 1): A boar made mostly of grudge. It's been eating Hollow Pine's fences.
- **Sootwing** (level 2): Something black and fast has been nesting in the clock oil.
- **The Sideways King** (level 3): A crab the size of a cart, and it will not be reasoned with.
- **The Reed Wraith** (level 4): It lives where the reservoir flooded the churchyard. Don't answer it.
- **Emerald Jack** (level 4): A pumpkin-headed thief who's been stealing green from the lamps.
- **Whitefang** (level 5): Bram swears it's not his brother this time.
- **The Hollow Ronin** (level 6): A suit of armour with nobody in it, still following orders.
- **The Petal Fiend** (level 6): It looks like falling blossom until it's on your face.
- **The Long Worm** (level 7): Zaira lost six camels to it, and she's only upset about five.
- **The Hullbiter** (level 7): It's been bumping Fen's boat for eleven years.
- **The Ash Lord** (level 8): It climbed out of the vent and it wants its mountain back.
- **The Grave Warden** (level 9): A bronze guard who was ordered to keep the capital safe, and has noticed you.

### Trials

- **Whiteback Slalom**
- **Sensei's Parry**
- **The Perfect Pour**
- **Buried Treasure**
- **Lily Hop**
- **Strike While Hot**
- **Cloudmere Regatta**
- **The Emperor's Seal**

### Delves

- **The Rimeback Caves**
- **The Hollow Roots**
- **The Petal Vault**
- **The Buried Bazaar**
- **The Drowned Stairs**
- **The Slag Vein**
- **The Tide Cellar**
- **The Imperial Crypt**
- **The Bottomless Stair**: endless roguelite with floor modifiers and boons

### Fishing

- **Silver minnow**
- **River roach**
- **Grumbling eel**
- **A left boot**
- **Saltwick sardine**
- **Sideways crab**
- **Offended pufferfish**
- **Moon ray**
- **Reservoir perch**
- **Overdue pike**
- **Bookworm trout**
- **Spectacled koi**
- **Glass icefish**
- **Mountain char**
- **Emerald guppy**
- **Hiccup carp**
- **Fallen starfish**
- **Nine-tail koi**
- **Whiteback trout**
- **Blossom koi**
- **Reed shiner**
- **Grumpy mudskipper**
- **Bog King**
- **Cloud ray**
- **Imperial carp**
- **Oasis minnow**

### Hats

- Straw hat (30 mon)
- Courier cap (45 mon)
- Red bow (35 mon)
- Radio beanie (40 mon)
- Good witch's hat (90 mon)
- Clockmaker's top hat (75 mon)
- Tiny umbrella (110 mon)
- Emerald crown (180 mon)
- Nine-Tail Crown (earned)
- Santa hat (earned)
- Reindeer antlers (earned)
- Earmuffs (earned)
- Holly crown (earned)
- Reaper's hood (earned)
- Chalk circlet (earned)
- Level Fun party hat (earned)
- Wayfarer's hat (earned)
- Delver's lamp (earned)
- Champion's laurel (earned)
- Good Neighbour's bonnet (earned)
- Bounty Hunter's hat (earned)
- Lantern Master's hat (earned)
- Derby Champion's hat (earned)
- Wardkeeper's helm (earned)
- Admiral's bicorne (earned)
- Moonwake sunhat (earned)
- Chronicler's cap (earned)
- Tidewalker's crown (earned)
- Stormchaser's hood (earned)

### House furniture

- Woven rug (15 mon)
- Futon (40 mon)
- Low table (25 mon)
- Potted fern (18 mon)
- Paper lamp (22 mon)
- Bookcase (45 mon)
- Tea set (20 mon)
- Slow clock (50 mon)
- Umbrella stand (28 mon)
- Moth radio (60 mon)
- Fishbowl (35 mon)
- Glass cat (120 mon)
- Iron stove (70 mon)
- Polite pitcher plant (85 mon)
- Tiny fir tree
- Snowman
- Stocking
- Pile of presents
- APPLICATION DENIED stamp
- Wynn's chalk circle
- Jar of Firesalt
- Rimeback's Horn
- The Hollow Flute
- A Blossom That Won't Fall
- The Tyrant's Hourglass
- A Very Old Frog Bell
- The Golem's Ember Heart
- The Drowned Lens
- The Empty Throne Seal

### Farm crops

- **Turnip**
- **Carrot**
- **Strawberry**
- **Tea leaf**
- **Cabbage**
- **Fire pepper**
- **Foxglove**
- **Pumpkin**
- **Moonmelon**
- **Gold wheat**

### Foraged and crafted items

- Acorn
- Lantern mushroom
- Snowberry
- Tea herb
- Wild honey
- Pinecone
- Spiral shell
- Saltwick kelp
- Small pearl
- Driftwood
- Reservoir reed
- Drowned lily
- Waterlogged page
- Frost quartz
- Iron ore
- Gold fleck
- Brass gear
- Old spring
- Umbrella silk
- Night spice
- Bottled ink
- Lost ticket
- Train coal
- Emerald chip
- Sleepy poppy
- Patchwork scrap
- Snowcap flower
- Mountain wool
- Bamboo shoot
- River jade
- Sakura petal
- Salted plum
- Desert date
- Sun glass
- Frogbell reed
- Bog iron
- Obsidian
- Firebloom salt
- Sea glass
- Cloud cotton
- Imperial coin
- Broken seal
- Turnip
- Carrot
- Strawberry
- Tea leaf
- Cabbage
- Fire pepper
- Foxglove
- Pumpkin
- Moonmelon
- Gold wheat

### Cooking

- **Too-long tea**
- **Snowberry jam toast**
- **Mushroom stew**
- **Saltwick broth**
- **Acorn pie**
- **Lily soup**
- **Night Market skewer**
- **Hot pinecone cocoa**
- **Sleeper train bento**
- **Emerald City cake**
- **Keeper's feast**
- **Three-seconds-late toffee**
- **Buttered turnip mash**
- **Carrot cake**
- **Strawberry tea**
- **Fire pepper curry**
- **Stuffed pumpkin**
- **Moonmelon sorbet**

### Critters

- **Sulphur butterfly**: village oz
- **Lantern blue**: village lake
- **Courier monarch**
- **Radio moth**
- **Firefly**: village lake
- **Luna moth**: lake oz
- **Reservoir dragonfly**
- **Salt fly**
- **Snow moth**
- **Icewing**
- **Clockwork beetle**
- **Ink moth**
- **Cinder fly**
- **Emerald swallowtail**

### Far Lands items

- **Snowcap flower**
- **Mountain wool**
- **Bamboo shoot**
- **River jade**
- **Sakura petal**
- **Salted plum**
- **Desert date**
- **Sun glass**
- **Frogbell reed**
- **Bog iron**
- **Obsidian**
- **Firebloom salt**
- **Sea glass**
- **Cloud cotton**
- **Imperial coin**
- **Broken seal**

### Combat

- Auto-aim attacks, levels, XP, perk points, flasks, weapon forging to +5, fighting pet companion
- **Fox claws**: What you were born with.
- **Rimeback Pick**: Still cold. Very good at getting into things.
- **War Fan**: Sweeps a whole arc, and looks wonderful doing it.
- **Imperial Glaive**: A long reach, and a long wait between swings.
- **Twin Tanto**: Fast enough to be rude about it.
- **Velvette's teaspoon**: She can make a knife out of one. This is that one.
- **Gerald**: A sharpened plastic ruler. He answers to no stairwell.
- **The Reaper's scythe**: It hums like a fridge. Hits everything around you.
- **War's hatchet**: Forged from an argument somebody swallowed.
- **Rui's ember**: Sets what it hits on fire.
- **Mae's machete**: Rusted. Has opened a Wretch's skull in one swing.
- **Firesalt broadsword**: Cools from white to orange. Sets what it hits on fire.

### Perks

- **Thick Fur**: +2 max health
- **Sharp Fangs**: +1 damage
- **Quick Paws**: +6% move speed
- **Big Lungs**: +20 stamina and faster recovery
- **Killer Instinct**: +8% critical hit chance
- **Bloodsucker**: 12% chance to heal on a kill
- **Ghost Step**: Longer dodge invincibility
- **Foxfire Bolt**: Unlocks a ranged shot (V), then more damage
- **Scavenger**: +25% loot chance

### Skills

- **Please**: Say the word. Every enemy near you freezes, and frozen enemies take double damage.
- **Relapse**: Kills feed your Corruption, which raises your damage. Spend it in a blast. At 100 it starts eating your health.
- **Foxfire Nova**: Burst blue flame around you, scorching and staggering anything close.
- **Flare**: Sanity drains while you're down here. Burn a flare to scorch what's close. Almond Water restores your sanity.

### Bosses

- The End of Paperwork
- The Tenant
- The Giant Partygoer
- Old Rimeback
- The Hollow Reed
- The Last Blossom
- The Sand Tyrant
- Mother Bogmaw
- The Slag Golem
- The Drowned Keeper
- The Paper Emperor

### Book realms

- **Blackwood University**: campus locations, relics, enemies, bosses and Madison's Best Friendify cupcake system
- **Incarnate**: story locations including The Ark, The Hermitage at the Edge of Time, Purgatory, The Lattice and The Panopticon Observatory
- **Backrooms**: Level 0, Level 1, Level 3, Level 11, Level 37, Level Fun, M.E.G. Base Beta, The Bog of Corbenic
- Hidden on kids profiles

## 14. Foxhold

- 18×14 town-builder with roads, terrain bonuses, jobs, food, happiness, storage, production chains, contracts, events and research
- Reading in Kitsune makes Ink, World residents move in as crew, Winterfest pets take jobs, town earns while away

### Buildings

- **Town Hall** (unlock level 1): The heart of Foxhold. Everything must connect to it by road.
- **Road** (unlock level 1): Buildings only work when a road links them to the Town Hall.
- **Cottage** (unlock level 1): Houses 4 foxes.
- **Row Houses** (unlock level 3): Houses 9.
- **Lantern Manor** (unlock level 7): Houses 20, and they're smug about it.
- **Forester** (unlock level 1): +50% for each forest tile next to it, up to two.
- **Quarry** (unlock level 2): +50% for each rock tile next to it, up to two.
- **Farm** (unlock level 1): Grows food. Foxes eat constantly.
- **Fishery** (unlock level 2): Must be built next to the pond.
- **Orchard** (unlock level 4): A lot of food, and it smells nice.
- **Sawmill** (unlock level 2): Turns wood into coin.
- **Bakery** (unlock level 3): Turns food into coin. +25% next to a Farm.
- **Tea Shop** (unlock level 3): Too long steeped. Big morale boost.
- **Night Market** (unlock level 5): Earns coin for every fox in town.
- **Stonemason** (unlock level 4): Turns stone into coin. +25% next to a Quarry.
- **Town Library** (unlock level 3): Slowly makes Ink. Reading in Kitsune makes far more.
- **Bindery** (unlock level 6): Binds Ink into Foxfire. +25% next to a Library.
- **Foxfire Still** (unlock level 8): Distils Foxfire from a truly upsetting amount of soup.
- **Street Lantern** (unlock level 1): Everything touching it works 6% harder.
- **Little Park** (unlock level 2): A bench and a tree. Foxes adore it.
- **Nine-Tail Statue** (unlock level 6): Nobody remembers who paid for it.
- **Fox Shrine** (unlock level 5): Everything within 2 tiles works 15% harder.
- **Clock Tower** (unlock level 9): All of Foxhold works 10% harder, three seconds late.
- **Storehouse** (unlock level 2): +300 storage for everything.

### Research

- **Better Axes** (15 Ink): Wood +20%
- **Iron Ploughs** (15 Ink): Farms and orchards +20%
- **Steel Picks** (20 Ink): Stone +20%
- **Double Ledgers** (30 Ink): All coin +15%
- **Thrifty Soup** (25 Ink): Foxes eat 20% less
- **Stacking Crates** (30 Ink): +50% storage
- **Town Choir** (45 Ink): +8 happiness
- **Night Shifts** (60 Ink): Town earns 85% while you're away, up from 60%
- **Foxlore** (90 Ink): Ink and Foxfire +30%
- **Master Builders** (120 Ink): Upgrades cost 25% less
- **The Golden Age** (300 Ink): Everything +15%

### Town events

- **Blizzard Warning**: The sky over Hollow Pine has gone the colour of a bruise. Choices: Board up (-20 wood); Ride it out (-12% of your food)
- **A Traveller at the Gate**: A hare with a very large cart would like to trade. Choices: Sell 30 wood for 45 coin; Sell 25 food for 35 coin; Wave them on
- **Lantern Festival**: The foxes want a festival. They've already bought the bunting. On credit. Choices: Pay for it (-40 coin, +15 happiness for 20 min); Say no (-5 happiness for 20 min)
- **A Crate of Lost Books**: It fell off the little train. Nobody has come back for it. Choices: Add it to the shelves (+6 Ink); Sell it (+30 coin)
- **Chimney Fire**: The bakery's chimney is doing something chimneys aren't meant to. Choices: Send everyone (-15 stone); Let it burn out (-8 happiness for 20 min)
- **Foxes on the Road**: A family with a handcart wants to know if there's room in town. Choices: Welcome them (-15 food, +20 XP); No vacancy
- **A Fallen Pine**: The big pine by the road came down overnight and missed every roof. Choices: Chop it up (+35 wood); Carve a bench (+6 happiness for 20 min)
- **A Letter from the Capital**: It's a tax. Nobody's sure which capital. Choices: Pay it (-30 coin, +15 XP); Lose it behind the stove (-4 happiness for 20 min)
- **Blue Lights in the Woods**: Little blue flames, drifting between the trees at dusk. Choices: Collect them (+3 Foxfire, -10 food); Leave them be (+4 happiness for 20 min)

## 15. Activities, campaign and Renown

- Activities hub (K), Renown levels 1–30 with mon rewards, Chronicler's cap at level 30, three daily contracts

### The Long Tide

- **Chapter 1: The Dimming** (keeper: kitsu). Goals: Win a card duel, Win a Fox Derby race, Catch a fish
- **Chapter 2: The Overdue Tide** (keeper: librarian). Goals: Win 4 card duels, Beat 3 different residents, Catch 4 fish
- **Chapter 3: Last Train Out** (keeper: haru). Goals: Win 4 Derby races, Earn medals on 3 courses
- **Chapter 4: The Light Stays On** (keeper: marin). Goals: Defend 2 towns in Night Siege, Destroy 150 shadows
- **Chapter 5: No Ship** (keeper: gull). Goals: Sink 6 ships, Visit 4 ports, Sink a named captain
- **Chapter 6: Filed Under Moon** (keeper: vesper). Goals: Adopt 3 critters, Host 5 hotel stays, Work 3 job shifts
- **Chapter 7: What the Fire Remembers** (keeper: ignis). Goals: Clear a Delve, Earn medals in 2 Trials, Complete a bounty hunt
- **Chapter 8: The Long Tide** (keeper: emperor). Goals: Beat 10 residents at cards, Sink 3 named captains, Defend 4 towns. Ends with The Long Tide, a three-phase bullet-dodging boss

### Daily contract pool

- Win 2 card duels (40 mon, 60 Renown)
- Win 2 Derby races (45 mon, 60 Renown)
- Destroy 60 shadows (50 mon, 60 Renown)
- Sink 4 ships (50 mon, 60 Renown)
- Earn 150 mon at sea (45 mon, 60 Renown)
- Catch 3 fish (30 mon, 60 Renown)
- Host 3 hotel stays (35 mon, 60 Renown)
- Work 2 Bay job shifts (35 mon, 60 Renown)
- Pick 6 fruit (25 mon, 60 Renown)
- Earn 150 shells (35 mon, 60 Renown)
- Finish 2 World Events (45 mon, 60 Renown)

## 16. Lantern Cards

- Six rounds, three lanterns, energy equal to the round, four cards per lane, most lanterns wins, total power breaks ties
- 22 commons, 37 resident signature cards, 12-card decks, maximum two copies, 70-mon packs
- Five opponent tiers, first win earns the signature, second win a copy, daily mon, Lantern Master hat for all 37

### Lantern rules

- **Plain Lantern**: No special rule.
- **Frost Lantern**: Cards here have -1.
- **Foxfire Lantern**: Cards here have +1.
- **Little Shrine**: Cards costing 2 or less have +2.
- **High Post**: Cards costing 4 or more have +3.
- **Narrow Bridge**: Only 2 cards each.
- **Wishing Well**: Playing here draws a card.
- **Night Market**: +1 energy next round for playing here.
- **Hush Wood**: Reveal effects don't work here.
- **Wild Lantern**: Beasts have +2.

### Common cards

- **Fox Cub** (cost 1, power 2)
- **Lamp Moth** (cost 1, power 1): Reveal: draw a card.
- **Hedge Sparrow** (cost 1, power 1): Reveal: flies to your weakest other lantern.
- **Spare Wick** (cost 1, power 1): Reveal: +1 energy next round.
- **Lucky Pebble** (cost 1, power 1): Reveal: a card in your hand gets +2.
- **Bog Frog** (cost 1, power 2): +2 while it's alone here.
- **Grey Heron** (cost 2, power 3)
- **Night Courier** (cost 2, power 2): Reveal: draw a card.
- **Lamplighter** (cost 2, power 2): Reveal: your other cards here get +1.
- **Pickpocket** (cost 2, power 2): Reveal: enemy cards here get -1.
- **Pine Sapling** (cost 2, power 1): Gains +1 at the end of each round.
- **Paper Twins** (cost 2, power 2): Reveal: adds a 1-power Paper Fox to each other lantern.
- **Old Badger** (cost 3, power 5)
- **Village Choir** (cost 3, power 2): Your other cards here have +1.
- **Sudden Snowfall** (cost 3, power 3): Reveal: enemy cards here get -2.
- **Last Bus** (cost 3, power 2): +4 if played in round 5 or 6.
- **Forest Stag** (cost 4, power 7)
- **Bonfire** (cost 4, power 3): Reveal: your other cards here get +2.
- **Great Owl** (cost 4, power 4): Reveal: draw two cards.
- **Mountain Bear** (cost 5, power 9)
- **Avalanche** (cost 5, power 4): Reveal: all enemy cards get -2.
- **Paper Dragon** (cost 6, power 12)

### Signature cards

- **Kitsu** (cost 3, power 4): Reveal: draw a card. The post gets through.
- **Ponzu** (cost 2, power 2): Reveal: a card in hand gets +3. It's steeped too long.
- **Wren** (cost 2, power 3): +3 if played in round 5 or 6. It's nearly two.
- **Fennick** (cost 3, power 3): Reveal: walks to your weakest other lantern.
- **Tibb** (cost 3, power 3): Gains +1 each round, three seconds late.
- **Mina** (cost 2, power 2): Reveal: draw a card. It's only twenty years overdue.
- **The Librarian** (cost 4, power 4): Reveal: enemy cards here get -2. There is a fine.
- **Tamba** (cost 3, power 3): Reveal: an umbrella opens at each other lantern.
- **Pell** (cost 3, power 2): Your other cards here have +1. She mends things.
- **Haru** (cost 4, power 5): Reveal: +2 energy next round. No tickets.
- **Odo** (cost 2, power 2): Reveal: enemy cards here get -1. A cold front.
- **Wren of Saltwick** (cost 1, power 2): Reveal: draw a card. She notices things.
- **Haru the artist** (cost 4, power 3): Reveal: gains the power of your strongest card here.
- **Bungle** (cost 2, power 5): -3 if there's an enemy card here. Careful, it's glass.
- **Scraps** (cost 3, power 2): +2 for each other card of yours here.
- **Tam** (cost 1, power 1): Reveal: a card in hand gets +2. He carries the eggs.
- **Wren Tallowmere** (cost 3, power 4): Reveal: your other cards here get +1.
- **Cephalotus** (cost 4, power 3): Reveal: eats your weakest other card here and gains its power +3.
- **Billina** (cost 2, power 3): +3 while alone here. She has opinions.
- **Madison** (cost 3, power 3): Reveal: takes 2 power from the strongest enemy card here.
- **Glinda** (cost 5, power 6): Your other cards here have +2.
- **Sorrel** (cost 2, power 3): Reveal: leads the way to your weakest other lantern.
- **Old Bram** (cost 4, power 8): Costs you 2 energy next round. He'll get there.
- **Sensei Kuro** (cost 4, power 4): Reveal: all enemy cards get -1.
- **Mei** (cost 2, power 2): Gains +1 each round. She can hear it growing.
- **Hana** (cost 3, power 3): Reveal: your other cards here get +2.
- **Ren the Poet** (cost 5, power 2): +9 if played in round 5 or 6. He's been saving it.
- **Zaira** (cost 3, power 3): Reveal: +2 energy next round. Water is money.
- **Tumble** (cost 1, power 1): Reveal: scouts your weakest other lantern.
- **Auntie Moss** (cost 3, power 3): Reveal: enemy cards here get -2. Mind the plank.
- **Fen** (cost 3, power 4): +4 while alone here.
- **Ignis** (cost 5, power 7): Reveal: enemy cards here get -2.
- **Little Cinder** (cost 2, power 4): Loses 1 power at the end of each round.
- **Marin** (cost 4, power 5): Reveal: draw two cards. She leaves the light on.
- **Captain Gull** (cost 3, power 5): -2 if there's an enemy card here. No ship.
- **Vesper** (cost 5, power 5): Reveal: your other cards here get +2. Filed.
- **The Last Emperor's Cat** (cost 6, power 10): Reveal: all enemy cards get -2. It wants fish.

## 17. Fox Derby

- Live races on the real map with gates, three rivals, stamina sprint, terrain speed, boost pads, carrots, mud, best-time ghosts, medals, daily bonus, Q reset, Derby Champion's hat

### Courses

- **Hollow Pine Dash**: Down the hill to the stalls. A good first race. Route: Hollow Pine → The Night Market → Saltwick Shore → Brask → Hollow Pine
- **Saltwick Run**: Fast road, then soft sand. Route: The Night Market → Saltwick Shore → Brask → The Drowned Reservoir → Brask → Saltwick Shore → The Night Market
- **Brask Clockwork**: Through town before the hour strikes. Route: Brask → Hollow Pine → The Land of Oz → Hollow Pine → Brask → The Drowned Reservoir → Brask
- **Reservoir Loop**: Round the drowned water and up. Route: The Drowned Reservoir → Brask → Hollow Pine → The High Post → Hollow Pine → Brask → The Drowned Reservoir
- **Emerald Express**: Beat the last train to Platform Zero. Route: Platform Zero → The Night Market → Hollow Pine → The Land of Oz → Platform Zero → The Night Market
- **High Post Climb**: Deep snow all the way. Save your legs. Route: The High Post → The Whiteback Range → The High Post → Hollow Pine → The High Post → The Whiteback Range
- **Petal Road**: Bamboo corners into falling blossom. Route: The Land of Oz → Bamboo Hollow → The Sakura Terraces → Bamboo Hollow → The Land of Oz → Platform Zero
- **Ember Descent**: Swamp first, then the heat. Route: The Night Market → Mirewater → The Ember Caldera → Mirewater → The Night Market → Platform Zero
- **Cloudmere Crossing**: The long way over the water. Route: Mirewater → The Cloudmere Isles → Mirewater → The Ember Caldera → Mirewater → The Cloudmere Isles
- **The Grand Tour**: The whole country in one go. Route: Hollow Pine → The High Post → The Whiteback Range → Bamboo Hollow → The Ember Caldera → Mirewater → The Night Market → Hollow Pine

### Cups

- **Acorn Cup**: Hollow Pine Dash, Saltwick Run, Brask Clockwork
- **Lantern Cup**: Reservoir Loop, Emerald Express, High Post Climb
- **Nine-Tail Cup**: Petal Road, Ember Descent, Cloudmere Crossing

### Stable

- **Stronger legs**: +2.5% top speed, four levels
- **Bigger lungs**: +15 stamina, four levels
- **Racing tack**: Boost pads last longer, four levels

## 18. Night Siege

- Live tower defense at real towns, 10 waves, build where you stand, upgrade twice, sell, player auto-attacks, three-star ratings, Endless mode, Ward Shards, Armoury, Wardkeeper's helm

### Towns

- **Hollow Pine** (difficulty ×1)
- **The Night Market** (difficulty ×1.08)
- **Saltwick Shore** (difficulty ×1.17)
- **Brask** (difficulty ×1.27)
- **The Land of Oz** (difficulty ×1.38)
- **Platform Zero** (difficulty ×1.5)
- **Bamboo Hollow** (difficulty ×1.64)
- **The Ember Caldera** (difficulty ×1.8)

### Towers

- **Arrow Lantern** (30 embers): Fast single shots
- **Frost Bell** (40 embers): Slows everything nearby
- **Foxfire Mortar** (70 embers): Splash damage
- **Owl Perch** (85 embers): Long range, ignores armor
- **Coin Shrine** (60 embers): Pays embers each wave

### Enemies

- **Shade**: 22 HP, speed 58, armor 0, 1 lantern damage
- **Runner**: 13 HP, speed 108, armor 0, 1 lantern damage
- **Wisp**: 28 HP, speed 70, armor 0, 1 lantern damage, flies
- **Brute**: 85 HP, speed 38, armor 3, 2 lantern damage
- **Warden**: 62 HP, speed 50, armor 7, 2 lantern damage
- **The Hollow King**: 620 HP, speed 30, armor 5, 10 lantern damage, boss

## 19. High Seas

- Sail the main ocean with inertia and daily wind, ports, shifting prices, safe harbors, cannon volleys, dodgeable shots, daily salvage timing game, cargo loss on sinking, Admiral's bicorne

### Ports

- **Saltwick Harbour** (danger 1). Makes Sea Salt, Squid Ink. Wants Hill Tea, Emberglass
- **Brask Quay** (danger 1). Makes Squid Ink, Hill Tea. Wants Sakura Silk, Sea Salt
- **High Post Landing** (danger 2). Makes Hill Tea, Pine Amber. Wants Sea Salt, Dune Spice
- **Emerald Pier** (danger 2). Makes Pine Amber, Sakura Silk. Wants Squid Ink, Cloud Pearl
- **Bamboo Wharf** (danger 3). Makes Hill Tea, Sakura Silk. Wants Pine Amber, Emberglass
- **Whiteback Moorings** (danger 3). Makes Pine Amber, Sea Salt. Wants Dune Spice, Sakura Silk
- **Sakura Steps** (danger 3). Makes Sakura Silk, Cloud Pearl. Wants Sea Salt, Pine Amber
- **Sunfall Jetty** (danger 3). Makes Dune Spice, Sea Salt. Wants Hill Tea, Cloud Pearl
- **Mirewater Stilts** (danger 4). Makes Squid Ink, Dune Spice. Wants Pine Amber, Sakura Silk
- **Caldera Slip** (danger 4). Makes Emberglass, Dune Spice. Wants Hill Tea, Squid Ink
- **Cloudmere Dock** (danger 5). Makes Cloud Pearl, Sea Salt. Wants Dune Spice, Emberglass
- **Old Capital Docks** (danger 5). Makes Emberglass, Cloud Pearl. Wants Sakura Silk, Pine Amber

### Cargo

- Sea Salt (base 12 mon)
- Hill Tea (base 18 mon)
- Squid Ink (base 24 mon)
- Sakura Silk (base 34 mon)
- Dune Spice (base 42 mon)
- Pine Amber (base 52 mon)
- Emberglass (base 64 mon)
- Cloud Pearl (base 80 mon)

### Shipyard

- **Oak hull**: +30 hull, four levels
- **Better sails**: +20 top speed, four levels
- **Bigger hold**: +5 cargo, four levels
- **Heavier guns**: +5 damage, four levels

### Pirates

- **Pirate Sloop**: hull 30, damage 5, loot 14
- **Pirate Brig**: hull 72, damage 8, loot 30
- **Black Corsair**: hull 125, damage 11, loot 55
- **Iron Galleon**: hull 230, damage 15, loot 95

### Captains

- **Mad Tessaly**: hull 140, damage 9, 120 mon
- **Rook Underfoot**: hull 200, damage 11, 190 mon
- **Orla Two-Anchors**: hull 270, damage 12, 260 mon
- **Old Man Brine**: hull 340, damage 14, 340 mon
- **Vesna of the Red Sail**: hull 430, damage 16, 430 mon
- **The Hollow Admiral**: hull 540, damage 18, 560 mon
- **The Undertow**: hull 900, damage 22, 1000 mon

## 20. World Events

- Start automatically or by horn, pause during other modes, tracker and arrow, bronze/silver/gold, Renown, Stormchaser's hood
- **Falling Stars** (30s): Grab the stars as they land. Medals at 8, 14, 22 stars
- **Balloon Drift** (35s): Pop the drifting balloons. Gold is worth 3. Medals at 6, 10, 14 points
- **The Golden Fox** (45s): Catch it three times. Sprint or ride!. Medals at 1, 2, 3 catches
- **Shadow Rifts** (55s): Stand by each rift to seal it. Medals at 1, 2, 3 sealed
- **Lantern Parade** (40s): Stay inside the parade's glow. Medals at 14, 24, 33 seconds
- **Meteor Shower** (35s): Dodge the red circles, grab the ore. Medals at 7, 13, 20 ore
- **Wandering Merchant** (60s): Reach the caravan before it moves on. Medals at 1, 1, 1 found
- **Lost Kit** (75s): Find the kit and bring it to the resident. Medals at 1, 2, 3 rating

## 21. Moonwake Bay

- 112×48 walkable resort reached by ferry, Shells currency, strolling residents with critters, active critter follower, rides, digging, goals and the Moonwake sunhat

### Places

- **Tidepool Shelter**: Adopt critters
- **Saltspray Garage**: Buy a ride
- **Driftwood Realty**: Buy a home
- **The Swap Stall**: Trade and sell
- **Scoop Shack**: Work a shift
- **Gull Post**: Run deliveries
- **Lifeguard Tower**: Go on duty
- **The Moonwake Grand**: Run the hotel
- **Critter Show**: Enter the show
- **Fluff & Frills**: Dress your critter
- **Tonic Shack**: Buy tonics
- **Town Hall**: Paycheck and gifts
- **Harbour Café**: Feed your critter
- **Juice Bar**: Quench its thirst
- **Critter Clinic**: See the vet
- **Bubble Baths**: Wash your critter
- **Seashell School**: Attend a lesson
- **Hatchery Nursery**: Buy and hatch eggs
- **Trade Plaza**: Trade critters
- **Tide Pool Playground**: Play
- **Dune Campsite**: Take a nap
- **Boardwalk Arcade**: Play games
- **Neighbour Board**: Help a neighbour

### Critters

- Sandy Otter, Tidal Otter, Coral Otter, Starlit Otter, Moonwake Otter
- Sandy Crab, Tidal Crab, Coral Crab, Starlit Crab, Moonwake Crab
- Sandy Seal, Tidal Seal, Coral Seal, Starlit Seal, Moonwake Seal
- Sandy Puffin, Tidal Puffin, Coral Puffin, Starlit Puffin, Moonwake Puffin
- Sandy Turtle, Tidal Turtle, Coral Turtle, Starlit Turtle, Moonwake Turtle
- Sandy Axolotl, Tidal Axolotl, Coral Axolotl, Starlit Axolotl, Moonwake Axolotl
- Sandy Bunny, Tidal Bunny, Coral Bunny, Starlit Bunny, Moonwake Bunny
- Sandy Hedgehog, Tidal Hedgehog, Coral Hedgehog, Starlit Hedgehog, Moonwake Hedgehog
- Sandy Red Panda, Tidal Red Panda, Coral Red Panda, Starlit Red Panda, Moonwake Red Panda
- Sandy Capybara, Tidal Capybara, Coral Capybara, Starlit Capybara, Moonwake Capybara
- Sandy Jellyfish, Tidal Jellyfish, Coral Jellyfish, Starlit Jellyfish, Moonwake Jellyfish
- Sandy Tanuki, Tidal Tanuki, Coral Tanuki, Starlit Tanuki, Moonwake Tanuki
- Rarities: Common, Uncommon, Rare, Epic, Legendary
- Growth: Hatchling (0 care), Tiny (4 care), Playful (10 care), Spirited (20 care), Blooming (34 care), Full Bloom (52 care)
- Moonlit: combine 3 of a kind
- Eclipse: combine 3 fully grown Moonlit critters

### Crates and eggs

- **Beach Crate** (60 shells): Common 70%, Uncommon 24%, Rare 5%, Epic 1%, Legendary 0%
- **Reef Crate** (180 shells): Common 42%, Uncommon 36%, Rare 17%, Epic 4%, Legendary 1%
- **Moon Crate** (500 shells): Common 12%, Uncommon 33%, Rare 33%, Epic 17%, Legendary 5%
- **Cove Egg** (90 shells, 4 care): Common 60%, Uncommon 30%, Rare 9%, Epic 1%, Legendary 0%
- **Reef Egg** (240 shells, 6 care): Common 35%, Uncommon 38%, Rare 20%, Epic 6%, Legendary 1%
- **Star Egg** (620 shells, 8 care): Common 10%, Uncommon 32%, Rare 35%, Epic 18%, Legendary 5%
- **Eclipse Egg** (1500 shells, 12 care): Common 0%, Uncommon 15%, Rare 40%, Epic 33%, Legendary 12%

### Needs

- **Hungry** at Harbour Café
- **Thirsty** at Juice Bar
- **Muddy** at Bubble Baths
- **Bored** at Tide Pool Playground
- **Sleepy** at Dune Campsite or your home
- **Under the weather** at Critter Clinic
- **Lesson time** at Seashell School

### Tonics

- **Ride Tonic** (300 shells): Your critter grows strong enough to ride
- **Glide Tonic** (650 shells): Your critter can glide over water and rooftops

### Critter outfits

- Ribbon bow (40 shells)
- Sailor cap (60 shells)
- Beach shades (70 shells)
- Knit scarf (55 shells)
- Island flower (45 shells)
- Tiny crown (220 shells)
- Moon halo (320 shells)
- Paper wings (260 shells)
- Party hat (80 shells)
- Pirate hat (130 shells)
- Headphones (110 shells)
- Hero cape (180 shells)

### Rides

- Beach Scooter (250 shells, 40% faster)
- Shell Cart (800 shells, 65% faster)
- Seafoam Coupe (2200 shells, 90% faster)
- Moonlight Van (5000 shells, 120% faster)

### Homes

- Beach Hut (300 shells, 6×4)
- Seaside Cottage (1000 shells, 7×5)
- Coral Villa (2800 shells, 9×6)
- Moonwake Manor (7000 shells, 11×7)

### Home furniture

- 🪑 Wicker chair (30 shells, +2 comfort)
- 🪴 Potted fern (35 shells, +2 comfort)
- 🏮 Paper lamp (45 shells, +3 comfort)
- 📚 Bookshelf (70 shells, +4 comfort)
- 🛏️ Hammock bed (120 shells, +7 comfort)
- 🛋️ Soft sofa (140 shells, +8 comfort)
- 🛁 Clawfoot tub (180 shells, +10 comfort)
- 📺 Tiny TV (160 shells, +9 comfort)
- 🎹 Sea-worn piano (320 shells, +16 comfort)
- 🎸 Porch guitar (110 shells, +6 comfort)
- 🐚 Giant shell (90 shells, +5 comfort)
- 🌊 Wave painting (85 shells, +5 comfort)
- 🌕 Moon globe (260 shells, +14 comfort)
- 🐠 Fish tank (240 shells, +13 comfort)
- 🎂 Welcome cake (55 shells, +3 comfort)
- 👑 Silly crown (900 shells, +40 comfort)

### Fruit

- 🥭 Mango (sells 14, 8 critter XP)
- 🍑 Peach (sells 11, 6 critter XP)
- 🥥 Coconut (sells 18, 11 critter XP)

### Jobs

- **Scoop Shack**: match cone orders against the clock
- **Lifeguard Tower**: tap swimmers and avoid sharks
- **Gull Post**: timed real-map parcel route

### The Moonwake Grand

- Real-time guests, requested room bonus, cleaning, star rating, slots, half-pay away earnings for up to 3 hours
- **Bunk Room** (120 shells, about 8 per stay)
- **Sea View** (320 shells, about 18 per stay)
- **Garden Suite** (700 shells, about 34 per stay)
- **Spa Suite** (1500 shells, about 46 per stay)
- **Moon Penthouse** (3600 shells, about 70 per stay)
- **Porter**: Guests arrive sooner, three levels
- **Housekeeper**: Cleans empty rooms for you, three levels
- **Chef**: +12% pay on every stay, three levels
- **Concierge**: Checks guests in for you, even while you're away, three levels

### Critter Show

- Spin, Hop, Wave and Bow memory routines, slips forgiven at levels 8 and 15
- **Bronze Ribbon**: 4 tricks, 60 shells
- **Silver Ribbon**: 6 tricks, 120 shells
- **Gold Ribbon**: 8 tricks, 250 shells
- **Star Ribbon**: 10 tricks, 500 shells
- **Moonwake Cup**: 13 tricks, 1000 shells

### Trading, town and daily loops

- **Trade Plaza**: six daily traders, offer up to three critters, fairness meter, values from rarity, form, stage and tonics
- **Swap Stall**: sell fruit, swap mon for shells, four daily critter swaps
- **Town Hall**: paycheck every 10 minutes, up to six saved
- **Daily gift**: Day 1 60 shells, Day 2 90 shells, Day 3 130 shells, Day 4 180 shells, Day 5 240 shells, Day 6 320 shells, Day 7 Star Egg
- **Neighbour Board**: four daily fruit, critter, growth or shell requests
- **Buried treasure**: five daily spots with hot/cold hints

### Boardwalk Arcade

- **Surf Rush**: three-lane dodger
- **Crab Bonk**: 25-second whack game
- **Shell Match**: eight-pair memory game
- **Prize Counter**: Cove, Reef and Star Eggs, 150 and 1,000 shells, Ride and Glide Tonics, Tiny crown, Moon halo, Paper wings, Hero cape, Legendary critter

### Shell album

- Sand Dollar (Common)
- Periwinkle (Common)
- Cockle (Common)
- Limpet (Common)
- Mussel (Common)
- Whelk (Common)
- Scallop (Common)
- Clam (Common)
- Auger (Common)
- Moon Snail (Common)
- Turban (Uncommon)
- Cowrie (Uncommon)
- Conch (Uncommon)
- Abalone (Uncommon)
- Nautilus (Uncommon)
- Coral Fan (Uncommon)
- Sea Glass (Uncommon)
- Starfish (Rare)
- Urchin (Rare)
- Pearl Oyster (Rare)
- Sunset Shell (Rare)
- Ghost Shell (Epic)
- Tide Crown (Epic)
- Moonwake Pearl (Legendary)

### Bay Goals

- Adopt your first critter (60 shells)
- Discover 5 critters (120 shells)
- Discover 20 critters (500 shells)
- Discover all 60 critters (5000 shells)
- Make a Moonlit critter (300 shells)
- Raise a critter to level 10 (400 shells)
- Buy a home (150 shells)
- Reach 50 comfort (350 shells)
- Buy a ride (120 shells)
- Finish 10 job shifts (250 shells)
- Pick 25 fruit (200 shells)
- Dig up 10 treasures (250 shells)
- Complete a critter swap (120 shells)
- Own Moonwake Manor (1500 shells)
- Host 10 hotel stays (300 shells)
- Reach a 4.5 star hotel (900 shells)
- Win a show ribbon (150 shells)
- Win the Moonwake Cup (1200 shells)
- Meet 25 critter needs (350 shells)
- Raise a critter to Full Bloom (800 shells)
- Hatch an egg (120 shells)
- Give a critter a tonic (150 shells)
- Dress up a critter (80 shells)
- Create an Eclipse critter (2500 shells)
- Play 10 arcade games (250 shells)
- Redeem an arcade prize (100 shells)
- Find 12 different shells (300 shells)
- Help 10 neighbours (400 shells)

## 22. Kitsune Plus

### Workspace

- **Sidebar presets**: Pure Reader, Cozy Mode, Full Kitsune OS, Custom with show/hide and pins
- **E-ink mode**: no animation, monochrome, Bayer-dithered covers
- **Controllers**: gamepads and Bluetooth page turners for readers and World
- **Desk buddy**: your active critter or Winterfest pet naps on screen
- **Corner scenes**: fox fishing, campfire, sleeper train
- **Real weather**: Open-Meteo sync for World weather and soundscapes
- **Achievement Maker**: custom goals, badges and World mon rewards

### Listen

- **Moth Radio**: synthesized lo-fi, chiptune, music box and rainy stations
- **World jukebox**: 16 region tracks unlocked by visiting
- **Sequencer**: 16 steps, 8 notes, kick, hat, share codes, Foxhold theme
- **Podcasts**: RSS shows with resume
- **Local audiobooks**: M4B chapters, MP3 folders, waveform scrubber

### Read

- **Side-by-side reader** with paragraph or position sync
- **Scan Enhancer**: WebGPU upscale, halftone, crop, deskew, OCR reflow
- **Previously On…** recap cards, plus an automatic manga recap after two weeks away
- **Spine Scanner** using on-device OCR and Open Library
- **Train & Ferry Focus** Pomodoro journeys
- **Checkout Cards** with stamped dates
- **Bookshelf Room** in 2D or 3D

### Together

- **Book Club**: peer-to-peer rooms, followed page turns, reactions, spoiler-locked comments
- **Beam to Device**: books, themes and saves by code or QR
- **Kitsune Post**: letter codes, recommendations, themes, gifts, resident pen pals
- **Two-Player Cards**: pass-and-play and online
- **Critter Trades** between two players

### Make

- **Zine Maker**: 8-page single-sheet PDF, fed from Panel Studio and Writing Studio
- **Story Studio**: branching stories with path checks and single-file HTML export
- **Sticker Maker** for Notebook, Den and Library tools
- **Custom Cards**: generated from finished books, plus a creator and deck codes

### World extras

- **Walkable Museum**: Aquarium, Terrarium, Shell Hall, Relic Vault, Trophy Hall, Fossil Wing
- **Photo Mode and Scrapbook**: filters, frames and captions
- **Finished books** on The Great Shelf with ratings and notes
- **Reading rewards**: mon, Foxhold Ink, egg warmth and lucky fishing
- **Festivals**: Sakura Matsuri, Summer Solstice Regatta, Autumn Lantern Market, Winterfest
- **Festival games**: Petal Catch, Solstice Regatta, Fireworks Show, Harvest Sort
- **Winterfest Part 2**: trick skating, ice fishing, snow fort, cocoa stand, aurora

## 23. Country Life

### On the real map

- **Rowboat and kayak** on The Drowned Reservoir and Mirewater
- **Hang-gliding** with thermals and rings from Whiteback and Cloudmere
- **Hot air balloon** with zoomed-out flight, parcel drops and aerial photos
- **Kite flying** at Saltwick Shore and Cloudmere Isles
- **Sleeper Train** that visibly runs a 12-stop loop
- **8 fox burrows**, 16 stamp booths, fossil digs, truffle hunts and lost items

### Walkable rooms

- **Foxfire Hot Springs** with soaking residents and buffs
- **6 secret rooms**: waterfall, bookshelf, ruins, clock, kiln and buried parlour

### Places and pastimes

- Observatory linked to your library
- Luminous Greenhouse with 27 flower genotypes and bonsai
- Tea & Cider Press
- Tea & Bookshop shift
- Night Market stall
- Weekly flea market, blind boxes and auctions
- Bookmobile reviews
- Resident birthdays, parties and heart scenes
- Campfire, tent, roasting and time skip
- Placed lanterns, signposts, benches and beehives
- Regional honey
- Paper lantern river notes
- Date-locked time capsules
- Busking with sequencer tracks
- Ghost Train around midnight
- Spirits tied to weather and moon
- Platform Zero Lost & Found
- Ship cabin decorating
- Gossip board
- Boss Rush with 5 modifiers

## 24. Town Square

- Town Square hub on the I key and in Activities
- Game Parlor against any resident on Easy, Fair or Sharp
- Reversi with legal-move hints and opponent AI
- Lantern Four with drop columns and winning-line highlight
- Mancala with extra turns, captures and opponent AI
- Ramen Stand timed orders
- Taiko Stage rhythm game with Don, Ka and combos
- Archery Range with aim, power and 10 arrows
- Post Office timed mail sorting
- Quarry rock breaking for ore
- Pottery wheel shaping scored by match
- Star tracing against the clock
- Charm Forge with wearable charms and bonuses
- The Easel pixel painting and personal gallery
- Lantern Theater plays cast from three residents
- Treasure Maps with three clues and digging
- Weekly Fishing Tournament against rivals
- Field Guide critter photography
- Almanac Forecast
- Town Council donation projects that appear in World

## 25. Reading and Word Tools

- Foxword daily five-letter word game with streaks and mon rewards
- Vocab Match using saved vocabulary
- Reading Garden where finished books grow plants
- Quote Wall with downloadable quote posters
- Mood Picker for choosing the next read
- Sound Mixer with 7 ambience layers and 4 presets
- Book Soundtracks generated from title and genre
- Cast Map relationship web from Cast notes
- Bookmark Designer with patterns, icons and image export

## 26. Foxglove Detective Agency

- Agency building in World, on the Z key and in Activities
- 12 written story cases that unlock in order
- Daily case with a 100 mon bonus
- Endless random cases at Simple, Tricky and Someone Is Lying
- Every generated case is checked to have exactly one possible culprit
- Interview suspects, including cases where the guilty one lies
- Search rooms by looking under objects
- Notebook logic grid for suspects, places and items
- Paid hints, star ratings, cold cases and a full solution reveal
- Five detective ranks earned through reputation
- Open cases save and resume

## 27. Moonroot Apothecary

- Apothecary building in World, on the Q key and in Activities
- Brew from any three foraged ingredients
- Four essences: Ember, Moon, Root and Tide
- 12 discoverable potions with a recipe book
- Stirring timing game that decides potion yield
- Potions give speed, lucky catches or mon
- Personal potion shelf

## 28. Skyward Isles

- Walkable floating archipelago reached via the Starlight Airship north of Platform Zero, on the F key, or from Activities
- Four floating islands connected by cloud bridges: Galeharbor, Loom-in-the-Clouds, Starlight Conservatory and The Amber Spire
- Four sky residents with dialogue and quests: Captain Kestrel, Loomis the Weaver, Astrid and Zephyr
- Daily drifting Star-Shards to collect across the islands
- Starlight Telescope rotating-ring puzzle to chart 6 constellations
- Amber Spire Wind-Chime memory trial across 3 escalating rounds
- Cloud-Fishing at any island's cliff edge for 6 unique Sky Fish
- The Cloud Loom shop for sky-born hats, house furniture and Updraft Tonic
- Four Wind-Bells quest that awakens the Aurora Sky and rewards the Sky Captain's cap and Brass Orrery

## 29. The Southern Frontier & Blackwood Expansion

- Expanded overworld map (`240×224`) with three new southern regions: The Coral Causeway, The Whispering Cavern and The Starfall Glacier
- Three new Far Beacons, three new buildings, six new residents, six new forageable items and six new fish
- Three new Delves (The Sunken Reef, The Crystal Seam, The Starfall Vault) with bosses and house trophies
- Three new Regional Trials (Pearl Diving, Crystal Echoes, Glacier Descent), three new Bounties and four new side quests
- Expanded Blackwood University with seven new locations (Hall of Residence, Sub-Basement Laundry, Duck Pond & Boathouse, Horsemen's Break Room, Meridian Wing Airlock 13, Tray Three and The Stopped Petrol Station), six new relics, two new weapons and The Hungry Stairwell boss

## 30. The Sunken Deep

- Walkable underwater realm reached via the Diving Bell at Saltwick Shore, the Deep HUD button, or Activities
- Four abyssal zones: The Kelp Trench, Sunken Library Annex, Bioluminescent Garden and The Leviathan's Gate
- Four underwater residents: Diver Barnaby Jr., Coralia the Archivist, Lumen and Warden Nautilus
- Daily Sea Pearls to collect along the seabed
- Coralia's Pearl Exchange for Abyssal Diver's Helm, Coral Crown, Coral Throne, Angler Lamp and Current-Fin Tonic
- Anemone Conservatory pressure-valve balancing puzzle and Leviathan's Arch Sonar Echo memory trial
- Trench Fishing for 6 abyssal fish species
- Four Sunken Lanterns quest that awakens the Phosphor Tide

## 31. The Lantern Guild

- Guild Board in Hollow Pine, in the HUD, and in Activities
- Six Guild Ranks earned by completing expeditions
- Five timed Companion Expeditions across Saltwick Coast, Southern Frontier, Skyward Isles, Sunken Deep and Blackwood's Stairwell
- Guild Armory with permanent passives (Courier's Boots, Wayfinder's Satchel, First-Lantern Oil) and Guild cosmetics
- World Mastery tracker summarizing completion across 12 Kitsune World pillars

## 32. The Deep Mines

- Walkable procedurally generated mine shafts entered from The High Post ridge `(46, 18)`, the Mine HUD button, or Activities
- Seven ore vein types (Copper, Tin, Silver, Gold, Jade, Ruby, Moonstone) shared with Town Square's Charm Forge
- Four Pickaxe tiers and three Lamp Stamina tiers
- Ore smelting into mon and Miner's Helmet + Crystal Cluster milestone rewards

## 33. Deep Blackwood

- Standalone book realm entered through The Meridian Gate (`74, 60`) in Kitsune World
- Twelve scenes based on the late Blackwood episodes: Meridian Station · Sector 4, Airlock 13 · The Drift, The Last Stop Rewrite, The Lower Screaming · Sub-Tray 9, The Fifth Horseman's Room, The Cathedral Inside-Out, The Wall Yuki Opened, The Hall of 104,000 Questions, The Grief Furnace, Biscuit's Meadow, The Unfiled Annex, and Meridian Observation Deck
- Eight-chapter questline, ten relics, The First Winter and The Furnace Warden boss fights, and Meridian Thermal Wrench weapon

## 34. Blackwood Student Powers

- Interactive and autonomous student powers (`public/js/world/powers.js`) active across both Blackwood University and Deep Blackwood
- Thirteen castable powers including Hero's Flame Burst, Poppy's 1-Star Review, Kevin's Zero-G Drift, Luna's Time Snap rewind, Imani's Mortality Chill, Violet's Kiln Mirage, Kimi's Shadow Ink, Officer Rusk's Detention Stamp, Madison's Friendship Pulse, Famine's Hollow Stomach, and War's Battle Frenzy
- Cleanse support via Nurse Marlowe, Saffron, Lunch Lady, and Okonkwo

## 35. Eastern Frontier, Southern Sea & Book Realm Expansions

- Overworld expanded to `304×280` with 25 total regions: added Eastern Frontier (The Amber Woods, The Salt Flats, The Obsidian Coast) and Southern Sea (The Kelp Archipelago, The Prism Reefs, The Maelstrom Rim), each with buildings, NPCs, beacons, fish, forage items, delves, trials, bounties, and side quests
- Backrooms expanded to 16 scenes and 13 relics with The Hub, Level 6 (Lights Out, The Elder Smiler boss), Level 94 (Motion), Level ! (Run For Your Life), Level 4 (Abandoned Office), and M.E.G. Crowbar
- Incarnate expanded to 20 scenes and 17 relics with The Pale Corridor (The Pale Horseman boss), The Salt Pantry, Beyond the Pocket, and Salt-Line Blade
- Skyward Isles expanded to 5 floating islands (added The Windmill Sanctum), 5 Wind-Bells, 8 Sky Fish, and 8 Constellations
- Sunken Deep expanded to 5 underwater zones (added The Hydrothermal Spire), 5 Sunken Lanterns, and 8 Abyssal Fish
- Lantern Guild expanded to 8 ranks, 8 expeditions, 8 armory items, and 15 World Mastery pillars; Deep Mines expanded to 6 pickaxes, 5 lamps, and 9 ore veins (Starfall Ore & Voidglass Seam)
- Added 12 Signature Cards (55 total), 4 Detective Agency cases (20 total), 2 World Events (12 total), 6 Night Siege towns (17 total), 2 Fox Derby courses + Abyssal Cup (14 courses, 5 cups), and 4 hats + 4 furniture items (50 hats, 60 furniture)

## 36. Five New Standalone Realms (9 Total Realms, 119 Scenes)

- **The Spirit Express (`express`)**: 6-car starlight train from Platform Zero (`99, 76`), with The Unpunched Conductor boss and Star-Coal Poker weapon
- **The Starlight Citadel (`citadel`)**: 5 suspended halls above The High Post (`60, 18`), with The Astral Warden boss and Starlight Lance weapon
- **The Lantern Under-Market (`undermarket`)**: 6 subterranean bazaar halls beneath The Night Market (`60, 74`), with The Mask Broker boss and Foxfire Halberd weapon
- **The Hollow Clockworks (`clockworks`)**: 5 brass gear-chambers beneath Brask (`19, 45`), with The Grand Horologist boss and Clockwork Rapier weapon
- **The Emerald Root-Vault (`emeraldvault`)**: 5 crystal chambers beneath The Emerald Palace in Oz (`104, 42`), with The Emerald Automaton boss and Emerald Greatsword weapon
- Blackwood University expanded to 44 scenes and 35 relics (Madison's Pink Rooftop, Power Sparring Gym, Detention Wing, Star-Deck) plus overlapping **Power Combos** (Solar Flare Drift, Abyssal Eclipse, Academic Probation)

## 37. The Astral Arena & World Codex

- **Astral Arena (`public/js/world/arena.js`)**: Challenge 5 exclusive Arena Champions (*The Paper Ronin*, *The Tide-Glass Chimera*, *The Meridian Automaton*, *The Nine-Tail Shadow*, *The Glasswing Sovereign*) or clear the **Grand Gauntlet** (`+1,000 mon`, `+300 Renown`)
- **World Codex (`public/js/world/codex.js`)**: Unified Encyclopedia in Activities covering all 9 Realms, Bosses & Champions, Weapons & Gear (`59` hats, `69` furniture), and the 33-Region Atlas

## 38. Outer Horizon & Deep Southern Sea (`368×336` Overworld)

- Overworld expanded to `368×336` with **33 total regions**, **41 buildings**, **71 NPCs**, **60 fish species**, **25 Far Beacons**, **25 Delves**, **25 Regional Trials**, **44 Side Quests**, and **29 Bounties**
- Added **Outer Horizon** (The Frostspire Wastes, The Jade Valley, The Sunspire Mesa, The Abyssal Shelf) and **Deep Southern Sea** (The Ambergris Atoll, The Sea of Glass, The Cinder Atoll, The World's Edge)
- Updated **Lantern Cards** to **71 Signature Cards**, **Night Siege** to **25 towns**, and **Fox Derby** to **18 courses (7 cups)**

## 39. Moonwake Bay's East District (Wings & Wildflowers)

- Moonwake Bay widened to `140×48` with a new east district: a vertical road, a flower meadow east of the bakery, and three new buildings — **the Butterfly Conservatory** (`108, 3`), **the Mooncrumb Bakery** (`108, 13`) and **The Gift Wagon** (`113, 33`)
- **Bug catching** (`public/js/world/baywild.js`): 24 bug species in five rarities wander the meadow flowers, grass and sand — ladybugs to Monarchs, Moon moths and Glasswings; a featured rare bug flutters each day. Walk up (they flee if you rush), press **E** to swing your net (`N` or the HUD Bugs button opens the book)
- Four net tiers at the Conservatory (Palm Frond → Woven → Brass Ring → Moon-Silk) that raise catch odds and calm the shy ones
- **Marigold's trades** at the Conservatory: three daily asks paid in shells and arcade tickets; catches are an inventory you can turn in or keep
- **Mooncrumb Bakery job**: a pull-the-tray timing game — load a pastry, take it out inside the green window, and it's perfect for the front of the queue; wrong pastry, raw or burnt costs the clock. Levelled like the other jobs, and perfect bakes count toward a goal
- **The Gift Wagon**: three gift tiers that wrap themselves for five minutes, then unwrap into shells, tickets, critter wear, eggs, a plushie shelf of 12 collectible plushies, or a jackpot — and a Golden Moonwake plush only found in Starlight Gifts
- Six new Bay Goals (catch 10 bugs, 12 species, a Legendary bug, the Brass Ring Net, 10 perfect pastries, 6 plushies), new folk chatter, and east-district walking routes for the townsfolk
- The Kitsune Museum gains three wings: **Butterfly Room** (all 24 bugs), **Plushie Parlor** (the 12 collectible plushies) and **Bay Pier** (the 15 pier fish), each filling in as you catch them
- **Trick School** at Seashell School: six tricks (Sit, Spin, Speak, Fetch, Dance, Backflip), each trained through five levels with a watch-and-copy arrow routine (buttons or keyboard); lessons cost shells only when learned, and mastered tricks pay out in an end-of-term showcase (three performances a day)
- The World Codex gains a **Moonwake Bay** tab: critters, bugs, fish, shells, plushies, goals and job shifts with live completion counts
- **The Glasswing Sovereign** joins the Astral Arena as its fifth champion — a meadow-wing boss whose clear wings beat with the fruit trees; beating it wins the **Glasswing Crown** hat and the **Moon Moth Lantern** for your house, and the Astral Gauntlet becomes five rounds

## 40. The Lantern Carnival (`public/js/world/carnival.js`)

- A walkable fairground (`96×64`) reached from the world HUD's Carnival button: striped show tents, lantern strings over the midway, a rotating ferris wheel and a wandering barker with a line for everyone
- **Ring Toss**: a sweeping marker and a shrinking striped zone; three rings, two tickets a hit, an all-three bonus
- **High Striker**: an oscillating strength puck; every 20 points is a ticket and the 90-point bell pays two more
- **Shooting Gallery**: paper stars and friendly moths pop up across nine holes for 25 seconds — stars pay a ticket each, moths take one back
- **Madam Fortuna's Wheel**: one spin a day, eight segments of mon, tickets and fortune lines, and a rare shot at the **Ringmaster's Hat**
- **Prize Counter**: tickets trade for mon, the Level Fun party hat, the **Carnival Tent Lamp** furniture and the Ringmaster's Hat; every game but the prizes has a three-round daily allowance

## 41. The Roulette Wave (nine lanes at once)

- **Deep Mines**: Opal and Amber veins, the Comet Pick and Starlight Lamp tiers, the 5%-a-strike Geode event and the Cometfall Hollow stratum with its own milestone
- **World Events**: Moth Migration (moths swarm at double the foxfire rate), Foxfire Storm (catch falling embers worth 5 mon each) and Lantern Regatta (paper boats pay mon and lantern wishes)
- **Moonwake Bay Neighbour Board**: three new request kinds — bring bugs from your journal (consuming), hold K different plushies, and show a caught pier fish
- **Foxglove Detective Agency**: three new hand-authored cases (an alibi timeline, a physical-evidence theft, a sworn-testimony liar case), each proven to solve to exactly one culprit
- **Fox Derby**: The Great Atoll Hop, Moonwake Beach Sprint and Starlight Steeplechase, the Steeplechase Cup, and tailwind gusts on long straights that briefly boost every racer
- **Night Siege**: the Ember Sapper (stuns the nearest tower on death) and the Pale Wraith (immune to slows), plus the zero-damage Ward Beacon whose glow makes every tower in range hit 15% harder
- **Lantern Guild**: The Mine Rescue and Regatta Guard expeditions, and the Carnival Pass (+10% expedition mon) and Moth Charm (+1 expedition loot) armory perks
- **Kitsune Browser site adapters (v143)**: Hacker News threads and profiles (Algolia API), BoardGameGeek things and users (XMLAPI2), TVMaze shows with season-by-season episode lists
- **Feeds**: JSON Feed 1.1 support end to end, media:content / media:thumbnail / itunes:image artwork and audio on episode cards, and podcast author and category on feed headers
- **Instant answers (v144)**: Morse code both ways, Roman numerals both ways, SHA-256, ROT13, HTTP status reasons with quips, five-field cron schedules in plain English, and hex/rgb/hsl colours
- **Compat suite round two**: shadowdom, emoji shaping, oddball URLs, prefetch/preload and legacy nested-table fixtures, with three engine fixes found along the way (print styles never applied on screen, cellpadding honoured via `--kb-kp`)

## 42. App-Wide Wave (tools, cosmetics, stats, daemons, an original, Winterfest)

- **Browser tools v145 (`webplus26.js`)**: reading time broken down by section with a jumpable plan; a per-site reading-goal stopwatch with daily memory; highlight-every-number with the biggest value called out; the page's quotes with attribution and Markdown copy; an abbreviations-and-definitions glossary; and footnote renumbering with undo
- **Cosmetics**: Twilight and Fern themes, deep-teal and persimmon accents, Festival Goldfish and Firefly cursor packs, and falling-maple, paper-lantern and fireflies wallpapers
- **Stats & Wrapped**: Regular and Page Mountain achievements, a reading-calendar insight (best day and best hour), a records strip (longest streak, biggest day, fastest finish), and two new Wrapped slides — Your longest night / golden hour, and Your most-read author
- **Daemons**: a reading-pace nudge, a series next-volume finder (shelf gaps like "you own 1, 2 and 5"), a feed digester that speaks up when unread piles past your threshold, and a weekly reading report on the weekday you choose
- **A new Kitsune Original**: *The Carnival of Nine Lanterns* (2,600 words, CC BY 4.0, hand-drawn cover) — Kitsu delivers nine letters to the carnival that exists one night a year, and the ninth is addressed to the moth that keeps secrets
- **Winterfest**: Icicle Bridge and Wassail Stand join the arcade (32 minigames), the Blizzard Ptarmigan pet, the Yule Lantern theme, Ice Skate cursor and Ice Carousel house furniture, and a deterministic daily Snowfall Forecast on the seasonal pages

## 43. Wave Four (trials, the Kite Yard, cards, code tools, lookups, sounds)

- **Regional Trials**: Harbor Lantern Parry (Starlight Harbor, a four-direction ember reflex) and Moonlit Shell Seals (Moonlit Shoals, a lights-out flip puzzle against the clock), both driven by the existing trial engine
- **Skyward Isles, a sixth island**: The Kite Yard — Sela the Kitemaker and Vane the Wind-Reader, the Kite Works and Wind-Reader's Watch, a seventh Wind-Bell and the Paper Kitefish, reached by cloud bridge from Galeharbor (the stale hardcoded bell counter went dynamic along the way)
- **Lantern Cards, a wave of eight**: Marigold's Butterflies, Glasswing Moth, The Monarch, Barker Pin, Madam Fortuna, The Ward Beacon, Blizzard Ptarmigan and Wassail Server — engine-proven with balance neighbours and a full match smoke
- **Code tools v114**: a JSON→JSON-Schema inferrer, a Unix⇄ISO timestamp toolkit, a regex timing scorer over the page's code blocks, and a messy-text table aligner
- **Lookups**: "Is it an idiom?" senses from Wiktionary's Idiom sections on multi-word selections, and a full 118-element chemistry table — "Fe" now opens the Iron article instead of a disambiguation page
- **Sound**: carnival (distant calliope over a crowd), meadow (crickets and breeze) and snowfall (wind and rare sleigh bells) soundscapes, plus ticket, spin, fortune and plush interface sounds
- **Offline shell**: every realm module is precached again — Arena, Codex, Guild, Deep, Deepcore, Mines, Sky, Skycore, Calypso, Mindai, Powers and the five book realms had been dynamically imported without ever joining the install cache

## 44. Expand-All-Worlds Wave (Moonwell, four delves, far frontier, two realm scenes)

- **The Sunken Deep, a seventh zone**: The Moonwell Cavern — Selene the Moonkeeper, the Moonwell Shrine, the Moonwell Lantern (30 pearls), Moonwell Koi and Moonwell Wraith fish, the Moon Moth Lantern at the Pearl Exchange, and every lantern counter in the realm went dynamic
- **Four new Delves** in the base country: The Overdue Stacks (The Overdue King, the Drowned Reservoir), The Second Cellar (The Second Thief, Brask), The Dead Letter Crypt (The Dead Letter Office, the High Post) and The Left-Luggage Line (The Last Porter, Platform Zero), each with a furniture trophy in the museum's Trophy Hall — 149 delves in all, and the delve doors now anchor through the region table
- **Four new far regions**: The Hanging Icefall, The Driftwood Estuary, The Lantern Orchard and The Glass Desert, each with a building, resident, fish, forage and beacon — the frontier is 149 regions wide with zero bounding-box collisions
- **The Spirit Express, an eighth car**: The Dead-Letter Car — the Dead-Letter Clerk, a parcel addressed to the never-punched conductor since 1892, and the never-punched ticket blank relic
- **The Starlight Citadel, a seventh hall**: The Brass Lens Loft — Astronomer Odo polishing the great lens between the Warden's inspections, and the brass lens-cap relic
- **Two Regional Trials**: Harbor Lantern Parry (Starlight Harbor) and Moonlit Shell Seals (Moonlit Shoals)
- **Fixed in passing**: the World view could crash on load — the treasure-chest scatter spread the whole walkable-tile array (~100k tiles) into `open.push(...)`, exhausting the call stack; it now filters by zone without a spread. The Guild's World Mastery totals (beacons, delves, trials) now count live data instead of a stale hardcode

## 45. The Daily Bug Contest

- The Butterfly Conservatory runs a **Daily Bug Contest**: one catchable species is the day's contest bug, deterministic per day, always rarity Rare or below so it's always findable
- Every contest bug caught adds a "Contest catch!" to your net swing, tracked on the Conservatory's new Contest tab
- Four prize steps — 3, 5, 8 and 12 catches — pay 40/70/110/160 shells and 4/6/8/12 arcade tickets, each claimable once per day

## 46. Six New Oz Originals

Kitsune Originals grows by six new stories set in L. Frank Baum's public-domain Land of Oz, each with a hand-drawn cover and kept offline:

- **The Melody Bank of Oz** — a bank that keeps melodies in drawers and pays interest in harmonies; a clockwork clerk who files a lullaby under Hush; and a seventh harmony that grew an ending into itself while it waited fifty years for its grandmother's voice
- **The Fourteenth Color of Oz** — a colorsmith mixes a color that is not one of Oz's official thirteen, and it hums; the Dictionary sulks, the Official Namer is away naming mushrooms, and an apprentice with perfect pitch names the color after what it truly is
- **The Royal Weather of Oz** — a wedding drizzle scheduled one hundred and forty years in advance arrives a century and a half early on the strawberry parade, and three clerks (a retired Rain Fairy, a retired thunder, a very literal Sandman) apologize in weather; the culprit is a hailstone paperweight, melting through the Schedule since the booking was made
- **The Nine Windows of Oz** — nine attic windows blown from undeliverable letters, a jar of August millpond and six autumns' first-fire ash each look into somebody else's yesterday; when the ninth pane is sold, yesterday leaks into the village as old snow, an unlearned song and one very calm fish
- **The Courthouse of Oz** — a signpost stands trial for pointing at itself, with an opinionated sofa for the defense, a brand-new gavel for the prosecution, and a verdict on whether being wrong on purpose can be a kindness
- **The Migrating Meadow of Oz** — a Quadling meadow walks south at the speed of a thoughtful cow, and the Registry's eviction notice turns out to be an invitation printed on the back, which only the birdbath can read; the meadow's four-hundred-year path home is written in its clover

All six are public-domain Oz only, released under Creative Commons Attribution 4.0 with the other Kitsune Originals, precached for offline reading, and every story ends quietly and glad.

## 47. The Emerald City Understories

The six new Oz originals walk off the page and into the World — six story locations around the Emerald Palace, each playable:

- **The Melody Bank** (bank, new columned building style): deposit mon as a melody, filed under H for Honest by Hengist the clockwork clerk; it earns ten percent an hour in harmonies, up to eight hours, and pays out when you withdraw
- **The Royal Weather Office**: a deterministic daily forecast in Mrs. Cumulus's voice, plus bookable personal weather — Drizzle, Breeze, Sun-shower or Snow-fitting — delivered tomorrow morning for 40 mon, with the Office's card under the counter glass: CHECK YOUR PAPERWEIGHTS
- **The Courthouse of Oz** (new pillared building style): one case a day from a pool of seven, each a thing from the new stories on trial — the signpost, the birdbath, the Fourteenth Color, the wedding drizzle itself — with a kind verdict and a stern verdict, and the sofa comfortable either way
- **Master Indigo's Colorsmith Shop**: a daily three-part commission from the thirteen official colors, mixed in any order; the rack's parliament watches you pour
- **The Nine Windows**: one window a day, deterministic, and each glimpse is built from your own save — the count of lanterns you have lit, boxes you have dug, orbs you have found — paid at 12 mon a look
- **The Migrating Meadow Signpost**: the meadow itself moves to a new Emerald City green each day (deterministic by date, seven wandering spots); find it where it stands and the birdbath pays 30 mon and reads you the small print

Six new overworld buildings (171 total, no overlaps), two new building art styles (bank and courthouse), and every location voiced from its story.
