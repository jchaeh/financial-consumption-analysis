// src/pages/MyPage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MyPage({ loggedInUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!loggedInUser) {
      navigate("/login");
      return;
    }
  }, [loggedInUser]);

  if (!loggedInUser) return null;

  const { userId, userName, gender, ageGroup } = loggedInUser;

  return (
    <div style={wrap}>
      <div style={box}>
        <h2 style={{ marginBottom: 20 }}>마이페이지</h2>

        <div style={infoCard}>
          <div style={label}>이름</div>
          <div style={value}>{userName}</div>
        </div>

        <div style={infoCard}>
          <div style={label}>아이디</div>
          <div style={value}>{userId}</div>
        </div>

        <div style={infoCard}>
          <div style={label}>성별</div>
          <div style={value}>{gender === "F" ? "여성" : "남성"}</div>
        </div>

        <div style={infoCard}>
          <div style={label}>연령대</div>
          <div style={value}>{ageGroup}대</div>
        </div>

        <button
          style={btn}
          onClick={() => alert("준비 중입니다.")}
        >
          회원정보 수정 (준비중)
        </button>

        <button
          style={{ ...btn, background: "#ef4444", marginTop: 10 }}
          onClick={() => alert("준비 중입니다.")}
        >
          회원 탈퇴 (준비중)
        </button>
      </div>
    </div>
  );
}

/* ---------------- 스타일 ---------------- */

const wrap = {
  width: "100%",
  minHeight: "100vh",
  background: "#f3f4f6",
  display: "flex",
  justifyContent: "center",
  paddingTop: 40,
};

const box = {
  width: 350,
  background: "#fff",
  padding: "24px 22px",
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const infoCard = {
  background: "#f9fafb",
  padding: "12px 14px",
  borderRadius: 10,
  marginBottom: 12,
  border: "1px solid #e5e7eb",
};

const label = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 4,
};

const value = {
  fontSize: 16,
  fontWeight: 700,
};

const btn = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};