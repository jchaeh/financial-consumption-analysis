# 금융 소비 패턴 분석 웹사이트

## 📌 프로젝트 소개
본 프로젝트는 **금융 소비 데이터**를 기반으로  
사용자의 소비 내역을 관리하고,  
소비 패턴을 분석·시각화하는 웹 서비스입니다.

사용자는 로그인 후 자신의 소비 내역을 조회·추가·수정·삭제(CRUD)할 수 있으며,  
월별 소비 추이, 카테고리별 지출 비율, 또래 평균 소비와의 비교 리포트를 확인할 수 있습니다.

본 프로젝트는 **데이터베이스 시스템 과목 팀 프로젝트**로 진행되었습니다.

---

## 🛠 기술 스택
- **Frontend**: React (SPA), React Router
- **Backend**: PHP (REST API)
- **Database**: Oracle DB (RDBMS)
- **Visualization**: Chart.js
- **Data Processing**: CSV → SQL INSERT

---

## ✨ 주요 기능
- 회원가입 / 로그인 기능
- 사용자별 소비 내역 관리 (CRUD)
  - INSERT: 지출 내역 추가
  - SELECT: 소비 내역 조회
  - UPDATE: 기존 지출 수정
  - DELETE: 지출 내역 삭제
- 월별 소비 추이 시각화
- 카테고리(대분류/중분류)별 소비 분석
- 연령대 기준 또래 평균 소비 비교 리포트 제공

---

## 🗂 프로젝트 구조
financial-consumption-analysis/
├─ frontend/ # React 기반 UI
├─ backend/ # PHP REST API
├─ database/ # DB 스키마 및 샘플 데이터
├─ README.md
└─ .gitignore

---

## 🧩 데이터베이스 설계
- **3정규형(3NF)** 기반 설계로 데이터 중복 최소화
- **Fact Table + Dimension Table 구조**
  - CARD_CONSUMPTION을 중심으로 다차원 분석 가능
- USER – USER_DETAIL: 1:1 관계
- INDUSTRY_L1 – INDUSTRY_L2: 1:N 관계
- AGE_GROUP – INDUSTRY_L2: N:M 관계 (AGE_INDUSTRY_PREF 테이블로 해결)
- 코드 테이블 분리(연령, 성별, 요일, 시간대)로 확장성 확보

---

## 📊 데이터 샘플링 전략
원본 데이터는 용량 및 민감 정보 이슈로 GitHub에는 전체를 공개하지 않았습니다.

대신,
- **2024년 1월 / 6월 / 12월 데이터**
- **성별 · 연령대 · 업종 대분류가 고르게 포함되도록 조건 기반 샘플링**

을 적용한 **샘플 데이터**만 공개하였습니다.

> 실제 분석 및 구현 과정에서는 전체 데이터를 활용하였습니다.

---

## 📄 Database 폴더 구성
database/
├─ schema.sql
└─ insert_sample.sql

- `schema.sql` : ERD 기반 테이블 생성 스크립트
- `insert_sample.sql` : 샘플 데이터 INSERT 스크립트

---

## 🔐 보안 처리
- 실제 DB 접속 정보(ID, 비밀번호, IP)는 제거
- GitHub에는 예시 값만 포함
- 민감 데이터는 샘플로 대체

---

## ▶️ 실행 방법
### Frontend
```bash
cd frontend
npm install
npm start

---

### Backend
Apache + PHP 환경에서 실행
REST API 방식으로 frontend와 JSON 통신
