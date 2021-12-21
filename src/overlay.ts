import ReconnectingWebSocket from "reconnecting-websocket";

/**
 * Known StreamCompanion osu! status values.
 */
export enum SCOsuStatus {
    Null = 0,
    Listening,
    Playing,
    Watching = 8,
    Editing = 16,
    ResultsScreen = 32
}

/**
 * Known StreamCompanion osu! grade values.
 */
export enum SCOsuGrade {
    SSH = 0,
    SH,
    SS,
    S,
    A,
    B,
    C,
    D,
    F
}

/**
 * Known StreamCompanion osu! leaderboard score type values.
 */
export enum SCScoresType {
    Local = 0,
    Top,
    SelectedMods,
    Friends,
    Country
}

/**
 * Known StreamCompanion tokens.
 */
export enum SCToken {
    Combo = "combo",
    Title = "titleRoman",
    Artist = "artistRoman",
    Difficulty = "mapDiff",
    Creator = "creator",
    Status = "status",

    BackgroundImageLocation = "backgroundImageLocation",
    OsuFileLocation = "osuFileLocation",

    Count300 = "c300",
    Count100 = "c100",
    Count50 = "c50",
    CountGeki = "geki",
    CountKatsu = "katsu",
    CountMiss = "miss",

    Time = "time",
    TimeLeft = "timeLeft",
}

/**
 * Gets the token name for a key assigned with StreamCompanion.
 * 
 * @param keyName Name of the key
 * @returns Token name for the key
 */
export const getKeyToken = (keyName: string): string => `key-${keyName}.txt`;

/**
 * Parameters to set to retrieve full StreamCompanion endpoint URLs.
 */
export interface SCUrlOpts {
    scheme?: string;
    path?: string;
}

/**
 * Returns the full URL to a resource exposed by the local StreamCompanion server.
 * 
 * @param opts URL options
 * @returns Full URL to the specified resource endpoint
 */
export const getSCUrl = (opts: SCUrlOpts = {}): string => {
    return `${opts.scheme || window.location.protocol.slice(0, -1)}://${window.location.hostname}:${window.location.port}${opts.path || ""}`;
}

/**
 * @returns URL to the StreamCompanion token websocket endpoint 
 */
export const getSCWebSocketUrl = (): string => {
    return getSCUrl({
        scheme: "ws",
        path: "/tokens"
    });
}

/**
 * Returns the URL to the background image HTTP endpoint.
 * If `cached` is set to false, the resulting URL will contain a query parameter `t` with the current UNIX timestamp as its value.
 * This is to prevent caching on the browser.
 * 
 * @param cached `false` if a query parameter to override caching should be added, `true` otherwise
 * @returns URL to the StreamCompanion background image endpoint
 */
export const getBackgroundImageUrl = (cached: boolean = false): string => {
    return getSCUrl({
        path: `/backgroundImage${cached ? "" : ("?t=" + Date.now())}`
    });
}

/**
 * Returns the URL to the songs folder HTTP endpoint.
 * The path describes the file or directory to look up in the user's songs folder.
 * 
 * @param path File or directory to look up in songs folder
 * @returns URL to the StreamCompanion songs folder endpoint
 */
export const getSongsUrl = (path: string = ""): string => {
    return getSCUrl({
        path: `/Songs${path}`
    });
}

/**
 * Uses an existing websocket connection to the StreamCompanion token endpoint to update the list of tokens to receive updates for.
 * 
 * @param sock Websocket connection to update
 * @param tokenList List of tokens to receive updates for
 */
export const updateSCWebsocketTokens = (sock: ReconnectingWebSocket, tokenList: string[]): void => {
    sock.send(JSON.stringify(tokenList));
}

/**
 * Handler function that receives updated values from the StreamCompanion token websocket endpoint.
 * Parameters passed in are the name of the token and its new value.
 */
export type SCWebsocketTokenChangedHandler = (name: string, value: unknown) => void;

/**
 * Creates a reconnecting websocket instance that connects to the StreamCompanion token websocket endpoint.
 * On start, it requests to listen for updates for the provided list of tokens.
 * Additionally, this call requires a callback function that is called whenever a token is updated.
 * 
 * @param tokenList List of tokens to receive updates for
 * @param tokenUpdatedCallback Handler function for token value updates
 * @returns Reconnecting websocket instance
 */
export const createSCWebsocket = (tokenList: string[], tokenUpdatedCallback: SCWebsocketTokenChangedHandler): ReconnectingWebSocket => {
    const socket = new ReconnectingWebSocket(getSCWebSocketUrl(), [], {
        startClosed: true,
        // this is set to always reconnect every 3 seconds
        minReconnectionDelay: 3000,
        reconnectionDelayGrowFactor: 1
    });

    socket.addEventListener("message", (data) => {
        const rawData = JSON.parse(data.data);

        for (const key of Object.keys(rawData)) {
            tokenUpdatedCallback(key, rawData[key]);
        }
    });

    socket.addEventListener("open", () => updateSCWebsocketTokens(socket, tokenList));
    socket.reconnect();

    return socket;
}

/**
 * Splits a string into its path components.
 * This function splits up the path on `\` backslashes for Windows user agents and on `/` for any other user agent.
 * 
 * @param path Path to split up
 * @returns Segmented path
 */
export const splitLocationPath = (path: string): string[] => {
    // not 100% reliable but should be good enough (tm)
    const isWindows = navigator.userAgent.toLowerCase().indexOf("windows") !== -1;

    // on *nix systems, the path might start with a leading slash
    if (!isWindows) {
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
    }

    return path.split(isWindows ? "\\" : "/");
}