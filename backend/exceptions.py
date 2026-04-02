class AppException(Exception):
    """Base class for all application-specific exceptions."""
    pass

class ValidationException(AppException):
    """Raised when input data fails business logic validation (mapped to 400)."""
    pass

class EntityAlreadyExistsException(AppException):
    """Raised when a resource already exists in the database (mapped to 400)."""
    pass

class EntityNotFoundException(AppException):
    """Raised when a requested resource is not found (mapped to 404)."""
    pass