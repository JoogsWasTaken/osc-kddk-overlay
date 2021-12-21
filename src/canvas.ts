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

/**
 * Sets the active font for the given rendering context.
 * Takes font name and size.
 * 
 * @param ctx Context to apply font to
 * @param fontName Font family name
 * @param fontSize Font size 
 */
export const setFont = (ctx: CanvasRenderingContext2D, fontName: string, fontSize: number) => {
    ctx.font = `${fontSize}px "${fontName}"`;
}

/**
 * Applies the window's inner width and height to the specified canvas.
 * 
 * @param canvas Canvas to resize
 */
const resizeCanvasToWindow = (canvas: HTMLCanvasElement) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

/**
 * Creates a new canvas that automatically fills out the entire window as it resizes.
 * Returns both the HTML element and the rendering context.
 * 
 * @returns Newly created canvas and its rendering context
 */
export const createFullScreenAutoResizingCanvas = (): [HTMLCanvasElement, CanvasRenderingContext2D] => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (ctx == null) throw new Error("cannot create 2d rendering context, probably unsupported");

    // this isn't really necessary but i like it when the script tags are always the last thing on a document
    document.body.insertBefore(canvas, document.body.firstChild);
    window.addEventListener("resize", resizeCanvasToWindow.bind(resizeCanvasToWindow, canvas));

    resizeCanvasToWindow(canvas);

    return [canvas, ctx];
}

/**
 * Options with which text can be rendered onto a canvas.
 */
export interface CtxTextRenderOpts {
    /**
     * Color of the text (default: white)
     */
    color?: string | CSSColor;
    /**
     * `true` if the text should get a drop shadow, `false` otherwise (default: `true`)
     */
    shaded?: boolean;
    /**
     * Offset in pixels from the original text to draw the drop shadow at
     */
    shadeOffset?: number;
    /**
     * Color of the drop shadow (default: black)
     */
    shadeColor?: string | CSSColor;
    /**
     * Maximum allowable width of the text in pixels
     */
    maxWidth?: number;
}

/**
 * Resolves a color value into its corresponding CSS color string representation.
 * If none is provided, it'll use the default color instead.
 * 
 * @param defaultColor Default color to use as fallback
 * @param color Color to resolve (may be undefined)
 * @returns Specified color, or default, as CSS color string
 */
const resolveOptionalColor = (defaultColor: CSSColor, color?: string | CSSColor): string => {
    if (color === undefined || color == null) {
        return convertCSSColorToString(defaultColor);
    } else {
        if (typeof color === "string") {
            return color;
        } else {
            return convertCSSColorToString(color);
        }
    }
}

/**
 * Default text rendering options to apply.
 */
const defaultCtxTextRenderOpts: CtxTextRenderOpts = {
    color: colorWhite,
    shaded: true,
    shadeOffset: 2,
    shadeColor: colorBlack
    // there is no default option for maxWidth bc it may be undefined when passing it to fillText()
}

/**
 * Renders a centered string of text at the specified coordinates on the specified canvas rendering context.
 * 
 * @param ctx Rendering context to use
 * @param text Text to draw
 * @param x x-coordinate in pixels at which to render the text
 * @param y y-coordinate in pixels at which to render the text
 * @param opts Options for rendering the text
 */
export const fillCenteredText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts?: CtxTextRenderOpts) => {
    // first assign() copies the default options into a new object.
    // second assign() copies the provided options onto the copy of the default values.
    // this is necessary bc the first parameter to assign() is actually a reference and just calling assign(defaultCtxRenderOpts, opts) would mutate the defaults.
    const mergedOpts = Object.assign(Object.assign({}, defaultCtxTextRenderOpts), opts);
    
    // translate so that (0,0) is actually right where we want to render our text.
    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = "none";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // draw the drop shadow first so the actual text can be rendered above it.
    if (mergedOpts.shaded) {
        const shadeOffset = mergedOpts.shadeOffset !== undefined ? mergedOpts.shadeOffset : 2;

        // since we're rendering the text at (0,0), the shadow is drawn at (offset, offset).
        ctx.fillStyle = resolveOptionalColor(colorBlack, mergedOpts.shadeColor);
        ctx.fillText(text, shadeOffset, shadeOffset, mergedOpts.maxWidth);
    }
    
    // now actually render the text on top.
    ctx.fillStyle = resolveOptionalColor(colorWhite, mergedOpts.color);
    ctx.fillText(text, 0, 0, mergedOpts.maxWidth);
    
    ctx.restore();
}

/**
 * Maximum amount of milliseconds that may pass before the render of a frame is completed.
 * This is set to 1/60 of a second, or what's tolerable to achieve 60 fps.
 */
const maxRenderPassMillis = 1000 / 60;

/**
 * Repeatedly calls the provided render function using requestAnimationFrame().
 * The parameters passed into the function are the current window width and height.
 * This is more of a convenience than anything else.
 * 
 * @param renderFunc Render function to call
 */
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