# chameleon.js

![Screenshot](https://github.com/tomtung/chameleon.js/wiki/screenshot.png)

[Chameleon.js](https://tomtung.github.io/chameleon.js) is an HTML5 application for interactive 3D texture painting, built with [three.js](http://threejs.org/) and [TypeScript](http://www.typescriptlang.org/) / JavaScript. You need *NOT* worry about providing UV texture mappings: they will be generated on the fly when you paint on the 3D model.

Our implementation is based on the [paper](http://www-ui.is.s.u-tokyo.ac.jp/~takeo/papers/i3dg2001.pdf) by [Takeo Igarashi](http://www-ui.is.s.u-tokyo.ac.jp/~takeo/) and Dennis Cosgrove about their [Chameleon](http://www-ui.is.s.u-tokyo.ac.jp/~takeo/chameleon/chameleon.htm) system.

## Usage

- Drag and drop a local `obj` 3D model file into the browser window to paint on it.
	- You can find some `obj` models in the `models` folder of this repository.
- Drag your mouse on the object to draw.
- Hold `⇧Shift` key to move the camera around:
	- Drag with mouse left button to rotate.
	- Drag with mouse right button to pan.
	- Scroll with mouse wheel to zoom.
- Check `Perspective Viewing` to view the model using a perspective camera
- Click `Reset` under `Camera` to reset camera position.
- Select a color at `Background Reset` to repaint the texture with a single color
- Click `Export Textured Model` to download a zip file, which contains the texture image and the model in `obj` format.

## Known Issues

Some limitations of the system have been discussed in the original paper. Other issues include:

- Sluggishness when trying to load relatively complex models with a lot of faces.
- Incomplete implementation of "Smart Brush":
	- Doesn't prevent brush pill if the mouse moves across a sharp edge.
	- Brush doesn't try to remain on the surface being painted.
- Cannot paint on a face that does not fully appear on the screen.

## Contributors

This was our final project for course [CSCI 580 - 3-D Graphics and Rendering](http://www-bcf.usc.edu/~saty/edu/courses/CS580/f14/). Team members include (in alphabetical order):

- Jakapun [@boong555](https://github.com/boong555)
	- Implemented the canvas brushes.
	- Implemented the update of "viewing texture" from "drawing texture".
- Wansui [@wansuisu](https://github.com/wansuisu)
	- Found out ways to import & export of meshes in `obj` format.
	- Implemented the update of "viewing texture" from "drawing texture".
- Yanqing [@VividLiu](https://github.com/VividLiu)
	- Implemented the algorithm for generating "packed texture" for export from "viewing texture".
- Yubing [@tomtung](https://github.com/tomtung/)
	- Designed & implemented the overall system in general.
	- Implemented the generation of "drawing texture" from "viewing texture".
	- Implemented synchronized control of both cameras based on `THREE.TrackballControls` and `THREE.OrthographicTrackballControls`
- Zhenyu [@memorybank](https://github.com/memorybank)
	- Implemented the algorithm for recursively finding affected faces in the drawing process.

## Reference

- Igarashi, T., & Cosgrove, D. (2001). [Adaptive Unwrapping for Interactive Texture Painting](http://www-ui.is.s.u-tokyo.ac.jp/~takeo/papers/i3dg2001.pdf). In Proceedings of the 2001 Symposium on Interactive 3D Graphics (pp. 209–216). New York, NY, USA
- [@kangax](https://twitter.com/kangax) (2013). [Exploring canvas drawing techniques](http://perfectionkills.com/exploring-canvas-drawing-techniques/).
