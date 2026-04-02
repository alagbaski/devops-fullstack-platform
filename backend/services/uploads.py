from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from config import MEDIA_ROOT, MEDIA_URL

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


def save_product_image(upload: UploadFile) -> str:
    suffix = Path(upload.filename or "").suffix.lower()
    if suffix not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValueError("Only JPG, PNG, GIF, and WEBP images are supported.")

    if upload.content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError("Uploaded file must be a supported image format.")

    product_media_dir = MEDIA_ROOT / "products"
    product_media_dir.mkdir(parents=True, exist_ok=True)

    file_name = f"{uuid4().hex}{suffix}"
    destination = product_media_dir / file_name

    upload.file.seek(0)
    destination.write_bytes(upload.file.read())

    return f"{MEDIA_URL}/products/{file_name}"
