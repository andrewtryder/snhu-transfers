/**
 * @jest-environment node
 */

jest.mock("pg", () => ({
  Client: jest.fn(),
}));

jest.mock("./fetch", () => ({
  fetchExperiences: jest.fn(),
  fetchExperienceDetail: jest.fn(),
}));

jest.mock("./persist", () => ({
  abortToIdle: jest.fn(),
  advanceCursor: jest.fn(),
  getSyncItems: jest.fn(),
  getSyncState: jest.fn(),
  insertStagedTransfer: jest.fn(),
  setSyncError: jest.fn(),
  startRefresh: jest.fn(),
  tryClaimLease: jest.fn(),
}));

jest.mock("./promote", () => ({
  promoteStaging: jest.fn(),
}));

jest.mock("@/lib/monitoring/honeybadger", () => ({
  reportTransferSyncError: jest.fn(),
}));

import { Client } from "pg";
import { runTransferSync } from "./index";
import { getSyncState, setSyncError } from "./persist";
import { reportTransferSyncError } from "@/lib/monitoring/honeybadger";

const MockClient = Client as unknown as jest.Mock;
const mockedGetSyncState = getSyncState as jest.MockedFunction<typeof getSyncState>;
const mockedSetSyncError = setSyncError as jest.MockedFunction<typeof setSyncError>;
const mockedReport = reportTransferSyncError as jest.MockedFunction<
  typeof reportTransferSyncError
>;

describe("runTransferSync Honeybadger reporting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.POSTGRES_URL = "postgres://example";

    MockClient.mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      end: jest.fn().mockResolvedValue(undefined),
    }));
  });

  it("notifies Honeybadger once in the catch path and still returns action: error", async () => {
    const failure = new Error("db blew up");
    mockedGetSyncState.mockRejectedValue(failure);
    mockedSetSyncError.mockResolvedValue(undefined);
    mockedReport.mockResolvedValue(undefined);

    const result = await runTransferSync();

    expect(result).toEqual({ action: "error", error: "db blew up" });
    expect(mockedReport).toHaveBeenCalledTimes(1);
    expect(mockedReport).toHaveBeenCalledWith(failure, { state: null });
    expect(mockedSetSyncError).toHaveBeenCalled();
  });

  it("keeps returning action: error when Honeybadger reporting throws", async () => {
    const failure = new Error("db blew up");
    mockedGetSyncState.mockRejectedValue(failure);
    mockedSetSyncError.mockResolvedValue(undefined);
    mockedReport.mockRejectedValue(new Error("hb failed"));

    const result = await runTransferSync();

    expect(result).toEqual({ action: "error", error: "db blew up" });
    expect(mockedReport).toHaveBeenCalledTimes(1);
  });
});
