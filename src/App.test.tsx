// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({
  api: {
    setLocale: vi.fn(),
    me: vi.fn().mockResolvedValue({ user: null }),
    interpret: vi.fn(
      () => new Promise(() => undefined),
    ),
  },
}));

import { App } from "./App";

describe("interpretation ritual", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    history.replaceState({}, "", "/zh");
    sessionStorage.setItem(
      "tarot-reading-v2",
      JSON.stringify({
        version: 2,
        stage: "interpreting",
        question: "我该如何安排接下来的工作？",
        spreadId: "general-reflection",
        sessionId: "test-session",
        selected: [0, 1, 2],
        cards: [
          {
            positionId: 1,
            position: "背景",
            cardId: "1",
            cardName: "魔术师",
            orientation: "upright",
          },
          {
            positionId: 2,
            position: "核心",
            cardId: "2",
            cardName: "女祭司",
            orientation: "upright",
          },
          {
            positionId: 3,
            position: "建议",
            cardId: "3",
            cardName: "皇后",
            orientation: "upright",
          },
        ],
        reading: null,
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it("shows a clear loading state immediately after the ritual is skipped", async () => {
    render(<App />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    fireEvent.click(screen.getByRole("button", { name: /跳过仪式/ }));

    expect(screen.getByRole("status").textContent).toContain(
      "仪式已跳过，解读仍在生成中",
    );
    expect(
      screen.queryByRole("button", { name: /跳过仪式/ }),
    ).toBeNull();
  });
});
