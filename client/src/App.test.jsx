import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";

beforeEach(() => {
    global.fetch = vi.fn((url, options) => {
        if (!options) {
            return Promise.resolve({ json: () => Promise.resolve([]) });
        }
        return Promise.resolve({
            json: () => Promise.resolve({ id: 1, text: "Test todo" }),
        });
    });
});

describe("App", () => {
    it("renders the input and add button", async () => {
        render(<App />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText("Enter a todo")).toBeInTheDocument();
            expect(screen.getByText("Add")).toBeInTheDocument();
        });
    });

    it("adds a todo when clicking Add", async () => {
        render(<App />);
        await waitFor(() => expect(screen.getByPlaceholderText("Enter a todo")).toBeInTheDocument());

        const input = screen.getByPlaceholderText("Enter a todo");
        fireEvent.change(input, { target: { value: "Test todo" } });
        fireEvent.click(screen.getByText("Add"));

        await waitFor(() => {
            expect(screen.getByText("Test todo")).toBeInTheDocument();
        });
    });
});
