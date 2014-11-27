/// <reference path="./common.ts" />
/// <reference path="./camera-controls.ts" />
/// <reference path="./texture-manager.ts" />
/// <reference path="./brushes.ts" />

module Chameleon {
    enum ControlsState {
        Idle, Draw, View
    }

    export class Controls {

        private _state: ControlsState = ControlsState.Idle;

        private _geometry: THREE.Geometry;
        private _mesh: THREE.Mesh = new THREE.Mesh();
        canvas: HTMLCanvasElement;

        canvasBox: Box = {left: 0, top: 0, width: 0, height: 0};

        public updateCanvasBox() {
            var canvasRect = this.canvas.getBoundingClientRect();
            var docElement = this.canvas.ownerDocument.documentElement;
            this.canvasBox.left = canvasRect.left + window.pageXOffset - docElement.clientLeft;
            this.canvasBox.top = canvasRect.top + window.pageYOffset - docElement.clientTop;
            this.canvasBox.width = canvasRect.width;
            this.canvasBox.height = canvasRect.height;
        }

        private _headLight: THREE.PointLight = new THREE.PointLight(0xFFFFFF, 0.4);
        private _camera: THREE.OrthographicCamera;
        private _cameraControls: OrthographicCameraControls;

        private _scene: THREE.Scene = (() => {
            var scene = new THREE.Scene();

            var ambientLight = new THREE.AmbientLight(0x777777);
            scene.add(ambientLight);

            var light = new THREE.DirectionalLight(0xFFFFFF, 0.2);
            light.position.set(320, 390, 700);
            scene.add(light);

            var light2 = new THREE.DirectionalLight(0xFFFFFF, 0.2);
            light2.position.set(-720, -190, -300);
            scene.add(light2);

            scene.add(this._headLight);

            scene.add(this._mesh);

            return scene;
        })();

        private _renderer: THREE.Renderer = (() => {
            var renderer = new THREE.WebGLRenderer({antialias: true});
            renderer.setClearColor(0xAAAAAA, 1.0);
            return renderer;
        })();

        brush: Brush = new Pencil1();


        private _textureManager: TextureManager;
        private _usingViewingTexture: boolean;

        handleResize() {
            this._renderer.setSize(this.canvas.width, this.canvas.height);
            this.updateCanvasBox();
            this._cameraControls.handleResize();
            this._useViewingTexture();
        }


        update() {
            this._cameraControls.updateCamera();
            this._headLight.position.copy(this._camera.position);

            this._renderer.render(this._scene, this._camera);
            this.canvas.getContext('2d').drawImage(this._renderer.domElement, 0, 0);
        }

        private _useViewingTexture() {
            // If already using the viewing texture, do nothing
            if (this._usingViewingTexture) {
                return;
            }

            this._textureManager.prepareViewingTexture().applyViewingTexture(this._mesh);
            this._usingViewingTexture = true;
        }

        private _useDrawingTexture() {
            // If already using the drawing texture, do nothing
            if (!this._usingViewingTexture) {
                return;
            }

            this._textureManager.prepareDrawingTexture().applyDrawingTexture(this._mesh);
            this._usingViewingTexture = false;
        }

        private _mousedown = (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            if (this._state !== ControlsState.Idle) {
                return;
            }

            // Hold shift key to rotate and pan
            if (event.shiftKey) {
                this._state = ControlsState.View;
                this._useViewingTexture();
                this._cameraControls.onMouseDown(event);
            } else {
                this._state = ControlsState.Draw;
                this._useDrawingTexture();

                var pos = mousePositionInCanvas(event, this.canvasBox);

                if (_brushType == "brush1") {
                    this.brush = new Pencil1();
                }
                if (_brushType == "brush2") {
                    this.brush = new Pencil2();
                }
                if (_brushType == "brush3") {
                    this.brush = new Pencil3();
                }
                if (_brushType == "brush4") {
                    this.brush = new Pencil4();
                }
                if (_brushType == "brush5") {
                    this.brush = new Pencil5();
                }
                if (_brushType == "brush6") {
                    this.brush = new Pencil6();
                }
                if (_brushType == "brush7") {
                    this.brush = new Pencil7();
                }

                if (_brushType == "brush8") {
                    this.brush = new Pencil8();
                }
                if (_brushType == "brush9") {
                    this.brush = new Pencil9();
                }

                this.brush.startStroke(this._textureManager.drawingCanvas, pos);
                this._textureManager.onStrokePainted(pos, this.brush.radius);
            }

            document.addEventListener('mousemove', this._mousemove, false);
            document.addEventListener('mouseup', this._mouseup, false);
        };

        private _mousemove = (event: MouseEvent) => {
            if (this._state === ControlsState.Idle) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            switch (this._state) {
                case ControlsState.View:
                    this._cameraControls.onMouseMove(event);
                    break;
                case ControlsState.Draw:
                    var pos = mousePositionInCanvas(event, this.canvasBox);
                    this.brush.continueStoke(pos);
                    this._textureManager.onStrokePainted(pos, this.brush.radius);
                    break;
                default:
                    debugger;
            }
        };

        private _mouseup = (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            this.brush.finishStroke();
            this.update();
            this._cameraControls.onMouseUp(event);
            this._state = ControlsState.Idle;

            document.removeEventListener('mousemove', this._mousemove);
            document.removeEventListener('mouseup', this._mouseup);
        };

        private _mousewheel = (event: MouseWheelEvent) => {
            event.preventDefault();
            event.stopPropagation();

            if (this._state === ControlsState.Draw || !event.shiftKey) {
                return;
            }

            this._useViewingTexture();
            this._cameraControls.onMouseWheel(event);
        };

        constructor(geometry: THREE.Geometry, canvas?: HTMLCanvasElement) {
            this._geometry = geometry.clone();
            // Note that a crucial assumption is that this Mesh object will never be transformed (rotated, scaled, or translated)
            // This is crucial for both TextureManager and CameraControls to work properly
            this._mesh.geometry = this._geometry;

            if (!canvas) {
                canvas = document.createElement('canvas');
            }
            this.canvas = canvas;
            this.canvas.addEventListener('contextmenu', (e) => e.preventDefault(), false);
            this.canvas.addEventListener('mousedown', this._mousedown, false);
            this.canvas.addEventListener('mousewheel', this._mousewheel, false);
            this.canvas.addEventListener('DOMMouseScroll', this._mousewheel, false); // firefox

            var viewSize = 1;
            var origin = new THREE.Vector3(0, 0, 0);
            for (var i = 0; i < this._mesh.geometry.vertices.length; i += 1) {
                viewSize = Math.max(
                    viewSize,
                    this._mesh.geometry.vertices[i].distanceTo(origin)
                );
            }
            viewSize *= 2 * 1.25;
            this._camera = new THREE.OrthographicCamera(-viewSize, viewSize, viewSize, -viewSize);
            this._camera.position.z = viewSize * 10;

            this._cameraControls = new OrthographicCameraControls(this._camera, this.canvasBox);

            this._textureManager = new TextureManager(this._geometry, this._renderer, this._camera);
            this._textureManager.applyViewingTexture(this._mesh);
            this._usingViewingTexture = true;

            this.handleResize();
            this.update();
        }
    }
}