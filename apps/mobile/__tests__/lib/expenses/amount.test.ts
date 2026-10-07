import { parseAmountToCents } from "@/shared/lib/expenses/amount";

describe("parseAmountToCents", () => {
  it("devuelve null si el texto está vacío", () => {
    expect(parseAmountToCents("")).toBeNull();
    expect(parseAmountToCents("   ")).toBeNull();
  });

  it("interpreta soles enteros como céntimos", () => {
    expect(parseAmountToCents("12")).toBe(1200);
    expect(parseAmountToCents("0")).toBe(0);
  });

  it("acepta punto o coma con hasta dos decimales", () => {
    expect(parseAmountToCents("12.5")).toBe(1250);
    expect(parseAmountToCents("12.50")).toBe(1250);
    expect(parseAmountToCents("12,5")).toBe(1250);
    expect(parseAmountToCents("0,01")).toBe(1);
    expect(parseAmountToCents("12.")).toBe(1200);
  });

  it("trata el último separador como decimal cuando hay miles", () => {
    expect(parseAmountToCents("1.000,50")).toBe(100050);
    expect(parseAmountToCents("1,000.50")).toBe(100050);
  });

  it("rechaza más de dos decimales, negativos y texto", () => {
    expect(parseAmountToCents("12.345")).toBeNull();
    expect(parseAmountToCents("-1")).toBeNull();
    expect(parseAmountToCents("abc")).toBeNull();
    expect(parseAmountToCents("12.5.1")).toBeNull();
  });
});
