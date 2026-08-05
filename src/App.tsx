import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { api } from "./api";
import type { SavedReading, User } from "./api";
import { cardImages, spreads } from "./data";
import type { Interpretation, RevealedCard, Spread, Stage } from "./types";
import {
  barePath,
  infoContent,
  localeFromPath,
  localizeSpread,
  pathForLocale,
  text,
} from "./i18n";
import type { Locale } from "./i18n";
import { updateSeo } from "./seo";
const back = "/assets/card-back-heritage.png";
const cues = {
  shuffle: "/audio/shuffle-soft.wav",
  cut: "/audio/deck-cut.wav",
  lift: "/audio/card-lift.wav",
  place: "/audio/card-place.wav",
  reveal: "/audio/card-reveal.wav",
  ready: "/audio/reading-ready.wav",
};
function play(name: keyof typeof cues, volume = 0.45) {
  const a = new Audio(cues[name]);
  a.volume = volume;
  a.play().catch(() => {});
  return a;
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SNAPSHOT_KEY = "tarot-reading-v2";
export function App() {
  const [stage, setStage] = useState<Stage>("question"),
    [question, setQuestion] = useState(""),
    [userContext, setUserContext] = useState(""),
    [spread, setSpread] = useState<Spread>(spreads[0]),
    [sessionId, setSessionId] = useState(""),
    [selected, setSelected] = useState<number[]>([]),
    [cards, setCards] = useState<RevealedCard[]>([]),
    [reading, setReading] = useState<Interpretation | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [route, setRoute] = useState(location.pathname),
    [loginOpen, setLoginOpen] = useState(false),
    [accountOpen, setAccountOpen] = useState(false),
    [user, setUser] = useState<User | null>(null),
    [snapshotHydrated, setSnapshotHydrated] = useState(false);
  const activeAudio = useRef<HTMLAudioElement[]>([]);
  const ritualResolve = useRef<(() => void) | null>(null);
  const interpretationStarted = useRef(false);
  const locale = localeFromPath(route),
    t = (value: string) => text(locale, value);
  const localeRef = useRef(locale);
  localeRef.current = locale;
  useEffect(() => {
    const onPop = () => setRoute(location.pathname);
    addEventListener("popstate", onPop);
    const hidden = () => {
      if (document.hidden) activeAudio.current.forEach((a) => a.pause());
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      removeEventListener("popstate", onPop);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SNAPSHOT_KEY) || "null");
      if (saved?.version === 2) {
        setStage(saved.stage);
        setQuestion(saved.question || "");
        setUserContext(saved.userContext || "");
        setSpread(
          spreads.find((item) => item.id === saved.spreadId) || spreads[0],
        );
        setSessionId(saved.sessionId || "");
        setSelected(saved.selected || []);
        setCards(saved.cards || []);
        setReading(saved.reading || null);
      }
    } catch {
      sessionStorage.removeItem(SNAPSHOT_KEY);
    } finally {
      setSnapshotHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (!snapshotHydrated) return;
    sessionStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({
        version: 2,
        stage,
        question,
        userContext,
        spreadId: spread.id,
        sessionId,
        selected,
        cards,
        reading,
      }),
    );
  }, [
    snapshotHydrated,
    stage,
    question,
    userContext,
    spread.id,
    sessionId,
    selected,
    cards,
    reading,
  ]);
  useEffect(() => {
    if (
      stage !== "interpreting" ||
      !sessionId ||
      reading ||
      interpretationStarted.current
    )
      return;
    interpretationStarted.current = true;
    api
      .interpret(sessionId)
      .then((result) => {
        setReading(result);
        if (user) api.save(sessionId).catch(() => {});
        sound("ready");
        setStage("result");
      })
      .catch((cause) =>
        setError(
          cause instanceof Error
            ? cause.message
            : t("The reading could not be completed."),
        ),
      )
      .finally(() => {
        interpretationStarted.current = false;
        setBusy(false);
      });
  }, [stage, sessionId, reading, user, locale]);
  useEffect(() => {
    api.setLocale(locale);
    document.documentElement.lang = locale;
    updateSeo(route, locale);
  }, [locale, route]);
  useEffect(() => {
    api
      .me()
      .then(({ user: current }) => setUser(current))
      .catch(() => setUser(null));
  }, []);
  const go = (path: string) => {
    const next = pathForLocale(path, locale);
    history.pushState({}, "", next);
    setRoute(next);
    scrollTo(0, 0);
  };
  const switchLocale = async (next: Locale) => {
    api.setLocale(next);
    const path = pathForLocale(route, next);
    history.pushState({}, "", path);
    setRoute(path);
    if (!sessionId || !["reveal", "interpreting", "result"].includes(stage))
      return;
    try {
      const shown = await api.reveal(sessionId);
      setCards(shown.cards);
      if (stage === "result") setReading(await api.interpret(sessionId));
    } catch {
      /* Keep the frozen reading visible if a translation refresh fails. */
    }
  };
  const sound = (n: keyof typeof cues, v?: number) => {
    const a = play(n, v);
    activeAudio.current.push(a);
  };
  const begin = async () => {
    if (question.trim().length < 8)
      return setError(
        t("Write a little more so the cards have a clear question."),
      );
    setError("");
    if (document.fonts?.load) {
      await Promise.race([
        document.fonts.load('48px "ZCOOL XiaoWei"', question),
        wait(1200),
      ]);
    }
    setStage("context");
  };
  const shuffle = async () => {
    setBusy(true);
    setError("");
    try {
      const s = await api.create(question, spread.id, userContext);
      setSessionId(s.id);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("The reading could not start."),
      );
      setBusy(false);
      return;
    }
    sound("shuffle");
    await wait(
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 100 : 2100,
    );
    sound("cut");
    await wait(
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 700,
    );
    sound("shuffle", 0.3);
    await wait(
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 100 : 1700,
    );
    sound("cut");
    await wait(
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 500,
    );
    setBusy(false);
    setStage("select");
  };
  const pick = async (i: number) => {
    if (busy || selected.includes(i) || selected.length >= spread.cards) return;
    const next = [...selected, i];
    setSelected(next);
    sound("place");
    try {
      await api.select(sessionId, next);
    } catch (e) {
      setSelected(selected);
      setError(e instanceof Error ? e.message : t("Selection failed."));
    }
  };
  const reveal = async () => {
    if (selected.length !== spread.cards) return;
    setError("");
    setBusy(true);
    setStage("reveal");
    try {
      const shown = await api.reveal(sessionId);
      setCards(shown.cards);
      for (let i = 0; i < spread.cards; i++) {
        sound("reveal");
        await wait(
          matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 40
            : spread.cards > 3
              ? 340
              : 900,
        );
      }
      await wait(900);
      interpretationStarted.current = true;
      setStage("interpreting");
      const ritual = new Promise<void>((resolve) => {
        ritualResolve.current = resolve;
        setTimeout(
          resolve,
          matchMedia("(prefers-reduced-motion: reduce)").matches ? 350 : 8000,
        );
      });
      const interpretation = api.interpret(sessionId).then((result) => {
        setReading(result);
        return result;
      });
      let [interpreted] = await Promise.all([interpretation, ritual]);
      if (localeRef.current !== locale) {
        api.setLocale(localeRef.current);
        interpreted = await api.interpret(sessionId);
      }
      setReading(interpreted);
      if (user) api.save(sessionId).catch(() => {});
      sound("ready");
      setStage("result");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("The cards could not be revealed."),
      );
      setStage("select");
    } finally {
      interpretationStarted.current = false;
      ritualResolve.current = null;
      setBusy(false);
    }
  };
  const restart = () => {
    setStage("question");
    setSelected([]);
    setCards([]);
    setReading(null);
    setUserContext("");
    setSessionId("");
    setError("");
    sessionStorage.removeItem(SNAPSHOT_KEY);
  };
  const signedIn = (nextUser: User) => {
    setUser(nextUser);
    setLoginOpen(false);
    if (sessionId && reading) api.save(sessionId).catch(() => {});
  };
  const signedOut = async () => {
    await api.logout();
    setUser(null);
    setAccountOpen(false);
  };
  const page = barePath(route);
  if (page === "/history" || page.startsWith("/history/"))
    return (
      <>
        {" "}
        <HistoryPage
          readingId={page.startsWith("/history/") ? page.slice(9) : null}
          go={go}
          locale={locale}
          switchLocale={switchLocale}
          user={user}
          onLogin={() => setLoginOpen(true)}
          onAccount={() => setAccountOpen(true)}
        />{" "}
        {loginOpen && (
          <LoginModal
            close={() => setLoginOpen(false)}
            setError={setError}
            locale={locale}
            onSignedIn={signedIn}
          />
        )}{" "}
        {accountOpen && user && (
          <AccountModal
            user={user}
            close={() => setAccountOpen(false)}
            logout={signedOut}
            locale={locale}
          />
        )}{" "}
      </>
    );
  if (page !== "/")
    return (
      <>
        {" "}
        <InfoPage
          route={barePath(route)}
          go={go}
          locale={locale}
          switchLocale={switchLocale}
          user={user}
          onLogin={() => setLoginOpen(true)}
          onAccount={() => setAccountOpen(true)}
        />{" "}
        {loginOpen && (
          <LoginModal
            close={() => setLoginOpen(false)}
            setError={setError}
            locale={locale}
            onSignedIn={signedIn}
          />
        )}{" "}
        {accountOpen && user && (
          <AccountModal
            user={user}
            close={() => setAccountOpen(false)}
            logout={signedOut}
            locale={locale}
          />
        )}{" "}
      </>
    );
  return (
    <div className={`app stage-${stage}`}>
      {" "}
      <Atmosphere />{" "}
      <Header
        stage={stage}
        go={go}
        onLogin={() => setLoginOpen(true)}
        onAccount={() => setAccountOpen(true)}
        user={user}
        locale={locale}
        switchLocale={switchLocale}
      />{" "}
      <main aria-live="polite">
        {" "}
        {error && (
          <div role="alert" className="error">
            {" "}
            {error}{" "}
          </div>
        )}{" "}
        {stage === "question" && (
          <Landing
            question={question}
            setQuestion={setQuestion}
            begin={begin}
            go={go}
            locale={locale}
          />
        )}{" "}
        {stage === "context" && (
          <ContextStep
            value={userContext}
            setValue={setUserContext}
            continueTo={() => setStage("spreads")}
            back={() => setStage("question")}
            locale={locale}
          />
        )}{" "}
        {stage === "spreads" && (
          <SpreadPicker
            selected={spread}
            choose={setSpread}
            continueTo={() => setStage("shuffle")}
            locale={locale}
          />
        )}{" "}
        {stage === "shuffle" && (
          <Shuffle
            question={question}
            spread={spread}
            busy={busy}
            start={shuffle}
            locale={locale}
          />
        )}{" "}
        {stage === "select" && (
          <Selection
            spread={spread}
            selected={selected}
            pick={pick}
            remove={(i) => {
              if (busy) return;
              const next = selected.filter((x) => x !== i);
              setSelected(next);
              api.select(sessionId, next).catch(() => {});
              sound("lift", 0.15);
            }}
            reveal={reveal}
            locale={locale}
          />
        )}{" "}
        {stage === "reveal" && <Reveal cards={cards} locale={locale} />}{" "}
        {stage === "interpreting" && (
          <InterpretationRitual
            question={question}
            cards={cards}
            reading={reading}
            locale={locale}
            skip={() => ritualResolve.current?.()}
          />
        )}{" "}
        {stage === "result" && reading && (
          <Results
            question={question}
            cards={cards}
            reading={reading}
            restart={restart}
            locale={locale}
          />
        )}{" "}
      </main>{" "}
      <Footer go={go} locale={locale} />{" "}
      {loginOpen && (
        <LoginModal
          close={() => setLoginOpen(false)}
          setError={setError}
          locale={locale}
          onSignedIn={signedIn}
        />
      )}{" "}
      {accountOpen && user && (
        <AccountModal
          user={user}
          close={() => setAccountOpen(false)}
          logout={signedOut}
          locale={locale}
        />
      )}{" "}
    </div>
  );
}
function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      {" "}
      <i /> <b>❦</b> <b>❦</b>{" "}
    </div>
  );
}
function Header({
  stage,
  go,
  onLogin,
  onAccount,
  user,
  locale,
  switchLocale,
}: {
  stage: Stage;
  go: (p: string) => void;
  onLogin: () => void;
  onAccount: () => void;
  user: User | null;
  locale: Locale;
  switchLocale: (l: Locale) => void;
}) {
  const journey: Stage[] = [
    "question",
    "context",
    "spreads",
    "shuffle",
    "select",
    "reveal",
    "interpreting",
    "result",
  ];
  const n = journey.indexOf(stage),
    t = (v: string) => text(locale, v);
  return (
    <header className={`stage-${stage}`}>
      {" "}
      <a className="brand" href={pathForLocale("/", locale)}>
        {" "}
        <img
          className="brand-emblem"
          src="/assets/tarot-emblem.svg"
          alt=""
          aria-hidden="true"
        />{" "}
        <i aria-hidden="true">◆</i>{" "}
        <img
          className="brand-wordmark"
          src="/assets/brand-wordmark.svg"
          alt="TAROT"
        />{" "}
      </a>{" "}
      <nav>
        {" "}
        <button onClick={() => go("/")}>{t("Readings")}</button>{" "}
        {user && (
          <button onClick={() => go("/history")}>{t("Reading history")}</button>
        )}{" "}
        <button onClick={() => go("/learn/how-tarot-works")}>
          {" "}
          {t("Learn")}{" "}
        </button>{" "}
      </nav>{" "}
      <div className="header-end">
        {" "}
        <button
          className="account-trigger"
          onClick={user ? onAccount : onLogin}
          title={user?.email || t("Sign in")}
        >
          {" "}
          {user
            ? user.name || user.email || t("My account")
            : t("Sign in")}{" "}
        </button>{" "}
        <div className="locale-switch" role="group" aria-label="Language">
          {" "}
          <button
            className={locale === "en" ? "active" : ""}
            onClick={() => switchLocale("en")}
          >
            {" "}
            EN{" "}
          </button>{" "}
          <span>/</span>{" "}
          <button
            className={locale === "zh-CN" ? "active" : ""}
            onClick={() => switchLocale("zh-CN")}
          >
            {" "}
            中文{" "}
          </button>{" "}
        </div>{" "}
        {stage !== "question" && (
          <div
            className="progress"
            role="img"
            aria-label={`Reading step ${n + 1} of ${journey.length}`}
          >
            {" "}
            {journey.map((_, x) => (
              <i key={x} className={x <= n ? "on" : ""} />
            ))}{" "}
          </div>
        )}{" "}
      </div>{" "}
    </header>
  );
}
function Landing({
  question,
  setQuestion,
  begin,
  go,
  locale,
}: {
  question: string;
  setQuestion: (s: string) => void;
  begin: () => void;
  go: (p: string) => void;
  locale: Locale;
}) {
  const t = (v: string) => text(locale, v);
  return (
    <>
      {" "}
      <section className="landing">
        {" "}
        <div className="landing-copy">
          {" "}
          <p className="eyebrow">{t("A QUIET SPACE FOR REFLECTION")}</p>{" "}
          <h1>
            {" "}
            {t("What would you like")} <br /> <em>{t("clarity on?")}</em>{" "}
          </h1>{" "}
          <p className="lede">
            {" "}
            {t(
              "Ask an open question about what you can understand, influence, or approach differently.",
            )}{" "}
          </p>{" "}
          <label>
            {" "}
            <span>{t("Your question")}</span>{" "}
            <textarea
              rows={2}
              maxLength={200}
              placeholder=""
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />{" "}
            <small className={question.length === 0 ? "is-empty" : undefined}>
              {question.length} / 200
            </small>{" "}
          </label>{" "}
          <button className="primary" onClick={begin}>
            {" "}
            {t("Begin Your Reading")} <b>→</b>{" "}
          </button>{" "}
          <p className="fine">
            {" "}
            {t(
              "For reflection, not prediction. Your choices remain your own.",
            )}{" "}
          </p>{" "}
        </div>{" "}
        <div className="hero" aria-hidden="true">
          {" "}
          <img
            className="hero-botanical"
            src="/assets/art/botanical-rose-lily-v1.png"
            alt=""
          />{" "}
          <img className="hero-card" src={back} alt="" />{" "}
        </div>{" "}
      </section>{" "}
      <section className="home-blocks">
        {" "}
        {[
          [
            "How it works",
            "Ask, choose a spread, then select your own cards.",
            "/learn/how-tarot-works",
          ],
          [
            "Why this reading",
            "Every interpretation stays traceable to the exact cards you draw.",
            "/about/accuracy",
          ],
          [
            "Explore tarot",
            "Learn the cards, positions and reflective method.",
            "/cards",
          ],
        ].map(([h, p, u]) => (
          <button key={h} onClick={() => go(u)}>
            {" "}
            <span>✦</span> <h2>{t(h)}</h2> <p>{t(p)}</p>{" "}
            <b>{t("Explore")} →</b>{" "}
          </button>
        ))}{" "}
      </section>{" "}
    </>
  );
}
function ContextStep({
  value,
  setValue,
  continueTo,
  back,
  locale,
}: {
  value: string;
  setValue: (value: string) => void;
  continueTo: () => void;
  back: () => void;
  locale: Locale;
}) {
  const zh = locale === "zh-CN";
  return (
    <section className="context-step">
      <div className="context-folio">
        <p className="eyebrow">
          {zh ? "可选 · 补充背景" : "OPTIONAL · ADD CONTEXT"}
        </p>
        <h1>
          {zh
            ? "让牌面更贴近你此刻的处境。"
            : "Give the cards a little more of the present moment."}
        </h1>
        <p className="lede">
          {zh
            ? "可以写下已知事实、时间范围，或你已经尝试过什么。没有更多内容也可以直接继续。"
            : "Add known facts, a timeframe, or what you have already tried. You can also continue without adding anything."}
        </p>
        <label>
          <span>{zh ? "当前背景" : "CURRENT CONTEXT"}</span>
          <textarea
            rows={6}
            maxLength={500}
            value={value}
            placeholder={
              zh
                ? "例如：这件事将在两个月内决定，我已经和对方沟通过一次……"
                : "For example: a decision is due within two months, and I have already had one conversation…"
            }
            onChange={(event) => setValue(event.target.value)}
          />
          <small>{value.length} / 500</small>
        </label>
        <div className="context-actions">
          <button className="ghost" onClick={back}>
            {zh ? "返回修改问题" : "Back to question"}
          </button>
          <button className="primary" onClick={continueTo}>
            {zh
              ? value
                ? "带着背景继续"
                : "跳过并继续"
              : value
                ? "Continue with context"
                : "Skip and continue"}
            <b>→</b>
          </button>
        </div>
      </div>
    </section>
  );
}

function SpreadPicker({
  selected,
  choose,
  continueTo,
  locale,
}: {
  selected: Spread;
  choose: (s: Spread) => void;
  continueTo: () => void;
  locale: Locale;
}) {
  const groups = useMemo(
      () =>
        [1, 3, 6, 10].map(
          (n) => [n, spreads.filter((s) => s.cards === n)] as const,
        ),
      [],
    ),
    t = (v: string) => text(locale, v);
  return (
    <section className="spread-page">
      {" "}
      <div className="center">
        {" "}
        <p className="eyebrow">{t("CHOOSE A SPREAD")}</p>{" "}
        <h1>
          {" "}
          {t("How deeply would you like")} <em>{t("to explore?")}</em>{" "}
        </h1>{" "}
        <p>
          {" "}
          {t("Your question remains with you throughout the reading.")}{" "}
        </p>{" "}
      </div>{" "}
      {groups.map(([count, list]) => (
        <div className="spread-group" key={count}>
          {" "}
          <h2>
            {" "}
            {locale === "zh-CN"
              ? `${count} 张牌阵`
              : `${count}-card spreads`}{" "}
          </h2>{" "}
          <div className="spread-grid">
            {" "}
            {list.map((source) => {
              const s = localizeSpread(source, locale);
              return (
                <button
                  key={s.id}
                  disabled={!s.available}
                  className={selected.id === s.id ? "chosen" : ""}
                  onClick={() => choose(source)}
                >
                  {" "}
                  <span>
                    {" "}
                    {t(
                      s.available
                        ? selected.id === s.id
                          ? "SELECTED"
                          : "AVAILABLE"
                        : "COMING LATER",
                    )}{" "}
                  </span>{" "}
                  <div className="backs">
                    {" "}
                    {Array.from({ length: s.cards }, (_, i) => (
                      <img key={i} src={back} alt="" />
                    ))}{" "}
                  </div>{" "}
                  <h3>{s.name}</h3>{" "}
                  <p>
                    {" "}
                    {s.positions.length
                      ? s.positions.join(" · ")
                      : t("A deeper reflective structure")}{" "}
                  </p>{" "}
                  <footer>
                    {" "}
                    {s.cards} {t("CARDS")}{" "}
                    <b>
                      {" "}
                      {t("ABOUT")} {s.duration} {t("MINUTES")}{" "}
                    </b>{" "}
                  </footer>{" "}
                </button>
              );
            })}{" "}
          </div>{" "}
        </div>
      ))}{" "}
      <button className="primary sticky-action" onClick={continueTo}>
        {" "}
        {t("Continue to Shuffling")} <b>→</b>{" "}
      </button>{" "}
    </section>
  );
}
function Shuffle({
  question,
  spread,
  busy,
  start,
  locale,
}: {
  question: string;
  spread: Spread;
  busy: boolean;
  start: () => void;
  locale: Locale;
}) {
  const t = (v: string) => text(locale, v),
    s = localizeSpread(spread, locale);
  return (
    <section className="shuffle-page">
      {" "}
      <p className="eyebrow">{s.name.toUpperCase()}</p>{" "}
      <h1>
        {" "}
        {t("Hold your question")} <br /> <em>{t("gently in mind.")}</em>{" "}
      </h1>{" "}
      <blockquote>“{question}”</blockquote>{" "}
      <div
        className={`deck deck-78 ${busy ? "shuffling" : ""}`}
        aria-label={t("A complete deck of 78 cards")}
      >
        {" "}
        {Array.from({ length: 78 }, (_, i) => {
          const leftPacket = i < 39;
          const packetIndex = i % 39;
          const style = {
            "--card-index": i,
            "--rest-x": `${(packetIndex - 19) * 0.05}px`,
            "--rest-y": `${-packetIndex * 0.075}px`,
            "--split-x": `${leftPacket ? -82 : 82}px`,
            "--packet-turn": `${leftPacket ? -3.5 : 3.5}deg`,
            "--riffle-x": `${leftPacket ? -5 : 5}px`,
            "--riffle-y": `${-packetIndex * 0.11}px`,
            "--cut-x": `${i < 52 ? -28 : 62}px`,
            "--cut-y": `${i < 52 ? 6 : -12}px`,
          } as CSSProperties;
          return (
            <img
              key={i}
              src={back}
              alt=""
              data-packet={leftPacket ? "left" : "right"}
              style={style}
            />
          );
        })}{" "}
      </div>{" "}
      <button disabled={busy} className="primary" onClick={start}>
        {" "}
        {t(busy ? "Shuffling…" : "Shuffle the Deck")} <b>↝</b>{" "}
      </button>{" "}
      <p className="fine">
        {" "}
        {t("The order and orientation are fixed before you choose.")}{" "}
      </p>{" "}
    </section>
  );
}
function Selection({
  spread,
  selected,
  pick,
  remove,
  reveal,
  locale,
}: {
  spread: Spread;
  selected: number[];
  pick: (i: number) => void;
  remove: (i: number) => void;
  reveal: () => void;
  locale: Locale;
}) {
  const t = (v: string) => text(locale, v),
    s = localizeSpread(spread, locale);
  const total = s.cards;
  const numeral = (index: number) =>
    ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][index];
  return (
    <section className="selection">
      {" "}
      <div className="select-head">
        {" "}
        <div>
          {" "}
          <p className="eyebrow">
            {" "}
            {locale === "zh-CN"
              ? `选择 ${total} 张牌`
              : `CHOOSE ${total} ${total === 1 ? "CARD" : "CARDS"}`}{" "}
          </p>{" "}
          <h1>
            {" "}
            {t("Notice what")} <em>{t("draws you in.")}</em>{" "}
          </h1>{" "}
        </div>{" "}
        <strong>
          {" "}
          {selected.length}{" "}
          <span>
            {" "}
            {locale === "zh-CN"
              ? `/ ${total} 已选择`
              : `OF ${total} SELECTED`}{" "}
          </span>{" "}
        </strong>{" "}
      </div>{" "}
      <div className={`slots layout-${s.layout || "row"} count-${total}`}>
        {" "}
        {s.positions.map((p, i) => (
          <button
            key={p}
            className={selected[i] !== undefined ? "filled" : ""}
            onClick={() => selected[i] !== undefined && remove(selected[i])}
          >
            {" "}
            {selected[i] !== undefined ? (
              <img src={back} alt="" />
            ) : (
              <>
                {" "}
                <b>{numeral(i)}</b> <span>{p}</span>{" "}
              </>
            )}{" "}
          </button>
        ))}{" "}
      </div>{" "}
      <div
        className="ribbon"
        role="listbox"
        aria-label={t("Choose from 78 tarot cards")}
      >
        {" "}
        {Array.from({ length: 78 }, (_, i) => (
          <button
            key={i}
            role="option"
            aria-selected={selected.includes(i)}
            aria-label={
              locale === "zh-CN"
                ? `选择第 ${i + 1} 张牌`
                : `Choose card ${i + 1}`
            }
            className={selected.includes(i) ? "picked" : ""}
            onFocus={() => soundQuiet()}
            onClick={() => pick(i)}
          >
            {" "}
            <img src={back} alt="" />{" "}
          </button>
        ))}{" "}
      </div>{" "}
      <div className="selection-foot">
        {" "}
        <p>{t("Move slowly. There is no wrong choice.")}</p>{" "}
        <button
          className="primary"
          disabled={selected.length !== total}
          onClick={reveal}
        >
          {" "}
          {t(total === 1 ? "Reveal My Card" : "Reveal My Cards")} <b>→</b>{" "}
        </button>{" "}
        <p>
          {" "}
          {selected.length === total
            ? t("Your selection is ready")
            : locale === "zh-CN"
              ? `请选择第 ${selected.length + 1} 张，共 ${total} 张`
              : `Choose card ${selected.length + 1} of ${total}`}{" "}
        </p>{" "}
      </div>{" "}
    </section>
  );
}
let lastLift = 0;
function soundQuiet() {
  if (Date.now() - lastLift > 500) {
    play("lift", 0.08);
    lastLift = Date.now();
  }
}

type DiagramMode = "ritual" | "result";

function diagramGroups(cards: RevealedCard[]) {
  if (cards.length === 10) return [cards.slice(0, 6), cards.slice(6)];
  if (cards.length === 6) return [cards.slice(0, 3), cards.slice(3)];
  return [cards];
}

function DiagramBranches({ count }: { count: number }) {
  return (
    <svg
      className="diagram-branches"
      viewBox="0 0 1000 118"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => {
        const x = ((index + 0.5) * 1000) / count;
        return (
          <path
            key={x}
            d={`M ${x} 0 V 28 Q ${x} 70 500 76 V 112`}
            pathLength="1"
          />
        );
      })}
      <path className="diagram-branch-stem" d="M 500 76 V 118" />
      <circle cx="500" cy="76" r="6" />
      <path className="diagram-branch-diamond" d="M500 68l8 8-8 8-8-8Z" />
    </svg>
  );
}

function diagramGroupLabel(
  total: number,
  groupIndex: number,
  locale: Locale,
) {
  if (total === 10) {
    if (locale === "zh-CN")
      return groupIndex === 0 ? "核心十字" : "观察支柱";
    return groupIndex === 0 ? "THE INNER CROSS" : "THE OUTER PILLAR";
  }
  if (total === 6) return groupIndex === 0 ? "I" : "II";
  return "";
}

function ReadingDiagram({
  cards,
  reading,
  locale,
  mode,
}: {
  cards: RevealedCard[];
  reading: Interpretation | null;
  locale: Locale;
  mode: DiagramMode;
}) {
  const groups = diagramGroups(cards);
  const keywordFor = (card: RevealedCard) => {
    const section = reading?.sections.find(
      (item) =>
        item.cardId === card.cardId && item.position === card.position,
    );
    return section?.keywords?.slice(0, 2).join(" · ") || "";
  };

  return (
    <div
      className={`reading-diagram mode-${mode} count-${cards.length} ${
        reading ? "has-keywords" : "is-gathering"
      }`}
    >
      <div className={`diagram-groups groups-${groups.length}`}>
        {groups.map((group, groupIndex) => {
          const label = diagramGroupLabel(cards.length, groupIndex, locale);
          return (
            <section
              className={`diagram-group group-${groupIndex + 1} size-${group.length}`}
              key={`${cards.length}-${groupIndex}`}
            >
              {label && <p className="diagram-group-label">{label}</p>}
              <div className="diagram-card-row">
                {group.map((card, index) => {
                  const keyword = keywordFor(card);
                  return (
                    <article
                      key={`${card.positionId}-${card.cardId}`}
                      style={
                        {
                          "--diagram-index": groupIndex * 6 + index,
                          "--diagram-delay": `${
                            (groupIndex * 6 + index) * 90
                          }ms`,
                        } as CSSProperties
                      }
                    >
                      <div className="diagram-position">
                        <span>{card.position}</span>
                        <i aria-hidden="true">◆</i>
                      </div>
                      <img
                        className={
                          card.orientation === "reversed" ? "reversed" : ""
                        }
                        src={cardImages[Number(card.cardId)]}
                        alt={`${card.cardName}, ${text(locale, card.orientation)}`}
                      />
                      <div className="diagram-keyword">
                        <i aria-hidden="true">◆</i>
                        <strong>{keyword || "\u00a0"}</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
              <DiagramBranches count={group.length} />
            </section>
          );
        })}
      </div>
      <div className="diagram-root" aria-hidden="true">
        <img src="/assets/ritual-flourish.svg" alt="" />
      </div>
    </div>
  );
}

function Reveal({ cards, locale }: { cards: RevealedCard[]; locale: Locale }) {
  const t = (v: string) => text(locale, v);
  return (
    <section className={`reveal reveal-${cards.length || 3}`}>
      {" "}
      <p className="eyebrow">{t("YOUR REFLECTION")}</p>{" "}
      <h1>
        {" "}
        {t("Your cards are")} <em>{t("ready.")}</em>{" "}
      </h1>{" "}
      <div className="reveal-grid">
        {" "}
        {cards.length
          ? cards.map((c, i) => (
              <article
                key={c.cardId}
                style={{
                  animationDelay: `${i * (cards.length > 3 ? 0.3 : 0.8)}s`,
                }}
              >
                {" "}
                <img
                  className={c.orientation === "reversed" ? "reversed" : ""}
                  src={cardImages[Number(c.cardId)]}
                  alt={`${c.cardName}, ${t(c.orientation)}`}
                />{" "}
                <h2>{c.cardName}</h2>{" "}
                <p>
                  {" "}
                  {c.position} · {t(c.orientation)}{" "}
                </p>{" "}
              </article>
            ))
          : [0, 1, 2].map((i) => (
              <article key={i}>
                {" "}
                <img src={back} alt="" />{" "}
              </article>
            ))}{" "}
      </div>{" "}
      <p>{t("Take a breath and meet them one at a time.")}</p>{" "}
    </section>
  );
}
function InterpretationRitual({
  question,
  cards,
  reading,
  locale,
  skip,
}: {
  question: string;
  cards: RevealedCard[];
  reading: Interpretation | null;
  locale: Locale;
  skip: () => void;
}) {
  const [showSkip, setShowSkip] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 1500);
    return () => clearTimeout(timer);
  }, []);
  const zh = locale === "zh-CN";
  return (
    <section
      className={`interpretation-ritual count-${cards.length} ${
        reading ? "is-ready" : ""
      }`}
      aria-busy={!reading}
    >
      <div className="ritual-question">
        <span>◆ {zh ? "你的问题" : "YOUR QUESTION"} ◆</span>
        <h1 className="mystic-question">{question}</h1>
      </div>
      <div className="ritual-tableau">
        <div className="ritual-tableau-heading">
          <img src="/assets/tarot-emblem.svg" alt="" aria-hidden="true" />
          <span>
            02 · {zh ? "牌面建立联系" : "THE CARDS FIND THEIR THREAD"}
          </span>
        </div>
        <ReadingDiagram
          cards={cards}
          reading={reading}
          locale={locale}
          mode="ritual"
        />
      </div>
      <div className={`ritual-reading ${reading ? "is-ready" : ""}`}>
        <div className="ritual-reading-copy">
          <span>
            03 · {zh ? "牌面之间的线索" : "THE THREAD BETWEEN THE CARDS"}
          </span>
          <h2>
            {reading?.headline ||
              (zh
                ? "正在整理牌面之间的线索……"
                : "The thread is still taking shape…")}
          </h2>
          {reading ? (
            <p>{reading.synthesis}</p>
          ) : (
            <div className="quiet-lines" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          )}
        </div>
      </div>
      {showSkip && (
        <button className="skip-ritual" onClick={skip}>
          {zh ? "跳过仪式" : "Skip ritual"} <b>›</b>
        </button>
      )}
    </section>
  );
}

function Results({
  question,
  cards,
  reading,
  restart,
  locale,
  restartLabel,
}: {
  question: string;
  cards: RevealedCard[];
  reading: Interpretation;
  restart: () => void;
  locale: Locale;
  restartLabel?: string;
}) {
  const t = (v: string) => text(locale, v);
  return (
    <section className="results">
      {" "}
      <div className="result-head">
        {" "}
        <div>
          {" "}
          <p className="eyebrow">{t("YOUR READING")}</p>{" "}
          <h1>
            {" "}
            {t("A quieter view of")} <br />{" "}
            <em>{t("what comes next.")}</em>{" "}
          </h1>{" "}
          <blockquote>“{question}”</blockquote>{" "}
        </div>{" "}
        <button onClick={restart}>
          {" "}
          {restartLabel || t("New reading")}{" "}
        </button>{" "}
      </div>{" "}
      <ReadingDiagram
        cards={cards}
        reading={reading}
        locale={locale}
        mode="result"
      />{" "}
      <div className="thread">
        {" "}
        <p className="eyebrow">
          {" "}
          {t(
            cards.length === 3
              ? "THE THREAD BETWEEN THEM"
              : "THE PATTERN BETWEEN THEM",
          )}{" "}
        </p>{" "}
        <h2>{reading.headline || reading.synthesis}</h2>{" "}
        <p className="synthesis-copy">{reading.synthesis}</p>
        {reading.relations.map((x) => (
          <p key={typeof x === "string" ? x : x.text}>
            {typeof x === "string" ? x : x.text}
          </p>
        ))}{" "}
      </div>{" "}
      {!!reading.groups?.length && (
        <div className="reading-groups">
          {" "}
          {reading.groups.map((group) => (
            <article key={group.title}>
              {" "}
              <span>{group.positions.join(" · ")}</span> <h2>{group.title}</h2>{" "}
              <p>{group.summary}</p>{" "}
            </article>
          ))}{" "}
        </div>
      )}{" "}
      <div className="long-reading">
        {" "}
        {reading.sections.map((s, i) => (
          <article key={s.cardId} className={i % 2 ? "alternate" : ""}>
            {" "}
            <div className="meaning">
              {" "}
              <span>{s.position}</span>{" "}
              <h2>
                {" "}
                {s.cardName} <em>{t(s.orientation)}</em>{" "}
              </h2>{" "}
              <h3>{t("Base meaning")}</h3> <p>{s.baseMeaning}</p>{" "}
              <h3>{t("In your context")}</h3> <p>{s.contextualMeaning}</p>{" "}
              <h3>{t("In relation")}</h3> <p>{s.relation}</p>{" "}
              <blockquote>{s.reflectionQuestion}</blockquote>{" "}
            </div>{" "}
            <img
              className={s.orientation === "reversed" ? "reversed" : ""}
              src={cardImages[Number(s.cardId)]}
              alt={`${s.cardName}, ${t(s.orientation)}`}
            />{" "}
          </article>
        ))}{" "}
      </div>{" "}
      <section className="reflection-close">
        <div>
          <p className="eyebrow">
            {locale === "zh-CN"
              ? "假设与不确定性"
              : "ASSUMPTIONS & UNCERTAINTY"}
          </p>
          {reading.assumptions?.map((item) => (
            <p key={item}>{item}</p>
          ))}
          <p>{reading.confidence.uncertainty}</p>
        </div>
        <div>
          <p className="eyebrow">
            {locale === "zh-CN" ? "可以落地的下一步" : "A PRACTICAL NEXT STEP"}
          </p>
          {reading.actionPlan?.map((item) => (
            <article key={item.action}>
              <h2>{item.action}</h2>
              <p>{item.reason}</p>
              <dl>
                <div>
                  <dt>{locale === "zh-CN" ? "时间" : "Timeframe"}</dt>
                  <dd>{item.timeframe}</dd>
                </div>
                <div>
                  <dt>
                    {locale === "zh-CN" ? "观察信号" : "Observable signal"}
                  </dt>
                  <dd>{item.observableSignal}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <footer>
          <span>
            {reading.generation?.mode === "ai"
              ? locale === "zh-CN"
                ? "结合语境生成"
                : "Context-shaped reading"
              : locale === "zh-CN"
                ? "规则解读模式"
                : "Rule-based reading"}
          </span>
          <p>{reading.safety}</p>
        </footer>
      </section>
    </section>
  );
}
function LoginModal({
  close,
  setError,
  locale,
  onSignedIn,
}: {
  close: () => void;
  setError: (s: string) => void;
  locale: Locale;
  onSignedIn: (user: User) => void;
}) {
  const ref = useRef<HTMLDivElement>(null),
    t = (v: string) => text(locale, v);
  useEffect(() => {
    const id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!id || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: id,
      callback: async ({ credential }: { credential: string }) => {
        try {
          const result = await api.google(credential);
          onSignedIn(result.user);
        } catch (e) {
          setError(e instanceof Error ? e.message : t("Sign in failed."));
        }
      },
    });
    window.google.accounts.id.renderButton(ref.current!, {
      theme: "outline",
      size: "large",
      width: 280,
      locale: locale === "zh-CN" ? "zh_CN" : "en",
    });
  }, [setError, locale, onSignedIn]);
  return (
    <div className="modal" role="dialog" aria-modal="true">
      {" "}
      <div>
        {" "}
        <button className="close" onClick={close}>
          {" "}
          ×{" "}
        </button>{" "}
        <p className="eyebrow">{t("SAVE YOUR REFLECTIONS")}</p>{" "}
        <h2>{t("Sign in to TAROT")}</h2>{" "}
        <p>
          {" "}
          {t(
            "Reading never requires an account. Sign in only when you want to save and revisit it.",
          )}{" "}
        </p>{" "}
        <div ref={ref} className="google-signin">
          {" "}
          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <p className="fine">
              {" "}
              {t(
                "Google sign-in will appear when the production client ID is configured.",
              )}{" "}
            </p>
          )}{" "}
        </div>{" "}
        <button onClick={close}>{t("Continue without account")}</button>{" "}
      </div>{" "}
    </div>
  );
}
function AccountModal({
  user,
  close,
  logout,
  locale,
}: {
  user: User;
  close: () => void;
  logout: () => Promise<void>;
  locale: Locale;
}) {
  const t = (value: string) => text(locale, value);
  return (
    <div className="modal account-modal" role="dialog" aria-modal="true">
      {" "}
      <div>
        {" "}
        <button className="close" onClick={close} aria-label={t("Close")}>
          {" "}
          ×{" "}
        </button>{" "}
        <div className="account-identity">
          {" "}
          {user.picture_url && <img src={user.picture_url} alt="" />}{" "}
          <div>
            {" "}
            <p className="eyebrow">{t("MY ACCOUNT")}</p>{" "}
            <h2>{user.name || t("My account")}</h2> <p>{user.email}</p>{" "}
          </div>{" "}
        </div>{" "}
        <button className="sign-out" onClick={() => logout()}>
          {" "}
          {t("Sign out")}{" "}
        </button>{" "}
      </div>{" "}
    </div>
  );
}
function HistoryPage({
  readingId,
  go,
  locale,
  switchLocale,
  user,
  onLogin,
  onAccount,
}: {
  readingId: string | null;
  go: (path: string) => void;
  locale: Locale;
  switchLocale: (locale: Locale) => void;
  user: User | null;
  onLogin: () => void;
  onAccount: () => void;
}) {
  const [readings, setReadings] = useState<SavedReading[]>([]),
    [detail, setDetail] = useState<
      Awaited<ReturnType<typeof api.reading>>["reading"] | null
    >(null),
    [loading, setLoading] = useState(true),
    [historyError, setHistoryError] = useState(""),
    t = (value: string) => text(locale, value);
  useEffect(() => {
    let active = true;
    api.setLocale(locale);
    setLoading(true);
    setHistoryError("");
    const request = readingId
      ? api.reading(readingId).then(({ reading }) => {
          if (active) setDetail(reading);
        })
      : api.readings().then(({ readings: saved }) => {
          if (active) setReadings(saved);
        });
    request
      .catch((error) => {
        if (active)
          setHistoryError(
            error instanceof Error
              ? error.message
              : t("History could not load."),
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [readingId, locale]);
  const spreadName = (id: string) => {
    const source = spreads.find((item) => item.id === id);
    return source ? localizeSpread(source, locale).name : id;
  };
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  const setAccuracy = async (id: string, accuracy: number) => {
    const previous = readings.find((item) => item.id === id)?.accuracy ?? null;
    setReadings((items) =>
      items.map((item) => (item.id === id ? { ...item, accuracy } : item)),
    );
    try {
      await api.accuracy(id, accuracy);
    } catch (error) {
      setReadings((items) =>
        items.map((item) =>
          item.id === id ? { ...item, accuracy: previous } : item,
        ),
      );
      setHistoryError(
        error instanceof Error
          ? error.message
          : t("Accuracy could not be saved."),
      );
    }
  };
  return (
    <div className="app">
      {" "}
      <Atmosphere />{" "}
      <Header
        stage="question"
        go={go}
        onLogin={onLogin}
        onAccount={onAccount}
        user={user}
        locale={locale}
        switchLocale={switchLocale}
      />{" "}
      <main>
        {" "}
        {loading && <div className="history-status">{t("Loading…")}</div>}{" "}
        {historyError && (
          <div className="history-status" role="alert">
            {" "}
            <p>{historyError}</p>{" "}
            {!user && <button onClick={onLogin}>{t("Sign in")}</button>}{" "}
          </div>
        )}{" "}
        {!loading && !historyError && readingId && detail && (
          <Results
            question={detail.question}
            cards={detail.interpretation.draw}
            reading={detail.interpretation}
            restart={() => go("/history")}
            restartLabel={t("Back to history")}
            locale={locale}
          />
        )}{" "}
        {!loading && !historyError && !readingId && (
          <section className="history-page">
            {" "}
            <div className="history-title">
              {" "}
              <div>
                {" "}
                <p className="eyebrow">{t("MY ACCOUNT")}</p>{" "}
                <h1>{t("My reading history")}</h1>{" "}
                <p>
                  {" "}
                  {t(
                    "Rate how well each reading matched your lived context.",
                  )}{" "}
                </p>{" "}
              </div>{" "}
              <strong>{readings.length}</strong>{" "}
            </div>{" "}
            {readings.length === 0 ? (
              <div className="history-empty">{t("No saved readings yet.")}</div>
            ) : (
              <div className="history-records">
                {" "}
                {readings.map((item) => (
                  <article key={item.id}>
                    {" "}
                    <button
                      className="record-link"
                      onClick={() => go(`/history/${item.id}`)}
                    >
                      {" "}
                      <time dateTime={item.created_at}>
                        {" "}
                        {date(item.created_at)}{" "}
                      </time>{" "}
                      <h2>{item.question}</h2>{" "}
                      <span>{spreadName(item.spread_id)}</span>{" "}
                      <b aria-hidden="true">→</b>{" "}
                    </button>{" "}
                    <div
                      className="accuracy-group"
                      role="radiogroup"
                      aria-label={t("Accuracy")}
                    >
                      {" "}
                      <span className="accuracy-label">
                        {" "}
                        {t("Accuracy")}{" "}
                      </span>{" "}
                      {(
                        [
                          [3, "Accurate"],
                          [2, "Partly accurate"],
                          [1, "Not accurate"],
                        ] as const
                      ).map(([value, label]) => (
                        <label key={value}>
                          {" "}
                          <input
                            type="radio"
                            name={`accuracy-${item.id}`}
                            value={value}
                            checked={item.accuracy === value}
                            onChange={() => setAccuracy(item.id, value)}
                          />{" "}
                          <span>{t(label)}</span>{" "}
                        </label>
                      ))}{" "}
                    </div>{" "}
                  </article>
                ))}{" "}
              </div>
            )}{" "}
          </section>
        )}{" "}
      </main>{" "}
      <Footer go={go} locale={locale} />{" "}
    </div>
  );
}
function InfoPage({
  route,
  go,
  locale,
  switchLocale,
  user,
  onLogin,
  onAccount,
}: {
  route: string;
  go: (p: string) => void;
  locale: Locale;
  switchLocale: (l: Locale) => void;
  user: User | null;
  onLogin: () => void;
  onAccount: () => void;
}) {
  const t = (v: string) => text(locale, v),
    entry = infoContent[route],
    content: [string, string[]] = entry
      ? locale === "zh-CN"
        ? entry.zh
        : entry.en
      : [t("Page not found"), [t("The page you requested is not available.")]];
  return (
    <div className="app">
      {" "}
      <Atmosphere />{" "}
      <Header
        stage="question"
        go={go}
        onLogin={onLogin}
        onAccount={onAccount}
        user={user}
        locale={locale}
        switchLocale={switchLocale}
      />{" "}
      <main>
        {" "}
        <article className="info">
          {" "}
          <p className="eyebrow">{t("TAROT · LEARN")}</p> <h1>{content[0]}</h1>{" "}
          {content[1].map((p) => (
            <p key={p}>{p}</p>
          ))}{" "}
          <button className="primary" onClick={() => go("/")}>
            {" "}
            {t("Begin a reading")} <b>→</b>{" "}
          </button>{" "}
        </article>{" "}
      </main>{" "}
      <Footer go={go} locale={locale} />{" "}
    </div>
  );
}
function Footer({ go, locale }: { go: (p: string) => void; locale: Locale }) {
  const t = (v: string) => text(locale, v);
  return (
    <footer>
      {" "}
      <span>© TAROT</span>{" "}
      <nav>
        {" "}
        <button onClick={() => go("/about/interpretation")}>
          {" "}
          {t("Method")}{" "}
        </button>{" "}
        <button onClick={() => go("/safety")}>{t("Safety")}</button>{" "}
        <button onClick={() => go("/privacy")}>{t("Privacy")}</button>{" "}
        <button onClick={() => go("/terms")}>{t("Terms")}</button>{" "}
      </nav>{" "}
      <em>{t("Reflection over certainty")}</em>{" "}
    </footer>
  );
}
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (x: unknown) => void;
          renderButton: (el: HTMLElement, x: unknown) => void;
        };
      };
    };
  }
}
