# /docker-compose.yml (운영 환경 : 컨테이너 실행용 - 실제 적용값)
# /review-service/app/config/settings.py (아무 설정도 없을 경우 이 셋팅으로 동작 - 기본값)
# /review-service/.env (개발 환경 : 로컬 직접 실행용)

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 서버 설정
    app_port: int = 8090
    app_name: str = "review-service"

    # Eureka 설정
    eureka_server_url: str = "http://localhost:8761/eureka"
    eureka_instance_host: str = "localhost"

    # Auth Server (JWT 검증)
    jwt_issuer_uri: str = "http://localhost:8080"
    jwk_set_uri: str = "http://auth-server:9000/oauth2/jwks"

    # 게이트웨이 JwtAuthenticationFilter 와 동일한 클레임을 사용한다.
    # PoCket 평가 서비스는 게이트웨이를 경유하지 않으므로 X-User-Id 헤더 대신
    # 토큰에서 직접 사용자 ID를 꺼낸다.
    jwt_user_id_claim: str = "user_id"

    # 연동 서비스 URL (실증 참여 여부 검증용)
    enrollment_service_url: str = "http://localhost:8083"
    course_service_url: str = "http://localhost:8082"

    # DB (reviews 테이블만 사용 — 기존 테이블 무변경)
    db_host: str = "localhost"
    db_port: int = 3379
    db_name: str = "lecture_db"
    db_user: str = "manager"
    db_password: str = "SqlDba-1"
    db_echo: bool = False

    # 평가 정책
    rating_min: int = 1
    rating_max: int = 5

    @property
    def database_url(self) -> str:
        return (
            f"mysql+aiomysql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}?charset=utf8mb4"
        )

    class Config:
        env_file = ".env"


settings = Settings()
