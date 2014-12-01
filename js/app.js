/// <reference path="../three.d.ts" />
var Chameleon;
(function (Chameleon) {
    function mousePositionInCanvas(event, canvasBox) {
        return new THREE.Vector2(event.pageX - canvasBox.left, event.pageY - canvasBox.top);
    }
    Chameleon.mousePositionInCanvas = mousePositionInCanvas;
    function showCanvasInNewWindow(canvas) {
        var dataURL = canvas.toDataURL("image/png");
        var newWindow = window.open();
        newWindow.document.write('<img style="border:1px solid black" src="' + dataURL + '"/>');
    }
    Chameleon.showCanvasInNewWindow = showCanvasInNewWindow;
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    Chameleon.getRandomInt = getRandomInt;
    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    Chameleon.getRandomFloat = getRandomFloat;
    function angleBetween(point1, point2) {
        return Math.atan2(point2.x - point1.x, point2.y - point1.y);
    }
    Chameleon.angleBetween = angleBetween;
})(Chameleon || (Chameleon = {}));
/// <reference path="./common.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Chameleon;
(function (Chameleon) {
    var mouseProjectionOnBall = (function () {
        var projGlobal = new THREE.Vector3(), projLocal = new THREE.Vector3();
        var upFactor = new THREE.Vector3(), eyeFactor = new THREE.Vector3(), sideFactor = new THREE.Vector3();
        return function (event, canvasBox, up, eye) {
            projLocal.set((event.pageX - canvasBox.width * 0.5 - canvasBox.left) / (canvasBox.width * .5), (canvasBox.height * 0.5 + canvasBox.top - event.pageY) / (canvasBox.height * .5), 0.0);
            var lengthSq = projLocal.lengthSq();
            if (lengthSq > 1.0) {
                projLocal.normalize();
            }
            else {
                projLocal.z = Math.sqrt(1.0 - lengthSq);
            }
            sideFactor.copy(up).cross(eye).setLength(projLocal.x);
            upFactor.copy(up).setLength(projLocal.y);
            eyeFactor.copy(eye).setLength(projLocal.z);
            return projGlobal.copy(sideFactor).add(upFactor).add(eyeFactor);
        };
    })();
    (function (CameraControlsState) {
        CameraControlsState[CameraControlsState["Idle"] = 0] = "Idle";
        CameraControlsState[CameraControlsState["Pan"] = 1] = "Pan";
        CameraControlsState[CameraControlsState["Rotate"] = 2] = "Rotate";
    })(Chameleon.CameraControlsState || (Chameleon.CameraControlsState = {}));
    var CameraControlsState = Chameleon.CameraControlsState;
    var CameraControlsBase = (function () {
        function CameraControlsBase(camera, canvasBox) {
            var _this = this;
            this.camera = camera;
            this.canvasBox = canvasBox;
            this.rotateSpeed = 1.5;
            this.panSpeed = 0.8;
            this.zoomSpeed = 1.2;
            this._state = 0 /* Idle */;
            this._eye = new THREE.Vector3();
            this.target = new THREE.Vector3();
            this._rotateStart = new THREE.Vector3();
            this._rotateEnd = new THREE.Vector3();
            this._zoomStart = 0;
            this._zoomEnd = 0;
            this._panStart = new THREE.Vector2();
            this._panEnd = new THREE.Vector2();
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
                var mouseChange = new THREE.Vector2(), cameraUp = new THREE.Vector3(), pan = new THREE.Vector3();
                return function () {
                    mouseChange.subVectors(_this._panEnd, _this._panStart);
                    if (mouseChange.lengthSq()) {
                        mouseChange.multiplyScalar(_this._eye.length() * _this.panSpeed);
                        pan.crossVectors(_this._eye, _this.camera.up).setLength(mouseChange.x).add(cameraUp.copy(_this.camera.up).setLength(mouseChange.y));
                        _this.camera.position.add(pan);
                        _this.target.add(pan);
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
        CameraControlsBase.prototype._getMousePositionInCanvas = function (event) {
            var pos = Chameleon.mousePositionInCanvas(event, this.canvasBox);
            pos.x /= this.canvasBox.width;
            pos.y /= this.canvasBox.height;
            return pos;
        };
        CameraControlsBase.prototype._getMouseProjectionOnBall = function (event) {
            return mouseProjectionOnBall(event, this.canvasBox, this.camera.up, this._eye);
        };
        CameraControlsBase.prototype.zoomCamera = function () {
            var factor = 1.0 + (this._zoomEnd - this._zoomStart) * this.zoomSpeed;
            if (factor !== 1.0 && factor > 0.0) {
                this.camera.zoom *= factor;
                this._zoomStart = this._zoomEnd;
                this.camera.updateProjectionMatrix();
            }
        };
        CameraControlsBase.prototype.updateCamera = function () {
            this._eye.subVectors(this.camera.position, this.target);
            this.rotateCamera();
            this.zoomCamera();
            this.panCamera();
            this.camera.position.addVectors(this.target, this._eye);
            this.camera.lookAt(this.target);
        };
        return CameraControlsBase;
    })();
    Chameleon.CameraControlsBase = CameraControlsBase;
    /**
     * A simplification of THREE.TrackballControls from the three.js examples
     */
    var PerspectiveCameraControls = (function (_super) {
        __extends(PerspectiveCameraControls, _super);
        function PerspectiveCameraControls(camera, canvasBox) {
            _super.call(this, camera, canvasBox);
            this.camera = camera;
            this.canvasBox = canvasBox;
        }
        PerspectiveCameraControls.prototype.handleResize = function () {
            this.camera.aspect = this.canvasBox.width / this.canvasBox.height;
            this.camera.updateProjectionMatrix();
        };
        return PerspectiveCameraControls;
    })(CameraControlsBase);
    Chameleon.PerspectiveCameraControls = PerspectiveCameraControls;
    /**
     * A simplification of THREE.OrthographicTrackballControls from the three.js examples
     */
    var OrthographicCameraControls = (function (_super) {
        __extends(OrthographicCameraControls, _super);
        function OrthographicCameraControls(camera, canvasBox) {
            _super.call(this, camera, canvasBox);
            this.camera = camera;
            this.canvasBox = canvasBox;
            this._center0 = new THREE.Vector2((camera.left + camera.right) / 2, (camera.top + camera.bottom) / 2);
            this._viewSize = camera.top - camera.bottom;
            this.handleResize();
        }
        OrthographicCameraControls.prototype.handleResize = function () {
            this.camera.top = this._center0.y + this._viewSize / 2;
            this.camera.bottom = this._center0.y - this._viewSize / 2;
            var ratio = this.canvasBox.width / this.canvasBox.height;
            this.camera.left = this._center0.x - this._viewSize / 2 * ratio;
            this.camera.right = this._center0.x + this._viewSize / 2 * ratio;
            this.camera.updateProjectionMatrix();
        };
        return OrthographicCameraControls;
    })(CameraControlsBase);
    Chameleon.OrthographicCameraControls = OrthographicCameraControls;
})(Chameleon || (Chameleon = {}));
/// <reference path="./common.ts" />
var Chameleon;
(function (Chameleon) {
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
            this._backgroundSinglePixelCanvas = document.createElement('canvas');
            this.backgroundColor = '#FFFFFF';
            this._affectedFaces = new AffectedFacesRecorder(this.geometry.faces.length);
            this.initializeViewingTexture().initializeDrawingTexture();
            this._isFloodFillEmpty = new Uint8Array(this.geometry.faces.length);
            this._isFloodFill = new Uint8Array(this.geometry.faces.length);
            this._nAdjacentFaces = new Uint8Array(this.geometry.faces.length);
            this._AdjacentFacesList = new Array(this.geometry.faces.length);
            for (var i = 0; i < this.geometry.faces.length; i += 1) {
                this._AdjacentFacesList[i] = new Uint32Array(10);
            }
            for (var i = 0; i < this.geometry.faces.length - 1; i += 1) {
                for (var j = i + 1; j < this.geometry.faces.length; j += 1) {
                    var vi = [this.geometry.faces[i].a, this.geometry.faces[i].b, this.geometry.faces[i].c];
                    var vj = [this.geometry.faces[j].a, this.geometry.faces[j].b, this.geometry.faces[j].c];
                    var count = 0;
                    var EPSILON = 1e-3;
                    for (var k = 0; k < 3; k++)
                        for (var l = 0; l < 3; l++)
                            if (this.geometry.vertices[vi[k]].x - this.geometry.vertices[vj[l]].x < EPSILON && this.geometry.vertices[vi[k]].x - this.geometry.vertices[vj[l]].x > -EPSILON && this.geometry.vertices[vi[k]].y - this.geometry.vertices[vj[l]].y < EPSILON && this.geometry.vertices[vi[k]].y - this.geometry.vertices[vj[l]].y > -EPSILON && this.geometry.vertices[vi[k]].z - this.geometry.vertices[vj[l]].z < EPSILON && this.geometry.vertices[vi[k]].z - this.geometry.vertices[vj[l]].z > -EPSILON && this.geometry.faces[i].normal.dot(this.geometry.faces[j].normal) > EPSILON)
                                count++;
                    if (count == 2) {
                        this._AdjacentFacesList[i][this._nAdjacentFaces[i]] = j;
                        this._AdjacentFacesList[j][this._nAdjacentFaces[j]] = i;
                        this._nAdjacentFaces[i] += 1;
                        this._nAdjacentFaces[j] += 1;
                    }
                }
            }
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
        TextureManager.prototype.backgroundReset = function () {
            var context = this._backgroundSinglePixelCanvas.getContext('2d');
            context.beginPath();
            context.fillStyle = this.backgroundColor;
            context.fillRect(0, 0, 1, 1);
            for (var i = 0; i < this.geometry.faces.length; i += 1) {
                var faceMaterial = this._viewingMaterial.materials[i];
                faceMaterial.map.image = this._backgroundSinglePixelCanvas;
                faceMaterial.map.needsUpdate = true;
                for (var j = 0; j < this._viewingTextureUvs[i].length; j += 1) {
                    this._viewingTextureUvs[i][j].set(0.5, 0.5);
                }
            }
        };
        TextureManager.prototype.initializeViewingTexture = function () {
            this._backgroundSinglePixelCanvas.width = this._backgroundSinglePixelCanvas.height = 1;
            var context = this._backgroundSinglePixelCanvas.getContext('2d');
            context.beginPath();
            context.fillStyle = this.backgroundColor;
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
                var lambertMaterial = new THREE.MeshLambertMaterial({
                    map: new THREE.Texture(this._backgroundSinglePixelCanvas),
                    transparent: true
                });
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
                map: new THREE.Texture(this._drawingCanvas),
                transparent: true
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
            // Assumption: when renderer is created, 'alpha' must be set to true
            var originalClearAlpha = this.renderer.getClearAlpha();
            var originalClearColor = this.renderer.getClearColor().clone();
            this.renderer.setClearColor(0, 0);
            this.renderer.render(this._drawingTextureScene, this.camera);
            this._drawingCanvas.width = this.renderer.domElement.width;
            this._drawingCanvas.height = this.renderer.domElement.height;
            this.drawingContext.drawImage(this.renderer.domElement, -2, 0);
            this.drawingContext.drawImage(this.renderer.domElement, 2, 0);
            this.drawingContext.drawImage(this.renderer.domElement, 0, -2);
            this.drawingContext.drawImage(this.renderer.domElement, 0, 2);
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
            this.renderer.setClearColor(originalClearColor, originalClearAlpha);
            return this;
        };
        TextureManager.prototype.applyDrawingTexture = function (mesh) {
            mesh.material = this._drawingMaterial;
            mesh.geometry.faceVertexUvs[0] = this._drawingTextureUvs;
            mesh.geometry.uvsNeedUpdate = true;
            return this;
        };
        TextureManager.prototype._castRayFromMouse = function (canvasPos) {
            var mouse3d = new THREE.Vector3(canvasPos.x / this._drawingCanvas.width * 2 - 1, -canvasPos.y / this._drawingCanvas.height * 2 + 1, -1.0);
            var direction = new THREE.Vector3(mouse3d.x, mouse3d.y, 1.0);
            mouse3d.unproject(this.camera);
            direction.unproject(this.camera).sub(mouse3d).normalize();
            return new THREE.Raycaster(mouse3d, direction).intersectObject(this._drawingTextureMesh);
        };
        TextureManager.prototype._pointCircleCollide = function (point, circle, r) {
            if (r === 0)
                return false;
            var dx = circle.x - point.x;
            var dy = circle.y - point.y;
            return dx * dx + dy * dy <= r * r;
        };
        TextureManager.prototype._lineCircleCollide = function (a, b, circle, radius) {
            //check to see if start or end points lie within circle 
            if (this._pointCircleCollide(a, circle, radius)) {
                return true;
            }
            if (this._pointCircleCollide(b, circle, radius)) {
                return true;
            }
            var x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y, cx = circle.x, cy = circle.y;
            var c1x = cx - x1;
            var c1y = cy - y1;
            var e1x = x2 - x1;
            var e1y = y2 - y1;
            var k = c1x * e1x + c1y * e1y;
            if (k > 0) {
                var len = Math.sqrt(e1x * e1x + e1y * e1y);
                k = k / len;
                if (k < len) {
                    if (c1x * c1x + c1y * c1y - k * k <= radius * radius)
                        return true;
                }
            }
            return false;
        };
        TextureManager.prototype._pointInTriangle = function (point, t0, t1, t2) {
            //compute vectors & dot products
            var cx = point.x, cy = point.y, v0x = t2.x - t0.x, v0y = t2.y - t0.y, v1x = t1.x - t0.x, v1y = t1.y - t0.y, v2x = cx - t0.x, v2y = cy - t0.y, dot00 = v0x * v0x + v0y * v0y, dot01 = v0x * v1x + v0y * v1y, dot02 = v0x * v2x + v0y * v2y, dot11 = v1x * v1x + v1y * v1y, dot12 = v1x * v2x + v1y * v2y;
            // Compute barycentric coordinates
            var b = (dot00 * dot11 - dot01 * dot01), inv = b === 0 ? 0 : (1 / b), u = (dot11 * dot02 - dot01 * dot12) * inv, v = (dot00 * dot12 - dot01 * dot02) * inv;
            return u >= 0 && v >= 0 && (u + v <= 1);
        };
        TextureManager.prototype._add_recursive = function (faceIndex, center, radius) {
            if (faceIndex >= 0 && !this._isFloodFill[faceIndex]) {
                var v1 = new THREE.Vector2();
                v1.copy(this._drawingTextureUvs[faceIndex][0]);
                var v2 = new THREE.Vector2();
                v2.copy(this._drawingTextureUvs[faceIndex][1]);
                var v3 = new THREE.Vector2();
                v3.copy(this._drawingTextureUvs[faceIndex][2]);
                v1.x = v1.x * this._drawingCanvas.width;
                v1.y = (1 - v1.y) * this._drawingCanvas.height;
                v2.x = v2.x * this._drawingCanvas.width;
                v2.y = (1 - v2.y) * this._drawingCanvas.height;
                v3.x = v3.x * this._drawingCanvas.width;
                v3.y = (1 - v3.y) * this._drawingCanvas.height;
                var inside = this._pointInTriangle(center, v1, v2, v3);
                var collide1 = this._lineCircleCollide(v1, v2, center, radius);
                var collide2 = this._lineCircleCollide(v2, v3, center, radius);
                var collide3 = this._lineCircleCollide(v3, v1, center, radius);
                if (inside || collide1 || collide2 || collide3) {
                    this._isFloodFill[faceIndex] = 1;
                    this._affectedFaces.add(faceIndex);
                    for (var i = 0; i < this._nAdjacentFaces[faceIndex]; i += 1) {
                        var newfaceIndex = this._AdjacentFacesList[faceIndex][i];
                        var cameradirection = new THREE.Vector3();
                        cameradirection.copy(this.camera.position);
                        cameradirection.normalize();
                        if (this.geometry.faces[newfaceIndex].normal.dot(cameradirection) > 0) {
                            this._add_recursive(newfaceIndex, center, radius);
                        }
                    }
                }
            }
        };
        TextureManager.prototype.onStrokePainted = function (canvasPos, radius) {
            var intersections = this._castRayFromMouse(canvasPos);
            if (intersections.length > 0) {
                this._drawingMaterial.map.needsUpdate = true;
                var faceIndex = intersections[0].face.materialIndex;
                this._isFloodFill.set(this._isFloodFillEmpty);
                this._add_recursive(faceIndex, canvasPos, radius);
            }
            return this;
        };
        return TextureManager;
    })();
    Chameleon.TextureManager = TextureManager;
})(Chameleon || (Chameleon = {}));
/// <reference path="./common.ts" />
var Chameleon;
(function (Chameleon) {
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
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.lineWidth = this.radius * 2;
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
    var MarkerBrush = (function () {
        function MarkerBrush(radius, color) {
            this.radius = radius;
            this.color = color;
            this._canvasContext = null;
        }
        MarkerBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.lineWidth = this.radius * 2;
            this._canvasContext.strokeStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.moveTo(position.x, position.y);
        };
        MarkerBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        };
        MarkerBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return MarkerBrush;
    })();
    Chameleon.MarkerBrush = MarkerBrush;
    var BlurryMarkerBrush = (function () {
        function BlurryMarkerBrush(radius, color) {
            this.radius = radius;
            this.color = color;
            this._canvasContext = null;
        }
        BlurryMarkerBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.lineWidth = this.radius;
            this._canvasContext.strokeStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.shadowBlur = this.radius;
            this._canvasContext.shadowColor = this.color;
            this._canvasContext.moveTo(position.x, position.y);
        };
        BlurryMarkerBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        };
        BlurryMarkerBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return BlurryMarkerBrush;
    })();
    Chameleon.BlurryMarkerBrush = BlurryMarkerBrush;
    var CalligraphyBrush = (function () {
        function CalligraphyBrush() {
            this.img = new Image();
            this._canvasContext = null;
            this._lastPosition = new THREE.Vector2();
        }
        Object.defineProperty(CalligraphyBrush.prototype, "radius", {
            get: function () {
                return 32 / 2;
            },
            enumerable: true,
            configurable: true
        });
        CalligraphyBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this.img.src = 'image/brush3.png';
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPosition.copy(position);
        };
        CalligraphyBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                var dist = this._lastPosition.distanceTo(position);
                var angle = Chameleon.angleBetween(this._lastPosition, position);
                for (var i = 0; i < dist; i++) {
                    var x = this._lastPosition.x + (Math.sin(angle) * i) - this.radius;
                    var y = this._lastPosition.y + (Math.cos(angle) * i) - this.radius;
                    this._canvasContext.drawImage(this.img, x, y);
                }
                this._lastPosition.copy(position);
            }
        };
        CalligraphyBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return CalligraphyBrush;
    })();
    Chameleon.CalligraphyBrush = CalligraphyBrush;
    var Fur = (function () {
        function Fur() {
            this.img = new Image();
            this._canvasContext = null;
            this._lastPosition = new THREE.Vector2();
        }
        Object.defineProperty(Fur.prototype, "radius", {
            get: function () {
                return 32 * 1.415 / 2;
            },
            enumerable: true,
            configurable: true
        });
        Fur.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this.img.src = 'image/brush3.png';
            this.img.width = 10;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPosition.copy(position);
        };
        Fur.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                var dist = this._lastPosition.distanceTo(position);
                var angle = Chameleon.angleBetween(this._lastPosition, position);
                for (var i = 0; i < dist; i++) {
                    var x = this._lastPosition.x + (Math.sin(angle) * i);
                    var y = this._lastPosition.y + (Math.cos(angle) * i);
                    this._canvasContext.save();
                    this._canvasContext.translate(x, y);
                    this._canvasContext.scale(0.5, 0.5);
                    this._canvasContext.rotate(Math.PI * 180 / Chameleon.getRandomInt(0, 180));
                    this._canvasContext.drawImage(this.img, 0, 0);
                    this._canvasContext.restore();
                }
                this._lastPosition.copy(position);
            }
        };
        Fur.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return Fur;
    })();
    Chameleon.Fur = Fur;
    var ThickBrush = (function () {
        function ThickBrush(radius, color) {
            this.radius = radius;
            this.color = color;
            this._canvasContext = null;
            this._lastPosition = new THREE.Vector2();
        }
        ThickBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.lineWidth = this.radius / 10;
            this._canvasContext.strokeStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPosition.copy(position);
        };
        ThickBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._canvasContext.beginPath();
                this._canvasContext.globalAlpha = 0.85;
                for (var i = -this.radius * 0.9; i <= this.radius * 0.9; i += this.radius / 20) {
                    this._canvasContext.beginPath();
                    this._canvasContext.moveTo(this._lastPosition.x + i, this._lastPosition.y + i);
                    this._canvasContext.lineTo(position.x + i, position.y + i);
                    this._canvasContext.stroke();
                }
                this._lastPosition.copy(position);
            }
        };
        ThickBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return ThickBrush;
    })();
    Chameleon.ThickBrush = ThickBrush;
    var InkDropBrush = (function () {
        function InkDropBrush(radius, color) {
            this.radius = radius;
            this.color = color;
            this._canvasContext = null;
            this._lastPosition = new THREE.Vector2();
        }
        InkDropBrush.prototype.drawDrop = function (position) {
            this._canvasContext.beginPath();
            this._canvasContext.globalAlpha = Math.random();
            this._canvasContext.arc(position.x, position.y, Chameleon.getRandomInt(this.radius / 3, this.radius), 30, 270, false);
            this._canvasContext.fill();
        };
        InkDropBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.fillStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPosition.copy(position);
            this.drawDrop(position);
        };
        InkDropBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext && position.distanceTo(this._lastPosition) > this.radius * 2 / 3) {
                this._lastPosition.copy(position);
                this.drawDrop(position);
            }
        };
        InkDropBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return InkDropBrush;
    })();
    Chameleon.InkDropBrush = InkDropBrush;
    var StarBrush = (function () {
        function StarBrush(radius, color) {
            this.radius = radius;
            this.color = color;
            this._canvasContext = null;
            this._lastPosition = new THREE.Vector2();
        }
        StarBrush.prototype.drawStar = function (position, angle) {
            var length = this.radius / 2;
            var x = position.x, y = position.y;
            this._canvasContext.save();
            this._canvasContext.translate(x, y);
            this._canvasContext.beginPath();
            this._canvasContext.rotate(Math.PI / 180 * angle);
            for (var i = 5; i--;) {
                this._canvasContext.lineTo(0, length);
                this._canvasContext.translate(0, length);
                this._canvasContext.rotate((Math.PI * 2 / 10));
                this._canvasContext.lineTo(0, -length);
                this._canvasContext.translate(0, -length);
                this._canvasContext.rotate(-(Math.PI * 6 / 10));
            }
            this._canvasContext.lineTo(0, length);
            this._canvasContext.closePath();
            this._canvasContext.stroke();
            this._canvasContext.restore();
        };
        StarBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save();
            this._canvasContext.strokeStyle = this.color;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this.drawStar(position, Chameleon.getRandomInt(0, 180));
            this._lastPosition.copy(position);
        };
        StarBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext && this._lastPosition.distanceTo(position) > this.radius) {
                this.drawStar(position, Chameleon.getRandomInt(0, 180));
                this._lastPosition.copy(position);
            }
        };
        StarBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return StarBrush;
    })();
    Chameleon.StarBrush = StarBrush;
    var RandomStarBrush = (function () {
        function RandomStarBrush(radius) {
            this.radius = radius;
            this._canvasContext = null;
            this._lastPosition = new THREE.Vector2();
        }
        RandomStarBrush.prototype.drawStar = function (position) {
            var angle = Chameleon.getRandomInt(0, 180), width = Chameleon.getRandomInt(1, this.radius / 2.8), opacity = Math.random(), scale = Chameleon.getRandomInt(10, 20) / 20, color = ('rgb(' + Chameleon.getRandomInt(0, 255) + ',' + Chameleon.getRandomInt(0, 255) + ',' + Chameleon.getRandomInt(0, 255) + ')'), length = this.radius / 3.5;
            this._canvasContext.save();
            this._canvasContext.translate(position.x, position.y);
            this._canvasContext.beginPath();
            this._canvasContext.globalAlpha = opacity;
            this._canvasContext.rotate(Math.PI / 180 * angle);
            this._canvasContext.scale(scale, scale);
            this._canvasContext.strokeStyle = color;
            this._canvasContext.lineWidth = width;
            for (var i = 5; i--;) {
                this._canvasContext.lineTo(0, length);
                this._canvasContext.translate(0, length);
                this._canvasContext.rotate((Math.PI * 2 / 10));
                this._canvasContext.lineTo(0, -length);
                this._canvasContext.translate(0, -length);
                this._canvasContext.rotate(-(Math.PI * 6 / 10));
            }
            this._canvasContext.lineTo(0, length);
            this._canvasContext.closePath();
            this._canvasContext.stroke();
            this._canvasContext.restore();
        };
        RandomStarBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save();
            this._lastPosition.copy(position);
            this.drawStar(position);
        };
        RandomStarBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext && position.distanceTo(this._lastPosition) > this.radius * 2 / 3) {
                this._lastPosition.copy(position);
                this.drawStar(position);
            }
        };
        RandomStarBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return RandomStarBrush;
    })();
    Chameleon.RandomStarBrush = RandomStarBrush;
    var SprayBrush = (function () {
        function SprayBrush(radius, color) {
            this.radius = radius;
            this.color = color;
            this._canvasContext = null;
            this._density = 70;
        }
        SprayBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.fillStyle = this.color;
        };
        SprayBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                for (var i = this._density; i--;) {
                    var dotRadius = Chameleon.getRandomFloat(0, this.radius);
                    var angle = Chameleon.getRandomFloat(0, Math.PI * 2);
                    var dotWidth = Chameleon.getRandomFloat(1, 2);
                    this._canvasContext.globalAlpha = Math.random();
                    this._canvasContext.fillRect(position.x + dotRadius * Math.cos(angle), position.y + dotRadius * Math.sin(angle), dotWidth, dotWidth);
                }
            }
        };
        SprayBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return SprayBrush;
    })();
    Chameleon.SprayBrush = SprayBrush;
    var TextureBrush = (function () {
        function TextureBrush(radius, texture) {
            this.radius = radius;
            this.texture = texture;
            this._canvasContext = null;
        }
        TextureBrush.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody else will call this until the stroke is finished
            this._canvasContext.lineWidth = this.radius * 2;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.strokeStyle = this._canvasContext.createPattern(this.texture, 'repeat');
            this._canvasContext.moveTo(position.x, position.y);
        };
        TextureBrush.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.moveTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        };
        TextureBrush.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.moveTo(0, 0);
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return TextureBrush;
    })();
    Chameleon.TextureBrush = TextureBrush;
})(Chameleon || (Chameleon = {}));
/// <reference path="./common.ts" />
/// <reference path="./camera-controls.ts" />
/// <reference path="./texture-manager.ts" />
/// <reference path="./brushes.ts" />
var Chameleon;
(function (Chameleon) {
    var ControlsState;
    (function (ControlsState) {
        ControlsState[ControlsState["Idle"] = 0] = "Idle";
        ControlsState[ControlsState["Draw"] = 1] = "Draw";
        ControlsState[ControlsState["View"] = 2] = "View";
    })(ControlsState || (ControlsState = {}));
    var Controls = (function () {
        function Controls(geometry, canvas) {
            var _this = this;
            this._state = 0 /* Idle */;
            this._mesh = new THREE.Mesh();
            this.canvasBox = { left: 0, top: 0, width: 0, height: 0 };
            this._headLight = new THREE.PointLight(0xFFFFFF, 0.4);
            this._perspectiveView = false;
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
                var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                renderer.setClearColor(0xAAAAAA, 1.0);
                return renderer;
            })();
            this.brush = new Chameleon.Pencil();
            this._mousedown = function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (_this._state !== 0 /* Idle */) {
                    return;
                }
                // Hold shift key to rotate and pan
                if (_this.perspectiveView || event.shiftKey) {
                    _this._state = 2 /* View */;
                    _this._useViewingTexture();
                    _this._perspectiveCameraControls.onMouseDown(event);
                    _this._orthographicCameraControls.onMouseDown(event);
                }
                else {
                    _this._state = 1 /* Draw */;
                    _this._useDrawingTexture();
                    var pos = Chameleon.mousePositionInCanvas(event, _this.canvasBox);
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
                        _this._perspectiveCameraControls.onMouseMove(event);
                        _this._orthographicCameraControls.onMouseMove(event);
                        break;
                    case 1 /* Draw */:
                        var pos = Chameleon.mousePositionInCanvas(event, _this.canvasBox);
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
                _this._perspectiveCameraControls.onMouseUp(event);
                _this._orthographicCameraControls.onMouseUp(event);
                _this._state = 0 /* Idle */;
                document.removeEventListener('mousemove', _this._mousemove);
                document.removeEventListener('mouseup', _this._mouseup);
            };
            this._mousewheel = function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (_this._state === 1 /* Draw */ || !_this.perspectiveView && !event.shiftKey) {
                    return;
                }
                _this._useViewingTexture();
                _this._perspectiveCameraControls.onMouseWheel(event);
                _this._orthographicCameraControls.onMouseWheel(event);
            };
            this._geometry = geometry.clone();
            // Note that a crucial assumption is that this Mesh object will never be transformed (rotated, scaled, or translated)
            // This is crucial for both TextureManager and CameraControls to work properly
            this._mesh.geometry = this._geometry;
            if (!canvas) {
                canvas = document.createElement('canvas');
            }
            this.canvas = canvas;
            this.canvas.addEventListener('contextmenu', function (e) { return e.preventDefault(); }, false);
            this.canvas.addEventListener('mousedown', this._mousedown, false);
            this.canvas.addEventListener('mousewheel', this._mousewheel, false);
            this.canvas.addEventListener('DOMMouseScroll', this._mousewheel, false); // firefox
            this._initializeCamera();
            this._textureManager = new Chameleon.TextureManager(this._geometry, this._renderer, this._orthographicCamera);
            this._textureManager.applyViewingTexture(this._mesh);
            this._usingViewingTexture = true;
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
        Object.defineProperty(Controls.prototype, "perspectiveView", {
            get: function () {
                return this._perspectiveView;
            },
            set: function (value) {
                if (this._perspectiveView === value) {
                    return;
                }
                this._perspectiveView = value;
                if (value) {
                    this._useViewingTexture();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Controls.prototype, "backgroundColor", {
            get: function () {
                return this._textureManager.backgroundColor;
            },
            set: function (value) {
                this._useViewingTexture();
                this._textureManager.backgroundColor = value;
                this._textureManager.backgroundReset();
            },
            enumerable: true,
            configurable: true
        });
        Controls.prototype.handleResize = function () {
            this._renderer.setSize(this.canvas.width, this.canvas.height);
            this.updateCanvasBox();
            this._orthographicCameraControls.handleResize();
            this._perspectiveCameraControls.handleResize();
            this._useViewingTexture();
        };
        Controls.prototype.update = function () {
            this._perspectiveCameraControls.updateCamera();
            this._orthographicCameraControls.updateCamera();
            if (this.perspectiveView) {
                this._headLight.position.copy(this._perspectiveCamera.position);
                this._renderer.render(this._scene, this._perspectiveCamera);
            }
            else {
                this._headLight.position.copy(this._orthographicCamera.position);
                this._renderer.render(this._scene, this._orthographicCamera);
            }
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
        Controls._computeBoundingBallRadius = function (geometry) {
            var radius = 0;
            var origin = new THREE.Vector3(0, 0, 0);
            for (var i = 0; i < geometry.vertices.length; i += 1) {
                radius = Math.max(radius, geometry.vertices[i].distanceTo(origin));
            }
            return radius;
        };
        Controls.prototype._initializeCamera = function () {
            this._boundingBallRadius = Controls._computeBoundingBallRadius(this._geometry);
            var fov = 60;
            var z = 2 * this._boundingBallRadius / Math.tan(fov / 2 / 180 * Math.PI);
            this._orthographicCamera = new THREE.OrthographicCamera(-this._boundingBallRadius * 2, this._boundingBallRadius * 2, this._boundingBallRadius * 2, -this._boundingBallRadius * 2);
            this._orthographicCamera.position.z = z;
            this._orthographicCameraControls = new Chameleon.OrthographicCameraControls(this._orthographicCamera, this.canvasBox);
            this._perspectiveCamera = new THREE.PerspectiveCamera(fov, 1);
            this._perspectiveCamera.position.setZ(z);
            this._perspectiveCameraControls = new Chameleon.PerspectiveCameraControls(this._perspectiveCamera, this.canvasBox);
        };
        Controls.prototype.resetCameras = function () {
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
        };
        return Controls;
    })();
    Chameleon.Controls = Controls;
})(Chameleon || (Chameleon = {}));
/// <reference path="./chameleon/controls.ts" />
/// <reference path="./chameleon/brushes.ts" />
var Chameleon;
(function (Chameleon) {
    function create(geometry, canvas) {
        return new Chameleon.Controls(geometry, canvas);
    }
    Chameleon.create = create;
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
    function setUpBrushSettingsGui(settings, folder) {
        settings.brush = {
            type: null,
            size: 15,
            color: '#00d3e1',
            texture: null
        };
        var loadTexture = function (path) {
            var textureSideLength = 512;
            var canvas = document.createElement('canvas');
            canvas.height = canvas.width = textureSideLength;
            var image = new Image();
            image.src = path;
            image.onload = function () {
                canvas.getContext('2d').drawImage(image, 0, 0);
            };
            return canvas;
        };
        var textureItems = [
            {
                name: 'Grass',
                canvas: loadTexture('image/grass_texture.jpg')
            },
            {
                name: 'Metal',
                canvas: loadTexture('image/metal_texture.jpg')
            },
            {
                name: 'Rock',
                canvas: loadTexture('image/rock_texture.jpg')
            },
            {
                name: 'Black Leather',
                canvas: loadTexture('image/blackleather_texture.jpg')
            }
        ];
        var brushItems = [
            {
                name: 'Marker',
                instance: new Chameleon.MarkerBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            },
            {
                name: 'Blurry Marker',
                instance: new Chameleon.BlurryMarkerBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            },
            {
                name: 'Calligraphy',
                instance: new Chameleon.CalligraphyBrush()
            },
            {
                name: 'Fur',
                instance: new Chameleon.Fur()
            },
            {
                name: 'Thick Brush',
                instance: new Chameleon.ThickBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            },
            {
                name: 'Ink Drop',
                instance: new Chameleon.InkDropBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            },
            {
                name: 'Star',
                instance: new Chameleon.StarBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            },
            {
                name: 'Random Star',
                instance: new Chameleon.RandomStarBrush(1),
                sizeConfig: true
            },
            {
                name: 'Spray',
                instance: new Chameleon.SprayBrush(1, '#000000'),
                sizeConfig: true,
                colorConfig: true
            },
            {
                name: 'Texture',
                instance: new Chameleon.TextureBrush(1, textureItems[0].canvas),
                sizeConfig: true,
                textureConfig: true
            }
        ];
        var typeController = folder.add(settings.brush, 'type', brushItems.map(function (_) { return _.name; })).name('Type');
        var sizeController = folder.add(settings.brush, 'size', 1, 40).step(0.5).name('Size');
        var colorController = folder.addColor(settings.brush, 'color').name('Color');
        var textureController = folder.add(settings.brush, 'texture', textureItems.map(function (_) { return _.name; })).name('Texture');
        var handleSizeChange = function (newSize) { return chameleon.brush.radius = newSize / 2; };
        var handleColorChange = function (newColor) {
            if ('color' in chameleon.brush) {
                chameleon.brush.color = newColor;
            }
        };
        var handleTextureChange = function (newTexture) {
            if (!('texture' in chameleon.brush)) {
                return;
            }
            for (var i = 0; i < textureItems.length; i += 1) {
                if (textureItems[i].name === newTexture) {
                    chameleon.brush.texture = textureItems[i].canvas;
                    return;
                }
            }
        };
        var handleTypeChange = function (newType) {
            for (var i = 0; i < brushItems.length; i += 1) {
                if (brushItems[i].name === newType) {
                    chameleon.brush = brushItems[i].instance;
                    handleSizeChange(settings.brush.size);
                    handleColorChange(settings.brush.color);
                    handleTextureChange(settings.brush.texture);
                    sizeController.domElement.style.visibility = (brushItems[i].sizeConfig) ? 'visible' : 'collapse';
                    colorController.domElement.style.visibility = (brushItems[i].colorConfig) ? 'visible' : 'collapse';
                    textureController.domElement.style.visibility = (brushItems[i].textureConfig) ? 'visible' : 'collapse';
                    return;
                }
            }
        };
        typeController.onChange(handleTypeChange);
        sizeController.onChange(handleSizeChange);
        colorController.onChange(handleColorChange);
        textureController.onChange(handleTextureChange);
        settings.brush.type = brushItems[0].name;
        handleTypeChange(settings.brush.type);
    }
    function setUpGui() {
        var settings = {
            backgroundColor: '#FFFFFF',
            camera: {
                reset: function () {
                    chameleon.resetCameras();
                },
                perspectiveViewing: false
            }
        };
        var gui = new dat.GUI({ width: 310 });
        gui.addColor(settings, 'backgroundColor').name('Background Reset').onChange(function (value) { return chameleon.backgroundColor = value; });
        var cameraFolder = gui.addFolder('Camera');
        var brushFolder = gui.addFolder('Brush');
        cameraFolder.open();
        cameraFolder.add(settings.camera, 'perspectiveViewing').name('Perspective Viewing').onChange(function (value) {
            chameleon.perspectiveView = value;
            if (value) {
                brushFolder.close();
            }
            else {
                brushFolder.open();
            }
        });
        cameraFolder.add(settings.camera, 'reset').name('Reset');
        brushFolder.open();
        setUpBrushSettingsGui(settings, brushFolder);
    }
    window.onload = function () {
        setUpGui();
        // Render loop
        var render = function () {
            chameleon.update();
            requestAnimationFrame(render);
        };
        render();
    };
})();
