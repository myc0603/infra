/** @jest-environment jsdom */

const React = require("react");
const { fireEvent, render, screen, waitFor } = require("@testing-library/react");

const { App } = require("../public/app");

function createResponse(body, options = {}) {
  return Promise.resolve({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: async () => body
  });
}

describe("App", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("loads and renders items on mount", async () => {
    global.fetch.mockResolvedValueOnce(
      createResponse([
        {
          id: "item-1",
          text: "loaded item",
          createdAt: "2026-03-10T00:00:00.000Z",
          updatedAt: "2026-03-10T00:00:00.000Z"
        }
      ])
    );

    render(<App />);

    expect(global.fetch).toHaveBeenCalledWith("/api/items");
    expect(await screen.findByText("loaded item")).toBeInTheDocument();
  });

  test("shows a validation error when submitting blank text", async () => {
    global.fetch.mockResolvedValueOnce(createResponse([]));

    render(<App />);
    await screen.findByRole("button", { name: "Add" });

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("Text is required.")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("enters edit mode and updates an item", async () => {
    global.fetch
      .mockResolvedValueOnce(
        createResponse([
          {
            id: "item-1",
            text: "before",
            createdAt: "2026-03-10T00:00:00.000Z",
            updatedAt: "2026-03-10T00:00:00.000Z"
          }
        ])
      )
      .mockResolvedValueOnce(
        createResponse({
          id: "item-1",
          text: "after",
          createdAt: "2026-03-10T00:00:00.000Z",
          updatedAt: "2026-03-10T01:00:00.000Z"
        })
      )
      .mockResolvedValueOnce(
        createResponse([
          {
            id: "item-1",
            text: "after",
            createdAt: "2026-03-10T00:00:00.000Z",
            updatedAt: "2026-03-10T01:00:00.000Z"
          }
        ])
      );

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));

    const input = screen.getByPlaceholderText("Update text");
    expect(input.value).toBe("before");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "after" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/items/item-1",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "after" })
        })
      );
    });

    expect(await screen.findByText("after")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("New item")).toHaveValue("");
  });

  test("deletes an item and reloads the list", async () => {
    global.fetch
      .mockResolvedValueOnce(
        createResponse([
          {
            id: "item-1",
            text: "delete me",
            createdAt: "2026-03-10T00:00:00.000Z",
            updatedAt: "2026-03-10T00:00:00.000Z"
          }
        ])
      )
      .mockResolvedValueOnce(
        createResponse({
          id: "item-1",
          text: "delete me",
          createdAt: "2026-03-10T00:00:00.000Z",
          updatedAt: "2026-03-10T00:00:00.000Z"
        })
      )
      .mockResolvedValueOnce(createResponse([]));

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/items/item-1", { method: "DELETE" });
    });

    await waitFor(() => {
      expect(screen.queryByText("delete me")).not.toBeInTheDocument();
    });
  });
});
