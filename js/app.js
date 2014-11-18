var Chameleon;
(function (Chameleon) {
    var State;
    (function (State) {
        State[State["Idle"] = 0] = "Idle";
        State[State["Draw"] = 1] = "Draw";
        State[State["Pan"] = 2] = "Pan";
        State[State["Rotate"] = 3] = "Rotate";
    })(State || (State = {}));
    function showCanvasInNewWindow(canvas) {
        var dataURL = canvas.toDataURL("image/png");
        var newWindow = window.open();
        newWindow.document.write('<img style="border:1px solid black" src="' + dataURL + '"/>');
    }
    /**
     * The camera manipulation is borrowed from THREE.TrackballControls from the three.js examples
     */
    var Controls = (function () {
        function Controls(mesh, camera, canvas) {
            var _this = this;
            this._state = 0 /* Idle */;
            this.rotateSpeed = 1.5;
            this.zoomSpeed = 1.2;
            this.panSpeed = 0.8;
            this.screen = { left: 0, top: 0, width: 0, height: 0 };
            this.target = new THREE.Vector3();
            this._eye = new THREE.Vector3();
            this._rotateStart = new THREE.Vector3();
            this._rotateEnd = new THREE.Vector3();
            this._zoomStart = 0;
            this._zoomEnd = 0;
            this._panStart = new THREE.Vector2();
            this._panEnd = new THREE.Vector2();
            this._drawingMaterial = new THREE.MeshLambertMaterial();
            this._nAffectedFaces = 0;
            this._getMouseOnScreen = (function () {
                var vector = new THREE.Vector2();
                return function (pageX, pageY) {
                    vector.set((pageX - _this.screen.left) / _this.screen.width, (pageY - _this.screen.top) / _this.screen.height);
                    return vector;
                };
            })();
            this._getMouseProjectionOnBall = (function () {
                var vector = new THREE.Vector3();
                var objectUp = new THREE.Vector3();
                var mouseOnBall = new THREE.Vector3();
                return function (pageX, pageY) {
                    mouseOnBall.set((pageX - _this.screen.width * 0.5 - _this.screen.left) / (_this.screen.width * .5), (_this.screen.height * 0.5 + _this.screen.top - pageY) / (_this.screen.height * .5), 0.0);
                    var length = mouseOnBall.length();
                    if (length > 1.0) {
                        mouseOnBall.normalize();
                    }
                    else {
                        mouseOnBall.z = Math.sqrt(1.0 - length * length);
                    }
                    _this._eye.subVectors(_this._camera.position, _this.target);
                    vector.copy(_this._camera.up).setLength(mouseOnBall.y);
                    vector.add(objectUp.copy(_this._camera.up).cross(_this._eye).setLength(mouseOnBall.x));
                    vector.add(_this._eye.setLength(mouseOnBall.z));
                    return vector;
                };
            })();
            this.rotateCamera = (function () {
                var axis = new THREE.Vector3(), quaternion = new THREE.Quaternion();
                return function () {
                    var angle = Math.acos(_this._rotateStart.dot(_this._rotateEnd) / _this._rotateStart.length() / _this._rotateEnd.length());
                    if (angle) {
                        axis.crossVectors(_this._rotateStart, _this._rotateEnd).normalize();
                        angle *= _this.rotateSpeed;
                        quaternion.setFromAxisAngle(axis, -angle);
                        _this._eye.applyQuaternion(quaternion);
                        _this._camera.up.applyQuaternion(quaternion);
                        _this._rotateEnd.applyQuaternion(quaternion);
                        _this._rotateStart.copy(_this._rotateEnd);
                    }
                };
            })();
            this.panCamera = (function () {
                var mouseChange = new THREE.Vector2(), objectUp = new THREE.Vector3(), pan = new THREE.Vector3();
                return function () {
                    mouseChange.subVectors(_this._panEnd, _this._panStart);
                    if (mouseChange.lengthSq()) {
                        mouseChange.multiplyScalar(_this._eye.length() * _this.panSpeed);
                        pan.crossVectors(_this._eye, _this._camera.up).setLength(mouseChange.x).add(objectUp.copy(_this._camera.up).setLength(mouseChange.y));
                        _this._camera.position.add(pan);
                        _this.target.add(pan);
                        _this._panStart.copy(_this._panEnd);
                    }
                };
            })();
            this._mousedown = function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (_this._state !== 0 /* Idle */) {
                    return;
                }
                // Hold shift key to rotate and pan
                if (event.shiftKey) {
                    _this._useViewingTexture();
                    switch (event.button) {
                        case 0:
                            _this._state = 3 /* Rotate */;
                            _this._rotateStart.copy(_this._getMouseProjectionOnBall(event.pageX, event.pageY));
                            _this._rotateEnd.copy(_this._rotateStart);
                            break;
                        case 2:
                            _this._state = 2 /* Pan */;
                            _this._panStart.copy(_this._getMouseOnScreen(event.pageX, event.pageY));
                            _this._panEnd.copy(_this._panStart);
                            break;
                        default:
                            console.log(event);
                    }
                }
                else {
                    _this._state = 1 /* Draw */;
                    _this._useDrawingTexture();
                    // TODO Implement drawing...
                    console.log("Start drawing...");
                    console.log(event);
                }
                document.addEventListener('mousemove', _this._mousemove, false);
                document.addEventListener('mouseup', _this._mouseup, false);
            };
            this._mousemove = function (event) {
                if (_this._state === 0 /* Idle */) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                switch (_this._state) {
                    case 3 /* Rotate */:
                        _this._rotateEnd.copy(_this._getMouseProjectionOnBall(event.pageX, event.pageY));
                        break;
                    case 2 /* Pan */:
                        _this._panEnd.copy(_this._getMouseOnScreen(event.pageX, event.pageY));
                        break;
                    case 1 /* Draw */:
                        // TODO Implement drawing...
                        console.log("Drawing... (not implemented)");
                        console.log(event);
                        break;
                    default:
                        debugger;
                }
            };
            this._mouseup = function (event) {
                event.preventDefault();
                event.stopPropagation();
                _this.updateCamera();
                _this._state = 0 /* Idle */;
                document.removeEventListener('mousemove', _this._mousemove);
                document.removeEventListener('mouseup', _this._mouseup);
            };
            this._mousewheel = function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (_this._state !== 0 /* Idle */ || !event.shiftKey) {
                    return;
                }
                _this._useViewingTexture();
                var delta = 0;
                if (event.wheelDelta) {
                    delta = event.wheelDelta / 40;
                }
                else if (event.detail) {
                    delta = -event.detail / 3;
                }
                _this._zoomStart += delta * 0.01;
            };
            this._mesh = mesh;
            this._camera = camera;
            this._canvas = canvas;
            this._canvas.addEventListener('contextmenu', function (e) { return e.preventDefault(); }, false);
            this._canvas.addEventListener('mousedown', this._mousedown, false);
            this._canvas.addEventListener('mousewheel', this._mousewheel, false);
            this._canvas.addEventListener('DOMMouseScroll', this._mousewheel, false); // firefox
            this._nAffectedFaces = 0;
            this._affectedFaces = new Uint32Array(this._mesh.geometry.faces.length);
            this._useViewingTexture(true);
            this.handleResize();
            this.updateCamera();
        }
        Controls.prototype.handleResize = function () {
            var box = this._canvas.getBoundingClientRect();
            var d = this._canvas.ownerDocument.documentElement;
            this.screen.left = box.left + window.pageXOffset - d.clientLeft;
            this.screen.top = box.top + window.pageYOffset - d.clientTop;
            this.screen.width = box.width;
            this.screen.height = box.height;
        };
        Controls.prototype.zoomCamera = function () {
            var factor = 1.0 + (this._zoomEnd - this._zoomStart) * this.zoomSpeed;
            if (factor !== 1.0 && factor > 0.0) {
                this._eye.multiplyScalar(factor);
                this._zoomStart = this._zoomEnd;
            }
        };
        Controls.prototype.updateCamera = function () {
            this._eye.subVectors(this._camera.position, this.target);
            this.rotateCamera();
            this.zoomCamera();
            this.panCamera();
            this._camera.position.addVectors(this.target, this._eye);
            this._camera.lookAt(this.target);
        };
        Controls.prototype._useViewingTexture = function (initialize) {
            if (initialize === void 0) { initialize = false; }
            if (initialize) {
                var singlePixelCanvas = document.createElement('canvas');
                singlePixelCanvas.width = singlePixelCanvas.height = 1;
                var context = singlePixelCanvas.getContext('2d');
                context.fillStyle = '#FFFFFF';
                context.fillRect(0, 0, 1, 1);
                showCanvasInNewWindow(singlePixelCanvas);
                var lambertMaterial = new THREE.MeshLambertMaterial({ map: new THREE.Texture(singlePixelCanvas) });
                lambertMaterial.map.needsUpdate = true;
                this._viewingMaterial = new THREE.MeshFaceMaterial([
                    lambertMaterial
                ]);
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
            }
            else if (this._usingViewingTexture) {
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
        };
        Controls.prototype._useDrawingTexture = function () {
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
        };
        return Controls;
    })();
    Chameleon.Controls = Controls;
})(Chameleon || (Chameleon = {}));
/// <reference path="./three.d.ts" />
/// <reference path="./dat.gui.d.ts" />
/// <reference path="./chameleon.ts" />
(function () {
    function createMesh() {
        // TODO replace with a more interesting object
        // TODO Note that it mush be a Mesh object
        var geometry = new THREE.CylinderGeometry(1, 1, 2);
        var material = new THREE.MeshLambertMaterial();
        material.side = THREE.DoubleSide;
        material.vertexColors = THREE.FaceColors;
        return new THREE.Mesh(geometry, material);
    }
    function createScene() {
        var scene = new THREE.Scene();
        var ambientLight = new THREE.AmbientLight(0x777777);
        scene.add(ambientLight);
        var light = new THREE.DirectionalLight(0xFFFFFF, 0.2);
        light.position.set(320, 390, 700);
        scene.add(light);
        var light2 = new THREE.DirectionalLight(0xFFFFFF, 0.2);
        light2.position.set(-720, -190, -300);
        scene.add(light2);
        return scene;
    }
    function createCamera() {
        var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        camera.position.z = 5;
        return camera;
    }
    function createRenderer() {
        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xAAAAAA, 1.0);
        return renderer;
    }
    function setUpDatGui() {
        var param = {
            color: "#439814",
            headLightBrightness: 0.4
        };
        var gui = new dat.GUI();
        gui.addColor(param, "color").name('Color');
        gui.add(param, 'headLightBrightness', 0, 1).step(0.1).name('Brightness');
        return param;
    }
    function prepareToRender() {
        var controlParam = setUpDatGui();
        var mesh = createMesh();
        var camera = createCamera();
        var scene = createScene();
        scene.add(mesh);
        var headLight = new THREE.PointLight(0xFFFFFF, 0.4);
        scene.add(headLight);
        var renderer = createRenderer();
        var canvas = renderer.domElement;
        document.body.appendChild(canvas);
        var controls = new Chameleon.Controls(mesh, camera, canvas);
        // Render loop
        var doRender = function () {
            controls.updateCamera();
            headLight.position.copy(camera.position);
            headLight.intensity = controlParam.headLightBrightness;
            renderer.render(scene, camera);
            requestAnimationFrame(doRender);
        };
        window.addEventListener('resize', function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            controls.handleResize();
        }, false);
        return doRender;
    }
    prepareToRender()();
})();
