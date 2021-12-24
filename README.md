# KDDK StreamCompanion Overlay

Stream overlay for osu!taiko, based on [StreamCompanion](https://github.com/Piotrekol/StreamCompanion).

## Table of contents

* [Setup](#setup)
* [Build](#build)
* [Configuration](#configuration)
* [License](#license)

## Setup

1. Download the latest release from the Releases tab. 
Drop the contents of the .zip file into your overlay folder of your StreamCompanion installation.

2. Start StreamCompanion and your osu! client.

3. Open the [config.json](config.json) file in a text editor of your choice.
Set the values of the `clientWidth` and `clientHeight` to the resolution of your osu! client.

4. Now navigate to http://localhost:20727/osc-kddk-overlay/ (the trailing slash is important!) in your browser to verify that it's working.
This can be done by navigating around your song selection menu and playing a few maps.

5. To add the overlay to your streaming setup, open OBS (or whichever streaming software you use).
Add a new browser source to your desired scene and point it to the URL above.
Make sure that the browser source fills out the entire scene.

6. Now add your game capture atop the browser source and make sure it's centered and filling the scene as best as possible.

7. Add a color key filter to your game capture and set it to black.

> Since the overlay only reacts to inputs in *near* real time, there may be some more or less noticeable delays between the overlay and the gameplay recording.
> Try tweaking it by adding a stream delay to your gameplay capture.
> Start with values in the range of 50 to 100 ms and see how it affects the quality of your stream.
> I personally found 70 ms to be the sweet spot for barely noticeable input delays.

## Build

If you want to build the overlay yourself, e.g. for adding some changes to the code, go through the following steps.
You will need to have a functioning (and recent) [Node.js](https://nodejs.org/en/) installation on your machine.

1. Clone this repository into your StreamCompanion overlay directory.
2. Navigate to the repository's root directory and run `npm install` on the command line.
3. Edit the source code to your heart's content.
4. Once you're done, execute `npm test`, followed by `npm run build`.
This will put the transpiled source code files into a new directory called *dist*.
5. Inspect your changes in the browser.

Alternatively, if you don't wanna execute the same command every time you change a single line of code, you can run `npm run watch` to automatically transpile the code whenever you change it.
This is very handy for testing out minor changes to the source code.

## Configuration

There are a number of options that can be tweaked in the [config.json](config.json) file to fine-tune the behavior of the overlay.
Their effects and acceptable values are explained below.

> There are no safe guards in place if you fill in the configuration with invalid values.
> The overlay may act weird or completely cease to function.
> If you intend to change any option, please make sure to read through its documentation here.

### clientHeight

Sets the real height of your osu! client's resolution.
This value may be any positive integer.
In combination with [clientWidth](#clientwidth), it is used to render the key input background to fit the size of your playfield.

### clientWidth

Sets the real width of your osu! client's resolution.
This value may be any positive integer.
In combination with [clientHeight](#clientheight), it is used to render the key input background to fit the size of your playfield.

### debug

Set this to `true` to enable debug output in the browser console.
You can view the output by pressing Ctrl+Shift+I in most browsers.
This may be helpful for troubleshooting issues you might be facing while using the overlay.
Setting this to `false` will *not* increase the overlay's performance by a noticeable degree.

### fontFileName (experimental)

Set this to the file name of the font file inside the [static/font](static/font) directory (including the file extension) that you'd like to use.
[All font formats supported by most browsers](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face#font_mime_types) can be used, including TTF, OTF, WOFF and WOFF2.

Support for this feature is currently experimental because the overlay has only been tested with the default font face so far.
If you run into problem with this setting, please let me know by filing an issue. 

### keyAttack

Sets the amount of milliseconds that a key in the background should take to fade in after the corresponding physical key has been pressed.
This value may be any positive integer, including zero.

### keyDecay

Sets the amount of milliseconds that a key in the background should take to fade out after it has completely faded in.
This value may be any positive integer, including zero.

## License

MIT.

The default font packaged with this overlay is [Roboto Condensed](https://fonts.google.com/specimen/Roboto+Condensed) provided by [Google Fonts](https://fonts.google.com), licensed under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0.html).
A copy of the license text can be found [here](static/font/LICENSE.txt).