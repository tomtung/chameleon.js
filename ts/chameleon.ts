module Chameleon {

    enum State {
        Idle, Draw, Pan, Rotate
    }

    function showCanvasInNewWindow(canvas: HTMLCanvasElement) {
        var dataURL = canvas.toDataURL("image/png");
        var newWindow = window.open();
        newWindow.document.write('<img style="border:1px solid black" src="' + dataURL + '"/>');
    }

    /**
     * The camera manipulation is borrowed from THREE.TrackballControls from the three.js examples
     */
    export class Controls {
        private _state: State = State.Idle;

        private _mesh: THREE.Mesh;
        private _camera: THREE.Camera;
        private _canvas: HTMLCanvasElement;

        rotateSpeed: number = 1.5;
        zoomSpeed: number = 1.2;
        panSpeed: number = 0.8;

        screen = {left: 0, top: 0, width: 0, height: 0};
        target: THREE.Vector3 = new THREE.Vector3();

        private _eye: THREE.Vector3 = new THREE.Vector3();
        private _rotateStart: THREE.Vector3 = new THREE.Vector3();
        private _rotateEnd: THREE.Vector3 = new THREE.Vector3();
        private _zoomStart: number = 0;
        private _zoomEnd: number = 0;
        private _panStart: THREE.Vector2 = new THREE.Vector2();
        private _panEnd: THREE.Vector2 = new THREE.Vector2();

        private _viewingTextureUvs: THREE.Vector2[][];
        private _viewingMaterial: THREE.MeshFaceMaterial;
        private _drawingTextureUvs: THREE.Vector2[][];
        private _drawingMaterial: THREE.MeshLambertMaterial = new THREE.MeshLambertMaterial();
        private _usingViewingTexture: boolean;

        private _nAffectedFaces: number = 0;
        private _affectedFaces: Uint32Array;

        handleResize() {
            var box = this._canvas.getBoundingClientRect();
            var d = this._canvas.ownerDocument.documentElement;
            this.screen.left = box.left + window.pageXOffset - d.clientLeft;
            this.screen.top = box.top + window.pageYOffset - d.clientTop;
            this.screen.width = box.width;
            this.screen.height = box.height;
        }

        private _getMouseOnScreen = (() => {
            var vector = new THREE.Vector2();
            return (pageX: number, pageY: number) => {
                vector.set(
                    ( pageX - this.screen.left ) / this.screen.width,
                    ( pageY - this.screen.top ) / this.screen.height
                );
                return vector;
            };
        })();

        private _getMouseProjectionOnBall = (() => {
            var vector = new THREE.Vector3();
            var objectUp = new THREE.Vector3();
            var mouseOnBall = new THREE.Vector3();

            return (pageX: number, pageY: number) => {
                mouseOnBall.set(
                    ( pageX - this.screen.width * 0.5 - this.screen.left ) / (this.screen.width * .5),
                    ( this.screen.height * 0.5 + this.screen.top - pageY ) / (this.screen.height * .5),
                    0.0
                );
                var length = mouseOnBall.length();

                if (length > 1.0) {
                    mouseOnBall.normalize();
                } else {
                    mouseOnBall.z = Math.sqrt(1.0 - length * length);
                }

                this._eye.subVectors(this._camera.position, this.target);

                vector.copy(this._camera.up).setLength(mouseOnBall.y);
                vector.add(objectUp.copy(this._camera.up).cross(this._eye).setLength(mouseOnBall.x));
                vector.add(this._eye.setLength(mouseOnBall.z));

                return vector;
            };
        })();

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
                    this._camera.up.applyQuaternion(quaternion);

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
                    pan.crossVectors(this._eye, this._camera.up).setLength(mouseChange.x).add(
                        objectUp.copy(this._camera.up).setLength(mouseChange.y)
                    );
                    this._camera.position.add(pan);
                    this.target.add(pan);
                    this._panStart.copy(this._panEnd);
                }
            }
        })();

        updateCamera() {
            this._eye.subVectors(this._camera.position, this.target);

            this.rotateCamera();
            this.zoomCamera();
            this.panCamera();

            this._camera.position.addVectors(this.target, this._eye);
            this._camera.lookAt(this.target);
        }

        private _useViewingTexture(initialize: boolean = false) {
            if (initialize) {
                var singlePixelCanvas = <HTMLCanvasElement>document.createElement('canvas');
                singlePixelCanvas.width = singlePixelCanvas.height = 1;
                var context = singlePixelCanvas.getContext('2d');
                context.fillStyle = '#FFFFFF';
                context.fillRect(0, 0, 1, 1);

                showCanvasInNewWindow(singlePixelCanvas);

                var lambertMaterial = new THREE.MeshLambertMaterial({map: new THREE.Texture(singlePixelCanvas)});
                lambertMaterial.map.needsUpdate = true;
                this._viewingMaterial = new THREE.MeshFaceMaterial(
                    [
                        lambertMaterial
                    ]
                );

                this._viewingTextureUvs = [];
                var faces = this._mesh.geometry.faces;
                for (var i = 0; i < faces.length; i += 1) {
                    faces[i].materialIndex = 0;
                    this._viewingTextureUvs.push([
                        new THREE.Vector2(0.5, 0.5),
                        new THREE.Vector2(0.5, 0.5),
                        new THREE.Vector2(0.5, 0.5)
                    ]);
                }
            } else if (this._usingViewingTexture) {
                // Already using viewing texture, do nothing
                return;
            }
            else {

                // TODO update viewing texture from drawing texture
                console.log('Preparing viewing texture...');

            }

            this._mesh.material = this._viewingMaterial;
            this._mesh.geometry.faceVertexUvs[0] = this._viewingTextureUvs;
            this._mesh.geometry.uvsNeedUpdate = true;
            this._usingViewingTexture = true;
        }

        private _useDrawingTexture() {
            // If already using the drawing texture, do nothing
            if (!this._usingViewingTexture) {
                return;
            }

            // Lazy initialization
            if (!this._drawingMaterial) {
                this._drawingMaterial = new THREE.MeshLambertMaterial();
                this._drawingTextureUvs = [];
                var faces = this._mesh.geometry.faces;
                for (var i = 0; i < faces.length; i += 1) {
                    faces[i].materialIndex = 0;
                    this._drawingTextureUvs.push([
                        new THREE.Vector2(),
                        new THREE.Vector2(),
                        new THREE.Vector2()
                    ]);
                }
            }

            // TODO render and apply drawing texture...
            console.log('Preparing drawing texture...');

            this._mesh.material = this._drawingMaterial;
            this._mesh.geometry.faceVertexUvs[0] = this._drawingTextureUvs;
            this._mesh.geometry.uvsNeedUpdate = true;
            this._usingViewingTexture = false;
        }

        private _mousedown = (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            if (this._state !== State.Idle) {
                return;
            }

            // Hold shift key to rotate and pan
            if (event.shiftKey) {
                this._useViewingTexture();

                switch (event.button) {
                    case 0: // Left button
                        this._state = State.Rotate;
                        this._rotateStart.copy(this._getMouseProjectionOnBall(event.pageX, event.pageY));
                        this._rotateEnd.copy(this._rotateStart);
                        break;
                    case 2: // Right button
                        this._state = State.Pan;
                        this._panStart.copy(this._getMouseOnScreen(event.pageX, event.pageY));
                        this._panEnd.copy(this._panStart);
                        break;
                    default:
                        console.log(event);
                }
            } else {
                this._state = State.Draw;
                this._useDrawingTexture();

                // TODO Implement drawing...
                console.log("Start drawing...");
                console.log(event);

            }

            document.addEventListener('mousemove', this._mousemove, false);
            document.addEventListener('mouseup', this._mouseup, false);
        };

        private _mousemove = (event: MouseEvent) => {
            if (this._state === State.Idle) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            switch (this._state) {
                case State.Rotate:
                    this._rotateEnd.copy(this._getMouseProjectionOnBall(event.pageX, event.pageY));
                    break;
                case State.Pan:
                    this._panEnd.copy(this._getMouseOnScreen(event.pageX, event.pageY));
                    break;
                case State.Draw:

                    // TODO Implement drawing...
                    console.log("Drawing... (not implemented)");
                    console.log(event);

                    break;
                default:
                    debugger;
            }
        };

        private _mouseup = (event: MouseEvent) => {

            event.preventDefault();
            event.stopPropagation();

            this.updateCamera();
            this._state = State.Idle;

            document.removeEventListener('mousemove', this._mousemove);
            document.removeEventListener('mouseup', this._mouseup);
        };

        private _mousewheel = (event: MouseWheelEvent) => {
            event.preventDefault();
            event.stopPropagation();

            if (this._state !== State.Idle || !event.shiftKey) {
                return;
            }

            this._useViewingTexture();

            var delta = 0;

            if (event.wheelDelta) { // WebKit / Opera / Explorer 9
                delta = event.wheelDelta / 40;
            } else if (event.detail) { // Firefox
                delta = -event.detail / 3;
            }
            this._zoomStart += delta * 0.01;
        };

        constructor(mesh: THREE.Mesh, camera: THREE.Camera, canvas: HTMLCanvasElement) {
            this._mesh = mesh;
            this._camera = camera;

            this._canvas = canvas;
            this._canvas.addEventListener('contextmenu', (e) => e.preventDefault(), false);
            this._canvas.addEventListener('mousedown', this._mousedown, false);
            this._canvas.addEventListener('mousewheel', this._mousewheel, false);
            this._canvas.addEventListener('DOMMouseScroll', this._mousewheel, false); // firefox

            this._nAffectedFaces = 0;
            this._affectedFaces = new Uint32Array(this._mesh.geometry.faces.length);

            this._useViewingTexture(true);

            this.handleResize();
            this.updateCamera();
        }

    }
}