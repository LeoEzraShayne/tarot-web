import { describe, expect, it } from "vitest";
import { cardImages, spreads } from "./data";
import {
  barePath,
  infoContent,
  localeFromPath,
  localizeSpread,
  pathForLocale,
} from "./i18n";
describe("product catalog", () => {
  it("contains all 78 cards", () => expect(cardImages).toHaveLength(78));
  it("opens all fourteen calibrated spreads", () =>
    expect(spreads.filter((x) => x.available)).toHaveLength(14));
  it("supports one, three, six and ten-card readings", () =>
    expect([
      ...new Set(spreads.filter((x) => x.available).map((x) => x.cards)),
    ]).toEqual([3, 1, 6, 10]));
  it("keeps every available spread position complete", () =>
    expect(
      spreads
        .filter((x) => x.available)
        .every(
          (x) =>
            x.positions.length === x.cards &&
            new Set(x.positions).size === x.cards,
        ),
    ).toBe(true));
});
describe("bilingual routes and content", () => {
  it("keeps English at root and maps Chinese paths without losing the page", () => {
    expect(localeFromPath("/")).toBe("en");
    expect(localeFromPath("/zh/cards")).toBe("zh-CN");
    expect(pathForLocale("/cards", "zh-CN")).toBe("/zh/cards");
    expect(pathForLocale("/zh/cards", "en")).toBe("/cards");
    expect(barePath("/zh/learn/spreads")).toBe("/learn/spreads");
  });
  it("localizes all fourteen spreads by stable ID", () => {
    const localized = spreads.map((spread) => localizeSpread(spread, "zh-CN"));
    expect(localized).toHaveLength(14);
    expect(
      localized.every(
        (spread, index) =>
          spread.id === spreads[index].id &&
          spread.name !== spreads[index].name,
      ),
    ).toBe(true);
    expect(
      localized
        .filter((x) => x.available)
        .every(
          (x) => x.positions.length === x.cards && x.positions.every(Boolean),
        ),
    ).toBe(true);
  });
  it("provides English and Chinese for every help page", () => {
    expect(
      Object.values(infoContent).every(
        (page) =>
          page.en[0] &&
          page.en[1].every(Boolean) &&
          page.zh[0] &&
          page.zh[1].every(Boolean),
      ),
    ).toBe(true);
  });
});
