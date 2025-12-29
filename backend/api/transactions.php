<?php
// backend/api/transactions.php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn   = get_db();
$raw    = file_get_contents('php://input');
$data   = json_decode($raw, true) ?? [];

// 1. 조회 (GET) - READ
if ($method === 'GET') {
    $userId = $_GET['userId'] ?? null;
    if (!$userId) send_json(['error' => 'userId 필수'], 400);

    $sql = "SELECT TRANSACTION_ID,
                   TO_CHAR(TRANS_DATE, 'YYYY-MM-DD') AS TDATE, 
                   CATEGORY,
                   AMOUNT,
                   TIME_SLOT_CODE 
            FROM USER_TRANSACTION
            WHERE USER_ID = :v_uid 
            ORDER BY TRANS_DATE DESC, TRANSACTION_ID DESC";
    $stid = oci_parse($conn, $sql);
    oci_bind_by_name($stid, ':v_uid', $userId);
    oci_execute($stid);

    $rows = [];
    while ($row = oci_fetch_assoc($stid)) {
        $rows[] = [
            'transactionId' => (int)$row['TRANSACTION_ID'],
            'transDate'     => $row['TDATE'],
            'category'      => $row['CATEGORY'],
            'amount'        => (int)$row['AMOUNT'],
            'timeSlotCode'  => $row['TIME_SLOT_CODE']
        ];
    }
    send_json($rows);
}

// 2. 추가 (POST) - CREATE
if ($method === 'POST') {
    $userId   = $data['userId']    ?? null;
    $date     = $data['transDate'] ?? null;
    $time     = $data['transTime'] ?? '12:00';
    $category = $data['category']  ?? null;
    $amount   = $data['amount']    ?? null;

    if (!$userId || !$date || !$category || $amount === null) {
        send_json(['error' => '필수 값 누락'], 400);
    }

    // 시간대 코드 계산
    $hour = (int)explode(':', $time)[0];
    $code = 10;
    if ($hour < 7)      $code = 1;
    else if ($hour < 9) $code = 2;
    else if ($hour < 11)$code = 3;
    else if ($hour < 13)$code = 4;
    else if ($hour < 15)$code = 5;
    else if ($hour < 17)$code = 6;
    else if ($hour < 19)$code = 7;
    else if ($hour < 21)$code = 8;
    else if ($hour < 23)$code = 9;

    $sql = "INSERT INTO USER_TRANSACTION
                (TRANSACTION_ID, USER_ID, TRANS_DATE, TIME_SLOT_CODE, CATEGORY, AMOUNT)
            VALUES
                (USER_TRANSACTION_SEQ.NEXTVAL,
                 :v_uid,
                 TO_DATE(:v_dt, 'YYYY-MM-DD'),
                 :v_tc,
                 :v_cat,
                 :v_amt)";
    $stid = oci_parse($conn, $sql);
    oci_bind_by_name($stid, ':v_uid', $userId);
    oci_bind_by_name($stid, ':v_dt',  $date);
    oci_bind_by_name($stid, ':v_tc',  $code);
    oci_bind_by_name($stid, ':v_cat', $category);
    oci_bind_by_name($stid, ':v_amt', $amount);

    if (@oci_execute($stid)) {
        oci_commit($conn);
        send_json(['status' => 'success']);
    } else {
        $e = oci_error($stid);
        send_json(['error' => $e['message']], 500);
    }
}

// 3. 수정 (PUT) - UPDATE
if ($method === 'PUT') {
    $tid      = $data['transactionId'] ?? null;  // 수정할 거래 PK
    $userId   = $data['userId']        ?? null;  // 로그인된 사용자
    $date     = $data['transDate']     ?? null;
    $category = $data['category']      ?? null;
    $amount   = $data['amount']        ?? null;

    if (!$tid || !$userId || !$date || !$category || $amount === null) {
        send_json(['error' => '필수 값 누락'], 400);
    }

    $sql = "UPDATE USER_TRANSACTION 
            SET TRANS_DATE = TO_DATE(:v_dt, 'YYYY-MM-DD'),
                CATEGORY   = :v_cat,
                AMOUNT     = :v_amt
            WHERE TRANSACTION_ID = :v_tid
              AND USER_ID        = :v_uid";  // 👉 본인 것만 수정

    $stid = oci_parse($conn, $sql);
    oci_bind_by_name($stid, ':v_dt',  $date);
    oci_bind_by_name($stid, ':v_cat', $category);
    oci_bind_by_name($stid, ':v_amt', $amount);
    oci_bind_by_name($stid, ':v_tid', $tid);
    oci_bind_by_name($stid, ':v_uid', $userId);

    if (@oci_execute($stid)) {
        oci_commit($conn);
        send_json(['status' => 'updated']);
    } else {
        $e = oci_error($stid);
        send_json(['error' => $e['message']], 500);
    }
}

// 4. 삭제 (DELETE) - DELETE
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) send_json(['error' => 'id 필수'], 400);

    $sql = "DELETE FROM USER_TRANSACTION WHERE TRANSACTION_ID = :v_tid";
    $stid = oci_parse($conn, $sql);
    oci_bind_by_name($stid, ':v_tid', $id);

    if (@oci_execute($stid)) {
        oci_commit($conn);
        send_json(['status' => 'deleted']);
    } else {
        send_json(['error' => '삭제 실패'], 500);
    }
}
?>