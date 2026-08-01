import { barePath, infoContent, pathForLocale } from "./i18n";
import type { Locale } from "./i18n";

const ORIGIN = "https://tarot.meritledger.org";
const indexable = new Set([
  "/",
  ...Object.keys(infoContent).filter((path) => path !== "/cards"),
]);

const home = {
  en: {
    title: "TAROT — Free Reflective Tarot Reading",
    description:
      "Ask an open question, choose a tarot spread, and receive a calm, evidence-grounded reading in English or Chinese.",
  },
  "zh-CN": {
    title: "TAROT — 安静、可复盘的塔罗解读",
    description:
      "提出一个开放式问题，选择牌阵并亲手抽牌，获得温和、具体且可追溯依据的塔罗解读。",
  },
};

const setMeta = (
  selector: string,
  attribute: "name" | "property",
  key: string,
  content: string,
) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
};

const setLink = (hreflang: string | null, href: string) => {
  const selector = hreflang
    ? `link[rel="alternate"][hreflang="${hreflang}"]`
    : 'link[rel="canonical"]';
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement("link");
    element.rel = hreflang ? "alternate" : "canonical";
    if (hreflang) element.hreflang = hreflang;
    document.head.append(element);
  }
  element.href = href;
};

export function updateSeo(route: string, locale: Locale) {
  const path = barePath(route);
  const content = infoContent[path];
  const localized = content
    ? locale === "zh-CN"
      ? content.zh
      : content.en
    : null;
  const title = localized ? `${localized[0]} — TAROT` : home[locale].title;
  const description = localized?.[1][0] || home[locale].description;
  const canonicalPath = pathForLocale(path, locale);
  const canonical = `${ORIGIN}${canonicalPath}`;

  document.title = title;
  setMeta('meta[name="description"]', "name", "description", description);
  setMeta(
    'meta[name="robots"]',
    "name",
    "robots",
    indexable.has(path)
      ? "index,follow,max-image-preview:large"
      : "noindex,follow",
  );
  setMeta('meta[property="og:title"]', "property", "og:title", title);
  setMeta(
    'meta[property="og:description"]',
    "property",
    "og:description",
    description,
  );
  setMeta('meta[property="og:url"]', "property", "og:url", canonical);
  setMeta(
    'meta[property="og:locale"]',
    "property",
    "og:locale",
    locale === "zh-CN" ? "zh_CN" : "en_US",
  );
  setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
  setMeta(
    'meta[name="twitter:description"]',
    "name",
    "twitter:description",
    description,
  );
  setLink(null, canonical);
  setLink("en", `${ORIGIN}${pathForLocale(path, "en")}`);
  setLink("zh-CN", `${ORIGIN}${pathForLocale(path, "zh-CN")}`);
  setLink("x-default", `${ORIGIN}${pathForLocale(path, "en")}`);
}
