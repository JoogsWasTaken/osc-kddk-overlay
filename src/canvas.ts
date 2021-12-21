import debug from "debug";

const log = debug("osc:kddk:canvas");

/**
 * Color consisting of red, green, blue and an optional alpha component.
 * Colors should be in range of 0 to 255, alpha should be in range of 0 to 1.
 */
export interface CSSColor {
    r: number;
    g: number;
    b: number;
    a?: number;
}

/**
 * The color white. (r=255, g=255, b=255)
 */
export const colorWhite: CSSColor = { r: 255, g: 255, b: 255 };

/**
 * The color black. (r=0, g=0, b=0)
 */
export const colorBlack: CSSColor = { r: 0, g: 0, b: 0 };

/**
 * Converts a color object into a CSS color string.
 * This will always return a string starting with either `rgb` or `rgba`, depending on whether an alpha component is set or not.
 * 
 * @param color Color object to convert
 * @returns CSS color string
 */
export const convertCSSColorToString = (color: CSSColor): string => {    
    let prefix = "rgb";
    let colors = [color.r, color.g, color.b];

    if (color.a !== undefined) {
        colors.push(color.a);
        prefix += "a";
    }

    return `${prefix}(${colors.join(",")})`;
}

export const setFont = (ctx: CanvasRenderingContext2D, fontName: string, fontSize: number) => {
    ctx.font = `${fontSize}px "${fontName}"`;
}

const resizeCanvasToWindow = (canvas: HTMLCanvasElement) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

export const createFullScreenAutoResizingCanvas = (): [HTMLCanvasElement, CanvasRenderingContext2D] => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (ctx == null) throw new Error("cannot create 2d rendering context, probably unsupported");

    document.body.insertBefore(canvas, document.body.firstChild);
    window.addEventListener("resize", resizeCanvasToWindow.bind(resizeCanvasToWindow, canvas));

    resizeCanvasToWindow(canvas);

    return [canvas, ctx];
}

export interface CtxTextRenderOpts {
    color?: string | CSSColor;
    shaded?: boolean;
    shadeOffset?: number;
    shadeColor?: string | CSSColor;
    maxWidth?: number;
}

const resolveOptionalColor = (defaultColor: CSSColor, color?: string | CSSColor): string => {
    if (color === undefined) {
        return convertCSSColorToString(defaultColor);
    } else {
        if (typeof color === "string") {
            return color;
        } else {
            return convertCSSColorToString(color);
        }
    }
}

const defaultCtxTextRenderOpts: CtxTextRenderOpts = {
    color: colorWhite,
    shaded: true,
    shadeOffset: 2,
    shadeColor: colorBlack
}

export const fillCenteredText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts?: CtxTextRenderOpts) => {
    const mergedOpts = Object.assign(Object.assign({}, defaultCtxTextRenderOpts), opts);
    
    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = "none";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (mergedOpts.shaded) {
        const shadeOffset = mergedOpts.shadeOffset !== undefined ? mergedOpts.shadeOffset : 2;

        ctx.fillStyle = resolveOptionalColor(colorBlack, mergedOpts.shadeColor);
        ctx.fillText(text, shadeOffset, shadeOffset, mergedOpts.maxWidth);
    }
    
    ctx.fillStyle = resolveOptionalColor(colorWhite, mergedOpts.color);
    ctx.fillText(text, 0, 0, mergedOpts.maxWidth);
    
    ctx.restore();
}

const maxRenderPassMillis = 1000 / 60;

export const doRenderLoop = (renderFunc: (w: number, h: number) => void): void => {
    const renderFuncWrapper = () => {
        const start = performance.now();
        renderFunc(window.innerWidth, window.innerHeight);
        const diff = performance.now() - start;

        if (diff > maxRenderPassMillis) {
            log("render pass took %d ms, heavy load or lack of performance optimization? (probably the latter)", diff);
        }

        requestAnimationFrame(renderFuncWrapper);
    }

    requestAnimationFrame(renderFuncWrapper);
}