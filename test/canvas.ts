import { expect } from "chai";
import { convertCSSColorToString } from "../src/canvas";

describe("canvas", () => {
    it("should convert RGB values into CSS strings", () => {
        expect(convertCSSColorToString({
            r: 50,
            g: 100,
            b: 150
        })).to.equal("rgb(50,100,150)");
    });

    it("should convert RGBA values into CSS strings", () => {
        expect(convertCSSColorToString({
            r: 50,
            g: 100,
            b: 150,
            a: .1
        })).to.equal("rgba(50,100,150,0.1)");
    });
});