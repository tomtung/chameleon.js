var Chameleon;
(function (Chameleon) {
    var CAMERA_NEAR = 0.5;
    function create(geometry, canvas) {
        return new Controls(geometry, canvas);
    }
    Chameleon.create = create;
    var mousePositionInCanvas = (function () {
        var vector = new THREE.Vector2();
        return function (event, canvasBox, normalize) {
            if (normalize === void 0) { normalize = false; }
            vector.set(event.pageX - canvasBox.left, event.pageY - canvasBox.top);
            if (normalize) {
                vector.x /= canvasBox.width;
                vector.y /= canvasBox.height;
            }
            return vector;
        };
    })();
    var CameraControlsState;
    (function (CameraControlsState) {
        CameraControlsState[CameraControlsState["Idle"] = 0] = "Idle";
        CameraControlsState[CameraControlsState["Pan"] = 1] = "Pan";
        CameraControlsState[CameraControlsState["Rotate"] = 2] = "Rotate";
    })(CameraControlsState || (CameraControlsState = {}));
    /**
     * A simplification of THREE.TrackballControls from the three.js examples
     */
    var PerspectiveCameraControls = (function () {
        function PerspectiveCameraControls(camera, canvasBox) {
            var _this = this;
            this.camera = camera;
            this.canvasBox = canvasBox;
            this.rotateSpeed = 1.5;
            this.zoomSpeed = 1.2;
            this.panSpeed = 0.8;
            this._state = 0 /* Idle */;
            this._eye = new THREE.Vector3();
            this._target = new THREE.Vector3();
            this._rotateStart = new THREE.Vector3();
            this._rotateEnd = new THREE.Vector3();
            this._zoomStart = 0;
            this._zoomEnd = 0;
            this._panStart = new THREE.Vector2();
            this._panEnd = new THREE.Vector2();
            this._getMouseProjectionOnBall = (function () {
                var vector = new THREE.Vector3();
                var objectUp = new THREE.Vector3();
                var mouseOnBall = new THREE.Vector3();
                return function (event) {
                    mouseOnBall.set((event.pageX - _this.canvasBox.width * 0.5 - _this.canvasBox.left) / (_this.canvasBox.width * .5), (_this.canvasBox.height * 0.5 + _this.canvasBox.top - event.pageY) / (_this.canvasBox.height * .5), 0.0);
                    var length = mouseOnBall.length();
                    if (length > 1.0) {
                        mouseOnBall.normalize();
                    }
                    else {
                        mouseOnBall.z = Math.sqrt(1.0 - length * length);
                    }
                    _this._eye.subVectors(_this.camera.position, _this._target);
                    vector.copy(_this.camera.up).setLength(mouseOnBall.y);
                    vector.add(objectUp.copy(_this.camera.up).cross(_this._eye).setLength(mouseOnBall.x));
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
                        _this.camera.up.applyQuaternion(quaternion);
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
                        pan.crossVectors(_this._eye, _this.camera.up).setLength(mouseChange.x).add(objectUp.copy(_this.camera.up).setLength(mouseChange.y));
                        _this.camera.position.add(pan);
                        _this._target.add(pan);
                        _this._panStart.copy(_this._panEnd);
                    }
                };
            })();
            this.onMouseDown = function (event) {
                switch (event.button) {
                    case 0:
                        _this._state = 2 /* Rotate */;
                        _this._rotateStart.copy(_this._getMouseProjectionOnBall(event));
                        _this._rotateEnd.copy(_this._rotateStart);
                        break;
                    case 2:
                        _this._state = 1 /* Pan */;
                        _this._panStart.copy(_this._getMousePositionInCanvas(event));
                        _this._panEnd.copy(_this._panStart);
                        break;
                    default:
                        debugger;
                }
            };
            this.onMouseMove = function (event) {
                switch (_this._state) {
                    case 2 /* Rotate */:
                        _this._rotateEnd.copy(_this._getMouseProjectionOnBall(event));
                        break;
                    case 1 /* Pan */:
                        _this._panEnd.copy(_this._getMousePositionInCanvas(event));
                        break;
                    default:
                        debugger;
                }
            };
            this.onMouseUp = function (event) {
                _this._state = 0 /* Idle */;
            };
            this.onMouseWheel = function (event) {
                var delta = 0;
                if (event.wheelDelta) {
                    delta = event.wheelDelta / 40;
                }
                else if (event.detail) {
                    delta = -event.detail / 3;
                }
                _this._zoomStart += delta * 0.01;
            };
        }
        PerspectiveCameraControls.prototype._getMousePositionInCanvas = function (event) {
            return mousePositionInCanvas(event, this.canvasBox, true);
        };
        PerspectiveCameraControls.prototype.zoomCamera = function () {
            var factor = 1.0 + (this._zoomEnd - this._zoomStart) * this.zoomSpeed;
            if (factor !== 1.0 && factor > 0.0) {
                this._eye.multiplyScalar(factor);
                this._zoomStart = this._zoomEnd;
            }
        };
        PerspectiveCameraControls.prototype.updateCamera = function () {
            this._eye.subVectors(this.camera.position, this._target);
            this.rotateCamera();
            this.zoomCamera();
            this.panCamera();
            this.camera.position.addVectors(this._target, this._eye);
            this.camera.lookAt(this._target);
        };
        return PerspectiveCameraControls;
    })();
    var ControlsState;
    (function (ControlsState) {
        ControlsState[ControlsState["Idle"] = 0] = "Idle";
        ControlsState[ControlsState["Draw"] = 1] = "Draw";
        ControlsState[ControlsState["View"] = 2] = "View";
    })(ControlsState || (ControlsState = {}));
    function showCanvasInNewWindow(canvas) {
        var dataURL = canvas.toDataURL("image/png");
        var newWindow = window.open();
        newWindow.document.write('<img style="border:1px solid black" src="' + dataURL + '"/>');
    }
    var AffectedFacesRecorder = (function () {
        function AffectedFacesRecorder(nFaces) {
            this._nAffectedFaces = 0;
            this._affectedFaces = new Uint32Array(nFaces);
            this._isFaceAffected = new Uint8Array(nFaces);
            this._isFaceAffectedEmpty = new Uint8Array(nFaces);
        }
        AffectedFacesRecorder.prototype.add = function (faceIndex) {
            if (!this._isFaceAffected[faceIndex]) {
                this._isFaceAffected[faceIndex] = 1;
                this._affectedFaces[this._nAffectedFaces] = faceIndex;
                this._nAffectedFaces += 1;
            }
        };
        AffectedFacesRecorder.prototype.reset = function () {
            this._nAffectedFaces = 0;
            this._isFaceAffected.set(this._isFaceAffectedEmpty);
        };
        AffectedFacesRecorder.prototype.forEach = function (f) {
            for (var i = 0; i < this._nAffectedFaces; i += 1) {
                f(this._affectedFaces[i]);
            }
        };
        Object.defineProperty(AffectedFacesRecorder.prototype, "length", {
            get: function () {
                return this._nAffectedFaces;
            },
            enumerable: true,
            configurable: true
        });
        AffectedFacesRecorder.prototype.contains = function (faceIndex) {
            return !!this._isFaceAffected[faceIndex];
        };
        return AffectedFacesRecorder;
    })();
    /**
     * Manages both the viewing texture and the drawing texture
     */
    var TextureManager = (function () {
        // Assumption on geometry: material indices are same to face indices.
        // This special treatment is implemented in the constructor of Controls
        function TextureManager(geometry, renderer, camera) {
            this.geometry = geometry;
            this.renderer = renderer;
            this.camera = camera;
            this._affectedFaces = new AffectedFacesRecorder(this.geometry.faces.length);
            this.initializeViewingTexture().initializeDrawingTexture();
        }
        Object.defineProperty(TextureManager.prototype, "drawingContext", {
            get: function () {
                return this._drawingCanvas.getContext('2d');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureManager.prototype, "drawingCanvas", {
            get: function () {
                return this._drawingCanvas;
            },
            enumerable: true,
            configurable: true
        });
        TextureManager.prototype.initializeViewingTexture = function () {
            var singlePixelCanvas = document.createElement('canvas');
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
                var lambertMaterial = new THREE.MeshLambertMaterial({ map: new THREE.Texture(singlePixelCanvas) });
                lambertMaterial.map.needsUpdate = true;
                this._viewingMaterial.materials.push(lambertMaterial);
            }
            return this;
        };
        // Depends on the initialization of viewing texture
        TextureManager.prototype.initializeDrawingTexture = function () {
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
        };
        TextureManager.prototype.prepareViewingTexture = function () {
            var _this = this;
            if (this._affectedFaces.length > 0) {
                var uMax = Number.NEGATIVE_INFINITY, uMin = Number.POSITIVE_INFINITY, vMax = Number.NEGATIVE_INFINITY, vMin = Number.POSITIVE_INFINITY;
                this._affectedFaces.forEach(function (faceIndex) {
                    var drawingUvs = _this._drawingTextureUvs[faceIndex];
                    uMax = Math.max(uMax, drawingUvs[0].x, drawingUvs[1].x, drawingUvs[2].x);
                    uMin = Math.min(uMin, drawingUvs[0].x, drawingUvs[1].x, drawingUvs[2].x);
                    vMax = Math.max(vMax, drawingUvs[0].y, drawingUvs[1].y, drawingUvs[2].y);
                    vMin = Math.min(vMin, drawingUvs[0].y, drawingUvs[1].y, drawingUvs[2].y);
                });
                var xMax = uMax * this._drawingCanvas.width, xMin = uMin * this._drawingCanvas.width, yMax = (1 - vMin) * this._drawingCanvas.height, yMin = (1 - vMax) * this._drawingCanvas.height;
                this.drawingContext.rect(xMin, yMin, xMax, yMax);
                this.drawingContext.clip();
                var patchCanvas = document.createElement('canvas');
                patchCanvas.width = xMax - xMin;
                patchCanvas.height = yMax - yMin;
                patchCanvas.getContext('2d').drawImage(this._drawingCanvas, xMin, yMin, patchCanvas.width, patchCanvas.height, 0, 0, patchCanvas.width, patchCanvas.height);
                this._affectedFaces.forEach(function (faceIndex) {
                    var faceMaterial = _this._viewingMaterial.materials[faceIndex];
                    faceMaterial.map.image = patchCanvas;
                    faceMaterial.map.needsUpdate = true;
                    var drawingUvs = _this._drawingTextureUvs[faceIndex];
                    var viewingUvs = _this._viewingTextureUvs[faceIndex];
                    for (var j = 0; j < 3; j += 1) {
                        var drawingUV = drawingUvs[j];
                        viewingUvs[j].setX((drawingUV.x - uMin) * (_this._drawingCanvas.width) / patchCanvas.width).setY((drawingUV.y - vMin) * (_this._drawingCanvas.height) / patchCanvas.height);
                    }
                });
                this._affectedFaces.reset();
            }
            return this;
        };
        TextureManager.prototype.applyViewingTexture = function (mesh) {
            mesh.material = this._viewingMaterial;
            mesh.geometry.faceVertexUvs[0] = this._viewingTextureUvs;
            mesh.geometry.uvsNeedUpdate = true;
            return this;
        };
        TextureManager.prototype.prepareDrawingTexture = function () {
            this.renderer.render(this._drawingTextureScene, this.camera);
            this._drawingCanvas.width = this.renderer.domElement.width;
            this._drawingCanvas.height = this.renderer.domElement.height;
            this.drawingContext.drawImage(this.renderer.domElement, 0, 0);
            this._drawingMaterial.map.needsUpdate = true;
            var projectedPosition = new THREE.Vector3();
            for (var i = 0; i < this.geometry.vertices.length; i += 1) {
                projectedPosition.copy(this.geometry.vertices[i]).project(this.camera);
                this._drawingVertexUvs[i].setX((projectedPosition.x + 1) / 2).setY((projectedPosition.y + 1) / 2);
            }
            for (var i = 0; i < this.geometry.faces.length; i += 1) {
                this._drawingTextureUvs[i][0].copy(this._drawingVertexUvs[this.geometry.faces[i].a]);
                this._drawingTextureUvs[i][1].copy(this._drawingVertexUvs[this.geometry.faces[i].b]);
                this._drawingTextureUvs[i][2].copy(this._drawingVertexUvs[this.geometry.faces[i].c]);
            }
            return this;
        };
        TextureManager.prototype.applyDrawingTexture = function (mesh) {
            mesh.material = this._drawingMaterial;
            mesh.geometry.faceVertexUvs[0] = this._drawingTextureUvs;
            mesh.geometry.uvsNeedUpdate = true;
            return this;
        };
        TextureManager.prototype._castRayFromMouse = function (canvasPos) {
            var mouse3d = new THREE.Vector3(canvasPos.x / this._drawingCanvas.width * 2 - 1, -canvasPos.y / this._drawingCanvas.height * 2 + 1, CAMERA_NEAR).unproject(this.camera).sub(this.camera.position).normalize();
            return new THREE.Raycaster(this.camera.position, mouse3d, CAMERA_NEAR).intersectObject(this._drawingTextureMesh);
        };
        TextureManager.prototype.onStrokePainted = function (canvasPos, radius) {
            var intersections = this._castRayFromMouse(canvasPos);
            if (intersections.length > 0) {
                this._drawingMaterial.map.needsUpdate = true;
                var faceIndex = intersections[0].face.materialIndex;
                this._affectedFaces.add(faceIndex);
            }
            return this;
        };
        return TextureManager;
    })();
    var Pencil = (function () {
        function Pencil() {
            this._canvasContext = null;
        }
        Object.defineProperty(Pencil.prototype, "radius", {
            get: function () {
                return 1;
            },
            enumerable: true,
            configurable: true
        });
        Pencil.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.moveTo(position.x, position.y);
        };
        Pencil.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        };
        Pencil.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return Pencil;
    })();
    Chameleon.Pencil = Pencil;
    var Controls = (function () {
        function Controls(geometry, canvas) {
            var _this = this;
            this._state = 0 /* Idle */;
            this._mesh = new THREE.Mesh();
            this.canvasBox = { left: 0, top: 0, width: 0, height: 0 };
            this._headLight = new THREE.PointLight(0xFFFFFF, 0.4);
            this._camera = (function () {
                var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, CAMERA_NEAR, 10000);
                camera.position.z = 5;
                return camera;
            })();
            this._cameraControls = new PerspectiveCameraControls(this._camera, this.canvasBox);
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
            this.brush = new Pencil();
            this._mousedown = function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (_this._state !== 0 /* Idle */) {
                    return;
                }
                // Hold shift key to rotate and pan
                if (event.shiftKey) {
                    _this._state = 2 /* View */;
                    _this._useViewingTexture();
                    _this._cameraControls.onMouseDown(event);
                }
                else {
                    _this._state = 1 /* Draw */;
                    _this._useDrawingTexture();
                    var pos = mousePositionInCanvas(event, _this.canvasBox);
                    _this.brush.startStroke(_this._textureManager.drawingCanvas, pos);
                    _this._textureManager.onStrokePainted(pos, _this.brush.radius);
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
                    case 2 /* View */:
                        _this._cameraControls.onMouseMove(event);
                        break;
                    case 1 /* Draw */:
                        var pos = mousePositionInCanvas(event, _this.canvasBox);
                        _this.brush.continueStoke(pos);
                        _this._textureManager.onStrokePainted(pos, _this.brush.radius);
                        break;
                    default:
                        debugger;
                }
            };
            this._mouseup = function (event) {
                event.preventDefault();
                event.stopPropagation();
                _this.brush.finishStroke();
                _this.update();
                _this._cameraControls.onMouseUp(event);
                _this._state = 0 /* Idle */;
                document.removeEventListener('mousemove', _this._mousemove);
                document.removeEventListener('mouseup', _this._mouseup);
            };
            this._mousewheel = function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (_this._state === 1 /* Draw */ || !event.shiftKey) {
                    return;
                }
                _this._useViewingTexture();
                _this._cameraControls.onMouseWheel(event);
            };
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
            this.canvas.addEventListener('contextmenu', function (e) { return e.preventDefault(); }, false);
            this.canvas.addEventListener('mousedown', this._mousedown, false);
            this.canvas.addEventListener('mousewheel', this._mousewheel, false);
            this.canvas.addEventListener('DOMMouseScroll', this._mousewheel, false); // firefox
            this.handleResize();
            this.update();
        }
        Controls.prototype.updateCanvasBox = function () {
            var canvasRect = this.canvas.getBoundingClientRect();
            var docElement = this.canvas.ownerDocument.documentElement;
            this.canvasBox.left = canvasRect.left + window.pageXOffset - docElement.clientLeft;
            this.canvasBox.top = canvasRect.top + window.pageYOffset - docElement.clientTop;
            this.canvasBox.width = canvasRect.width;
            this.canvasBox.height = canvasRect.height;
        };
        Controls.prototype.handleResize = function () {
            this._renderer.setSize(this.canvas.width, this.canvas.height);
            this._camera.aspect = this.canvas.width / this.canvas.height;
            this._camera.updateProjectionMatrix();
            this.updateCanvasBox();
            this._useViewingTexture();
        };
        Controls.prototype.update = function () {
            this._cameraControls.updateCamera();
            this._headLight.position.copy(this._camera.position);
            this._renderer.render(this._scene, this._camera);
            this.canvas.getContext('2d').drawImage(this._renderer.domElement, 0, 0);
        };
        Controls.prototype._useViewingTexture = function () {
            // If already using the viewing texture, do nothing
            if (this._usingViewingTexture) {
                return;
            }
            this._textureManager.prepareViewingTexture().applyViewingTexture(this._mesh);
            this._usingViewingTexture = true;
        };
        Controls.prototype._useDrawingTexture = function () {
            // If already using the drawing texture, do nothing
            if (!this._usingViewingTexture) {
                return;
            }
            this._textureManager.prepareDrawingTexture().applyDrawingTexture(this._mesh);
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
    function getGeometry() {
        return new THREE.CylinderGeometry(1, 1, 2);
    }
    var chameleon = Chameleon.create(getGeometry());
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
