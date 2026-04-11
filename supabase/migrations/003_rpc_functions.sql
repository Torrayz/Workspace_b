-- ============================================================================
-- Migration 003 — PostgreSQL RPC Functions
-- Field Marketing Reporting System
-- ============================================================================
-- Semua kalkulasi agregasi WAJIB berjalan sebagai PostgreSQL function.
-- Tidak boleh dikalkulasi di JavaScript.
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: get_dashboard_summary
-- Mengembalikan KPI cards data: total nominal, jumlah laporan, completion rate,
-- user aktif — termasuk tren perbandingan vs periode sebelumnya.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_dashboard_summary(
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS JSON AS $$
DECLARE
  v_period_days    INTEGER;
  v_prev_start     DATE;
  v_prev_end       DATE;
  v_current        RECORD;
  v_previous       RECORD;
  v_result         JSON;
BEGIN
  -- Hitung panjang periode untuk periode pembanding
  v_period_days := p_end_date - p_start_date + 1;
  v_prev_end    := p_start_date - 1;
  v_prev_start  := v_prev_end - v_period_days + 1;

  -- Data periode saat ini
  SELECT
    COALESCE(COUNT(l.id), 0)                                        AS total_laporan,
    COALESCE(SUM(l.jumlah_tagihan), 0)                              AS total_nominal,
    CASE
      WHEN COUNT(r.id) = 0 THEN 0
      ELSE ROUND(
        (COUNT(CASE WHEN r.status = 'selesai' THEN 1 END)::NUMERIC /
         NULLIF(COUNT(r.id), 0)) * 100, 1
      )
    END                                                              AS completion_rate,
    COUNT(DISTINCT l.user_id)                                        AS user_aktif
  INTO v_current
  FROM laporan l
  LEFT JOIN rencana r ON r.user_id = l.user_id
    AND r.created_at::date BETWEEN p_start_date AND p_end_date
  WHERE l.created_at::date BETWEEN p_start_date AND p_end_date;

  -- Data periode sebelumnya (untuk tren)
  SELECT
    COALESCE(COUNT(l.id), 0)                                        AS total_laporan,
    COALESCE(SUM(l.jumlah_tagihan), 0)                              AS total_nominal,
    CASE
      WHEN COUNT(r.id) = 0 THEN 0
      ELSE ROUND(
        (COUNT(CASE WHEN r.status = 'selesai' THEN 1 END)::NUMERIC /
         NULLIF(COUNT(r.id), 0)) * 100, 1
      )
    END                                                              AS completion_rate,
    COUNT(DISTINCT l.user_id)                                        AS user_aktif
  INTO v_previous
  FROM laporan l
  LEFT JOIN rencana r ON r.user_id = l.user_id
    AND r.created_at::date BETWEEN v_prev_start AND v_prev_end
  WHERE l.created_at::date BETWEEN v_prev_start AND v_prev_end;

  -- Hitung persentase perubahan (handle division by zero)
  v_result := json_build_object(
    'total_laporan',   v_current.total_laporan,
    'total_nominal',   v_current.total_nominal,
    'completion_rate', v_current.completion_rate,
    'user_aktif',      v_current.user_aktif,
    'trends', json_build_object(
      'laporan_change',    CASE WHEN v_previous.total_laporan = 0 THEN 0
                                ELSE ROUND(((v_current.total_laporan - v_previous.total_laporan)::NUMERIC / v_previous.total_laporan) * 100, 1)
                           END,
      'nominal_change',    CASE WHEN v_previous.total_nominal = 0 THEN 0
                                ELSE ROUND(((v_current.total_nominal - v_previous.total_nominal) / v_previous.total_nominal) * 100, 1)
                           END,
      'completion_change', v_current.completion_rate - v_previous.completion_rate,
      'user_aktif_change', CASE WHEN v_previous.user_aktif = 0 THEN 0
                                ELSE ROUND(((v_current.user_aktif - v_previous.user_aktif)::NUMERIC / v_previous.user_aktif) * 100, 1)
                           END
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: get_performance_per_user
-- Mengembalikan array data performa per user untuk bar chart & tabel ranking.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_performance_per_user(
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(row_data ORDER BY row_data->>'total_nominal' DESC)
    FROM (
      SELECT json_build_object(
        'user_id',         u.id,
        'user_nama',       u.nama,
        'user_nomor_induk', u.nomor_induk,
        'total_laporan',   COALESCE(COUNT(l.id), 0),
        'total_nominal',   COALESCE(SUM(l.jumlah_tagihan), 0),
        'completion_rate', CASE
          WHEN COUNT(r.id) = 0 THEN 0
          ELSE ROUND(
            (COUNT(DISTINCT CASE WHEN r.status = 'selesai' THEN r.id END)::NUMERIC /
             NULLIF(COUNT(DISTINCT r.id), 0)) * 100, 1
          )
        END
      ) AS row_data
      FROM users u
      LEFT JOIN laporan l ON l.user_id = u.id
        AND l.created_at::date BETWEEN p_start_date AND p_end_date
      LEFT JOIN rencana r ON r.user_id = u.id
        AND r.created_at::date BETWEEN p_start_date AND p_end_date
      WHERE u.role = 'user' AND u.is_active = true
      GROUP BY u.id, u.nama, u.nomor_induk
    ) sub
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: calculate_user_scores
-- Menghitung skor performa + tier untuk setiap user.
-- Bobot: completion_rate 40%, konsistensi 35%, achievement 25%.
-- Tier: top (>= 80), on_track (60–79), needs_attention (40–59), underperforming (< 40)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION calculate_user_scores()
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(scored ORDER BY (scored->>'score')::NUMERIC DESC)
    FROM (
      SELECT json_build_object(
        'user_id',         sub.user_id,
        'user_nama',       sub.user_nama,
        'user_nomor_induk', sub.user_nomor_induk,
        'total_laporan',   sub.total_laporan,
        'total_nominal',   sub.total_nominal,
        'completion_rate', sub.completion_rate,
        'score',           sub.score,
        'tier',            CASE
          WHEN sub.score >= 80 THEN 'top'
          WHEN sub.score >= 60 THEN 'on_track'
          WHEN sub.score >= 40 THEN 'needs_attention'
          ELSE 'underperforming'
        END
      ) AS scored
      FROM (
        SELECT
          u.id          AS user_id,
          u.nama        AS user_nama,
          u.nomor_induk AS user_nomor_induk,
          COALESCE(COUNT(l.id), 0) AS total_laporan,
          COALESCE(SUM(l.jumlah_tagihan), 0) AS total_nominal,
          -- Completion rate (40%)
          CASE
            WHEN COUNT(r.id) = 0 THEN 0
            ELSE ROUND(
              (COUNT(DISTINCT CASE WHEN r.status = 'selesai' THEN r.id END)::NUMERIC /
               NULLIF(COUNT(DISTINCT r.id), 0)) * 100, 1
            )
          END AS completion_rate,
          -- Composite score
          ROUND((
            -- Completion rate component (40%)
            (CASE
              WHEN COUNT(r.id) = 0 THEN 0
              ELSE (COUNT(DISTINCT CASE WHEN r.status = 'selesai' THEN r.id END)::NUMERIC /
                    NULLIF(COUNT(DISTINCT r.id), 0)) * 100
            END) * 0.4
            +
            -- Konsistensi: berapa hari dalam 30 hari terakhir user submit laporan (35%)
            (SELECT COUNT(DISTINCT l2.created_at::date)::NUMERIC
             FROM laporan l2
             WHERE l2.user_id = u.id
               AND l2.created_at >= NOW() - INTERVAL '30 days'
            ) / 30.0 * 100 * 0.35
            +
            -- Achievement: rata-rata (jumlah_tagihan / target_nominal) (25%)
            COALESCE((
              SELECT AVG(
                LEAST(l3.jumlah_tagihan / NULLIF(r3.target_nominal, 0), 1.0)
              ) * 100
              FROM laporan l3
              JOIN rencana r3 ON r3.id = l3.rencana_id
              WHERE l3.user_id = u.id
                AND l3.created_at >= NOW() - INTERVAL '30 days'
            ), 0) * 0.25
          ), 1) AS score
        FROM users u
        LEFT JOIN laporan l ON l.user_id = u.id
          AND l.created_at >= NOW() - INTERVAL '30 days'
        LEFT JOIN rencana r ON r.user_id = u.id
          AND r.created_at >= NOW() - INTERVAL '30 days'
        WHERE u.role = 'user' AND u.is_active = true
        GROUP BY u.id, u.nama, u.nomor_induk
      ) sub
    ) outer_sub
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: detect_anomalies
-- Mendeteksi anomali berdasarkan Z-score jumlah tagihan vs rata-rata historis.
-- Tandai anomali jika Z-score > 2 (tidak butuh model ML).
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION detect_anomalies(
  p_days_back INTEGER DEFAULT 30
)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(anomaly), '[]'::json)
    FROM (
      SELECT json_build_object(
        'user_id',        l.user_id,
        'user_nama',      u.nama,
        'laporan_id',     l.id,
        'jumlah_tagihan', l.jumlah_tagihan,
        'z_score',        ROUND(
          (l.jumlah_tagihan - stats.avg_tagihan) / NULLIF(stats.stddev_tagihan, 0),
          2
        ),
        'user_average',   ROUND(stats.avg_tagihan, 2),
        'user_stddev',    ROUND(stats.stddev_tagihan, 2)
      ) AS anomaly
      FROM laporan l
      JOIN users u ON u.id = l.user_id
      JOIN LATERAL (
        SELECT
          AVG(l2.jumlah_tagihan) AS avg_tagihan,
          STDDEV(l2.jumlah_tagihan) AS stddev_tagihan
        FROM laporan l2
        WHERE l2.user_id = l.user_id
          AND l2.id != l.id
      ) stats ON true
      WHERE l.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
        AND stats.stddev_tagihan > 0
        AND ABS((l.jumlah_tagihan - stats.avg_tagihan) / stats.stddev_tagihan) > 2
      ORDER BY ABS((l.jumlah_tagihan - stats.avg_tagihan) / stats.stddev_tagihan) DESC
    ) sub
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: get_daily_trend
-- Data untuk line chart tren nominal harian.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_daily_trend(
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(row_data ORDER BY tanggal)
    FROM (
      SELECT json_build_object(
        'tanggal',        d.tanggal::TEXT,
        'total_nominal',  COALESCE(SUM(l.jumlah_tagihan), 0),
        'total_laporan',  COALESCE(COUNT(l.id), 0)
      ) AS row_data,
      d.tanggal
      FROM generate_series(p_start_date, p_end_date, '1 day'::INTERVAL) AS d(tanggal)
      LEFT JOIN laporan l ON l.created_at::date = d.tanggal
      GROUP BY d.tanggal
    ) sub
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: get_status_distribution
-- Data untuk donut chart distribusi status laporan.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_status_distribution(
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS JSON AS $$
DECLARE
  v_total BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM laporan
  WHERE created_at::date BETWEEN p_start_date AND p_end_date;

  RETURN (
    SELECT COALESCE(json_agg(row_data), '[]'::json)
    FROM (
      SELECT json_build_object(
        'status',     l.status,
        'count',      COUNT(*),
        'percentage', CASE WHEN v_total = 0 THEN 0
                           ELSE ROUND((COUNT(*)::NUMERIC / v_total) * 100, 1)
                      END
      ) AS row_data
      FROM laporan l
      WHERE l.created_at::date BETWEEN p_start_date AND p_end_date
      GROUP BY l.status
      ORDER BY COUNT(*) DESC
    ) sub
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: get_personal_dashboard
-- Data dashboard personal untuk user role 'user'.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_personal_dashboard(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'total_laporan_bulan_ini', (
      SELECT COUNT(*)
      FROM laporan
      WHERE user_id = p_user_id
        AND created_at >= date_trunc('month', NOW())
    ),
    'total_nominal_bulan_ini', (
      SELECT COALESCE(SUM(jumlah_tagihan), 0)
      FROM laporan
      WHERE user_id = p_user_id
        AND created_at >= date_trunc('month', NOW())
    ),
    'rencana_aktif', (
      SELECT COUNT(*)
      FROM rencana
      WHERE user_id = p_user_id
        AND status = 'aktif'
    ),
    'daily_trend', (
      SELECT COALESCE(json_agg(row_data ORDER BY tanggal), '[]'::json)
      FROM (
        SELECT json_build_object(
          'tanggal',        d.tanggal::TEXT,
          'total_nominal',  COALESCE(SUM(l.jumlah_tagihan), 0),
          'total_laporan',  COALESCE(COUNT(l.id), 0)
        ) AS row_data,
        d.tanggal
        FROM generate_series(
          date_trunc('month', NOW())::date,
          NOW()::date,
          '1 day'::INTERVAL
        ) AS d(tanggal)
        LEFT JOIN laporan l ON l.user_id = p_user_id AND l.created_at::date = d.tanggal
        GROUP BY d.tanggal
      ) sub
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;
