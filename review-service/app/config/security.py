import httpx
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config.settings import settings

logger = logging.getLogger(__name__)

security = HTTPBearer()

_jwks_cache: dict = {}


async def get_jwks() -> dict:
    global _jwks_cache
    if not _jwks_cache:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(settings.jwk_set_uri)
            response.raise_for_status()
            _jwks_cache = response.json()
    return _jwks_cache


def get_signing_key(token: str, jwks: dict) -> dict:
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")

    if not kid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰 헤더에 kid가 없습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="일치하는 공개키를 찾을 수 없습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    token = credentials.credentials

    try:
        jwks = await get_jwks()
        signing_key = get_signing_key(token, jwks)

        return jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=settings.jwt_issuer_uri,
            options={"verify_aud": False},
        )

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"유효하지 않은 토큰입니다: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_id(
    token_payload: dict = Depends(verify_token)
) -> int:
    """
    토큰에서 사용자 ID를 추출한다.
    게이트웨이(JwtAuthenticationFilter)와 동일하게 user_id → userId 순으로 조회한다.
    """
    raw = token_payload.get(settings.jwt_user_id_claim)
    if raw is None:
        raw = token_payload.get("userId")

    if raw is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰에 사용자 ID 클레임이 없습니다",
        )

    try:
        return int(raw)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"사용자 ID 클레임이 숫자가 아닙니다: {raw}",
        )
