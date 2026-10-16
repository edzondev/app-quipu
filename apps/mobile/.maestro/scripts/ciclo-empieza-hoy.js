// CICLO en movimientos: "CICLO 16 – 30 OCT" o "CICLO 28 JUL – 26 AGO"
// (cycleRange en shared/lib/movements/model.ts). Lima es UTC−5, sin DST.
var MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
var line = typeof output.cycleBefore === "string" ? output.cycleBefore : "";
var same = line.match(/^CICLO (\d+) (?:\u2013|-) \d+ ([A-Z]{3})$/);
var cross = line.match(/^CICLO (\d+) ([A-Z]{3}) (?:\u2013|-) \d+ ([A-Z]{3})$/);
var startDay = 0;
var startMon = "";
if (same) {
	startDay = Number(same[1]);
	startMon = same[2];
} else if (cross) {
	startDay = Number(cross[1]);
	startMon = cross[2];
}
var lima = new Date(Date.now() - 5 * 60 * 60 * 1000);
var todayDay = lima.getUTCDate();
var todayMon = MONTHS[lima.getUTCMonth()] || "";
output.cycleStartsToday = startDay === todayDay && startMon === todayMon;
