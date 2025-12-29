<?php
error_reporting(E_ALL);
/* 경고가 JSON에 섞여서 React에서 파싱 깨지는 것 막기 */
ini_set('display_errors', 0);

require_once __DIR__ . '/config.php';

$conn = get_db();

$userId = $_GET['userId'] ?? null;
if (!$userId) {
    echo json_encode(["error" => "userId required"]);
    exit;
}

// 소분류만 추출 (CATEGORY: "대분류|소분류" -> 소분류만)
function extractSmall($cat) {
    if (!$cat) return "";
    $parts = explode("|", $cat);
    return trim(end($parts));
}

/* ---------------- 1. 내 전체 지출(합계) ---------------- */
/* 네가 원래 쓰던 방식 그대로 (USER_TRANSACTION + 문자열 바인딩) */
$safeUserId = str_replace("'", "''", $userId);

$sql = "SELECT NVL(SUM(AMOUNT),0) AS TOTAL 
        FROM USER_TRANSACTION 
        WHERE USER_ID = '$safeUserId'";
$stid = oci_parse($conn, $sql);
oci_execute($stid);
$row   = oci_fetch_assoc($stid);
$total = $row ? intval($row["TOTAL"]) : 0;

/* ---------------- 2. 또래 평균 (CSV만 사용, '내가 사용한 달' 기준 월 평균) ---------------- */

/* 2-0. 내가 쓴 거래 중 가장 최근 날짜의 월(MM) 구하기 */
$sql = "SELECT TO_CHAR(MAX(TRANS_DATE), 'MM') AS TARGET_MM
        FROM USER_TRANSACTION
        WHERE USER_ID = '$safeUserId'";
$stid = oci_parse($conn, $sql);
oci_execute($stid);
$row         = oci_fetch_assoc($stid);
$targetMonth = $row ? $row["TARGET_MM"] : null;   // 예: '12'

if ($targetMonth) {
    // 2-1. CSV에서 해당 월(MM)의 평균 결제 금액 (amt 평균)
    $sql = "
        SELECT NVL(AVG(amt), 0) AS PEER_CSV
        FROM   TEMP_PAGE4_REPORT
        WHERE  SUBSTR(ta_ymd, 5, 2) = '$targetMonth'
    ";
    $stid = oci_parse($conn, $sql);
    oci_execute($stid);
    $row        = oci_fetch_assoc($stid);
    $peerCsvAvg = $row ? floatval($row["PEER_CSV"]) : 0.0;

    $peerAvg = intval(round($peerCsvAvg));
} else {
    // 2-2. 내가 거래가 하나도 없으면, CSV 전체 평균 결제 금액 사용
    $sql = "
        SELECT NVL(AVG(amt), 0) AS PEER_CSV
        FROM   TEMP_PAGE4_REPORT
    ";
    $stid = oci_parse($conn, $sql);
    oci_execute($stid);
    $row        = oci_fetch_assoc($stid);
    $peerCsvAvg = $row ? floatval($row["PEER_CSV"]) : 0.0;

    $peerAvg = intval(round($peerCsvAvg));
}

/* ---------------- 3. 전체 건수 ---------------- */
$sql = "SELECT COUNT(*) AS CNT 
        FROM USER_TRANSACTION 
        WHERE USER_ID = '$safeUserId'";
$stid = oci_parse($conn, $sql);
oci_execute($stid);
$row = oci_fetch_assoc($stid);
$cnt = $row ? intval($row["CNT"]) : 0;

/* ---------------- 4. 카테고리 그룹 ---------------- */
/* 이 부분도 네가 준 구조 그대로 두고, LIKE만 안전하게 escape */
$sql = "SELECT CATEGORY, SUM(AMOUNT) AS MYAMT
        FROM USER_TRANSACTION
        WHERE USER_ID = '$safeUserId'
        GROUP BY CATEGORY";
$stid = oci_parse($conn, $sql);
oci_execute($stid);

$byCategory = [];

while ($row = oci_fetch_assoc($stid)) {

    $raw   = $row["CATEGORY"];
    $small = extractSmall($raw);         // 소분류 이름 (예: '커피/디저트')
    $myAmt = intval($row["MYAMT"]);

    // 작은 따옴표만 escape
    $safeSmall = str_replace("'", "''", $small);

    /* 4-1. 앱 또래 카테고리별 평균 (네 원래 로직) */
    $sql2 = "SELECT NVL(AVG(TOTAL),0) AS PA_APP
             FROM (
                 SELECT USER_ID, SUM(AMOUNT) AS TOTAL
                 FROM USER_TRANSACTION
                 WHERE CATEGORY LIKE '%$safeSmall%'
                 GROUP BY USER_ID
             )";
    $s2  = oci_parse($conn, $sql2);
    oci_execute($s2);
    $pApp       = oci_fetch_assoc($s2);
    $peerAppCat = $pApp ? floatval($pApp["PA_APP"]) : 0.0;

    /* 4-2. CSV 또래 카테고리별 평균 */
    $sql3 = "SELECT NVL(AVG(daily_amt),0) AS PA_CSV
             FROM (
                 SELECT ta_ymd,
                        SUM(amt) AS daily_amt
                 FROM   TEMP_PAGE4_REPORT
                 WHERE  card_tpbuz_nm_2 LIKE '%$safeSmall%'
                    OR  card_tpbuz_nm_1 LIKE '%$safeSmall%'
                 GROUP  BY ta_ymd
             )";
    $s3  = oci_parse($conn, $sql3);
    oci_execute($s3);
    $pCsv       = oci_fetch_assoc($s3);
    $peerCsvCat = $pCsv ? floatval($pCsv["PA_CSV"]) : 0.0;

    /* 4-3. 최종 카테고리 또래 = (앱 또래 + CSV 또래) / 2 */
    $peerCat = intval(round(($peerAppCat + $peerCsvCat) / 2.0));

    $byCategory[] = [
        "category"   => $small,
        "myAmount"   => $myAmt,
        "peerAmount" => $peerCat
    ];
}

/* ---------------- 5. 일별 추이 ---------------- */
/* 이 부분도 네가 준 구조 거의 그대로 복원 */

/* 5-1. 내 일별 지출 */
$sql = "SELECT 
            TO_CHAR(TRANS_DATE,'YYYY-MM-DD') AS DT,
            SUM(AMOUNT) AS AMT
        FROM USER_TRANSACTION
        WHERE USER_ID = '$safeUserId'
        GROUP BY TO_CHAR(TRANS_DATE,'YYYY-MM-DD')
        ORDER BY DT";

$stid = oci_parse($conn, $sql);
oci_execute($stid);

$myDailyMap = [];   // [날짜 => 내 금액]
while ($row = oci_fetch_assoc($stid)) {
    $dt              = $row["DT"];
    $myDailyMap[$dt] = intval($row["AMT"]);
}

/* 5-2. 앱 또래 일별 지출 (나를 제외한 전체 유저 기준) */
$sql = "SELECT 
            TO_CHAR(TRANS_DATE,'YYYY-MM-DD') AS DT,
            SUM(AMOUNT) AS AMT
        FROM USER_TRANSACTION
        WHERE USER_ID <> '$safeUserId'
        GROUP BY TO_CHAR(TRANS_DATE,'YYYY-MM-DD')";
$stid = oci_parse($conn, $sql);
oci_execute($stid);

$peerDailyAppMap = []; // [날짜 => 앱 또래 금액]
while ($row = oci_fetch_assoc($stid)) {
    $dt                   = $row["DT"];
    $peerDailyAppMap[$dt] = intval($row["AMT"]);
}

/* 5-3. CSV 또래 일별 지출 (TEMP_PAGE4_REPORT 전체 기준) */
$sql = "SELECT 
            TO_CHAR(TO_DATE(ta_ymd,'YYYYMMDD'),'YYYY-MM-DD') AS DT,
            SUM(amt) AS AMT
        FROM TEMP_PAGE4_REPORT
        GROUP BY TO_CHAR(TO_DATE(ta_ymd,'YYYYMMDD'),'YYYY-MM-DD')";
$stid = oci_parse($conn, $sql);
oci_execute($stid);

$peerDailyCsvMap = []; // [날짜 => CSV 또래 금액]
while ($row = oci_fetch_assoc($stid)) {
    $dt                   = $row["DT"];
    $peerDailyCsvMap[$dt] = intval($row["AMT"]);
}

/* 5-4. 최종 dailyTrend 생성
   - "내가 쓴 날짜"들을 기준으로 라인 차트 구성
   - 각 날짜별 peerAmount = (앱 또래 + CSV 또래) / 2
*/
$daily = [];
foreach ($myDailyMap as $dt => $myAmt) {
    $appPeerAmt = $peerDailyAppMap[$dt] ?? 0;
    $csvPeerAmt = $peerDailyCsvMap[$dt] ?? 0;
    $peerAmt    = intval(round(($appPeerAmt + $csvPeerAmt) / 2.0));

    $daily[] = [
        "date"       => $dt,
        "myAmount"   => $myAmt,
        "peerAmount" => $peerAmt
    ];
}

/* ---------------- 출력 ---------------- */
echo json_encode([
    "summary" => [
        "thisMonthTotal"   => $total,
        "peerAverage"      => $peerAvg,
        "transactionCount" => $cnt
    ],
    "byCategory" => $byCategory,
    "dailyTrend" => $daily
], JSON_UNESCAPED_UNICODE);
?>