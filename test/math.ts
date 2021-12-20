import { expect } from "chai";
import { calcAttackDecay } from "../src/math";

describe("attack-decay calculation", () => {
    it("should handle negative deltas correctly", () => {
        expect(calcAttackDecay(50, 50, -1)).to.equal(0);
    });

    it("should handle out-of-range deltas correctly", () => {
        expect(calcAttackDecay(50, 50, 101)).to.equal(0);
    });

    it("should calculate attack-decay values correctly", () => {
        expect(calcAttackDecay(50, 50, 0)).to.equal(0);
        expect(calcAttackDecay(50, 50, 25)).to.equal(.5);
        expect(calcAttackDecay(50, 50, 50)).to.equal(1);
        expect(calcAttackDecay(50, 50, 75)).to.equal(.5);
        expect(calcAttackDecay(50, 50, 100)).to.equal(0);
    });
});