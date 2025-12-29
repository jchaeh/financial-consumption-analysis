// src/pages/ConsumptionReport.jsx
import React, { useEffect, useState } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend
);

// 🔥 이제 PHP 서버 보고서 엔드포인트 사용
const API_BASE =
  "http://203.249.87.58/db2025_502/db2025_502_team1/api";

function formatCurrency(v) {
  const n = Number(v) || 0;
  return n.toLocaleString("ko-KR") + "원";
}

// 카테고리별 색상 팔레트
const CATEGORY_COLOR = {
  배달: "#4F46E5",
  음식: "#4F46E5",
  "커피/디저트": "#6366F1",
  편의점: "#8B5CF6",
  "마트/식료품": "#A855F7",
  쇼핑: "#EC4899",
  패션: "#F97316",
  교통: "#10B981",
  자동차: "#22C55E",
  "병원/의료": "#EF4444",
  기타: "#6B7280",

  "약국/의약품": "EF4444",
  "구독/정기결제": "6366F1",
  "주유": "22C55E"
};

function pickColor(categoryName = "") {
  const key = Object.keys(CATEGORY_COLOR).find((k) =>
    categoryName.includes(k)
  );
  return key ? CATEGORY_COLOR[key] : "#9CA3AF";
}

export default function ConsumptionReport({ loggedInUser }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 App.js에서 넘겨주는 loggedInUser 사용
  const userId = loggedInUser?.userId;

  useEffect(() => {
    if (!userId) return;

    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/report.php?userId=${encodeURIComponent(userId)}`
        );
        if (!res.ok) {
          console.error("report response not ok", res.status);
          setReport(null);
        } else {
          const data = await res.json();
          setReport(data);
        }
      } catch (e) {
        console.error("report fetch error:", e);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [userId]);

  if (!userId) {
    return (
      <div className="card" style={{ margin: 20 }}>
        <h2 className="page-title">소비 리포트</h2>
        <p>로그인 후 이용할 수 있습니다.</p>
      </div>
    );
  }

  if (loading || !report) {
    return (
      <div className="card" style={{ margin: 20 }}>
        <h2 className="page-title">소비 리포트</h2>
        <p>리포트 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  const { summary = {}, byCategory = [], dailyTrend = [] } = report;

  const thisMonthTotal = Number(summary.thisMonthTotal || 0);
  const peerAverage = Number(summary.peerAverage || 0);
  const txCount = Number(summary.transactionCount || 0);

  // 🔹 평균 결제 금액
  const avgPayment = txCount ? Math.round(thisMonthTotal / txCount) : 0;

  // 🔹 이번 달 지출 순위용
  const sortedCategories = [...byCategory].sort(
    (a, b) => Number(b.myAmount || 0) - Number(a.myAmount || 0)
  );

  // 🔹 카테고리 문자열 정리 (key|소분류 → 사용자 보기용)
  const prettyCategory = (category) => {
    if (!category) return "";
    const [bigKey, small] = category.split("|");

    // bigKey가 키 형식일 수도, 이모지/라벨일 수도 있음
    // 키 목록
    const BIG_LABEL_MAP = {
      food_convenience: "🍽 식비·생활편의",
      fashion_beauty: "👗 쇼핑·패션·뷰티",
      transport_car: "🚗 교통·자동차",
      home_bills: "🏠 주거·청구",
      culture_leisure: "🎬 문화·여가·오락",
      health_medical: "❤️ 건강·의료",
      travel: "🛫 여행",
      family_life: "🙋‍♀️ 가족·생활",
      finance_donation: "💳 금융·기부",
      etc: "📦 기타",
    };

    const label = BIG_LABEL_MAP[bigKey] || bigKey; // 키 없으면 그냥 원문
    return `${label} | ${small || ""}`;
  };

  // 🔹 또래 대비 차이
  const diff = thisMonthTotal - peerAverage;
  const diffAbs = Math.abs(diff);

  const diffText =
    diff === 0
      ? "또래 평균과 거의 비슷하게 쓰고 있어요."
      : diff > 0
      ? `또래 평균 ${formatCurrency(peerAverage)}보다 ${diffAbs.toLocaleString(
          "ko-KR"
        )}원 더 쓰고 있어요`
      : `또래 평균 ${formatCurrency(peerAverage)}보다 ${diffAbs.toLocaleString(
          "ko-KR"
        )}원 덜 쓰고 있어요`;
  const diffColor = diff > 0 ? "#DC2626" : diff < 0 ? "#2563EB" : "#6B7280";

  // 🔹 카테고리별 지출 비교 (막대)
  const barLabels = byCategory.map((c) => prettyCategory(c.category));
  const barMyData = byCategory.map((c) => Number(c.myAmount || 0));
  const barPeerData = byCategory.map((c) => Number(c.peerAmount || 0));
  const barColors = byCategory.map((c) => pickColor(prettyCategory(c.category)));

  const categoryBarData = {
    labels: barLabels,
    datasets: [
      {
        label: "나의 지출",
        data: barMyData,
        backgroundColor: barColors,
        borderRadius: 6,
      },
      {
        label: "또래 평균",
        data: barPeerData,
        backgroundColor: "#E5E7EB",
        borderRadius: 6,
      },
    ],
  };

  const categoryBarOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: function (ctx) {
            const v = ctx.parsed.y || 0;
            return `${ctx.dataset.label}: ${v.toLocaleString("ko-KR")}원`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (v) => v.toLocaleString("ko-KR") + "원",
        },
      },
    },
  };

  // 🔹 지출 추이 (일별)
  const lineLabels = dailyTrend.map((d) => d.date);
  const lineMyData = dailyTrend.map((d) => Number(d.myAmount || 0));
  const linePeerData = dailyTrend.map((d) => Number(d.peerAmount || 0));

  const dailyLineData = {
    labels: lineLabels,
    datasets: [
      {
        label: "나의 지출",
        data: lineMyData,
        borderColor: "#4F46E5",
        backgroundColor: "rgba(79, 70, 229, 0.08)",
        tension: 0.3,
        fill: true,
        pointRadius: 3,
      },
      {
        label: "또래 지출",
        data: linePeerData,
        borderColor: "#D1D5DB",
        backgroundColor: "rgba(209, 213, 219, 0.3)",
        tension: 0.3,
        fill: false,
        pointRadius: 3,
      },
    ],
  };

  const dailyLineOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: function (ctx) {
            const v = ctx.parsed.y || 0;
            return `${ctx.dataset.label}: ${v.toLocaleString("ko-KR")}원`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (v) => v.toLocaleString("ko-KR") + "원",
        },
      },
    },
  };

  // 🔹 카테고리 비중 (도넛)
  const totalForShare = byCategory.reduce(
    (acc, c) => acc + Number(c.myAmount || 0),
    0
  );

  const doughnutData = {
    labels: byCategory.map((c) => prettyCategory(c.category)),
    datasets: [
      {
        data: byCategory.map((c) => Number(c.myAmount || 0)),
        backgroundColor: byCategory.map((c) =>
          pickColor(prettyCategory(c.category))
        ),
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: function (ctx) {
            const v = ctx.parsed || 0;
            const ratio =
              totalForShare > 0 ? ((v / totalForShare) * 100).toFixed(1) : 0;
            return `${ctx.label}: ${v.toLocaleString(
              "ko-KR"
            )}원 (${ratio}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="card" style={{ margin: 20 }}>
      <h2 className="page-title">소비 리포트</h2>

      {/* 상단 요약 카드 3개 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* 1. 이번 달 내 지출 + 또래 평균 */}
        <div
          className="card"
          style={{ background: "#EEF4FF", boxShadow: "none" }}
        >
          <div style={{ fontSize: 13, color: "#6B7280" }}>
            전체 기간 내 지출
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginTop: 4,
            }}
          >
            {formatCurrency(thisMonthTotal)}
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
            또래 평균 지출 {formatCurrency(peerAverage)}
          </div>
        </div>

        {/* 2. 평균 결제 금액 */}
        <div className="card">
          <div style={{ fontSize: 13, color: "#6B7280" }}>
            평균 결제 금액
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginTop: 4,
            }}
          >
            {formatCurrency(avgPayment)}
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
            총 결제 건수 {txCount}건 기준
          </div>
        </div>

        {/* 3. 지출 순위 */}
        <div className="card">
          <div style={{ fontSize: 13, color: "#6B7280" }}>
            지출 카테고리 순위
          </div>
          {sortedCategories[0] ? (
            <div style={{ marginTop: 4, fontSize: 14 }}>
              <div>
                1위 {prettyCategory(sortedCategories[0].category)}{" "}
                <strong>
                  {formatCurrency(sortedCategories[0].myAmount)}
                </strong>
              </div>
              {sortedCategories[1] && (
                <div style={{ marginTop: 4 }}>
                  2위 {prettyCategory(sortedCategories[1].category)}{" "}
                  <strong>
                    {formatCurrency(sortedCategories[1].myAmount)}
                  </strong>
                </div>
              )}
              {sortedCategories[2] && (
                <div style={{ marginTop: 4 }}>
                  3위 {prettyCategory(sortedCategories[2].category)}{" "}
                  <strong>
                    {formatCurrency(sortedCategories[2].myAmount)}
                  </strong>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 4, color: "#6B7280", fontSize: 14 }}>
              카테고리별 지출 데이터가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 하단 그래프 3개: 바, 라인, 도넛 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {/* 카테고리별 지출 비교 */}
        <div className="card">
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            카테고리별 지출 비교
          </h3>
          <Bar data={categoryBarData} options={categoryBarOptions} />
        </div>

        {/* 지출 추이 */}
        <div className="card">
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            일별 지출 추이
          </h3>
          <Line data={dailyLineData} options={dailyLineOptions} />
        </div>

        {/* 카테고리 비중 */}
        <div className="card">
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            카테고리 비중
          </h3>
          <Doughnut data={doughnutData} options={doughnutOptions} />
          <p
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#6B7280",
            }}
          >
            총 지출 {formatCurrency(totalForShare)} 기준 비율입니다.
          </p>
        </div>
      </div>
    </div>
  );
}