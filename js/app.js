var ChameleonState;
(function (ChameleonState) {
    ChameleonState[ChameleonState["Idle"] = 0] = "Idle";
    ChameleonState[ChameleonState["Draw"] = 1] = "Draw";
    ChameleonState[ChameleonState["Pan"] = 2] = "Pan";
    ChameleonState[ChameleonState["Rotate"] = 3] = "Rotate";
})(ChameleonState || (ChameleonState = {}));
/**
 * The camera manipulation is borrowed from THREE.TrackballControls from the three.js examples
 */
var Chameleon = (function () {
    function Chameleon(geometry, canvas) {
        var _this = this;
        this._state = 0 /* Idle */;
        this._mesh = new THREE.Mesh();
        this._headLight = new THREE.PointLight(0xFFFFFF, 0.4);
        this._camera = (function () {
            var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
            camera.position.z = 5;
            return camera;
        })();
        this._scene = (function () {
            var scene = new THREE.Scene();
            var ambientLight = new THREE.AmbientLight(0x777777);
            scene.add(ambientLight);
            var light = new THREE.DirectionalLight(0xFFFFFF, 0.2);
            light.position.set(320, 390, 700);
            scene.add(light);
            var light2 = new THREE.DirectionalLight(0xFFFFFF, 0.2);
            light2.position.set(-720, -190, -300);
            scene.add(light2);
            scene.add(_this._headLight);
            scene.add(_this._mesh);
            return scene;
        })();
        this._renderer = (function () {
            var renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setClearColor(0xAAAAAA, 1.0);
            return renderer;
        })();
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
        this._drawingTextureMesh = new THREE.Mesh();
        this._drawingTextureScene = (function () {
            var scene = new THREE.Scene();
            scene.add(new THREE.AmbientLight(0xFFFFFF));
            scene.add(_this._drawingTextureMesh);
            return scene;
        })();
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
            _this.update();
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
        this._geometry = geometry.clone();
        if (!canvas) {
            canvas = document.createElement('canvas');
        }
        this.canvas = canvas;
        this.canvas.addEventListener('contextmenu', function (e) { return e.preventDefault(); }, false);
        this.canvas.addEventListener('mousedown', this._mousedown, false);
        this.canvas.addEventListener('mousewheel', this._mousewheel, false);
        this.canvas.addEventListener('DOMMouseScroll', this._mousewheel, false); // firefox
        this._projectedVertices = [];
        for (var i = 0; i < this._geometry.vertices.length; i += 1) {
            this._projectedVertices.push(new THREE.Vector3());
        }
        this._nAffectedFaces = 0;
        this._affectedFaces = new Uint32Array(this._mesh.geometry.faces.length);
        var initializeViewingTexture = function () {
            var singlePixelCanvas = document.createElement('canvas');
            singlePixelCanvas.width = singlePixelCanvas.height = 1;
            var context = singlePixelCanvas.getContext('2d');
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, 1, 1);
            var lambertMaterial = new THREE.MeshLambertMaterial({ map: new THREE.Texture(singlePixelCanvas) });
            lambertMaterial.map.needsUpdate = true;
            _this._viewingMaterial = new THREE.MeshFaceMaterial([
                lambertMaterial
            ]);
            _this._viewingTextureUvs = [];
            var faces = _this._geometry.faces;
            for (var i = 0; i < faces.length; i += 1) {
                faces[i].materialIndex = 0;
                _this._viewingTextureUvs.push([
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.5, 0.5)
                ]);
            }
        };
        initializeViewingTexture();
        var initializeDrawingTexture = function () {
            _this._drawingMaterial = new THREE.MeshLambertMaterial();
            _this._drawingTextureUvs = [];
            var faces = _this._mesh.geometry.faces;
            for (var i = 0; i < faces.length; i += 1) {
                faces[i].materialIndex = 0;
                _this._drawingTextureUvs.push([
                    new THREE.Vector2(),
                    new THREE.Vector2(),
                    new THREE.Vector2()
                ]);
            }
        };
        initializeDrawingTexture();
        this._mesh.geometry = this._geometry;
        this._mesh.material = this._viewingMaterial;
        this._mesh.geometry.faceVertexUvs[0] = this._viewingTextureUvs;
        this._mesh.geometry.uvsNeedUpdate = true;
        this._usingViewingTexture = true;
        this.handleResize();
        this.update();
    }
    Chameleon._showCanvasInNewWindow = function (canvas) {
        var dataURL = canvas.toDataURL("image/png");
        var newWindow = window.open();
        newWindow.document.write('<img style="border:1px solid black" src="' + dataURL + '"/>');
    };
    Chameleon.prototype.handleResize = function () {
        this._renderer.setSize(this.canvas.width, this.canvas.height);
        this._camera.aspect = this.canvas.width / this.canvas.height;
        this._camera.updateProjectionMatrix();
        var box = this.canvas.getBoundingClientRect();
        var d = this.canvas.ownerDocument.documentElement;
        this.screen.left = box.left + window.pageXOffset - d.clientLeft;
        this.screen.top = box.top + window.pageYOffset - d.clientTop;
        this.screen.width = box.width;
        this.screen.height = box.height;
        this._useViewingTexture();
    };
    Chameleon.prototype.zoomCamera = function () {
        var factor = 1.0 + (this._zoomEnd - this._zoomStart) * this.zoomSpeed;
        if (factor !== 1.0 && factor > 0.0) {
            this._eye.multiplyScalar(factor);
            this._zoomStart = this._zoomEnd;
        }
    };
    Chameleon.prototype.update = function () {
        this._eye.subVectors(this._camera.position, this.target);
        this.rotateCamera();
        this.zoomCamera();
        this.panCamera();
        this._camera.position.addVectors(this.target, this._eye);
        this._camera.lookAt(this.target);
        this._headLight.position.copy(this._camera.position);
        this._renderer.render(this._scene, this._camera);
        this.canvas.getContext('2d').drawImage(this._renderer.domElement, 0, 0);
    };
    Chameleon.prototype._useViewingTexture = function () {
        // If already using the viewing texture, do nothing
        if (this._usingViewingTexture) {
            return;
        }
        // TODO update viewing texture from drawing texture
        console.log('Preparing viewing texture...');
        this._mesh.material = this._viewingMaterial;
        this._mesh.geometry.faceVertexUvs[0] = this._viewingTextureUvs;
        this._mesh.geometry.uvsNeedUpdate = true;
        this._usingViewingTexture = true;
    };
    Chameleon.prototype._useDrawingTexture = function () {
        // If already using the drawing texture, do nothing
        if (!this._usingViewingTexture) {
            return;
        }
        // TODO render and apply drawing texture...
        console.log('Preparing drawing texture...');
        this._drawingTextureMesh.geometry = this._mesh.geometry.clone();
        this._drawingTextureMesh.material = this._viewingMaterial.clone();
        this._renderer.render(this._drawingTextureScene, this._camera);
        this._mesh.material = this._drawingMaterial;
        this._mesh.geometry.faceVertexUvs[0] = this._drawingTextureUvs;
        this._mesh.geometry.uvsNeedUpdate = true;
        this._usingViewingTexture = false;
    };
    return Chameleon;
})();
/// <reference path="./three.d.ts" />
/// <reference path="./dat.gui.d.ts" />
/// <reference path="./chameleon.ts" />
(function () {
    function getGeometry() {
        return new THREE.CylinderGeometry(1, 1, 2);
    }
    var chameleon = new Chameleon(getGeometry());
    document.body.appendChild(chameleon.canvas);
    var onresize = function () {
        chameleon.canvas.height = window.innerHeight;
        chameleon.canvas.width = window.innerWidth;
        chameleon.handleResize();
    };
    onresize();
    window.addEventListener('resize', onresize, false);
    // Render loop
    var render = function () {
        chameleon.update();
        requestAnimationFrame(render);
    };
    render();
})();
