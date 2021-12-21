import debug from "debug";
import ReconnectingWebSocket from "reconnecting-websocket";

import { colorBlack, colorWhite, convertCSSColorToString, createFullScreenAutoResizingCanvas, CSSColor, doRenderLoop, fillCenteredText, setFont } from "./canvas";
import { createSCWebsocket, getBackgroundImageUrl, getKeyToken, SCOsuStatus, SCToken, SCWebsocketTokenChangedHandler, splitLocationPath } from "./overlay";
import { config } from "./config";
import { calcAttackDecay } from "./math";

if (config.debug) {
    localStorage.debug = "osc:*";
}

const log = debug("osc:kddk");

// set up canvas
const [canvas, ctx] = createFullScreenAutoResizingCanvas();
const [bgCanvas, bgCtx] = createFullScreenAutoResizingCanvas();

bgCanvas.style.display = "none";

// global web socket instance and abort controller for background image fetch requests
let socket: ReconnectingWebSocket;
let controller: AbortController;

// set up background image
const bgImg = new Image();

// set up background image handler
const reloadBackgroundImage = () => {
    bgImg.src = getBackgroundImageUrl();
}

// this is called when the background image element has triggered the "load" event
const onBackgroundImageLoaded = () => {
    const w = bgCanvas.width, h = bgCanvas.height;
    const bgW = bgImg.width, bgH = bgImg.height;
    const bgW2 = bgW / 2, bgH2 = bgH / 2;

    // the factor of 1.1 is to avoid white borders
    const imgScale = Math.max(w / bgW, h / bgH) * 1.1;

    bgCtx.save();
    bgCtx.resetTransform();
    bgCtx.translate(w / 2, h / 2); // set origin to center
    bgCtx.scale(imgScale, imgScale);
    bgCtx.filter = "blur(10px) brightness(.5)";
    bgCtx.drawImage(bgImg, -bgW2, -bgH2);
    bgCtx.restore();
}

// this is called when the background image element has triggered the "error" event
const onBackgroundImageError = () => {
    log("no background image present");

    bgCtx.fillStyle = convertCSSColorToString(colorBlack);
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
}

bgImg.addEventListener("load", onBackgroundImageLoaded);
bgImg.addEventListener("error", onBackgroundImageError);
// this handler is registered bc on a resize, the canvas is cleared/stuck so the background canvas needs to be rerendered
window.addEventListener("resize", onBackgroundImageLoaded);

// set up global state vars
interface AnnotatedTokenValue<T> {
    value: T;
    lastUpdated: number;
}

// just a cleaner way to express { value: x, lastUpdated: 0 }
const newAnnotatedTokenValue = <T>(value: T): AnnotatedTokenValue<T> => {
    return { value, lastUpdated: 0 };
}

/**
 * Variables related to the game client size and its position on the browser canvas.
 */
const clientSize = {
    realW: config.clientWidth,
    realH: config.clientHeight,
    scaledW: config.clientWidth,
    scaledH: config.clientHeight,
    offsetX: 0,
    offsetY: 0
}

/**
 * Variables related to the state that the game client is currently in.
 */
const gameState = {
    status: SCOsuStatus.Null,
    keyLeftKat: newAnnotatedTokenValue(0),
    keyRightKat: newAnnotatedTokenValue(0),
    keyLeftDon: newAnnotatedTokenValue(0),
    keyRightDon: newAnnotatedTokenValue(0),
    isPlaying: () => gameState.status == SCOsuStatus.Playing,
}

/**
 * Variables related to the currently selected map in the game client.
 */
const mapData = {
    artist: "",
    title: "",
    difficulty: "",
    creator: ""
}

// set up token handler function
const tokenLeftKat = getKeyToken("kat_left"),
    tokenLeftDon = getKeyToken("don_left"),
    tokenRightDon = getKeyToken("don_right"), 
    tokenRightKat = getKeyToken("kat_right")

const handleTokenChanged: SCWebsocketTokenChangedHandler = (name: string, value: unknown) => {
    const now = performance.now();
    log("%s = %o", name, value);

    switch (name) {
        case SCToken.Artist:
            mapData.artist = value as string; break;
        case SCToken.Title:
            mapData.title = value as string; break;
        case SCToken.Creator:
            mapData.creator = value as string; break;
        case SCToken.Difficulty:
            mapData.difficulty = value as string; break;
        case SCToken.Status:
            gameState.status = value as number; break;
        case tokenLeftDon:
            gameState.keyLeftDon.value = value as number;
            gameState.keyLeftDon.lastUpdated = now;
            break;
        case tokenRightDon:
            gameState.keyRightDon.value = value as number;
            gameState.keyRightDon.lastUpdated = now;
            break;
        case tokenLeftKat:
            gameState.keyLeftKat.value = value as number;
            gameState.keyLeftKat.lastUpdated = now;
            break;
        case tokenRightKat:
            gameState.keyRightKat.value = value as number;
            gameState.keyRightKat.lastUpdated = now;
            break;
        case SCToken.BackgroundImageLocation:
            reloadBackgroundImage(); break;
    }
} 

// set up inner playfield window 
const recalculateClientOffset = () => {
    const w = window.innerWidth, h = window.innerHeight;
    const clientW = clientSize.realW, clientH = clientSize.realH;

    const aspect = w / h;
    const clientAspect = clientW / clientH;

    log("window aspect ratio %d", aspect);
    log("client aspect ratio %d", clientAspect);

    let scaledClientW = 0, scaledClientH = 0, offsetX = 0, offsetY = 0;

    // if the client is wider than the browser window
    if (clientAspect > aspect) {
        scaledClientH = clientH * (w / clientW);
        scaledClientW = w;
        offsetY = (h - scaledClientH) / 2;
    } else {
        scaledClientW = clientW * (h / clientH);
        scaledClientH = h;
        offsetX = (w - scaledClientW) / 2;
    }

    clientSize.scaledW = scaledClientW;
    clientSize.scaledH = scaledClientH;
    clientSize.offsetX = offsetX;
    clientSize.offsetY = offsetY;

    log("scaled client size %dx%d", scaledClientW, scaledClientH);
    log("scaled client offset @ %d,%d", offsetX, offsetY);
}

window.addEventListener("resize", recalculateClientOffset);
recalculateClientOffset();

// render stuff goes here
const colorDonRed: CSSColor = { r: 170, g: 50, b: 31 };
const colorKatBlue: CSSColor = { r: 43, g: 91, b: 110 };
const colorKiai: CSSColor =  { r: 255, g: 184, b: 40 };

const colorGoodGreen: CSSColor = { r: 82, g: 255, b: 21 };
const colorGreatBlue: CSSColor = { r: 55, g: 194, b: 255 };
const colorMissRed: CSSColor = { r: 255, g: 102, b: 47 };

const fontName = "display";

// this is for rendering everything around the gameplay area (scaled client dimensions)
const renderTaiko = (w: number, h: number) => {
    // % of the client height to reach the top and the bottom of the playfield
    // TODO does this hold for all aspect ratios?
    const laneTopPct = .28148;
    const laneBottomPct = .54166;

    const laneTop = h * laneTopPct, laneBottom = h * laneBottomPct;
    const now = performance.now();

    // render the keys
    (() => {
        const w4 = w / 4;
        const colors = [ colorKatBlue, colorDonRed, colorDonRed, colorKatBlue ];
        const timestamps = [ gameState.keyLeftKat.lastUpdated, gameState.keyLeftDon.lastUpdated, gameState.keyRightDon.lastUpdated, gameState.keyRightKat.lastUpdated ];

        for (let i = 0; i < 4; i++) {
            const alpha = calcAttackDecay(config.keyAttack, config.keyDecay, now - timestamps[i]);

            if (alpha == 0) continue;

            const gradient = ctx.createLinearGradient(0, 0, 0, h);

            gradient.addColorStop(0, convertCSSColorToString(Object.assign(Object.assign({}, colors[i]), { a: 0 })));
            gradient.addColorStop(1, convertCSSColorToString(Object.assign(Object.assign({}, colors[i]), { a: alpha })));

            ctx.fillStyle = gradient;
            ctx.fillRect(w4 * i, 0, w4, h);
        }
    })();

    // render part above the playfield
    (() => {
        ctx.save();
        
        const textVerticalOffset = -(h / 50);

        ctx.translate(0, laneTop / 2);
        setFont(ctx, fontName, 30);

        const mapName = `${mapData.artist} - ${mapData.title} ${mapData.difficulty}`.toUpperCase();
        const mapperName = `Mapped by ${mapData.creator}`.toUpperCase();

        fillCenteredText(ctx, mapName, w / 2, 0 + textVerticalOffset, {maxWidth: w - 50});

        setFont(ctx, fontName, 20);
        fillCenteredText(ctx, mapperName, w / 2, 35 + textVerticalOffset, {maxWidth: w - 50});

        ctx.restore();
    })();

    // fill in the playfield
    ctx.fillStyle = convertCSSColorToString(colorBlack);
    ctx.fillRect(0, laneTop, w, laneBottom - laneTop);
}

// this is for rendering the whole canvas
const render = (w: number, h: number) => {
    ctx.fillStyle = convertCSSColorToString(colorBlack);
    ctx.fillRect(0, 0, w, h);

    if (gameState.isPlaying()) {
        // draw the background to the gameplay window (if the client is currently in a playing state, otherwise this is all black)
        ctx.drawImage(bgCanvas, clientSize.offsetX, clientSize.offsetY, clientSize.scaledW, clientSize.scaledH,
            clientSize.offsetX, clientSize.offsetY, clientSize.scaledW, clientSize.scaledH);

        ctx.save();
        ctx.translate(clientSize.offsetX, clientSize.offsetY);
        renderTaiko(clientSize.scaledW, clientSize.scaledH);
        ctx.restore();
    }

    // or rather is the client wider than the current browser window?
    const isClientSlim = clientSize.offsetX > 0;

    if (isClientSlim) {
        // if the client is wider than the browser window, then the parts above and below the playfield must be filled in
        ctx.drawImage(bgCanvas, 0, 0, clientSize.offsetX, clientSize.scaledH, 
            0, 0, clientSize.offsetX, clientSize.scaledH);
        ctx.drawImage(bgCanvas, clientSize.offsetX + clientSize.scaledW, 0, clientSize.offsetX, clientSize.scaledH,
            clientSize.offsetX + clientSize.scaledW, 0, clientSize.offsetX, clientSize.scaledH);
    } else {
        // if the client is slimmer than the browser window, then the parts to the right and left of the playfield must be filled in
        ctx.drawImage(bgCanvas, 0, 0, clientSize.scaledW, clientSize.offsetY, 
            0, 0, clientSize.scaledW, clientSize.offsetY);
        ctx.drawImage(bgCanvas, 0, clientSize.offsetY + clientSize.scaledH, clientSize.scaledW, clientSize.offsetY, 
            0, clientSize.offsetY + clientSize.scaledH, clientSize.scaledW, clientSize.offsetY);
    }
}

const main = () => {
    log("loading web font...");

    new FontFace(fontName, "url(static/font/display.ttf)").load().then((font) => {
        document.fonts.add(font);

        log("connecting to websocket server and starting render loop...");
        socket = createSCWebsocket([
            SCToken.Artist, SCToken.Title, SCToken.Difficulty, SCToken.Creator, SCToken.Status, SCToken.BackgroundImageLocation,
            tokenLeftKat, tokenLeftDon, tokenRightDon, tokenRightKat,
        ], handleTokenChanged);
    
        doRenderLoop(render);
    }).catch((err) => {
        log("couldn't load web font %O", err);
    });
}

main();
