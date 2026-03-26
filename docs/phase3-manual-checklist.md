# Phase 3 Manual Checklist

1. Start the stack with `docker compose up -d --build`.
2. Open `http://localhost` and confirm the storefront loads.
3. Verify at least one active product is visible in the product listing.
4. Click `Add to cart` on a product and confirm the cart panel updates.
5. Increase the quantity and confirm the subtotal changes.
6. Decrease the quantity or remove the item and confirm the cart updates correctly.
7. Refresh the page and confirm the cart persists in the browser.
8. Confirm `GET /items` and `POST /items` still work from the legacy smoke-test section.
