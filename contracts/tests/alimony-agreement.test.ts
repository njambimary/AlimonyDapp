import { Cl, type ClarityValue } from "@stacks/transactions";
import type { Simnet } from "@stacks/clarinet-sdk";
import { describe, expect, it } from "vitest";

declare const simnet: Simnet;

const contractName = "alimony-agreement";
const accounts = simnet.getAccounts();
const payer = accounts.get("deployer")!;
const payee = accounts.get("wallet_1")!;
const documentHash = "a".repeat(64);

function callPublic(
  functionName: string,
  args: ClarityValue[],
  sender = payer,
) {
  return simnet.callPublicFn(contractName, functionName, args, sender).result;
}

function callReadOnly(functionName: string, args: ClarityValue[] = []) {
  return simnet.callReadOnlyFn(contractName, functionName, args, payer).result;
}

function createAgreement(
  amountPerPeriod = 100,
  periodBlocks = 5,
  totalPeriods = 2,
) {
  return callPublic("create-agreement", [
    Cl.principal(payee),
    Cl.uint(amountPerPeriod),
    Cl.uint(periodBlocks),
    Cl.uint(totalPeriods),
  ]);
}

describe("alimony agreement", () => {
  it("funds an agreement and releases installments after vesting", () => {
    expect(createAgreement()).toEqual(Cl.ok(Cl.bool(true)));
    expect(callPublic("deposit", [Cl.uint(200)])).toEqual(Cl.ok(Cl.uint(200)));
    expect(callReadOnly("get-claimable-amount")).toEqual(Cl.uint(0));

    simnet.mineEmptyBlocks(5);

    expect(callReadOnly("get-claimable-amount")).toEqual(Cl.uint(100));
    expect(callPublic("claim", [], payee)).toEqual(Cl.ok(Cl.uint(100)));
    expect(callReadOnly("get-contract-balance")).toEqual(Cl.uint(100));
  });

  it("rejects invalid terms, duplicate creation, unauthorized funding, and early claims", () => {
    expect(callPublic("deposit", [Cl.uint(1)])).toEqual(Cl.error(Cl.uint(101)));
    expect(createAgreement(0)).toEqual(Cl.error(Cl.uint(103)));
    expect(createAgreement()).toEqual(Cl.ok(Cl.bool(true)));
    expect(createAgreement()).toEqual(Cl.error(Cl.uint(100)));
    expect(callPublic("deposit", [Cl.uint(1)], payee)).toEqual(Cl.error(Cl.uint(104)));
    expect(callPublic("deposit", [Cl.uint(201)])).toEqual(Cl.error(Cl.uint(105)));
    expect(callPublic("claim", [], payee)).toEqual(Cl.error(Cl.uint(107)));
    expect(callPublic("claim", [])).toEqual(Cl.error(Cl.uint(106)));
  });

  it("approves extra funds, increases claimable balance, and preserves request history", () => {
    expect(createAgreement(100, 100, 1)).toEqual(Cl.ok(Cl.bool(true)));
    expect(callPublic("deposit", [Cl.uint(100)])).toEqual(Cl.ok(Cl.uint(100)));

    const requestResult = simnet.callPublicFn(
      contractName,
      "request-extra-funds",
      [Cl.uint(50), Cl.stringAscii(documentHash), Cl.stringUtf8("Medical expense")],
      payee,
    ).result;
    expect(requestResult).toEqual(Cl.ok(Cl.uint(1)));
    expect(callReadOnly("get-request", [Cl.uint(1)])).toMatchObject({
      type: "some",
      value: expect.objectContaining({
        type: "tuple",
        value: expect.objectContaining({
          "request-id": Cl.uint(1),
          requester: Cl.principal(payee),
          amount: Cl.uint(50),
          status: Cl.stringAscii("pending"),
        }),
      }),
    });
    expect(callReadOnly("get-pending-requests")).toMatchObject({
      type: "list",
      value: [expect.objectContaining({
        type: "tuple",
        value: expect.objectContaining({ "request-id": Cl.uint(1) }),
      })],
    });
    expect(callPublic("request-extra-funds", [
      Cl.uint(10),
      Cl.stringAscii(documentHash),
      Cl.stringUtf8("Second request"),
    ], payee)).toEqual(Cl.error(Cl.uint(108)));

    expect(callPublic("approve-extra-request", [Cl.uint(1)])).toEqual(Cl.ok(Cl.bool(true)));
    expect(callReadOnly("get-pending-requests")).toEqual(Cl.list([]));
    expect(callReadOnly("get-request", [Cl.uint(1)])).toMatchObject({
      type: "some",
      value: expect.objectContaining({
        type: "tuple",
        value: expect.objectContaining({ status: Cl.stringAscii("approved") }),
      }),
    });
    expect(callReadOnly("get-claimable-amount")).toEqual(Cl.uint(50));
    expect(callPublic("deposit", [Cl.uint(50)])).toEqual(Cl.ok(Cl.uint(50)));
    expect(callPublic("claim", [], payee)).toEqual(Cl.ok(Cl.uint(50)));
    expect(callReadOnly("get-contract-balance")).toEqual(Cl.uint(100));
    expect(callPublic("approve-extra-request", [Cl.uint(1)])).toEqual(Cl.error(Cl.uint(110)));
  });

  it("rejects unauthorized or malformed requests and permits a new request after rejection", () => {
    expect(createAgreement()).toEqual(Cl.ok(Cl.bool(true)));
    expect(callPublic("request-extra-funds", [
      Cl.uint(10),
      Cl.stringAscii(documentHash),
      Cl.stringUtf8("Unauthorized"),
    ])).toEqual(Cl.error(Cl.uint(106)));
    expect(callPublic("request-extra-funds", [
      Cl.uint(10),
      Cl.stringAscii("a".repeat(63)),
      Cl.stringUtf8("Bad hash"),
    ], payee)).toEqual(Cl.error(Cl.uint(111)));
    expect(callPublic("request-extra-funds", [
      Cl.uint(10),
      Cl.stringAscii(documentHash),
      Cl.stringUtf8("Pending"),
    ], payee)).toEqual(Cl.ok(Cl.uint(1)));
    expect(callPublic("approve-extra-request", [Cl.uint(1)], payee)).toEqual(Cl.error(Cl.uint(104)));
    expect(callPublic("reject-extra-request", [Cl.uint(1)], payee)).toEqual(Cl.error(Cl.uint(104)));
    expect(callPublic("approve-extra-request", [Cl.uint(99)])).toEqual(Cl.error(Cl.uint(109)));
    expect(callPublic("reject-extra-request", [Cl.uint(1)])).toEqual(Cl.ok(Cl.bool(true)));
    expect(callReadOnly("get-pending-requests")).toEqual(Cl.list([]));
    expect(callReadOnly("get-request", [Cl.uint(1)])).toMatchObject({
      type: "some",
      value: expect.objectContaining({
        type: "tuple",
        value: expect.objectContaining({ status: Cl.stringAscii("rejected") }),
      }),
    });
    expect(callPublic("reject-extra-request", [Cl.uint(1)])).toEqual(Cl.error(Cl.uint(110)));
    expect(callPublic("request-extra-funds", [
      Cl.uint(20),
      Cl.stringAscii(documentHash),
      Cl.stringUtf8("Next request"),
    ], payee)).toEqual(Cl.ok(Cl.uint(2)));
  });
});