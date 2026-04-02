"""Tests for main app and system routes."""

from main import app
from routes.system import health_check


def test_health():
    assert health_check() == {"status": "ok"}


def test_metrics_route_registered():
    paths = {route.path for route in app.routes}
    assert "/metrics" in paths
