import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, it, expect, vi, afterEach } from "vitest";

import { routes } from "../App";
import { AuthProvider } from "../context/AuthContext";
import { publicApiClient } from "../utils/publicClient";

vi.mock("../utils/publicClient", () => ({
  publicApiClient: {
    post: vi.fn(),
  },
}));

const renderAt = (path) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Anonymous/Public Flow", () => {
  it("shows CTA on landing page", () => {
    renderAt("/");
    expect(screen.getByText(/Try without signing up/i)).toBeInTheDocument();
  });

  it("runs a public analysis without touching auth storage", async () => {
    publicApiClient.post.mockResolvedValueOnce({
      data: {
        session_id: "demo",
        condition: "Benign lesion",
        confidence: 64,
        severity: "Low",
        characteristics: ["flat"],
        recommendation: "Keep area clean",
        disclaimer: "demo disclaimer",
        status: "success",
      },
    });

    renderAt("/try-anonymous");

    const file = new File(["test"], "skin.png", { type: "image/png" });
    const input = screen.getByLabelText(/Upload an image/i);
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByText(/Run quick analysis/i));

    await waitFor(() => expect(publicApiClient.post).toHaveBeenCalled());

    const [url, body] = publicApiClient.post.mock.calls[0];
    expect(url).toBe("/public/try/analyze");
    expect(body).toBeInstanceOf(FormData);

    await waitFor(() => {
      const ctas = screen.getAllByText(/Sign up to save this case/i);
      expect(ctas.length).toBeGreaterThan(0);
    });
    expect(localStorage.getItem("authUser")).toBeNull();
  });
});

