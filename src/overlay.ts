import ReconnectingWebSocket from "reconnecting-websocket";

export enum SCOsuStatus {
    Null = 0,
    Listening,
    Playing,
    Watching = 8,
    Editing = 16,
    ResultsScreen = 32
}

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

export enum SCScoresType {
    Local = 0,
    Top,
    SelectedMods,
    Friends,
    Country
}

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

export const getKeyToken = (keyName: string): string => `key-${keyName}.txt`;

export interface SCUrlOpts {
    scheme?: string;
    path?: string;
}

export const getSCUrl = (opts: SCUrlOpts = {}): string => {
    return `${opts.scheme || window.location.protocol.slice(0, -1)}://${window.location.hostname}:${window.location.port}${opts.path || ""}`;
}

export const getSCWebSocketUrl = (): string => {
    return getSCUrl({
        scheme: "ws",
        path: "/tokens"
    });
}

export const getBackgroundImageUrl = (cached: boolean = false): string => {
    return getSCUrl({
        path: `/backgroundImage${cached ? "" : ("?t=" + Date.now())}`
    });
}

export const getSongsUrl = (path: string = ""): string => {
    return getSCUrl({
        path: `/Songs${path}`
    });
}

export const updateSCWebsocketTokens = (sock: ReconnectingWebSocket, tokenList: string[]): void => {
    sock.send(JSON.stringify(tokenList));
}

export type SCWebsocketTokenChangedHandler = (name: string, value: unknown) => void;

export const createSCWebsocket = (tokenList: string[], tokenUpdatedCallback: SCWebsocketTokenChangedHandler): ReconnectingWebSocket => {
    const socket = new ReconnectingWebSocket(getSCWebSocketUrl(), [], {
        startClosed: true,
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

export const splitLocationPath = (path: string): string[] => {
    // not 100% reliable but should be good enough (tm)
    const isWindows = navigator.userAgent.toLowerCase().indexOf("windows") !== -1;
    return path.split(isWindows ? "\\" : "/");
}