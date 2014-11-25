module Chameleon {
    var CAMERA_NEAR = 0.5;

    export function create(geometry: THREE.Geometry, canvas?: HTMLCanvasElement) {
        return new Controls(geometry, canvas);
    }

    var mousePositionInCanvas = (() => {
        var vector = new THREE.Vector2();
        return (event: MouseEvent,
                canvasBox: {left: number; top: number; width: number; height: number},
                normalize: boolean = false) => {
            vector.set(
                event.pageX - canvasBox.left,
                event.pageY - canvasBox.top
            );
            if (normalize) {
                vector.x /= canvasBox.width;
                vector.y /= canvasBox.height;
            }
            return vector;
        };
    })();

    enum CameraControlsState {
        Idle, Pan, Rotate
    }

    /**
     * A simplification of THREE.TrackballControls from the three.js examples
     */
    class PerspectiveCameraControls {
        rotateSpeed: number = 1.5;
        zoomSpeed: number = 1.2;
        panSpeed: number = 0.8;

        private _state: CameraControlsState = CameraControlsState.Idle;
        private _eye: THREE.Vector3 = new THREE.Vector3();
        private _target: THREE.Vector3 = new THREE.Vector3();
        private _rotateStart: THREE.Vector3 = new THREE.Vector3();
        private _rotateEnd: THREE.Vector3 = new THREE.Vector3();
        private _zoomStart: number = 0;
        private _zoomEnd: number = 0;
        private _panStart: THREE.Vector2 = new THREE.Vector2();
        private _panEnd: THREE.Vector2 = new THREE.Vector2();

        private _getMouseProjectionOnBall = (() => {
            var vector = new THREE.Vector3();
            var objectUp = new THREE.Vector3();
            var mouseOnBall = new THREE.Vector3();

            return (event: MouseEvent) => {
                mouseOnBall.set(
                    ( event.pageX - this.canvasBox.width * 0.5 - this.canvasBox.left ) / (this.canvasBox.width * .5),
                    ( this.canvasBox.height * 0.5 + this.canvasBox.top - event.pageY ) / (this.canvasBox.height * .5),
                    0.0
                );
                var length = mouseOnBall.length();

                if (length > 1.0) {
                    mouseOnBall.normalize();
                } else {
                    mouseOnBall.z = Math.sqrt(1.0 - length * length);
                }

                this._eye.subVectors(this.camera.position, this._target);

                vector.copy(this.camera.up).setLength(mouseOnBall.y);
                vector.add(objectUp.copy(this.camera.up).cross(this._eye).setLength(mouseOnBall.x));
                vector.add(this._eye.setLength(mouseOnBall.z));

                return vector;
            };
        })();

        private _getMousePositionInCanvas(event: MouseEvent) {
            return mousePositionInCanvas(event, this.canvasBox, true);
        }

        rotateCamera = (()=> {
            var axis = new THREE.Vector3(),
                quaternion = new THREE.Quaternion();

            return () => {
                var angle = Math.acos(
                    this._rotateStart.dot(this._rotateEnd) / this._rotateStart.length() / this._rotateEnd.length()
                );
                if (angle) {
                    axis.crossVectors(this._rotateStart, this._rotateEnd).normalize();
                    angle *= this.rotateSpeed;
                    quaternion.setFromAxisAngle(axis, -angle);

                    this._eye.applyQuaternion(quaternion);
                    this.camera.up.applyQuaternion(quaternion);

                    this._rotateEnd.applyQuaternion(quaternion);
                    this._rotateStart.copy(this._rotateEnd);
                }
            }
        })();

        zoomCamera() {
            var factor = 1.0 + ( this._zoomEnd - this._zoomStart ) * this.zoomSpeed;
            if (factor !== 1.0 && factor > 0.0) {
                this._eye.multiplyScalar(factor);
                this._zoomStart = this._zoomEnd;
            }
        }

        panCamera = (() => {
            var mouseChange = new THREE.Vector2(),
                objectUp = new THREE.Vector3(),
                pan = new THREE.Vector3();

            return () => {
                mouseChange.subVectors(this._panEnd, this._panStart);
                if (mouseChange.lengthSq()) {
                    mouseChange.multiplyScalar(this._eye.length() * this.panSpeed);
                    pan.crossVectors(this._eye, this.camera.up).setLength(mouseChange.x).add(
                        objectUp.copy(this.camera.up).setLength(mouseChange.y)
                    );
                    this.camera.position.add(pan);
                    this._target.add(pan);
                    this._panStart.copy(this._panEnd);
                }
            }
        })();

        updateCamera() {
            this._eye.subVectors(this.camera.position, this._target);

            this.rotateCamera();
            this.zoomCamera();
            this.panCamera();

            this.camera.position.addVectors(this._target, this._eye);
            this.camera.lookAt(this._target);
        }

        onMouseDown = (event: MouseEvent) => {
            switch (event.button) {
                case 0: // Left button
                    this._state = CameraControlsState.Rotate;
                    this._rotateStart.copy(this._getMouseProjectionOnBall(event));
                    this._rotateEnd.copy(this._rotateStart);
                    break;
                case 2: // Right button
                    this._state = CameraControlsState.Pan;
                    this._panStart.copy(this._getMousePositionInCanvas(event));
                    this._panEnd.copy(this._panStart);
                    break;
                default:
                    debugger;
            }
        };

        onMouseMove = (event: MouseEvent) => {
            switch (this._state) {
                case CameraControlsState.Rotate:
                    this._rotateEnd.copy(this._getMouseProjectionOnBall(event));
                    break;
                case CameraControlsState.Pan:
                    this._panEnd.copy(this._getMousePositionInCanvas(event));
                    break;
                default:
                    debugger;
            }
        };

        onMouseUp = (event: MouseEvent) => {
            this._state = CameraControlsState.Idle;
        };

        onMouseWheel = (event: MouseWheelEvent) => {
            var delta = 0;

            if (event.wheelDelta) { // WebKit / Opera / Explorer 9
                delta = event.wheelDelta / 40;
            } else if (event.detail) { // Firefox
                delta = -event.detail / 3;
            }
            this._zoomStart += delta * 0.01;
        };

        constructor(public camera: THREE.PerspectiveCamera,
                    public canvasBox: {left: number; top: number; width: number; height: number}) {
        }
    }

    enum ControlsState {
        Idle, Draw, View
    }

    function showCanvasInNewWindow(canvas: HTMLCanvasElement) {
        var dataURL = canvas.toDataURL("image/png");
        var newWindow = window.open();
        newWindow.document.write('<img style="border:1px solid black" src="' + dataURL + '"/>');
    }

    class AffectedFacesRecorder {
        private _nAffectedFaces: number = 0;
        private _affectedFaces: Uint32Array;
        private _isFaceAffected: Uint8Array; // Used as if it's a boolean array
        private _isFaceAffectedEmpty: Uint8Array; // Used to clear _isFaceAffected. Should not be modified once initialized.

        constructor(nFaces: number) {
            this._affectedFaces = new Uint32Array(nFaces);
            this._isFaceAffected = new Uint8Array(nFaces);
            this._isFaceAffectedEmpty = new Uint8Array(nFaces);
        }

        add(faceIndex: number) {
            if (!this._isFaceAffected[faceIndex]) {
                this._isFaceAffected[faceIndex] = 1;
                this._affectedFaces[this._nAffectedFaces] = faceIndex;
                this._nAffectedFaces += 1;
            }
        }

        reset() {
            this._nAffectedFaces = 0;
            this._isFaceAffected.set(this._isFaceAffectedEmpty);
        }

        forEach(f: (int)=>any) {
            for (var i = 0; i < this._nAffectedFaces; i += 1) {
                f(this._affectedFaces[i]);
            }
        }

        get length(): number {
            return this._nAffectedFaces;
        }

        contains(faceIndex: number): boolean {
            return !!this._isFaceAffected[faceIndex];
        }
    }

    /**
     * Manages both the viewing texture and the drawing texture
     */
    class TextureManager {
        private _viewingTextureUvs: THREE.Vector2[][];
        private _viewingMaterial: THREE.MeshFaceMaterial;
        private _drawingTextureUvs: THREE.Vector2[][];
        private _drawingCanvas: HTMLCanvasElement;
        private _drawingMaterial: THREE.MeshLambertMaterial;
        private _drawingTextureMesh: THREE.Mesh;
        private _drawingTextureScene: THREE.Scene;
        private _drawingVertexUvs: THREE.Vector2[];
        private _affectedFaces: AffectedFacesRecorder;

        get drawingContext() {
            return this._drawingCanvas.getContext('2d');
        }

        get drawingCanvas() {
            return this._drawingCanvas;
        }

        initializeViewingTexture(): TextureManager {
            var singlePixelCanvas = <HTMLCanvasElement>document.createElement('canvas');
            singlePixelCanvas.width = singlePixelCanvas.height = 1;
            var context = singlePixelCanvas.getContext('2d');
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, 1, 1);

            this._viewingTextureUvs = [];
            var faces = this.geometry.faces;
            this._viewingMaterial = new THREE.MeshFaceMaterial();
            for (var i = 0; i < faces.length; i += 1) {
                // Set the materialIndex to be the face index
                // TextureManager requires this special treatment to work
                faces[i].materialIndex = i;
                this._viewingTextureUvs.push([
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.5, 0.5)
                ]);

                var lambertMaterial = new THREE.MeshLambertMaterial({map: new THREE.Texture(singlePixelCanvas)});
                lambertMaterial.map.needsUpdate = true;
                this._viewingMaterial.materials.push(lambertMaterial);
            }

            return this;
        }

        // Depends on the initialization of viewing texture
        initializeDrawingTexture(): TextureManager {
            this._drawingVertexUvs = [];
            for (var i = 0; i < this.geometry.vertices.length; i += 1) {
                this._drawingVertexUvs.push(new THREE.Vector2());
            }

            this._drawingTextureUvs = [];
            var faces = this.geometry.faces;
            for (var i = 0; i < faces.length; i += 1) {
                this._drawingTextureUvs.push([
                    new THREE.Vector2(),
                    new THREE.Vector2(),
                    new THREE.Vector2()
                ]);
            }

            this._drawingCanvas = document.createElement('canvas');
            this._drawingMaterial = new THREE.MeshLambertMaterial({
                map: new THREE.Texture(this._drawingCanvas)
            });
            this._drawingTextureMesh = new THREE.Mesh(this.geometry, this._viewingMaterial);

            this._drawingTextureScene = new THREE.Scene();
            this._drawingTextureScene.add(new THREE.AmbientLight(0xFFFFFF));
            this._drawingTextureScene.add(this._drawingTextureMesh);

            return this;
        }

        prepareViewingTexture(): TextureManager {
            if (this._affectedFaces.length > 0) {
                var uMax = Number.NEGATIVE_INFINITY,
                    uMin = Number.POSITIVE_INFINITY,
                    vMax = Number.NEGATIVE_INFINITY,
                    vMin = Number.POSITIVE_INFINITY;

                this._affectedFaces.forEach((faceIndex) => {
                    var drawingUvs = this._drawingTextureUvs[faceIndex];
                    uMax = Math.max(uMax, drawingUvs[0].x, drawingUvs[1].x, drawingUvs[2].x);
                    uMin = Math.min(uMin, drawingUvs[0].x, drawingUvs[1].x, drawingUvs[2].x);
                    vMax = Math.max(vMax, drawingUvs[0].y, drawingUvs[1].y, drawingUvs[2].y);
                    vMin = Math.min(vMin, drawingUvs[0].y, drawingUvs[1].y, drawingUvs[2].y);
                });

                var xMax = uMax * this._drawingCanvas.width,
                    xMin = uMin * this._drawingCanvas.width,
                    yMax = (1 - vMin) * this._drawingCanvas.height,
                    yMin = (1 - vMax) * this._drawingCanvas.height;

                this.drawingContext.rect(xMin, yMin, xMax, yMax);
                this.drawingContext.clip();
                var patchCanvas = <HTMLCanvasElement>document.createElement('canvas');
                patchCanvas.width = xMax - xMin;
                patchCanvas.height = yMax - yMin;
                patchCanvas.getContext('2d').drawImage(
                    this._drawingCanvas,
                    xMin, yMin, patchCanvas.width, patchCanvas.height,
                    0, 0, patchCanvas.width, patchCanvas.height
                );

                this._affectedFaces.forEach((faceIndex) => {
                    var faceMaterial = <THREE.MeshLambertMaterial>this._viewingMaterial.materials[faceIndex];
                    faceMaterial.map.image = patchCanvas;
                    faceMaterial.map.needsUpdate = true;

                    var drawingUvs = this._drawingTextureUvs[faceIndex];
                    var viewingUvs = this._viewingTextureUvs[faceIndex];
                    for (var j = 0; j < 3; j += 1) {
                        var drawingUV = drawingUvs[j];
                        viewingUvs[j].setX(
                            (drawingUV.x - uMin) * (this._drawingCanvas.width) / patchCanvas.width
                        ).setY(
                            (drawingUV.y - vMin) * (this._drawingCanvas.height) / patchCanvas.height
                        );
                    }
                });

                this._affectedFaces.reset();
            }

            return this;
        }

        applyViewingTexture(mesh: THREE.Mesh): TextureManager {
            mesh.material = this._viewingMaterial;
            mesh.geometry.faceVertexUvs[0] = this._viewingTextureUvs;
            mesh.geometry.uvsNeedUpdate = true;

            return this;
        }

        prepareDrawingTexture(): TextureManager {
            this.renderer.render(this._drawingTextureScene, this.camera);
            this._drawingCanvas.width = this.renderer.domElement.width;
            this._drawingCanvas.height = this.renderer.domElement.height;
            this.drawingContext.drawImage(this.renderer.domElement, 0, 0);
            this._drawingMaterial.map.needsUpdate = true;

            var projectedPosition = new THREE.Vector3();
            for (var i = 0; i < this.geometry.vertices.length; i += 1) {
                projectedPosition.copy(this.geometry.vertices[i]).project(this.camera);
                this._drawingVertexUvs[i].setX(
                    (projectedPosition.x + 1) / 2
                ).setY(
                    (projectedPosition.y + 1) / 2
                );
            }
            for (var i = 0; i < this.geometry.faces.length; i += 1) {
                this._drawingTextureUvs[i][0].copy(this._drawingVertexUvs[this.geometry.faces[i].a]);
                this._drawingTextureUvs[i][1].copy(this._drawingVertexUvs[this.geometry.faces[i].b]);
                this._drawingTextureUvs[i][2].copy(this._drawingVertexUvs[this.geometry.faces[i].c]);
            }

            return this;
        }

        applyDrawingTexture(mesh: THREE.Mesh): TextureManager {
            mesh.material = this._drawingMaterial;
            mesh.geometry.faceVertexUvs[0] = this._drawingTextureUvs;
            mesh.geometry.uvsNeedUpdate = true;

            return this;
        }

        private _castRayFromMouse(canvasPos: THREE.Vector2): THREE.Intersection[] {
            var mouse3d = new THREE.Vector3(
                canvasPos.x / this._drawingCanvas.width * 2 - 1,
                -canvasPos.y / this._drawingCanvas.height * 2 + 1,
                CAMERA_NEAR
            ).unproject(this.camera).sub(this.camera.position).normalize();

            return new THREE.Raycaster(
                this.camera.position,
                mouse3d,
                CAMERA_NEAR
            ).intersectObject(this._drawingTextureMesh);
        }

        public onStrokePainted(canvasPos: THREE.Vector2, radius: number): TextureManager {
            var intersections = this._castRayFromMouse(canvasPos);
            if (intersections.length > 0) {
                this._drawingMaterial.map.needsUpdate = true;
                var faceIndex = intersections[0].face.materialIndex;
                this._affectedFaces.add(faceIndex);

                // TODO use radius to find all affected triangles

            }

            return this;
        }

        // Assumption on geometry: material indices are same to face indices.
        // This special treatment is implemented in the constructor of Controls
        constructor(public geometry: THREE.Geometry,
                    public renderer: THREE.Renderer,
                    public camera: THREE.Camera) {

            this._affectedFaces = new AffectedFacesRecorder(this.geometry.faces.length);
            this.initializeViewingTexture().initializeDrawingTexture();
        }
    }

    interface Brush {
        radius: number;
        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2);
        continueStoke(position: THREE.Vector2);
        finishStroke();
    }

    class Pencil implements Brush {
        get radius(): number {
            return 1;
        }

        private _canvasContext: CanvasRenderingContext2D = null;

        startStroke(canvas: HTMLCanvasElement, position: THREE.Vector2) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished

            this._canvasContext.moveTo(position.x, position.y);
        }

        continueStoke(position: THREE.Vector2) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        }

        finishStroke() {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        }
    }

    export class Controls {

        private _state: ControlsState = ControlsState.Idle;

        private _geometry: THREE.Geometry;
        private _mesh: THREE.Mesh = new THREE.Mesh();
        canvas: HTMLCanvasElement;

        canvasBox = {left: 0, top: 0, width: 0, height: 0};

        public updateCanvasBox() {
            var canvasRect = this.canvas.getBoundingClientRect();
            var docElement = this.canvas.ownerDocument.documentElement;
            this.canvasBox.left = canvasRect.left + window.pageXOffset - docElement.clientLeft;
            this.canvasBox.top = canvasRect.top + window.pageYOffset - docElement.clientTop;
            this.canvasBox.width = canvasRect.width;
            this.canvasBox.height = canvasRect.height;
        }

        private _headLight: THREE.PointLight = new THREE.PointLight(0xFFFFFF, 0.4);
        private _camera: THREE.PerspectiveCamera = (() => {
            var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, CAMERA_NEAR, 10000);
            camera.position.z = 5;
            return camera;
        })();
        private _cameraControls = new PerspectiveCameraControls(this._camera, this.canvasBox);

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

        brush: Brush = new Pencil();

        private _textureManager: TextureManager;
        private _usingViewingTexture: boolean;

        handleResize() {
            this._renderer.setSize(this.canvas.width, this.canvas.height);
            this._camera.aspect = this.canvas.width / this.canvas.height;
            this._camera.updateProjectionMatrix();

            this.updateCanvasBox();
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

            this._textureManager = new TextureManager(this._geometry, this._renderer, this._camera);
            this._textureManager.applyViewingTexture(this._mesh);
            this._usingViewingTexture = true;

            if (!canvas) {
                canvas = document.createElement('canvas');
            }
            this.canvas = canvas;
            this.canvas.addEventListener('contextmenu', (e) => e.preventDefault(), false);
            this.canvas.addEventListener('mousedown', this._mousedown, false);
            this.canvas.addEventListener('mousewheel', this._mousewheel, false);
            this.canvas.addEventListener('DOMMouseScroll', this._mousewheel, false); // firefox

            this.handleResize();
            this.update();
        }

    }
}

