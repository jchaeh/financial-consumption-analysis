// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ setLoggedInUser }) {
  const navigate = useNavigate();
  const API_BASE = "http://203.249.87.58/db2025_502/db2025_502_team1/api";

  const [mode, setMode] = useState("login"); // login | register
  const [userId, setUserId] = useState("");
  const [userPw, setUserPw] = useState("");
  const [userName, setUserName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("F");

  const [msg, setMsg] = useState("");
  const [checking, setChecking] = useState(false);

  // ------- 아이디 중복 확인 -------
  const checkId = async () => {
    if (!userId.trim()) {
      setMsg("아이디를 입력하세요.");
      return;
    }

    try {
      setChecking(true);
      const res = await fetch(
        `${API_BASE}/auth.php?action=check_id&userId=${encodeURIComponent(userId)}`
      );

      const data = await res.json();

      if (data.available) {
        setMsg("✔ 사용 가능한 아이디입니다.");
      } else {
        setMsg("❌ 이미 사용 중인 아이디입니다.");
      }
    } catch (e) {
      setMsg("중복 확인 중 오류 발생.");
    } finally {
      setChecking(false);
    }
  };

  // ------- 회원가입 -------
  const handleRegister = async () => {
    if (!userId || !userPw || !userName || !age) {
      setMsg("모든 정보를 입력해주세요!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth.php?action=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userPw,
          userName,
          age,
          gender,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setMsg("회원가입 오류: " + data.error);
        return;
      }

      alert("회원가입 완료! 로그인해주세요.");
      setMode("login");
      setMsg("");
    } catch (e) {
      setMsg("회원가입 중 오류 발생.");
    }
  };

  // ------- 로그인 -------
  const handleLogin = async () => {
    if (!userId || !userPw) {
      setMsg("아이디와 비밀번호를 입력하세요.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth.php?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userPw }),
      });

      const data = await res.json();

      if (data.error) {
        setMsg("로그인 실패: " + data.error);
        return;
      }

      // 로그인 성공
      setLoggedInUser({
        userId: data.userId,
        userName: data.userName,
        gender: data.gender,
        ageGroup: data.ageGroup,
      });

      navigate("/");
    } catch (e) {
      setMsg("로그인 중 오류 발생.");
    }
  };

  return (
    <div style={wrap}>
      <div style={box}>
        <h2 style={{ marginBottom: 20 }}>
          {mode === "login" ? "로그인" : "회원가입"}
        </h2>

        {/* 메시지 */}
        {msg && (
          <div style={{ color: "red", marginBottom: 12, fontSize: 14 }}>
            {msg}
          </div>
        )}

        {/* 아이디 */}
        <input
          type="text"
          placeholder="아이디"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={input}
        />

        {/* 중복확인 버튼 (회원가입일 때만) */}
        {mode === "register" && (
          <button
            onClick={checkId}
            style={{
              ...btn,
              background: "#6b7280",
              marginBottom: 10,
              opacity: checking ? 0.6 : 1,
            }}
          >
            {checking ? "확인 중..." : "아이디 중복확인"}
          </button>
        )}

        {/* 비밀번호 */}
        <input
          type="password"
          placeholder="비밀번호"
          value={userPw}
          onChange={(e) => setUserPw(e.target.value)}
          style={input}
        />

        {/* 회원가입 모드: 이름 / 나이 / 성별 */}
        {mode === "register" && (
          <>
            <input
              type="text"
              placeholder="이름"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={input}
            />

            <input
              type="number"
              placeholder="나이"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={input}
            />

            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={{
                ...input,
                height: 40,
              }}
            >
              <option value="F">여성</option>
              <option value="M">남성</option>
            </select>
          </>
        )}

        {/* 버튼 */}
        {mode === "login" ? (
          <button onClick={handleLogin} style={btn}>
            로그인
          </button>
        ) : (
          <button onClick={handleRegister} style={btn}>
            회원가입
          </button>
        )}

        {/* 모드 변경 */}
        <div style={{ marginTop: 14, fontSize: 14 }}>
          {mode === "login" ? (
            <>
              계정이 없나요?
              <span
                style={link}
                onClick={() => {
                  setMode("register");
                  setMsg("");
                }}
              >
                회원가입
              </span>
            </>
          ) : (
            <>
              이미 계정이 있나요?
              <span
                style={link}
                onClick={() => {
                  setMode("login");
                  setMsg("");
                }}
              >
                로그인
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 스타일 ---------------- */
const wrap = {
  width: "100%",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f3f4f6",
};

const box = {
  width: 350,
  background: "#fff",
  padding: "30px 26px",
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
};

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  marginBottom: 12,
  fontSize: 14,
};

const btn = {
  width: "100%",
  padding: "10px 12px",
  background: "#2563eb",
  color: "#fff",
  fontSize: 15,
  fontWeight: 600,
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  marginTop: 4,
};

const link = {
  marginLeft: 6,
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: 600,
};