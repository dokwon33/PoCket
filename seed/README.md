# 더미 데이터 적재

화면 개발과 시연용 실증 슬롯 데이터입니다. **백엔드 코드나 `init-db/`는 건드리지 않습니다.**
이미 떠 있는 MariaDB 컨테이너에 SQL을 직접 넣는 방식이라, 원할 때 넣고 원할 때 지울 수 있습니다.

## 들어가는 내용

| 항목 | 수량 | 비고 |
|---|---|---|
| 실증 슬롯 | 95건 | 산업군 8종 × 약 12건 |
| 호스트 계정 | 10개 | 화면 표시 전용 (로그인 불가) |

모집 중 / 마감 상태가 섞여 있고, 실증 진행 건수는 0~44건, 실증비는 산업군별로 다른 구간에
분포합니다. 목록·필터·추천 정렬을 실제 데이터로 확인하기 위한 구성입니다.

## 실행

컨테이너가 떠 있는 상태에서 프로젝트 루트에서 실행합니다.

```bash
docker exec -i lecturedb mariadb -umanager -pSqlDba-1 lecture_db < seed/pocket_seed.sql
```

확인:

```bash
docker exec lecturedb mariadb -umanager -pSqlDba-1 lecture_db \
  -e "SELECT category, COUNT(*) FROM courses GROUP BY category;"
```

브라우저에서는 http://localhost:3000/testbeds 에서 보입니다. (로그인 필요)

## 다시 넣고 싶을 때

**`courses` 가 비어 있는 상태에서 실행해야 합니다.** 이미 데이터가 있으면 그대로 중복 적재됩니다.
초기화하려면 신청 내역을 먼저 지워야 합니다 — `enrollments` 가 `courses` 를 참조하기 때문입니다.

```bash
docker exec lecturedb mariadb -umanager -pSqlDba-1 lecture_db -e "
  DELETE FROM enrollments;
  DELETE FROM courses;
  ALTER TABLE courses AUTO_INCREMENT = 1;
"
```

그 다음 위 실행 명령을 다시 돌리면 됩니다.

## 알아둘 것

**호스트 계정은 로그인할 수 없습니다.**
`password` 컬럼에 유효한 BCrypt 해시가 아니라 `LOGIN_DISABLED_SEED_ACCOUNT` 문자열이 들어갑니다.
카드에 호스트 이름을 표시하기 위한 데이터일 뿐, 실제로 쓸 수 있는 계정을 만들지 않으려고 이렇게 했습니다.
로그인이 필요하면 회원가입 화면에서 직접 만드세요.

**`category` 값은 프론트 매핑표와 짝이 맞아야 합니다.**
`vue-frontend/src/domain/pocket.js` 의 `CATEGORIES` 와 동일한 대응을 씁니다.

| enum | 화면 라벨 |
|---|---|
| `BACKEND` | F&B |
| `FRONTEND` | 리테일 |
| `DEVOPS` | 물류 |
| `DATA_SCIENCE` | 헬스케어 |
| `MOBILE` | 오피스 |
| `SECURITY` | 보안·관제 |
| `DATABASE` | 데이터센터 |
| `OTHER` | 기타 |

여기가 어긋나면 화면에는 "헬스케어"라고 뜨는데 내용은 물류인 슬롯이 생깁니다.
직접 데이터를 추가할 때도 이 표를 기준으로 넣으세요.

**DB는 각자 로컬입니다.**
`pocket_mariadb_data` 볼륨에 저장되므로 이 SQL을 실행한 사람의 PC에만 반영됩니다.
팀원이 같은 데이터를 보려면 각자 위 명령을 한 번씩 실행해야 합니다.
