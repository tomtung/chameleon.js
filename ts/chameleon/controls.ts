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
        private _orthographicCamera: THREE.OrthographicCamera;
        private _orthographicCameraControls: OrthographicCameraControls;
        private _perspectiveCamera: THREE.PerspectiveCamera;
        private _perspectiveCameraControls: PerspectiveCameraControls;

        private _perspectiveView = false;
        get perspectiveView(): boolean {
            return this._perspectiveView;
        }

        set perspectiveView(value: boolean) {
            if (this._perspectiveView === value) {
                return;
            }

            this._perspectiveView = value;
            if (value) {
                this._useViewingTexture();
            }
        }

        get backgroundColor(): string {
            return this._textureManager.backgroundColor;
        }

        set backgroundColor(value: string) {
            this._useViewingTexture();
            this._textureManager.backgroundColor = value;
            this._textureManager.backgroundReset();
        }

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

        private _renderer: THREE.WebGLRenderer = (() => {
            var renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
            renderer.setClearColor(0xAAAAAA, 1.0);
            return renderer;
        })();

        brush: Brush = new Pencil();


        private _textureManager: TextureManager;
        private _usingViewingTexture: boolean;

        handleResize() {
            this._renderer.setSize(this.canvas.width, this.canvas.height);
            this.updateCanvasBox();
            this._orthographicCameraControls.handleResize();
            this._perspectiveCameraControls.handleResize();
            this._useViewingTexture();
        }


        update() {
            this._perspectiveCameraControls.updateCamera();
            this._orthographicCameraControls.updateCamera();
            if (this.perspectiveView) {
                this._headLight.position.copy(this._perspectiveCamera.position);
                this._renderer.render(this._scene, this._perspectiveCamera);
            } else {
                this._headLight.position.copy(this._orthographicCamera.position);
                this._renderer.render(this._scene, this._orthographicCamera);
            }

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
            if (this.perspectiveView || event.shiftKey) {
                this._state = ControlsState.View;
                this._useViewingTexture();
                this._perspectiveCameraControls.onMouseDown(event);
                this._orthographicCameraControls.onMouseDown(event);
            } else {
                this._state = ControlsState.Draw;
                this._useDrawingTexture();

                var pos = mousePositionInCanvas(event, this.canvasBox);
                this.brush.startStroke(this._textureManager.drawingCanvas, pos);
                this._textureManager.onStrokePainted(pos, this.brush.radius, true);
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
                    this._perspectiveCameraControls.onMouseMove(event);
                    this._orthographicCameraControls.onMouseMove(event);
                    break;
                case ControlsState.Draw:
                    var pos = mousePositionInCanvas(event, this.canvasBox);
                    this.brush.continueStoke(pos);
                    this._textureManager.onStrokePainted(pos, this.brush.radius, false);
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
            this._perspectiveCameraControls.onMouseUp(event);
            this._orthographicCameraControls.onMouseUp(event);
            this._state = ControlsState.Idle;

            document.removeEventListener('mousemove', this._mousemove);
            document.removeEventListener('mouseup', this._mouseup);
        };

        private _mousewheel = (event: MouseWheelEvent) => {
            event.preventDefault();
            event.stopPropagation();

            if (this._state === ControlsState.Draw || !this.perspectiveView && !event.shiftKey) {
                return;
            }

            this._useViewingTexture();
            this._perspectiveCameraControls.onMouseWheel(event);
            this._orthographicCameraControls.onMouseWheel(event);
        };

        private _boundingBallRadius: number;

        private static _computeBoundingBallRadius(geometry: THREE.Geometry): number {
            var radius = 0;
            var origin = new THREE.Vector3(0, 0, 0);
            for (var i = 0; i < geometry.vertices.length; i += 1) {
                radius = Math.max(
                    radius,
                    geometry.vertices[i].distanceTo(origin)
                );
            }

            return radius;
        }

        private _initializeCamera() {
            this._boundingBallRadius = Controls._computeBoundingBallRadius(this._geometry);

            var fov = 60;
            var z = 2 * this._boundingBallRadius / Math.tan(fov / 2 / 180 * Math.PI);

            this._orthographicCamera = new THREE.OrthographicCamera(
                -this._boundingBallRadius * 2,
                this._boundingBallRadius * 2,
                this._boundingBallRadius * 2,
                -this._boundingBallRadius * 2
            );
            this._orthographicCamera.position.z = z;
            this._orthographicCameraControls = new OrthographicCameraControls(this._orthographicCamera, this.canvasBox);

            this._perspectiveCamera = new THREE.PerspectiveCamera(fov, 1);
            this._perspectiveCamera.position.setZ(z);
            this._perspectiveCameraControls = new PerspectiveCameraControls(this._perspectiveCamera, this.canvasBox);
        }

        resetCameras() {
            var fov = 60;
            var z = 2 * this._boundingBallRadius / Math.tan(fov / 2 / 180 * Math.PI);

            this._orthographicCamera.position.set(0, 0, z);
            this._perspectiveCamera.position.set(0, 0, z);

            var origin = new THREE.Vector3(0, 0, 0);

            this._orthographicCameraControls.target.copy(origin);
            this._orthographicCamera.lookAt(origin);
            this._perspectiveCameraControls.target.copy(origin);
            this._perspectiveCamera.lookAt(origin);

            this._orthographicCamera.up.set(0, 1, 0);
            this._perspectiveCamera.up.set(0, 1, 0);

            this._orthographicCamera.zoom = 1;
            this._perspectiveCamera.zoom = 1;

            this._orthographicCamera.updateProjectionMatrix();
            this._perspectiveCamera.updateProjectionMatrix();

            this._orthographicCameraControls.handleResize();
            this._perspectiveCameraControls.handleResize();

            this._useViewingTexture();
        }

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

            this._initializeCamera();

            this._textureManager = new TextureManager(this._geometry, this._renderer, this._orthographicCamera);
            this._textureManager.applyViewingTexture(this._mesh);
            this._usingViewingTexture = true;

            this.handleResize();
            this.update();
        }
    }
}