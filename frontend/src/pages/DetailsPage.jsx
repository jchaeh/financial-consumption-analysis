import React, { useEffect, useState } from "react";

const API_BASE =
  "http://203.249.87.58/db2025_502/db2025_502_team1/api";

// 카테고리 트리
const CATEGORY_TREE = [
  {
    key: "food_convenience",
    label: "식비·생활편의",
    subs: ["음식", "배달", "커피/디저트", "편의점", "마트/식료품", "유흥", "기타"],
  },
  {
    key: "fashion_beauty",
    label: "쇼핑·패션·뷰티",
    subs: ["패션", "쇼핑", "뷰티", "온라인 쇼핑", "미용", "기타"],
  },
  {
    key: "transport_car",
    label: "교통·자동차",
    subs: ["교통", "자동차", "기타"],
  },
  {
    key: "home_bills",
    label: "주거·청구",
    subs: ["주거", "통신", "공과금/관리비", "구독/정기결제", "기타"],
  },
  {
    key: "culture_leisure",
    label: "문화·여가·오락",
    subs: ["영화", "스포츠", "문화/여가", "게임", "기타"],
  },
  {
    key: "health_medical",
    label: "건강·의료",
    subs: ["병원/의료", "약국/의약품", "기타"],
  },
  {
    key: "travel",
    label: "여행",
    subs: ["여행/숙박", "기타"],
  },
  {
    key: "family_life",
    label: "가족·생활",
    subs: ["육아/출산", "교육", "생활", "애견/반려동물", "기타"],
  },
  {
    key: "finance_donation",
    label: "금융·기부",
    subs: ["금융", "이체", "후원/기부", "세금/공공납부", "기타"],
  },
  {
    key: "etc",
    label: "기타",
    subs: [],
  },
];

// key 기반(categoryKey|sub) → UI 라벨로 변환
function convertCategoryToLabel(categoryStr) {
  if (!categoryStr) return categoryStr;

  // 저장된 형태: food_convenience|음식 인 경우 고려
  const [bigKey, small] = categoryStr.split("|");

  const big = CATEGORY_TREE.find((c) => c.key === bigKey);
  if (!big || !small) return categoryStr; // DB에 소분류만 있을 때는 원문 그대로

  return `${big.label} | ${small}`;
}

export default function DetailsPage({ loggedInUser }) {
  const userId = loggedInUser?.userId;

  const [date, setDate] = useState("");
  const [time, setTime] = useState("12:00");

  // 기본값 = 첫 카테고리
  const [selectedBig, setSelectedBig] = useState(CATEGORY_TREE[0].key);
  const [selectedSmall, setSelectedSmall] = useState(
    CATEGORY_TREE[0].subs[0]
  );

  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState([]);

  // 현재 수정 중인 거래 ID (null이면 "추가 모드")
  const [editingId, setEditingId] = useState(null);

  // ---------------------- 데이터 불러오기 ----------------------
  const loadData = async () => {
    if (!userId) return;

    const res = await fetch(
      `${API_BASE}/transactions.php?userId=${encodeURIComponent(userId)}`
    );
    const data = await res.json();

    // 저장된 category를 UI용 라벨로 변환 (필요시)
    const converted = data.map((item) => ({
      ...item,
      categoryLabel: convertCategoryToLabel(item.category),
    }));

    setTransactions(converted);
  };

  // ---------------------- 지출 추가 (CREATE) ----------------------
  const addTransaction = async () => {
    if (!amount || !date) return alert("날짜와 금액을 입력하세요.");
    if (!userId) return alert("로그인 정보가 없습니다.");

    const body = {
      userId,
      transDate: date,
      transTime: time,
      // DB에는 소분류만 저장!
      category: selectedSmall,
      amount: amount,
    };

    await fetch(`${API_BASE}/transactions.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // 폼 리셋 + 목록 새로고침
    setAmount("");
    setDate("");
    setTime("12:00");
    setSelectedBig(CATEGORY_TREE[0].key);
    setSelectedSmall(CATEGORY_TREE[0].subs[0]);
    loadData();
  };

  // ---------------------- 지출 수정 (UPDATE) ----------------------
  const updateTransaction = async () => {
    if (!editingId) return;
    if (!amount || !date) return alert("날짜와 금액을 입력하세요.");
    if (!userId) return alert("로그인 정보가 없습니다.");

    const body = {
      transactionId: editingId,
      userId,
      transDate: date,
      category: selectedSmall, // DB에는 소분류
      amount: amount,
    };

    await fetch(`${API_BASE}/transactions.php`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // 수정 종료 + 폼 리셋 + 목록 새로고침
    setEditingId(null);
    setAmount("");
    setDate("");
    setTime("12:00");
    setSelectedBig(CATEGORY_TREE[0].key);
    setSelectedSmall(CATEGORY_TREE[0].subs[0]);
    loadData();
  };

  // 행의 수정 버튼 클릭 시: 폼에 값 채워넣고 수정 모드로 전환
  const startEdit = (t) => {
    setEditingId(t.transactionId);
    setDate(t.transDate);
    setAmount(String(t.amount));

    // categoryLabel이 식비·생활편의 | 음식 이거나, 그냥 패션 같은 경우 모두 처리
    const label = t.categoryLabel ?? "";
    const parts = label.split("|");
    const small = parts.length > 1 ? parts[1].trim() : label.trim(); // 소분류 추출

    // 어떤 대분류에 속하는지 찾기
    const bigCat = CATEGORY_TREE.find((c) => c.subs.includes(small));
    if (bigCat) {
      setSelectedBig(bigCat.key);
      setSelectedSmall(small);
    } else {
      // 못 찾으면 기본값으로
      setSelectedBig(CATEGORY_TREE[0].key);
      setSelectedSmall(CATEGORY_TREE[0].subs[0]);
    }
  };

  // 수정 취소
  const cancelEdit = () => {
    setEditingId(null);
    setAmount("");
    setDate("");
    setTime("12:00");
    setSelectedBig(CATEGORY_TREE[0].key);
    setSelectedSmall(CATEGORY_TREE[0].subs[0]);
  };

  // ---------------------- 삭제 (DELETE) ----------------------
  const deleteTransaction = async (id) => {
    if (!window.confirm("삭제하시겠습니까?")) return;

    await fetch(`${API_BASE}/transactions.php?id=${id}`, {
      method: "DELETE",
    });

    // 혹시 그걸 수정 중이었으면 수정 모드 해제
    if (editingId === id) {
      cancelEdit();
    }

    loadData();
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  // 대분류 변경 → 소분류 기본값 변경
  const handleBigChange = (value) => {
    const cat = CATEGORY_TREE.find((c) => c.key === value);
    setSelectedBig(value);
    setSelectedSmall(cat.subs[0] ?? "");
  };

  // ---------------------- UI ----------------------
  return (
    <div style={pageWrapper}>
      <div style={container}>
        <h2 style={title}>지출 내역 관리</h2>

        {/* 입력/수정 폼 */}
        <div style={inputCard}>
          <div style={inputRow}>
            {/* 날짜 */}
            <div style={inputGroup}>
              <label style={label}>날짜</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputBox}
              />
            </div>

            {/* 시간 */}
            <div style={inputGroup}>
              <label style={label}>시간</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={inputBox}
                disabled={!!editingId} // 수정 모드에서는 시간은 고정 (옵션)
              />
            </div>

            {/* 대분류 */}
            <div style={inputGroup}>
              <label style={label}>대분류</label>
              <select
                value={selectedBig}
                onChange={(e) => handleBigChange(e.target.value)}
                style={inputBox}
              >
                {CATEGORY_TREE.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 소분류 */}
            <div style={inputGroup}>
              <label style={label}>소분류</label>
              <select
                value={selectedSmall}
                onChange={(e) => setSelectedSmall(e.target.value)}
                style={inputBox}
              >
                {CATEGORY_TREE.find((c) => c.key === selectedBig).subs.map(
                  (sub) => (
                    <option key={sub}>{sub}</option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* 금액 */}
          <div style={{ marginTop: 14 }}>
            <label style={label}>금액</label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ ...inputBox, width: 180 }}
            />
          </div>

          {/* 추가 / 수정 버튼 */}
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <button
              style={editingId ? editBtnMain : addBtn}
              onClick={editingId ? updateTransaction : addTransaction}
            >
              {editingId ? "지출 수정 완료" : "지출 추가"}
            </button>
            {editingId && (
              <button style={cancelBtn} onClick={cancelEdit}>
                취소
              </button>
            )}
          </div>
        </div>

        {/* 리스트 */}
        <div>
          {transactions.length === 0 ? (
            <div style={noData}>등록된 소비 내역이 없습니다.</div>
          ) : (
            transactions.map((t) => (
              <div key={t.transactionId} style={itemCard}>
                <div>
                  <div style={itemDate}>
                    {t.transDate} (코드:{t.timeSlotCode})
                  </div>
                  <div style={itemCategory}>{t.categoryLabel}</div>
                </div>

                <div style={itemRight}>
                  <div style={itemAmount}>
                    {Number(t.amount).toLocaleString()}원
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                    <button
                      style={editBtn}
                      onClick={() => startEdit(t)}
                    >
                      수정
                    </button>
                    <button
                      style={deleteBtn}
                      onClick={() => deleteTransaction(t.transactionId)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------- 스타일 그대로 + 수정/취소 버튼 추가 ---------------------- */
const pageWrapper = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  padding: "20px",
};

const container = {
  width: "100%",
  maxWidth: "720px",
};

const title = {
  fontSize: "22px",
  fontWeight: "700",
  marginBottom: "20px",
};

const inputCard = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 3px 12px rgba(0, 0, 0, 0.08)",
  marginBottom: "24px",
};

const inputRow = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
};

const inputGroup = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const label = {
  fontSize: "13px",
  color: "#555",
};

const inputBox = {
  padding: "8px 10px",
  fontSize: "14px",
  borderRadius: "8px",
  border: "1px solid #ddd",
};

const addBtn = {
  padding: "10px 18px",
  background: "#4f46e5",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontWeight: 600,
  cursor: "pointer",
};

const editBtnMain = {
  padding: "10px 18px",
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontWeight: 600,
  cursor: "pointer",
};

const cancelBtn = {
  padding: "10px 18px",
  background: "#e5e7eb",
  color: "#111827",
  border: "none",
  borderRadius: "8px",
  fontWeight: 500,
  cursor: "pointer",
};

const noData = {
  padding: "20px",
  textAlign: "center",
  color: "#888",
};

const itemCard = {
  background: "#fff",
  padding: "16px",
  borderRadius: "12px",
  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.05)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};

const itemDate = { fontSize: "13px", color: "#666" };
const itemCategory = { fontSize: "15px", marginTop: "4px" };
const itemRight = { textAlign: "right" };
const itemAmount = { fontSize: "16px", fontWeight: "700" };

const deleteBtn = {
  padding: "5px 10px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const editBtn = {
  padding: "5px 10px",
  background: "#3b82f6",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
