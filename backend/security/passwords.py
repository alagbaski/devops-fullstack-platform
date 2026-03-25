import hashlib
import hmac

from passlib.context import CryptContext
from passlib.exc import UnknownHashError

password_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(password: str, stored_password_hash: str) -> bool:
    try:
        return password_context.verify(password, stored_password_hash)
    except UnknownHashError:
        return verify_legacy_scrypt_password(password, stored_password_hash)


def verify_legacy_scrypt_password(password: str, stored_password_hash: str) -> bool:
    salt, password_hash = stored_password_hash.split(":", 1)
    computed_hash = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt.encode("utf-8"),
        n=2**14,
        r=8,
        p=1,
    ).hex()
    return hmac.compare_digest(computed_hash, password_hash)
