// =============================================================================
// TEST SUITE: OFFLINE-TO-ONLINE SYNC & IDEMPOTENCY VERIFICATION
// Pecel Lele Cabe Ijo - Kantin SMB
// =============================================================================

const API_BASE = "https://wdd-plci-backend-2.vercel.app/api";

async function runIdempotencyTests() {
  console.log("=== STARTING OFFLINE SYNC IDEMPOTENCY VERIFICATION ===");
  const testLocalId = `TX_IDEMP_TEST_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const testSheet = "PLCI Kantin SMB";
  const testTanggal = "Kamis, 25 September 2026";
  let createdDbId = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: First sync attempt with unique localId (Single Create)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1] Mengirim transaksi pertama dengan localId:", testLocalId);
    const payload1 = {
      localId: testLocalId,
      sheet: testSheet,
      tanggal: testTanggal,
      cash: 18000,
      bca: 0,
      gofood: 0,
      jenisPengeluaran: `[TEST-IDEMP] ** MAKAN SINI **, 1x Lele Goreng, ++ PAY:Cash|18000|0`,
      totalPengeluaran: 0
    };

    const res1 = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload1)
    });

    const data1 = await res1.json();
    if (!res1.ok || data1.status !== 'success') {
      throw new Error(`Gagal menyimpan transaksi test pertama: ${JSON.stringify(data1)}`);
    }

    createdDbId = data1.data?._id;
    console.log(`✅ [PASS] Transaksi pertama berhasil disimpan dengan Mongo ID: ${createdDbId}`);

    // -------------------------------------------------------------------------
    // TEST 2: Second sync attempt (RETRY) with THE SAME localId
    // Simulating: Network dropped before client received HTTP 200, client retries!
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] Simulasi Network Drop / Retry: Mengirim ulang payload yang sama persis...");
    const res2 = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload1)
    });

    const data2 = await res2.json();
    if (!res2.ok || data2.status !== 'success') {
      throw new Error(`Gagal pada retry test: ${JSON.stringify(data2)}`);
    }

    const retryDbId = data2.data?._id;
    console.log(`✅ [PASS] Server merespon sukses pada retry. Mongo ID: ${retryDbId}`);

    if (retryDbId !== createdDbId) {
      throw new Error(`❌ DUPLIKAT TERDETEKSI! ID pertama: ${createdDbId}, ID kedua: ${retryDbId}`);
    }
    console.log(`✅ [PASS] ZERO DUPLICATION: Mongo ID identik (${createdDbId} === ${retryDbId})!`);

    // -------------------------------------------------------------------------
    // TEST 3: Batch Array sync attempt with existing localId
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Menguji idempotensi dalam Batch Array payload...");
    const batchPayload = [
      payload1 // same item
    ];

    const res3 = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchPayload)
    });

    const data3 = await res3.json();
    const batchDbId = data3.data?.[0]?._id;
    if (batchDbId !== createdDbId) {
      throw new Error(`❌ DUPLIKAT DALAM BATCH! ID: ${batchDbId}`);
    }
    console.log(`✅ [PASS] ZERO DUPLICATION IN BATCH: ID tetap sama (${batchDbId})!`);

    // -------------------------------------------------------------------------
    // TEST 4: Cleanup test transaction
    // -------------------------------------------------------------------------
    console.log("\n[TEST 4] Membersihkan data uji dari database...");
    const delRes = await fetch(`${API_BASE}/transactions/${createdDbId}`, {
      method: 'DELETE'
    });
    if (delRes.ok) {
      console.log(`✅ [PASS] Data uji berhasil dihapus permanen dari MongoDB.`);
    }

    console.log("\n==================================================");
    console.log("SELURUH UJI IDEMPOTENSI & SYNC BERHASIL 100%!");
    console.log("==================================================");

  } catch (err) {
    console.error("❌ TEST FAILED:", err);
    if (createdDbId) {
      await fetch(`${API_BASE}/transactions/${createdDbId}`, { method: 'DELETE' }).catch(() => {});
    }
    process.exit(1);
  }
}

runIdempotencyTests();
