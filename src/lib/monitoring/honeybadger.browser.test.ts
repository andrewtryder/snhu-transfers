import { HONEYBADGER_FILTERS } from "../../../honeybadger.filters.js";

jest.mock("@honeybadger-io/react", () => ({
  Honeybadger: {
    configure: jest.fn(),
    beforeNotify: jest.fn(),
  },
}));

describe("honeybadger.browser.config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("does not configure Honeybadger when NEXT_PUBLIC_HONEYBADGER_API_KEY is missing", async () => {
    delete process.env.NEXT_PUBLIC_HONEYBADGER_API_KEY;

    let hbReactMock: typeof import("@honeybadger-io/react") | undefined;
    await jest.isolateModulesAsync(async () => {
      hbReactMock = await import("@honeybadger-io/react");
      await import("../../../honeybadger.browser.config.js");
    });

    const configureMock = hbReactMock!.Honeybadger.configure as unknown as jest.Mock;
    const beforeNotifyMock = hbReactMock!.Honeybadger.beforeNotify as unknown as jest.Mock;

    expect(configureMock).not.toHaveBeenCalled();
    expect(beforeNotifyMock).not.toHaveBeenCalled();
  });

  it("configures Honeybadger with ignoreBrowserExtensionErrors: true and shared filters when API key is present", async () => {
    process.env.NEXT_PUBLIC_HONEYBADGER_API_KEY = "browser-test-key";
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_GIT_COMMIT_SHA = "abc1234";

    let hbReactMock: typeof import("@honeybadger-io/react") | undefined;
    await jest.isolateModulesAsync(async () => {
      hbReactMock = await import("@honeybadger-io/react");
      await import("../../../honeybadger.browser.config.js");
    });

    const configureMock = hbReactMock!.Honeybadger.configure as unknown as jest.Mock;
    const beforeNotifyMock = hbReactMock!.Honeybadger.beforeNotify as unknown as jest.Mock;

    expect(configureMock).toHaveBeenCalledWith({
      apiKey: "browser-test-key",
      environment: "preview",
      revision: "abc1234",
      projectRoot: "webpack://_N_E/./",
      filters: HONEYBADGER_FILTERS,
      ignoreBrowserExtensionErrors: true,
    });
    expect(beforeNotifyMock).toHaveBeenCalledTimes(1);

    const beforeNotifyHandler = beforeNotifyMock.mock.calls[0][0];

    // Ignores empty/unspecified unhandled promise rejection chatter
    expect(
      beforeNotifyHandler({
        message: "UnhandledPromiseRejectionWarning: {}",
      })
    ).toBe(false);
    expect(
      beforeNotifyHandler({
        message: "UnhandledPromiseRejectionWarning: Unspecified reason",
      })
    ).toBe(false);

    // Preserves legitimate application errors
    expect(
      beforeNotifyHandler({
        message: "TypeError: Failed to fetch transfer equivalencies",
      })
    ).toBeUndefined();
  });
});
