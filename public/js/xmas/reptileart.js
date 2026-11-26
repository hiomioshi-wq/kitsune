// Clade- and species-accurate cute SVG renderers for all 45 new Sunscale Reptile House species.
// Monitors ("monitor") and False Water Cobras ("fwc") continue using their dedicated renderers in art.js.

export const REPTILE_FAMILIES = new Set([
  "gecko",
  "agamid",
  "skink",
  "chameleon",
  "snake",
  "chelonian",
  "croc",
]);

function eyesMarkup(mood, x1, x2, y, r = 4.6, iris = "#181a24", slit = false, slitCol = "#0c0d12") {
  if (mood === "sleepy") {
    return `<path d="M${x1 - r} ${y + 1}q${r} 4 ${r * 2} 0M${x2 - r} ${y + 1}q${r} 4 ${r * 2} 0" stroke="#181a24" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }
  if (mood === "love") {
    return `<path d="M${x1} ${y + 3}l-4 -4a2.4 2.4 0 0 1 4 -2.4a2.4 2.4 0 0 1 4 2.4ZM${x2} ${y + 3}l-4 -4a2.4 2.4 0 0 1 4 -2.4a2.4 2.4 0 0 1 4 2.4Z" fill="#e0343e"/>`;
  }
  const pupil = slit
    ? `<ellipse cx="${x1}" cy="${y}" rx="${Math.max(1.3, r * 0.28)}" ry="${r * 0.84}" fill="${slitCol}"/><ellipse cx="${x2}" cy="${y}" rx="${Math.max(1.3, r * 0.28)}" ry="${r * 0.84}" fill="${slitCol}"/>`
    : "";
  const brow = mood === "sad"
    ? `<path d="M${x1 - r - 1} ${y - r - 1}l${r * 1.8} -2.2M${x2 + r + 1} ${y - r - 1}l-${r * 1.8} -2.2" stroke="#181a24" stroke-width="2" stroke-linecap="round"/>`
    : "";
  return `
    <circle cx="${x1}" cy="${y}" r="${r}" fill="${iris}"/>
    <circle cx="${x2}" cy="${y}" r="${r}" fill="${iris}"/>
    ${pupil}
    <circle cx="${x1 + r * 0.34}" cy="${y - r * 0.32}" r="${Math.max(1.4, r * 0.34)}" fill="#fff"/>
    <circle cx="${x2 + r * 0.34}" cy="${y - r * 0.32}" r="${Math.max(1.4, r * 0.34)}" fill="#fff"/>
    ${brow}`;
}

const festAcc = (stage, scarfY = 66, hatY = 26) => ({
  scarf: stage >= 2
    ? `<path d="M40 ${scarfY}Q60 ${scarfY + 10} 80 ${scarfY}L82 ${scarfY + 7}Q60 ${scarfY + 17} 38 ${scarfY + 7}Z" fill="#d3312f"/><path d="M68 ${scarfY + 6}l7 13l-7 -2l-5 -9Z" fill="#b52228"/>`
    : "",
  hat: stage >= 3
    ? `<g transform="translate(0 ${hatY - 26})"><path d="M45 26Q55 6 74 12Q80 16 79 27Q62 20 45 26Z" fill="#d3312f"/><path d="M41 27Q60 20 81 27" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="81" cy="14" r="4.6" fill="#fff"/></g>`
    : "",
});

function drawGecko(id, c, b, a, mood, stage) {
  const leaf = id === "leaftailgecko";
  const crest = id === "crestedgecko";
  const tokay = id === "tokaygecko";
  const leachie = id === "leachianus";
  const leo = id === "leopardgecko";

  const tail = leaf
    ? `<path d="M78 90C96 86 112 72 110 56C108 42 92 48 86 58L94 60L84 68C79 75 76 83 78 90Z" fill="#633223" stroke="#422016" stroke-width="1.8"/><path d="M80 87C91 79 101 67 107 54" stroke="#c88a68" stroke-width="1.6" fill="none"/>`
    : leo
    ? `<path d="M76 92C98 96 114 84 106 66C101 56 91 61 90 70C89 77 82 84 74 86Z" fill="#f2e2fa" stroke="${c}" stroke-width="2"/><path d="M90 73q6 4 12 0M86 82q6 4 12 1" stroke="#3a2e38" stroke-width="2" fill="none"/><circle cx="98" cy="70" r="2.2" fill="#3a2e38"/><circle cx="94" cy="81" r="2" fill="#3a2e38"/>`
    : crest
    ? `<path d="M78 90C102 92 112 72 102 58C95 49 84 55 88 64C90 69 96 68 95 62" stroke="${c}" stroke-width="7.5" stroke-linecap="round" fill="none"/><circle cx="95" cy="61" r="3" fill="${b}"/>`
    : leachie
    ? `<path d="M76 90C98 95 108 82 102 68C97 58 88 66 84 76Z" fill="${c}"/><ellipse cx="94" cy="79" rx="5" ry="3" fill="${b}" opacity=".65"/>`
    : `<path d="M76 90C102 94 114 76 105 56C102 50 96 54 97 60" stroke="${c}" stroke-width="8" stroke-linecap="round" fill="none"/>${tokay ? `<circle cx="94" cy="84" r="2.5" fill="${a}"/><circle cx="102" cy="74" r="2.5" fill="${a}"/><circle cx="103" cy="62" r="2.2" fill="${a}"/>` : ""}`;

  const feet = `
    <path d="M36 86L22 94M22 94l-4 -3M22 94l-4 1M22 94l-2 4" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M84 86L98 94M98 94l4 -3M98 94l4 1M98 94l2 4" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M40 104L26 112M26 112l-4 -2M26 112l-3 3M26 112l0 4" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M80 104L94 112M94 112l4 -2M94 112l3 3M94 112l0 4" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/>`;

  const bodyPat = leo
    ? `<circle cx="46" cy="78" r="2.4" fill="#3a2e38"/><circle cx="62" cy="76" r="2.8" fill="#3a2e38"/><circle cx="72" cy="84" r="2.3" fill="#3a2e38"/><circle cx="52" cy="90" r="2.6" fill="#3a2e38"/><circle cx="66" cy="95" r="2.2" fill="#3a2e38"/><circle cx="48" cy="30" r="2" fill="#3a2e38"/><circle cx="68" cy="32" r="2" fill="#3a2e38"/>`
    : tokay
    ? `<circle cx="45" cy="78" r="2.8" fill="${a}"/><circle cx="60" cy="74" r="3" fill="${a}"/><circle cx="73" cy="82" r="2.6" fill="${a}"/><circle cx="50" cy="92" r="2.8" fill="${a}"/><circle cx="67" cy="94" r="2.5" fill="${a}"/><circle cx="46" cy="32" r="2.3" fill="${a}"/><circle cx="72" cy="34" r="2.3" fill="${a}"/>`
    : leachie
    ? `<path d="M36 86q4 14 10 18M84 86q-4 14 -10 18" stroke="#424a30" stroke-width="2.5" fill="none"/><ellipse cx="48" cy="82" rx="5" ry="3" fill="${b}" opacity=".6"/><ellipse cx="70" cy="88" rx="6" ry="3.2" fill="${b}" opacity=".6"/>`
    : crest
    ? `<path d="M43 74l5 3l4 -3l5 3l4 -3l5 3l4 -3M45 34L40 24L48 29L44 21L52 27M75 34L80 24L72 29L76 21L68 27" stroke="${b}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
    : leaf
    ? `<path d="M42 32L34 18L47 28ZM78 32L86 18L73 28Z" fill="${a}"/><path d="M44 76l8 6l8 -6l8 6l8 -6" stroke="${a}" stroke-width="2.2" fill="none" opacity=".75"/>`
    : "";

  const irisCol = leaf ? "#d84828" : tokay ? "#ffbe3b" : crest ? "#d97828" : "#222430";
  const eyeR = leaf || crest ? 6.2 : 5.4;
  const gEyes = eyesMarkup(mood, 45, 75, 44, eyeR, irisCol, true, "#0b0c12");
  const { scarf, hat } = festAcc(stage, 66, 23);

  return `${tail}${feet}
    <ellipse cx="60" cy="90" rx="${leachie ? 25 : 21}" ry="19" fill="${c}"/>
    <ellipse cx="60" cy="94" rx="14" ry="13" fill="${b}" opacity=".92"/>
    <path d="M32 48C32 28 45 22 60 22C75 22 88 28 88 48C88 61 73 69 60 69C47 69 32 61 32 48Z" fill="${c}"/>
    <ellipse cx="60" cy="59" rx="14" ry="7.5" fill="${b}" opacity=".88"/>
    ${bodyPat}
    <ellipse cx="37" cy="54" rx="4.5" ry="2.6" fill="#ff8fa8" opacity=".52"/>
    <ellipse cx="83" cy="54" rx="4.5" ry="2.6" fill="#ff8fa8" opacity=".52"/>
    ${gEyes}
    <path d="M51 59Q60 65 69 59" stroke="#181a24" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${!leaf && mood !== "sad" ? `<path d="M60 62q3 5 0 7q-3 -2 0 -7Z" fill="#ff7694"/>` : ""}
    ${scarf}${hat}`;
}

function drawAgamid(id, c, b, a, tl, mood, stage) {
  const beardie = id === "beardeddragon";
  const frilled = id === "frilledlizard";
  const uro = id === "uromastyx";
  const gIguana = id === "greeniguana";
  const wDragon = id === "waterdragon";
  const rhinoIg = id === "rhinoiguana";
  const armadillo = id === "armadillolizard";
  const gila = id === "gilamonster";
  const tuatara = id === "tuatara";

  const tail = uro
    ? `<path d="M74 92C96 96 112 86 108 70C105 62 96 66 96 74" stroke="${c}" stroke-width="13" stroke-linecap="round" fill="none"/><path d="M84 86l3 10M92 84l4 9M100 79l6 6M103 71l7 2" stroke="${a}" stroke-width="2.6" stroke-linecap="round"/>`
    : armadillo
    ? `<path d="M74 92C98 95 110 82 104 62C100 50 90 52 90 60" stroke="${c}" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M84 88l3 -6M93 84l5 -5M100 76l6 -4M102 66l6 -1" stroke="${a}" stroke-width="3" stroke-linecap="round"/>`
    : gila
    ? `<path d="M74 92C96 96 110 88 106 74C103 68 96 71 96 78" stroke="${c}" stroke-width="13" stroke-linecap="round" fill="none"/><path d="M85 88v10M96 82l4 9M103 74l5 5" stroke="${b}" stroke-width="4" stroke-linecap="round"/>`
    : `<path d="M74 92C102 96 114 78 109 50C107 40 100 42 100 49" stroke="${c}" stroke-width="${beardie ? 9 : 7.5}" stroke-linecap="round" fill="none"/>${gIguana || wDragon || frilled ? `<path d="M88 92l2 -5M98 85l4 -4M106 72l5 -3M108 58l5 -2" stroke="${a}" stroke-width="3" stroke-linecap="round"/>` : ""}`;

  const frill = frilled
    ? `<g><path d="M60 44L20 26Q14 48 24 68L60 56Z" fill="${a}" stroke="${c}" stroke-width="2.5"/><path d="M60 44L100 26Q106 48 96 68L60 56Z" fill="${a}" stroke="${c}" stroke-width="2.5"/><path d="M60 46L26 36M60 49L23 50M60 52L27 62M60 46L94 36M60 49L97 50M60 52L93 62" stroke="${b}" stroke-width="2" stroke-linecap="round"/></g>`
    : "";

  const crest = gIguana || wDragon || rhinoIg || tuatara
    ? `<path d="M56 14L60 22L64 14M44 72l4 -6l4 6M56 71l4 -6l4 6M68 72l4 -6l4 6" stroke="${tuatara ? b : a}" stroke-width="2.4" stroke-linejoin="round" fill="none"/>`
    : "";

  const beard = beardie
    ? `<path d="M35 58L32 67L41 64L45 73L53 67L60 76L67 67L75 73L79 64L88 67L85 58Z" fill="${a}" stroke="#2a1d14" stroke-width="1.2"/>`
    : gIguana || wDragon
    ? `<path d="M49 62Q60 80 71 62Z" fill="${gIguana ? "#e88a38" : "#2890d8"}" opacity=".9"/>`
    : "";

  const horns = rhinoIg
    ? `<path d="M55 48L57 40L59 48ZM60 46L60 36L62 46ZM61 48L63 40L65 48Z" fill="#d8dadc" stroke="#222" stroke-width="1"/>`
    : tuatara
    ? `<circle cx="60" cy="31" r="2.3" fill="${a}" stroke="#283424" stroke-width="1"/>`
    : "";

  const bodyPat = gila
    ? `<path d="M40 78Q60 72 80 78M38 88Q60 82 82 88M42 98Q60 92 78 98" stroke="${b}" stroke-width="5.5" stroke-dasharray="4 3" stroke-linecap="round" fill="none"/><circle cx="48" cy="34" r="2.6" fill="${b}"/><circle cx="72" cy="34" r="2.6" fill="${b}"/>`
    : armadillo
    ? `<path d="M38 78H82M37 86H83M39 94H81M44 72v28M55 71v30M66 71v30M76 72v28" stroke="${a}" stroke-width="2.1" opacity=".82"/>`
    : uro
    ? `<circle cx="46" cy="80" r="2.5" fill="${b}"/><circle cx="60" cy="76" r="2.5" fill="${b}"/><circle cx="72" cy="82" r="2.5" fill="${b}"/><circle cx="54" cy="90" r="2.5" fill="${b}"/><circle cx="67" cy="92" r="2.5" fill="${b}"/>`
    : wDragon || gIguana
    ? `<path d="M40 78Q60 84 80 78M40 88Q60 94 80 88" stroke="${a}" stroke-width="2.5" fill="none" opacity=".8"/>${gIguana ? `<circle cx="38" cy="55" r="4.5" fill="${b}" stroke="#1f4d24" stroke-width="1.3"/><circle cx="82" cy="55" r="4.5" fill="${b}" stroke="#1f4d24" stroke-width="1.3"/>` : ""}`
    : beardie
    ? `<path d="M35 80l-4 3l4 3M85 80l4 3l-4 3M34 90l-4 3l4 3M86 90l4 3l-4 3" stroke="${a}" stroke-width="2.2" fill="none"/>`
    : "";

  const legs = `
    <path d="M36 86L23 97L28 103L40 94ZM84 86L97 97L92 103L80 94ZM40 102L28 112L35 115L46 106ZM80 102L92 112L85 115L74 106Z" fill="${c}"/>`;

  const eyeIris = tuatara || gila ? "#141418" : beardie ? "#b86a18" : "#1c1f28";
  const aEyes = eyesMarkup(mood, 46, 74, 44, 4.8, eyeIris, tuatara || beardie, "#0d0e12");
  const { scarf, hat } = festAcc(stage, 67, 22);

  return `${tail}${legs}${frill}
    <ellipse cx="60" cy="89" rx="${beardie || uro || gila ? 26 : 22}" ry="19" fill="${c}"/>
    <ellipse cx="60" cy="93" rx="15" ry="13" fill="${b}" opacity="${gila ? 0.5 : 0.9}"/>
    ${bodyPat}${beard}${crest}
    <path d="M33 48C34 28 46 21 60 21C74 21 86 28 87 48C87 61 73 69 60 69C47 69 33 61 33 48Z" fill="${c}"/>
    <ellipse cx="60" cy="58" rx="14" ry="8" fill="${b}" opacity="${gila ? 0.3 : 0.85}"/>
    ${horns}
    <ellipse cx="38" cy="53" rx="4.2" ry="2.4" fill="#ff8fa8" opacity=".46"/>
    <ellipse cx="82" cy="53" rx="4.2" ry="2.4" fill="#ff8fa8" opacity=".46"/>
    ${aEyes}
    <path d="M51 59Q60 64 69 59" stroke="#181a24" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${scarf}${hat}`;
}

function drawSkink(id, c, b, a, mood, stage) {
  const bts = id === "bluetongueskink";
  const shingle = id === "shingleback";
  const tegu = id === "argentinetegu";

  const tail = shingle
    ? `<path d="M74 92C92 98 106 94 104 80C102 70 88 73 80 82Z" fill="${c}" stroke="#2d2218" stroke-width="2"/>`
    : `<path d="M74 92C102 96 114 80 107 58C105 51 98 53 99 60" stroke="${c}" stroke-width="${bts ? 11 : 9}" stroke-linecap="round" fill="none"/>`;

  const bands = shingle
    ? `<path d="M40 78l5 -4l5 4l5 -4l5 4l5 -4l5 4l5 -4l5 4M38 88l5 -4l5 4l5 -4l5 4l5 -4l5 4l5 -4l5 4" stroke="${b}" stroke-width="2.2" fill="none"/>`
    : tegu
    ? `<path d="M38 78Q60 72 82 78M37 87Q60 81 83 87M40 96Q60 90 80 96" stroke="#f4f4f8" stroke-width="4" stroke-dasharray="3 3" stroke-linecap="round" fill="none"/><ellipse cx="37" cy="54" rx="7" ry="6" fill="#24262c"/><ellipse cx="83" cy="54" rx="7" ry="6" fill="#24262c"/>`
    : `<path d="M39 78Q60 72 81 78M38 88Q60 82 82 88M42 98Q60 92 78 98" stroke="#3c2618" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;

  const tongue = bts || shingle
    ? `<path d="M55 61Q60 79 65 61Z" fill="#2f7bff" stroke="#1842a8" stroke-width="1.2"/>`
    : mood === "sad"
    ? ""
    : `<path d="M60 62v8M60 70l-3 4M60 70l3 4" stroke="#ff6e8a" stroke-width="2.2" stroke-linecap="round" fill="none"/>`;

  const { scarf, hat } = festAcc(stage, 66, 22);
  return `${tail}
    <path d="M36 88L26 98L31 103L40 94ZM84 88L94 98L89 103L80 94ZM41 103L32 112L38 115L46 106ZM79 103L88 112L82 115L74 106Z" fill="${c}"/>
    <ellipse cx="60" cy="89" rx="25" ry="20" fill="${c}"/>
    <ellipse cx="60" cy="94" rx="15" ry="13" fill="${b}"/>
    ${bands}
    <path d="M33 48C33 28 45 21 60 21C75 21 87 28 87 48C87 60 74 68 60 68C46 68 33 60 33 48Z" fill="${c}"/>
    <ellipse cx="60" cy="58" rx="14" ry="8" fill="${b}"/>
    <ellipse cx="38" cy="53" rx="4.2" ry="2.4" fill="#ff8fa8" opacity=".48"/>
    <ellipse cx="82" cy="53" rx="4.2" ry="2.4" fill="#ff8fa8" opacity=".48"/>
    ${eyesMarkup(mood, 46, 74, 44, 4.8, "#181a24")}
    <path d="M50 58Q60 63 70 58" stroke="#181a24" stroke-width="2" fill="none"/>
    ${tongue}${scarf}${hat}`;
}

function drawChameleon(id, c, b, a, mood, stage) {
  const veiled = id === "veiledchameleon";
  const casque = veiled
    ? `<path d="M46 36Q56 6 70 16L74 38Z" fill="${c}" stroke="#206834" stroke-width="2"/>`
    : `<path d="M46 34Q58 21 72 28Z" fill="${c}"/>`;
  const bars = `<path d="M42 46Q48 56 44 68M55 44Q60 56 56 72M68 46Q72 57 69 72" stroke="${a}" stroke-width="5" stroke-linecap="round" fill="none" opacity=".88"/><path d="M36 59H78" stroke="${b}" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>`;
  const { scarf, hat } = festAcc(stage, 72, veiled ? 15 : 22);

  return `
    <path d="M12 88Q60 80 108 90" stroke="#6d482a" stroke-width="9" stroke-linecap="round" fill="none"/>
    <path d="M74 72C94 74 104 60 98 46C92 34 78 40 80 51C82 58 90 58 90 51" stroke="${c}" stroke-width="7.5" stroke-linecap="round" fill="none"/>
    <ellipse cx="58" cy="58" rx="23" ry="18" fill="${c}"/>
    ${bars}
    <path d="M42 73L40 85M46 73L47 85M68 73L66 85M72 73L74 85" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>
    ${casque}
    <circle cx="48" cy="43" r="14" fill="${c}"/>
    <circle cx="48" cy="43" r="9.5" fill="${b}" opacity=".32"/>
    ${eyesMarkup(mood, 45, 55, 42, 4.6, "#222430", false)}
    <path d="M38 51Q47 55 55 50" stroke="#181a24" stroke-width="2" stroke-linecap="round" fill="none"/>
    <ellipse cx="40" cy="49" rx="3.4" ry="2" fill="#ff8fa8" opacity=".55"/>
    ${scarf}${hat}`;
}

function drawSnake(id, c, b, a, tl, mood, stage) {
  const perch = tl === "perch";
  const blueViper = id === "bluepitviper";
  const emBoa = id === "emeraldtreeboa";
  const boom = id === "boomslang";
  const hood = id === "kingcobra";
  const hognose = id === "hognose";
  const sand = id === "sandboa";
  const rainbow = id === "rainbowboa";
  const retic = id === "reticpython";
  const rhino = id === "rhinoviper";
  const spider = id === "spiderviper";

  if (perch) {
    const tailTip = blueViper
      ? `<path d="M88 68C98 86 92 104 82 104" stroke="${a}" stroke-width="6.5" stroke-linecap="round" fill="none"/>`
      : `<path d="M88 68C96 84 91 99 84 102" stroke="${c}" stroke-width="5.5" stroke-linecap="round" fill="none"/>`;
    const marks = emBoa
      ? `<path d="M35 74L40 66L45 74ZM57 74L62 66L67 74ZM79 74L84 66L89 74Z" fill="#fff"/>`
      : id === "greentreepython"
      ? `<circle cx="40" cy="70" r="2.6" fill="${b}"/><circle cx="62" cy="70" r="2.8" fill="${a}"/><circle cx="84" cy="70" r="2.6" fill="${b}"/>`
      : "";
    const headPts = boom ? `<circle cx="46" cy="45" r="6.4" fill="${b}"/><circle cx="74" cy="45" r="6.4" fill="${b}"/>` : "";
    const eyeCol = blueViper ? "#e05228" : boom ? "#185a2c" : "#d89a1c";
    const sEyes = eyesMarkup(mood, 46, 74, 45, boom ? 6 : 4.8, eyeCol, !boom, "#0c0e14");
    const pits = blueViper || emBoa ? `<circle cx="43" cy="54" r="1.4" fill="#182026"/><circle cx="77" cy="54" r="1.4" fill="#182026"/>` : "";
    const { scarf, hat } = festAcc(stage, 62, 24);
    return `
      <path d="M12 78H108" stroke="#6c4a2d" stroke-width="8" stroke-linecap="round"/>
      ${tailTip}
      <path d="M28 76C26 58 46 58 48 76C50 92 66 92 68 76C70 58 90 58 88 76" stroke="${c}" stroke-width="11" stroke-linecap="round" fill="none"/>
      <path d="M32 76C30 62 42 62 44 76M72 76C74 62 86 62 84 76" stroke="${b}" stroke-width="3.5" fill="none" opacity=".55"/>
      ${marks}
      <path d="M36 46C35 30 46 24 60 24C74 24 85 30 84 46C83 56 71 63 60 63C49 63 37 56 36 46Z" fill="${c}"/>
      ${headPts}${pits}
      <ellipse cx="40" cy="51" rx="3.8" ry="2.2" fill="#ff8fa8" opacity=".48"/>
      <ellipse cx="80" cy="51" rx="3.8" ry="2.2" fill="#ff8fa8" opacity=".48"/>
      ${sEyes}
      ${mood !== "sad" ? `<path d="M60 61v7M60 68l-3 4M60 68l3 4" stroke="#ff6e8a" stroke-width="2" stroke-linecap="round" fill="none"/>` : ""}
      ${scarf}${hat}`;
  }

  if (hood) {
    const { scarf, hat } = festAcc(stage, 58, 22);
    return `
      <ellipse cx="60" cy="100" rx="36" ry="14" fill="${c}"/>
      <ellipse cx="60" cy="90" rx="28" ry="11" fill="${c}"/>
      <path d="M38 96Q60 88 82 96M42 87Q60 80 78 87" stroke="${b}" stroke-width="3" fill="none" opacity=".82"/>
      <path d="M41 72C33 52 38 35 60 35C82 35 87 52 79 72Q60 80 41 72Z" fill="${c}"/>
      <path d="M46 66Q60 72 74 66Q70 50 60 50Q50 50 46 66Z" fill="${b}" opacity=".9"/>
      <path d="M46 54Q60 47 74 54" stroke="${a}" stroke-width="2.5" fill="none"/>
      <ellipse cx="60" cy="40" rx="18" ry="14" fill="${c}"/>
      <path d="M51 28h7v6h-7ZM62 28h7v6h-7Z" fill="${a}" opacity=".45"/>
      ${eyesMarkup(mood, 49, 49 + 22, 39, 4.6, "#c89020", false)}
      ${mood !== "sad" ? `<path d="M60 52v7M60 59l-3 3.5M60 59l3 3.5" stroke="#ff6e8a" stroke-width="2" stroke-linecap="round" fill="none"/>` : ""}
      ${scarf}${hat}`;
  }

  // Coiled terrestrial snakes
  const coilMarks = retic
    ? `<path d="M30 88L40 80L50 88L40 96ZM50 88L60 80L70 88L60 96ZM70 88L80 80L90 88L80 96Z" stroke="${a}" stroke-width="2.4" fill="none"/><circle cx="40" cy="88" r="2.2" fill="${b}"/><circle cx="60" cy="88" r="2.2" fill="${b}"/><circle cx="80" cy="88" r="2.2" fill="${b}"/>`
    : rhino
    ? `<path d="M32 88L42 80L48 92ZM54 84L60 75L66 84ZM72 92L78 80L88 88Z" fill="${a}"/><circle cx="44" cy="84" r="3" fill="${b}"/><circle cx="76" cy="84" r="3" fill="${b}"/>`
    : rainbow
    ? `<path d="M26 88Q60 70 94 88" stroke="#68d8ff" stroke-width="3" fill="none" opacity=".55"/><path d="M29 94Q60 77 91 94" stroke="#ff76e8" stroke-width="2.5" fill="none" opacity=".42"/><circle cx="42" cy="88" r="5" fill="none" stroke="#1f1512" stroke-width="2.5"/><circle cx="60" cy="83" r="5" fill="none" stroke="#1f1512" stroke-width="2.5"/><circle cx="78" cy="88" r="5" fill="none" stroke="#1f1512" stroke-width="2.5"/>`
    : sand
    ? `<ellipse cx="40" cy="88" rx="6" ry="4" fill="${a}"/><ellipse cx="61" cy="84" rx="7" ry="4.5" fill="${a}"/><ellipse cx="81" cy="90" rx="6" ry="4" fill="${a}"/><ellipse cx="52" cy="99" rx="6" ry="4" fill="${a}"/>`
    : id === "ballpython"
    ? `<ellipse cx="42" cy="88" rx="7" ry="5" fill="${a}"/><circle cx="42" cy="88" r="2" fill="${c}"/><ellipse cx="62" cy="84" rx="7" ry="5" fill="${a}"/><circle cx="62" cy="84" r="2" fill="${c}"/><ellipse cx="80" cy="90" rx="6" ry="4.5" fill="${a}"/>`
    : `<path d="M30 88Q40 80 50 88M52 84Q60 77 68 84M72 88Q82 80 92 88M38 100Q50 93 62 100M66 100Q78 93 88 100" stroke="${a}" stroke-width="4.5" stroke-linecap="round" fill="none" opacity=".88"/>`;

  const tailFeature = spider
    ? `<path d="M88 94C102 88 108 74 103 58" stroke="${c}" stroke-width="5.5" stroke-linecap="round" fill="none"/><ellipse cx="102" cy="54" rx="4.5" ry="5.5" fill="${a}"/><path d="M97 50l-6 -4M96 54l-7 0M97 58l-6 4M107 50l6 -4M108 54l7 0M107 58l6 4" stroke="${a}" stroke-width="1.6" stroke-linecap="round"/>`
    : `<path d="M86 102C105 100 112 86 103 75C98 69 91 75 95 82" stroke="${c}" stroke-width="7.5" stroke-linecap="round" fill="none"/>`;

  const noseExtras = hognose
    ? `<path d="M52 57L60 49L68 57Q60 63 52 57Z" fill="${b}" stroke="${a}" stroke-width="1.6"/>`
    : rhino
    ? `<path d="M54 52L56 38L59 52ZM61 52L64 38L66 52Z" fill="#f0d878" stroke="#1b1d28" stroke-width="1"/>`
    : spider
    ? `<path d="M40 34L38 25L45 32ZM80 34L82 25L75 32Z" fill="${a}"/>`
    : "";

  const eyeY = sand ? 41 : 47;
  const eyeOff = sand ? 9 : 13;
  const eyeCol = retic || rhino ? "#d88a20" : "#181a24";
  const { scarf, hat } = festAcc(stage, 64, 27);

  return `${tailFeature}
    <ellipse cx="60" cy="96" rx="34" ry="15" fill="${c}"/>
    <ellipse cx="60" cy="100" rx="24" ry="9" fill="${b}" opacity=".9"/>
    <ellipse cx="60" cy="86" rx="28" ry="13" fill="${c}"/>
    ${coilMarks}
    <ellipse cx="60" cy="48" rx="${hognose || sand ? 18 : 21}" ry="15" fill="${c}"/>
    <ellipse cx="60" cy="56" rx="13" ry="7.5" fill="${b}" opacity=".9"/>
    ${noseExtras}
    <ellipse cx="40" cy="52" rx="3.8" ry="2.2" fill="#ff8fa8" opacity=".48"/>
    <ellipse cx="80" cy="52" rx="3.8" ry="2.2" fill="#ff8fa8" opacity=".48"/>
    ${eyesMarkup(mood, 60 - eyeOff, 60 + eyeOff, eyeY, sand ? 3.8 : 4.8, eyeCol, rhino || spider, "#0a0b10")}
    ${mood !== "sad" ? `<path d="M60 61v7M60 68l-3 4M60 68l3 4" stroke="#ff6e8a" stroke-width="2" stroke-linecap="round" fill="none"/>` : ""}
    ${scarf}${hat}`;
}

function drawChelonian(id, c, b, a, mood, stage) {
  const radiated = id === "radiatedtortoise";
  const sulcata = id === "sulcata";
  const box = id === "boxturtle";
  const redfoot = id === "redfoottortoise";
  const galap = id === "galapagostortoise";
  const mata = id === "matamata";
  const snapper = id === "alligatorsnapper";
  const pignose = id === "pignoseturtle";

  const legsCol = redfoot ? a : c;
  const limbs = pignose
    ? `<path d="M36 86Q14 78 14 96Q22 104 38 98ZM84 86Q106 78 106 96Q98 104 82 98ZM40 102Q30 116 44 114ZM80 102Q90 116 76 114Z" fill="${c}"/>`
    : `<ellipse cx="38" cy="108" rx="9" ry="7" fill="${legsCol}"/><ellipse cx="82" cy="108" rx="9" ry="7" fill="${legsCol}"/><circle cx="32" cy="106" r="2.2" fill="${a}"/><circle cx="38" cy="103" r="2.2" fill="${a}"/><circle cx="82" cy="103" r="2.2" fill="${a}"/><circle cx="88" cy="106" r="2.2" fill="${a}"/>`;

  const shell = snapper
    ? `<path d="M22 92C22 50 42 42 60 42C78 42 98 50 98 92Z" fill="${c}" stroke="#26231d" stroke-width="2.5"/><path d="M40 50l5 -8l6 8M56 44l4 -9l4 9M72 50l5 -8l6 8M35 70l4 -6l5 6M56 66l4 -7l4 7M76 70l4 -6l5 6" fill="${c}" stroke="#221e19" stroke-width="1.8"/>`
    : galap
    ? `<path d="M24 94C24 46 38 34 60 36C82 34 96 46 96 94Z" fill="${c}" stroke="#28282c" stroke-width="2"/>`
    : `<path d="M24 92C24 48 40 38 60 38C80 38 96 48 96 92Z" fill="${c}" stroke="#24201c" stroke-width="2"/>`;

  const shellPat = radiated
    ? `<path d="M44 62l-10 -8M44 62l10 -10M44 62v12M44 62h-12M76 62l10 -8M76 62l-10 -10M76 62v12M76 62h12M60 76l-11 -9M60 76l11 -9M60 76v12" stroke="${b}" stroke-width="2" stroke-linecap="round"/>`
    : box
    ? `<path d="M44 62l-8 -7M44 62l8 -7M44 62v9M76 62l8 -7M76 62l-8 -7M76 62v9M60 54v16" stroke="${b}" stroke-width="2.4" stroke-linecap="round"/>`
    : sulcata || redfoot
    ? `<ellipse cx="44" cy="64" rx="7" ry="6" fill="${b}" opacity=".65"/><ellipse cx="76" cy="64" rx="7" ry="6" fill="${b}" opacity=".65"/><ellipse cx="60" cy="76" rx="8" ry="6" fill="${b}" opacity=".65"/>`
    : mata
    ? `<path d="M35 64l10 -6l15 6l15 -6l10 6" stroke="${b}" stroke-width="3" fill="none" opacity=".7"/>`
    : pignose
    ? `<path d="M26 90Q60 96 94 90" stroke="${b}" stroke-width="4" fill="none"/>`
    : "";

  const head = mata
    ? `<path d="M40 76L50 56L70 56L80 76Q60 88 40 76Z" fill="${b}" stroke="${a}" stroke-width="1.8"/><path d="M36 74l-5 -3M37 78l-6 1M84 74l5 -3M83 78l6 1" stroke="${b}" stroke-width="2.5" stroke-linecap="round"/><rect x="58" y="49" width="4" height="8" rx="2" fill="${b}"/><path d="M48 77Q60 83 72 77" stroke="#2c1810" stroke-width="2" fill="none"/>`
    : pignose
    ? `<circle cx="60" cy="73" r="14" fill="${c}"/><ellipse cx="60" cy="77" rx="6.5" ry="4.5" fill="${a}"/><circle cx="57.8" cy="77" r="1.4" fill="#3a2024"/><circle cx="62.2" cy="77" r="1.4" fill="#3a2024"/>`
    : `<ellipse cx="60" cy="74" rx="${galap ? 12 : 14}" ry="13" fill="${redfoot ? c : c}"/><ellipse cx="60" cy="79" rx="10" ry="6" fill="${b}" opacity=".85"/>${redfoot ? `<circle cx="60" cy="68" r="4" fill="${a}"/>` : ""}${snapper ? `<path d="M56 80l4 5l4 -5" fill="#2c2922"/><path d="M58 83q2 4 5 1" stroke="#ff7894" stroke-width="2" stroke-linecap="round" fill="none"/>` : ""}`;

  const tEyeCol = box ? "#e84a28" : "#181a24";
  const tEyes = eyesMarkup(mood, 51, 69, mata ? 66 : 71, 3.6, tEyeCol);
  const { scarf, hat } = festAcc(stage, 84, 30);

  return `
    ${limbs}${shell}${shellPat}
    <ellipse cx="60" cy="94" rx="34" ry="8" fill="${b}" opacity=".9"/>
    ${head}
    ${tEyes}
    <path d="M54 81Q60 85 66 81" stroke="#181a24" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    ${scarf}${hat}`;
}

function drawCroc(id, c, b, a, mood, stage) {
  const gharial = id === "gharial";
  const spec = id === "spectacledcaiman";
  const dwarf = id === "dwarfcaiman";

  const tail = `<path d="M74 92C102 96 113 78 106 56C104 49 97 51 98 58" stroke="${c}" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M86 89l4 -5M96 81l5 -4M104 68l5 -2" stroke="${a}" stroke-width="3" stroke-linecap="round"/>`;
  const snout = gharial
    ? `<path d="M52 54L56 80L64 80L68 54Z" fill="${c}" stroke="#293d2e" stroke-width="1.4"/><circle cx="60" cy="80" r="6" fill="${a}" stroke="#293d2e" stroke-width="1.5"/><path d="M55 62l-2 1M55 68l-2 1M55 74l-2 1M65 62l2 1M65 68l2 1M65 74l2 1" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`
    : `<ellipse cx="60" cy="60" rx="${dwarf ? 13 : 16}" ry="${dwarf ? 9 : 11}" fill="${c}"/><ellipse cx="60" cy="62" rx="12" ry="6.5" fill="${b}" opacity=".9"/><path d="M47 61l2 4M54 64l1.5 3.5M66 64l-1.5 3.5M73 61l-2 4" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`;
  const specBridge = spec
    ? `<path d="M47 44Q60 39 73 44" stroke="${a}" stroke-width="3" stroke-linecap="round" fill="none"/>`
    : "";
  const { scarf, hat } = festAcc(stage, 72, 22);

  return `${tail}
    <path d="M35 86L23 96L28 102L40 94ZM85 86L97 96L92 102L80 94ZM40 102L28 112L35 115L46 106ZM80 102L92 112L85 115L74 106Z" fill="${c}"/>
    <ellipse cx="60" cy="90" rx="24" ry="19" fill="${c}"/>
    <ellipse cx="60" cy="94" rx="15" ry="13" fill="${b}"/>
    <path d="M42 78h36M40 87h40M44 96h32" stroke="${a}" stroke-width="2.2" stroke-dasharray="4 4" opacity=".65"/>
    <ellipse cx="60" cy="45" rx="22" ry="16" fill="${c}"/>
    ${specBridge}
    ${snout}
    <ellipse cx="40" cy="52" rx="4" ry="2.2" fill="#ff8fa8" opacity=".45"/>
    <ellipse cx="80" cy="52" rx="4" ry="2.2" fill="#ff8fa8" opacity=".45"/>
    ${eyesMarkup(mood, 46, 74, 43, dwarf ? 5.2 : 4.6, "#181a24", !dwarf, "#0d0e12")}
    ${scarf}${hat}`;
}

export function reptileSvg(id, name, rar, c, b, a, ear, tl, stage = 1, mood = "happy", size = 0) {
  const scale = stage === 1 ? 0.85 : stage === 2 ? 0.93 : 1;
  const glow = rar === "l" ? `<circle cx="60" cy="64" r="54" fill="${a}" opacity=".15"/>` : "";
  const body =
    ear === "gecko" ? drawGecko(id, c, b, a, mood, stage)
    : ear === "agamid" ? drawAgamid(id, c, b, a, tl, mood, stage)
    : ear === "skink" ? drawSkink(id, c, b, a, mood, stage)
    : ear === "chameleon" ? drawChameleon(id, c, b, a, mood, stage)
    : ear === "snake" ? drawSnake(id, c, b, a, tl, mood, stage)
    : ear === "chelonian" ? drawChelonian(id, c, b, a, mood, stage)
    : drawCroc(id, c, b, a, mood, stage);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 124" ${size ? `width="${size}" height="${size}"` : ""} role="img" aria-label="${name}">${glow}<g transform="translate(${60 - 60 * scale} ${124 - 122 * scale}) scale(${scale})"><ellipse cx="60" cy="116" rx="35" ry="4.5" fill="#000" opacity=".15"/>${body}</g></svg>`;
}
