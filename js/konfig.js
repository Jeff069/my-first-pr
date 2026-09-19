/* Zugangsdaten für den gemeinsamen Stand.
   Solange hier nichts eingetragen ist, läuft die App wie bisher: alles bleibt
   im Browser, nichts wird übertragen.

   Beide Werte stehen im Supabase-Dashboard unter Settings -> API.
   Der "anon"-Schlüssel ist ausdrücklich zur Veröffentlichung gedacht; er
   erlaubt für sich genommen keinen Zugriff auf die Daten - dafür braucht es
   die Anmeldung mit E-Mail und Passwort. */
window.HB = window.HB || {};
window.HB.konfig = {
  url: '',
  schluessel: '',
  /* Name des gemeinsamen Haushalts - beide Geräte müssen denselben verwenden. */
  haushalt: 'haushalt'
};
