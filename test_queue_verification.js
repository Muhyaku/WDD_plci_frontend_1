import { extractQueueNumber, calculateNextQueueNumber, formatQueue, getTodayStr } from './src/shared/utils.js';

console.log('=== TEST SUITE: QUEUE GENERATION & DATABASE COUNT ACCURACY ===\n');

let pass = 0;
let fail = 0;

function assert(cond, name, details) {
  if (cond) {
    console.log(`[PASS] ${name}`);
    pass++;
  } else {
    console.error(`[FAIL] ${name}`, details);
    fail++;
  }
}

const todayStr = getTodayStr();
const yesterdayStr = 'Kamis, 08 Oktober 2026';

// 1. TEST START DARI 1 PADA HARI BARU
const queueStart = calculateNextQueueNumber([], [], todayStr);
assert(queueStart === 1, 'Hari baru (data kosong) wajib mulai dari antrian 1 (A-001)', { queueStart });

// 2. TEST JIKA ADA SISA UNPAID DARI HARI KEMARIN DI LOCAL ORDERS (TIDAK BOLEH MENCEMARI)
const yesterdayParked = [
  { id: 101, queue: 'A-045 - Budi', tanggal: yesterdayStr, createdAt: '2026-10-08T10:00:00.000Z' },
  { id: 102, queue: 'A-050 - Agus', tanggal: yesterdayStr, createdAt: '2026-10-08T10:05:00.000Z' }
];
const queueAfterYesterday = calculateNextQueueNumber([], yesterdayParked, todayStr);
assert(queueAfterYesterday === 1, 'Pesanan sisa kemarin (A-045, A-050) tidak boleh mencemari antrian hari ini (harus tetap mulai dari 1)', { queueAfterYesterday });

// 3. TEST CATATAN MEJA ATAU PAKET SEPERTI "A-50", "A-20", "A-34" TIDAK BOLEH MEMBUAT ANTRIAN LONCAT
const txWithTrickyNotes = [
  {
    jenisPengeluaran: '[A-001] ** MAKAN SINI **, 1x Ayam, ++ CATATAN: Meja A-50, blok A-34',
    tanggal: todayStr
  },
  {
    jenisPengeluaran: '[A-002] ** BUNGKUS **, 2x Paket A-20, ++ CATATAN: antar ke A-35',
    tanggal: todayStr
  }
];
const nextQueueTricky = calculateNextQueueNumber(txWithTrickyNotes, [], todayStr);
assert(nextQueueTricky === 3, 'Catatan pesanan "Meja A-50 / A-34 / Paket A-20" tidak boleh membajak nomor antrian (harus tetap A-003)', { nextQueueTricky });

// 4. TEST FORMAT UNPAID DENGAN CATATAN DAN HEADER
const trickyUnpaid = [
  {
    jenisPengeluaran: '[UNPAID] [A-003 - Doni (Ambil: Pagi)] ** MAKAN SINI **, 1x Lele, ++ CATATAN: Meja A-99',
    tanggal: todayStr
  }
];
const nextQueueAfterUnpaid = calculateNextQueueNumber(trickyUnpaid, [], todayStr);
assert(nextQueueAfterUnpaid === 4, 'Antrian UNPAID [A-003] terbaca dengan benar menjadi A-004 tanpa terpengaruh Catatan Meja A-99', { nextQueueAfterUnpaid });

// 5. TEST SECURE EXTRACT QUEUE NUMBER HELPER
assert(extractQueueNumber('[A-001] ** MAKAN SINI **') === 1, 'extractQueueNumber [A-001] -> 1');
assert(extractQueueNumber('[UNPAID] [A-045 - Agus]') === 45, 'extractQueueNumber [UNPAID] [A-045] -> 45');
assert(extractQueueNumber('A-007 - Siti (Ambil: Siang)') === 7, 'extractQueueNumber A-007 -> 7');
assert(extractQueueNumber('++ CATATAN: Tolong kirim ke Meja A-50') === null, 'extractQueueNumber catatan tanpa header -> null');
assert(extractQueueNumber('1x Paket Nasi A-30') === null, 'extractQueueNumber nama menu -> null');

// 6. TEST FORMAT QUEUE PAD
assert(formatQueue(1) === 'A-001', 'formatQueue(1) -> A-001');
assert(formatQueue(46) === 'A-046', 'formatQueue(46) -> A-046');

console.log(`\n==================================================`);
console.log(`TEST RESULTS: PASS = ${pass}, FAIL = ${fail}`);
console.log(`==================================================`);

if (fail > 0) process.exit(1);
