import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import App from "../src/App";

function mockJsonResponse(data, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  });
}

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    global.fetch = vi.fn(() => mockJsonResponse([]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the auth landing page by default", async () => {
    render(
      <MemoryRouter
        initialEntries={["/"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /welcome to your developer store/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/^opsdev$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email\/username/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/v1/products");
    });
  });

  it("redirects protected shop visitors back to the auth page when logged out", async () => {
    render(
      <MemoryRouter
        initialEntries={["/shop"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("heading", { name: /welcome to your developer store/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/product catalog/i)).not.toBeInTheDocument();
  });

  it("switches to the signup experience", async () => {
    render(
      <MemoryRouter
        initialEntries={["/"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("tab", { name: /^sign up$/i }));

    expect(await screen.findByLabelText(/^username$/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign up$/i })).toBeInTheDocument();
  });
});
