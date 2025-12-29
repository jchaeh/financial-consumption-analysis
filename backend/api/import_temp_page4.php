<?php
// api/import_temp_page4.php
// CSV(2024data.csv)를 TEMP_PAGE4_REPORT 테이블에 적재하는 1회성 스크립트

require_once __DIR__ . '/config.php';   // auth.php와 동일하게 DB 설정 불러오기

// 1) DB 연결
$conn = get_db();                       // auth.php와 같은 방식
if (!$conn) {
    http_response_code(500);
    echo 'DB 연결 실패';
    exit;
}

// 2) CSV 파일 경로 설정
$csvPath = __DIR__ . '/data/2024data.csv';   // api/data/2024data.csv

if (!file_exists($csvPath)) {
    http_response_code(500);
    echo 'CSV 파일을 찾을 수 없습니다: ' . $csvPath;
    exit;
}

// 3) TEMP_PAGE4_REPORT 비울지 여부 (원하면 ?truncate=1 붙여 호출)
if (isset($_GET['truncate']) && $_GET['truncate'] === '1') {
    $truncateSql = 'TRUNCATE TABLE TEMP_PAGE4_REPORT';
    $truncateStmt = oci_parse($conn, $truncateSql);
    if (!oci_execute($truncateStmt)) {
        $e = oci_error($truncateStmt);
        http_response_code(500);
        echo 'TEMP_PAGE4_REPORT 초기화 실패: ' . $e['message'];
        exit;
    }
}

// 4) CSV 열기
$fp = fopen($csvPath, 'r');
if (!$fp) {
    http_response_code(500);
    echo 'CSV 파일을 열 수 없습니다.';
    exit;
}

// 첫 줄(헤더) 건너뛰기
$header = fgetcsv($fp);

// 5) INSERT 준비
$sql = "
    INSERT INTO TEMP_PAGE4_REPORT (
        ta_ymd,
        card_tpbuz_nm_1,
        card_tpbuz_nm_2,
        hour,
        sex,
        age,
        day,
        amt,
        cnt
    ) VALUES (
        :ta_ymd,
        :c1,
        :c2,
        :hour,
        :sex,
        :age,
        :day,
        :amt,
        :cnt
    )
";

$stmt = oci_parse($conn, $sql);
if (!$stmt) {
    $e = oci_error($conn);
    http_response_code(500);
    echo '쿼리 준비 실패: ' . $e['message'];
    fclose($fp);
    exit;
}

$rowCount  = 0;
$batchSize = 1000; // 1000행마다 한 번씩 커밋

// 6) CSV를 한 줄씩 읽어서 INSERT
while (($row = fgetcsv($fp)) !== false) {
    // CSV 컬럼 순서: ta_ymd, card_tpbuz_nm_1, card_tpbuz_nm_2, hour, sex, age, day, amt, cnt
    if (count($row) < 9) {
        continue; // 컬럼 수가 맞지 않으면 스킵
    }

    list($ta_ymd, $c1, $c2, $hour, $sex, $age, $day, $amt, $cnt) = $row;

    // 숫자는 살짝 캐스팅해도 되고 안 해도 되지만, 안전하게 캐스팅
    $hour = (int)$hour;
    $age  = (int)$age;
    $day  = (int)$day;
    $amt  = (int)$amt;
    $cnt  = (int)$cnt;

    oci_bind_by_name($stmt, ':ta_ymd', $ta_ymd);
    oci_bind_by_name($stmt, ':c1',     $c1);
    oci_bind_by_name($stmt, ':c2',     $c2);
    oci_bind_by_name($stmt, ':hour',   $hour);
    oci_bind_by_name($stmt, ':sex',    $sex);
    oci_bind_by_name($stmt, ':age',    $age);
    oci_bind_by_name($stmt, ':day',    $day);
    oci_bind_by_name($stmt, ':amt',    $amt);
    oci_bind_by_name($stmt, ':cnt',    $cnt);

    $r = oci_execute($stmt, OCI_NO_AUTO_COMMIT);
    if (!$r) {
        $e = oci_error($stmt);
        oci_rollback($conn);
        fclose($fp);
        http_response_code(500);
        echo 'INSERT 실패 (약 ' . $rowCount . '행 부근): ' . $e['message'];
        exit;
    }

    $rowCount++;

    if ($rowCount % $batchSize === 0) {
        oci_commit($conn);
    }
}

// 남은 데이터 커밋
oci_commit($conn);
fclose($fp);

echo "TEMP_PAGE4_REPORT에 {$rowCount}건 INSERT 완료";