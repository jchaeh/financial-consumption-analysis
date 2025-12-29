// src/pages/MyConsumption.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MyConsumption({ loggedInUser }) {
  const navigate = useNavigate();
  const userId = loggedInUser?.userId;

  const API_BASE = "http://203.249.87.58/db2025_502/db2025_502_team1/api";

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 카드용 상태
  const [monthTotal, setMonthTotal] = useState(0);
  const [topCategory, setTopCategory] = useState(null);
  const [peerAvg, setPeerAvg] = useState(0);

  // 숫자 포맷
  const fmt = (n) => Number(n || 0).toLocaleString();

  // 최신순 정렬
  const sortByDate = (arr) =>
    arr.slice().sort(
      (a, b) => new Date(b.transDate).getTime() - new Date(a.transDate).getTime()
    );

  // 이번 달인지 체크
  const isThisMonth = (dateStr) => {
    if (!dateStr) return false;
    const [y, m] = dateStr.split("-").map(Number);
    const now = new Date();
    return y === now.getFullYear() && m === now.getMonth() + 1;
  };

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // 1) 지출 내역 불러오기 (DetailsPage랑 완전 동일 엔드포인트)
      const tRes = await fetch(
        `${API_BASE}/transactions.php?userId=${encodeURIComponent(userId)}`
      );
      if (!tRes.ok) throw new Error("transactions 응답 오류");

      const tData = await tRes.json();
      const sorted = sortByDate(tData);
      setTransactions(sorted);

      // ====== 여기서 이번 달 합계 / 최다 카테고리 계산 ======
      const thisMonthList = sorted.filter((t) => isThisMonth(t.transDate));

      const total = thisMonthList.reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      );
      setMonthTotal(total);

      // category 문자열에서 "대분류 | 소분류" 중 대분류만 사용
      const catSum = {};
      thisMonthList.forEach((t) => {
        const big = String(t.category || "").split("|")[0].trim(); // "🍽 식비·생활편의" 이런 부분
        if (!big) return;
        catSum[big] = (catSum[big] || 0) + Number(t.amount || 0);
      });

      if (Object.keys(catSum).length > 0) {
        const [catName, catAmount] = Object.entries(catSum).sort(
          (a, b) => b[1] - a[1]
        )[0];
        setTopCategory({ category: catName, myAmount: catAmount });
      } else {
        setTopCategory(null);
      }

      // 2) 또래 평균만 report.php에서 (실패해도 그냥 넘어감)
      try {
        const rRes = await fetch(
          `${API_BASE}/report.php?userId=${encodeURIComponent(userId)}`
        );
        if (rRes.ok) {
          const rData = await rRes.json();
          setPeerAvg(rData.summary?.peerAverage || 0);
        }
      } catch (e) {
        console.warn("report.php 호출 실패(또래 평균만 미표시 가능):", e);
      }
    } catch (e) {
      console.error("MyConsumption loadData error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loggedInUser) {
      navigate("/login");
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser]);

  if (loading)
    return (
      <div style={{ padding: 30 }}>
        <h3>불러오는 중...</h3>
      </div>
    );

  return (
    <div style={page}>
      <div style={wrapper}>
        <h2 style={title}>나의 소비</h2>
        <div style={subText}>{loggedInUser.userName}님의 소비 현황</div>

        {/* ===== 카드 3개 ===== */}
        <div style={threeCards}>
          {/* 이번 달 총 지출 */}
          <div style={cardBlue}>
            <div style={cardLabel}>이번 달 총 지출</div>
            <div style={cardValue}>{fmt(monthTotal)}원</div>
          </div>

          {/* 가장 많이 쓴 곳 */}
          <div style={cardWhite}>
            <div style={cardLabel}>가장 많이 쓴 곳</div>
            {topCategory ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {topCategory.category}
                </div>
                <div style={{ marginTop: 6, fontSize: 14, color: "#666" }}>
                  {fmt(topCategory.myAmount)}원
                </div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: "#999", marginTop: 6 }}>
                이번 달 소비 내역이 없습니다.
              </div>
            )}
          </div>

          {/* 또래 평균 비교 */}
          <div style={cardWhite}>
            <div style={cardLabel}>또래 평균 비교</div>
            <div style={{ fontSize: 14 }}>
              내 지출: {fmt(monthTotal)}원 <br />
              또래 평균: {fmt(peerAvg)}원
            </div>

            <div
              style={{
                marginTop: 4,
                color: monthTotal > peerAvg ? "red" : "green",
                fontWeight: 700,
              }}
            >
              {peerAvg === 0
                ? "또래 평균 데이터를 불러오지 못했습니다."
                : monthTotal > peerAvg
                ? `평균보다 ${fmt(monthTotal - peerAvg)}원 더 씀`
                : monthTotal === peerAvg
                ? "또래 평균과 동일한 지출"
                : `평균보다 ${fmt(peerAvg - monthTotal)}원 덜 씀`}
            </div>
          </div>
        </div>

        {/* ===== 최근 내역 ===== */}
        <div style={{ marginTop: 30, fontWeight: 700, fontSize: 17 }}>
          최근 내역
        </div>

        <div style={{ marginTop: 12 }}>
          {transactions.length === 0 ? (
            <div style={{ padding: 20, color: "#777" }}>
              최근 내역이 없습니다.
            </div>
          ) : (
            transactions.slice(0, 3).map((t) => (
              <div key={t.transactionId} style={listItem}>
                <div>
                  <div style={itemDate}>{t.transDate}</div>
                  <div style={itemCategory}>{t.category}</div>
                </div>
                <div style={itemAmount}>{fmt(t.amount)}원</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= 스타일 ================= */

const page = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  paddingTop: 20,
};

const wrapper = {
  width: "100%",
  maxWidth: 800,
  background: "#fff",
  padding: "28px",
  borderRadius: "16px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
};

const title = {
  fontSize: "22px",
  fontWeight: 700,
};

const subText = {
  marginTop: 4,
  color: "#666",
  fontSize: 14,
};

const threeCards = {
  marginTop: 24,
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
};

const cardBlue = {
  flex: 1,
  minWidth: 180,
  background: "#eef3ff",
  padding: "18px",
  borderRadius: 12,
};

const cardWhite = {
  flex: 1,
  minWidth: 180,
  background: "#fff",
  padding: "18px",
  borderRadius: 12,
  border: "1px solid #eee",
};

const cardLabel = {
  fontSize: 14,
  color: "#555",
  marginBottom: 6,
};

const cardValue = {
  fontSize: 24,
  fontWeight: 700,
};

const listItem = {
  display: "flex",
  justifyContent: "space-between",
  padding: "14px 0",
  borderBottom: "1px solid #eee",
};

const itemDate = {
  fontSize: 13,
  color: "#666",
};

const itemCategory = {
  fontSize: 15,
  marginTop: 4,
};

const itemAmount = {
  fontWeight: 700,
  fontSize: 16,
};