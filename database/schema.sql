/* =========================
   CODE TABLES
========================= */

CREATE TABLE HOUR_BAND (
    hour_code   CHAR(2) PRIMARY KEY,
    range_text  VARCHAR2(20)
);

CREATE TABLE DAY_OF_WEEK (
    day_code   CHAR(2) PRIMARY KEY,
    day_name   VARCHAR2(10)
);

CREATE TABLE SEX_CODE (
    sex_code   CHAR(1) PRIMARY KEY,
    sex_name   VARCHAR2(10)
);

CREATE TABLE AGE_GROUP (
    age_code   CHAR(2) PRIMARY KEY,
    range_text VARCHAR2(20)
);

/* =========================
   USER TABLES
========================= */

CREATE TABLE USER_ACCOUNT (
    user_id   VARCHAR2(10) PRIMARY KEY,
    username  VARCHAR2(10),
    password  VARCHAR2(60)
);

CREATE TABLE USER_DETAIL (
    user_id   VARCHAR2(10) PRIMARY KEY,
    age_group CHAR(2),
    sex_code  CHAR(1),
    CONSTRAINT fk_user_detail_user
        FOREIGN KEY (user_id) REFERENCES USER_ACCOUNT(user_id),
    CONSTRAINT fk_user_detail_age
        FOREIGN KEY (age_group) REFERENCES AGE_GROUP(age_code),
    CONSTRAINT fk_user_detail_sex
        FOREIGN KEY (sex_code) REFERENCES SEX_CODE(sex_code)
);

/* =========================
   INDUSTRY TABLES
========================= */

CREATE TABLE INDUSTRY_L1 (
    ind_l1_id  NUMBER PRIMARY KEY,
    name       VARCHAR2(100)
);

CREATE TABLE INDUSTRY_L2 (
    ind_l2_id  NUMBER PRIMARY KEY,
    ind_l1_id  NUMBER,
    name       VARCHAR2(100),
    CONSTRAINT fk_ind_l2_l1
        FOREIGN KEY (ind_l1_id) REFERENCES INDUSTRY_L1(ind_l1_id)
);

/* =========================
   FACT TABLE
========================= */

CREATE TABLE CARD_CONSUMPTION (
    ta_ymd     DATE,
    user_id    VARCHAR2(10),
    hour_code  CHAR(2),
    sex_code   CHAR(1),
    age_code   CHAR(2),
    ind_l2_id  NUMBER,
    ind_l1_id  NUMBER,
    day_code   CHAR(2),
    amt        NUMBER(20,2),
    cnt        NUMBER,
    CONSTRAINT pk_card_consumption
        PRIMARY KEY (ta_ymd, user_id, hour_code, ind_l2_id),
    CONSTRAINT fk_cc_user
        FOREIGN KEY (user_id) REFERENCES USER_ACCOUNT(user_id),
    CONSTRAINT fk_cc_hour
        FOREIGN KEY (hour_code) REFERENCES HOUR_BAND(hour_code),
    CONSTRAINT fk_cc_sex
        FOREIGN KEY (sex_code) REFERENCES SEX_CODE(sex_code),
    CONSTRAINT fk_cc_age
        FOREIGN KEY (age_code) REFERENCES AGE_GROUP(age_code),
    CONSTRAINT fk_cc_day
        FOREIGN KEY (day_code) REFERENCES DAY_OF_WEEK(day_code),
    CONSTRAINT fk_cc_ind_l1
        FOREIGN KEY (ind_l1_id) REFERENCES INDUSTRY_L1(ind_l1_id),
    CONSTRAINT fk_cc_ind_l2
        FOREIGN KEY (ind_l2_id) REFERENCES INDUSTRY_L2(ind_l2_id)
);

/* =========================
   N:M RELATION TABLE
========================= */

CREATE TABLE AGE_INDUSTRY_PREF (
    age_code   CHAR(2),
    ind_l2_id  NUMBER,
    ind_l1_id  NUMBER,
    score_amt  NUMBER(5,2),
    rank_amt   NUMBER,
    CONSTRAINT pk_age_ind_pref
        PRIMARY KEY (age_code, ind_l2_id),
    CONSTRAINT fk_aip_age
        FOREIGN KEY (age_code) REFERENCES AGE_GROUP(age_code),
    CONSTRAINT fk_aip_l2
        FOREIGN KEY (ind_l2_id) REFERENCES INDUSTRY_L2(ind_l2_id),
    CONSTRAINT fk_aip_l1
        FOREIGN KEY (ind_l1_id) REFERENCES INDUSTRY_L1(ind_l1_id)
);
