import hashlib
import hmac
import secrets


SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    password_hash = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt.encode("utf-8"),
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
    ).hex()
    return f"{salt}:{password_hash}"


def verify_password(password: str, stored_password_hash: str) -> bool:
    salt, password_hash = stored_password_hash.split(":", 1)
    computed_hash = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt.encode("utf-8"),
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
    ).hex()
    return hmac.compare_digest(computed_hash, password_hash)
