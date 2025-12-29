// src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ loggedInUser, setLoggedInUser }) {
  const navigate = useNavigate();

  const logout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      setLoggedInUser(null);
      navigate("/login");
    }
  };

  return (
    <nav
      style={{
        width: "100%",
        padding: "12px 20px",
        background: "#2563eb",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* 왼쪽 로고 */}
      <div
        style={{
          fontWeight: 700,
          fontSize: 18,
          cursor: "pointer",
          minWidth: 120,
        }}
        onClick={() => navigate("/")}
      >
        소비패턴 분석
      </div>

      {/* 중앙 메뉴 3개 */}
      {loggedInUser && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 20,
            flexGrow: 1,
          }}
        >
          <Link to="/my-consumption" style={menuBtn}>
            나의 소비
          </Link>
          <Link to="/details" style={menuBtn}>
            지출 내역
          </Link>
          <Link to="/report" style={menuBtn}>
            소비 리포트
          </Link>
        </div>
      )}

      {/* 오른쪽 영역: 사용자 이름 + 로그아웃 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          minWidth: 120,
          justifyContent: "flex-end",
        }}
      >
        {loggedInUser ? (
          <>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                background: "rgba(255,255,255,0.25)",
                padding: "6px 10px",
                borderRadius: 8,
              }}
            >
              {loggedInUser.userName} 님
            </span>

            <button
              onClick={logout}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: "#ef4444",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              로그아웃
            </button>
          </>
        ) : (
          <Link to="/login" style={menuBtn}>
            로그인
          </Link>
        )}
      </div>
    </nav>
  );
}

/* 공통 버튼 스타일 */
const menuBtn = {
  color: "#fff",
  textDecoration: "none",
  fontSize: 15,
  fontWeight: 600,
  padding: "6px 10px",
  borderRadius: 8,
  background: "rgba(255,255,255,0.15)",
};