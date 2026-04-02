"""
Upload Service Module

Handles the physical saving of uploaded files to the server's disk.
Includes security checks for file extensions and MIME types.
"""
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from config import MEDIA_ROOT, MEDIA_URL
from exceptions import ValidationException

# Security: White-list of allowed image formats
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


def save_product_image(upload: UploadFile) -> str:
    """
    Saves an uploaded image with a unique UUID filename.
    
    - Validates file type and extension.
    - Creates the destination directory if missing.
    - Returns the public URL path for the image.
    """
    suffix = Path(upload.filename or "").suffix.lower()
    if suffix not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationException("Only JPG, PNG, GIF, and WEBP images are supported.")

    if upload.content_type not in ALLOWED_IMAGE_TYPES:
        raise ValidationException("Uploaded file must be a supported image format.")

    product_media_dir = MEDIA_ROOT / "products"
    product_media_dir.mkdir(parents=True, exist_ok=True)

    # Generate a unique filename to prevent overwriting existing files
    # and to avoid directory traversal attacks from malicious filenames.
    file_name = f"{uuid4().hex}{suffix}"
    destination = product_media_dir / file_name

    upload.file.seek(0)
    destination.write_bytes(upload.file.read())

    return f"{MEDIA_URL}/products/{file_name}"
