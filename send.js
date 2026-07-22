// Wysyła powiadomienie push. Uruchamiane przez GitHub Actions.
// Sekrety: VAPID_PUBLIC, VAPID_PRIVATE, SUBSCRIPTION
// Zmienne: TITLE, BODY, TAG, TARGET_HOUR (godzina w czasie polskim)
const webpush = require("web-push");

const { VAPID_PUBLIC, VAPID_PRIVATE, SUBSCRIPTION, TARGET_HOUR } = process.env;

if (!VAPID_PUBLIC || !VAPID_PRIVATE || !SUBSCRIPTION) {
  console.error("Brak sekretów: VAPID_PUBLIC / VAPID_PRIVATE / SUBSCRIPTION");
  process.exit(1);
}

// --- Obsługa zmiany czasu ---
// Cron w GitHub Actions jest w UTC i nie zna CET/CEST, więc każdy workflow ma
// dwa wpisy (letni i zimowy). Tutaj sprawdzamy, która jest realnie godzina
// w Polsce — pasujący wpis wysyła, drugi kończy się bez akcji.
if (TARGET_HOUR) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Warsaw",
      hour: "2-digit",
      hourCycle: "h23"
    }).format(new Date())
  );
  if (hour !== Number(TARGET_HOUR)) {
    console.log(`Pomijam — w Polsce jest ${hour}:00, cel to ${TARGET_HOUR}:00.`);
    process.exit(0);
  }
  console.log(`Godzina w Polsce: ${hour}:00 — zgadza się, wysyłam.`);
}

// mailto: musi być prawdziwy — Apple odrzuca nieprawidłowy subject
webpush.setVapidDetails("mailto:twoj@email.pl", VAPID_PUBLIC, VAPID_PRIVATE);

// ?? zamiast || — pusty TITLE ma zostać pusty (wariant A: bez linii tytułu).
// Przy || pusty ciąg jest "fałszywy" i wracałaby wartość domyślna.
const payload = JSON.stringify({
  title: process.env.TITLE ?? "Mój Kapitał",
  body: process.env.BODY ?? "Przypomnienie",
  tag: process.env.TAG || "kapital",
  url: "./"
});

webpush
  .sendNotification(JSON.parse(SUBSCRIPTION), payload)
  .then(r => console.log("Wysłano, status:", r.statusCode))
  .catch(err => {
    console.error("Błąd:", err.statusCode, err.body || err.message);
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.error(
        "Subskrypcja nieaktualna — wejdź w Ustawienia w apce, kliknij " +
        "'Włącz powiadomienia' i wklej nową do sekretu SUBSCRIPTION."
      );
    }
    process.exit(1);
  });
