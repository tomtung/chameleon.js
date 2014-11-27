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
    var CameraControlsState;
    (function (CameraControlsState) {
        CameraControlsState[CameraControlsState["Idle"] = 0] = "Idle";
        CameraControlsState[CameraControlsState["Pan"] = 1] = "Pan";
        CameraControlsState[CameraControlsState["Rotate"] = 2] = "Rotate";
    })(CameraControlsState || (CameraControlsState = {}));
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
            this._target = new THREE.Vector3();
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
            // To be implemented by subclasses
        };
        CameraControlsBase.prototype.updateCamera = function () {
            this._eye.subVectors(this.camera.position, this._target);
            this.rotateCamera();
            this.zoomCamera();
            this.panCamera();
            this.camera.position.addVectors(this._target, this._eye);
            this.camera.lookAt(this._target);
        };
        return CameraControlsBase;
    })();
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
        PerspectiveCameraControls.prototype.zoomCamera = function () {
            var factor = 1.0 + (this._zoomEnd - this._zoomStart) * this.zoomSpeed;
            if (factor !== 1.0 && factor > 0.0) {
                this._eye.multiplyScalar(factor);
                this._zoomStart = this._zoomEnd;
            }
        };
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
            this._viewSize = Math.min(this._center0.x - camera.left, camera.right - this._center0.x, this._center0.y - camera.bottom, camera.top - this._center0.y);
            this.handleResize();
        }
        OrthographicCameraControls.prototype.zoomCamera = function () {
            var factor = 1.0 + (this._zoomEnd - this._zoomStart) * this.zoomSpeed;
            if (factor !== 1.0 && factor > 0.0) {
                this.camera.zoom *= factor;
                this._zoomStart = this._zoomEnd;
                this.camera.updateProjectionMatrix();
            }
        };
        OrthographicCameraControls.prototype.handleResize = function () {
            if (this.canvasBox.width < this.canvasBox.height) {
                this.camera.left = this._center0.x - this._viewSize / 2;
                this.camera.right = this._center0.x + this._viewSize / 2;
                var ratio = this.canvasBox.height / this.canvasBox.width;
                this.camera.top = this._center0.y + this._viewSize / 2 * ratio;
                this.camera.bottom = this._center0.y - this._viewSize / 2 * ratio;
            }
            else {
                this.camera.top = this._center0.y + this._viewSize / 2;
                this.camera.bottom = this._center0.y - this._viewSize / 2;
                var ratio = this.canvasBox.width / this.canvasBox.height;
                this.camera.left = this._center0.x - this._viewSize / 2 * ratio;
                this.camera.right = this._center0.x + this._viewSize / 2 * ratio;
            }
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
            this._affectedFaces = new AffectedFacesRecorder(this.geometry.faces.length);
            this.initializeViewingTexture().initializeDrawingTexture();
            this._isFloodFillEmpty = new Uint8Array(this.geometry.faces.length);
            this._isFloodFill = new Uint8Array(this.geometry.faces.length);
            this._nAdjacentFaces = new Uint8Array(this.geometry.faces.length);
            this._AdjacentFacesList = new Array(this.geometry.faces.length);
            for (var i = 0; i < this.geometry.faces.length; i += 1) {
                this._AdjacentFacesList[i] = new Uint32Array(this.geometry.faces.length);
            }
            for (var i = 0; i < this.geometry.faces.length - 1; i += 1) {
                for (var j = i + 1; j < this.geometry.faces.length; j += 1) {
                    var vi = [this.geometry.faces[i].a, this.geometry.faces[i].b, this.geometry.faces[i].c];
                    var vj = [this.geometry.faces[j].a, this.geometry.faces[j].b, this.geometry.faces[j].c];
                    var count = 0;
                    for (var k = 0; k < 3; k++)
                        for (var l = 0; l < 3; l++)
                            if (this.geometry.vertices[vi[k]].x == this.geometry.vertices[vj[l]].x && this.geometry.vertices[vi[k]].y == this.geometry.vertices[vj[l]].y && this.geometry.vertices[vi[k]].z == this.geometry.vertices[vj[l]].z && this.geometry.faces[i].normal.dot(this.geometry.faces[j].normal) > 0)
                                count++;
                    if (count == 2) {
                        this._AdjacentFacesList[i][this._nAdjacentFaces[i]] = j;
                        this._AdjacentFacesList[j][this._nAdjacentFaces[j]] = i;
                        this._nAdjacentFaces[i] += 1;
                        this._nAdjacentFaces[j] += 1;
                    }
                }
            }
            console.log(this._nAdjacentFaces);
            console.log(this._AdjacentFacesList);
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
            var mouse3d = new THREE.Vector3(canvasPos.x / this._drawingCanvas.width * 2 - 1, -canvasPos.y / this._drawingCanvas.height * 2 + 1, -10000).unproject(this.camera);
            var direction = new THREE.Vector3(0, 0, -1).transformDirection(this.camera.matrixWorld);
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
            //vector d
            var dx = x2 - x1;
            var dy = y2 - y1;
            //vector lc
            var lcx = cx - x1;
            var lcy = cy - y1;
            //project lc onto d, resulting in vector p
            var dLen2 = dx * dx + dy * dy; //len2 of d
            var px = dx;
            var py = dy;
            if (dLen2 > 0) {
                var dp = (lcx * dx + lcy * dy) / dLen2;
                px *= dp;
                py *= dp;
            }
            var nearest = [x1 + px, y1 + py];
            //len2 of p
            var pLen2 = px * px + py * py;
            //check collision
            return this._pointCircleCollide(nearest, circle, radius) && pLen2 <= dLen2 && (px * dx + py * dy) >= 0;
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
                //this._affectedFaces.add(faceIndex);
                // TODO use radius to find all affected triangles
                this._isFloodFill.set(this._isFloodFillEmpty);
                this._add_recursive(faceIndex, canvasPos, radius);
                console.log(this._isFloodFill);
                console.log(this._affectedFaces);
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
    Chameleon._brushSize;
    Chameleon._brushType;
    Chameleon._brushColor;
    Chameleon._brushTexture;
    function changeBrushSize(_size) {
        Chameleon._brushSize = _size;
    }
    Chameleon.changeBrushSize = changeBrushSize;
    function changeBrushType(_type) {
        Chameleon._brushType = _type;
    }
    Chameleon.changeBrushType = changeBrushType;
    function changeBrushColor(_color) {
        Chameleon._brushColor = _color;
    }
    Chameleon.changeBrushColor = changeBrushColor;
    function changeTextureType(_texture) {
        Chameleon._brushTexture = _texture;
    }
    Chameleon.changeTextureType = changeTextureType;
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
    var Pencil1 = (function () {
        function Pencil1() {
            this._canvasContext = null;
            this._pencilSize = Chameleon._brushSize;
            this._pencilColor = Chameleon._brushColor;
        }
        Object.defineProperty(Pencil1.prototype, "radius", {
            get: function () {
                return this._pencilSize;
            },
            enumerable: true,
            configurable: true
        });
        Pencil1.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody        else will call this until the stroke is finished
            this._canvasContext.lineWidth = this._pencilSize;
            this._canvasContext.strokeStyle = this._pencilColor;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.moveTo(position.x, position.y);
        };
        Pencil1.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        };
        Pencil1.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return Pencil1;
    })();
    Chameleon.Pencil1 = Pencil1;
    var Pencil2 = (function () {
        function Pencil2() {
            this._canvasContext = null;
            this._pencilSize = Chameleon._brushSize;
            this._pencilColor = Chameleon._brushColor;
        }
        Object.defineProperty(Pencil2.prototype, "radius", {
            get: function () {
                return this._pencilSize;
            },
            enumerable: true,
            configurable: true
        });
        Pencil2.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody        else will call this until the stroke is finished
            this._canvasContext.lineWidth = this._pencilSize;
            this._canvasContext.strokeStyle = this._pencilColor;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.shadowBlur = this._pencilSize;
            this._canvasContext.shadowColor = this._pencilColor;
            this._canvasContext.moveTo(position.x, position.y);
        };
        Pencil2.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();
            }
        };
        Pencil2.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return Pencil2;
    })();
    Chameleon.Pencil2 = Pencil2;
    var Pencil3 = (function () {
        function Pencil3() {
            this.img = new Image();
            this._canvasContext = null;
            this._pencilSize = Chameleon._brushSize;
        }
        Object.defineProperty(Pencil3.prototype, "radius", {
            get: function () {
                return 32;
            },
            enumerable: true,
            configurable: true
        });
        Pencil3.prototype.distanceBetween = function (point1, point2) {
            return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
        };
        Pencil3.prototype.angleBetween = function (point1, point2) {
            return Math.atan2(point2.x - point1.x, point2.y - point1.y);
        };
        Pencil3.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody        else will call this until the stroke is finished
            this.img.src = 'image/brush3.png';
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this.lastPoint = { x: position.x, y: position.y };
            //this._canvasContext.moveTo(position.x, position.y);
        };
        Pencil3.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                //this._canvasContext.lineTo(position.x, position.y);
                var currentPoint = { x: position.x, y: position.y };
                var dist = this.distanceBetween(this.lastPoint, currentPoint);
                var angle = this.angleBetween(this.lastPoint, currentPoint);
                for (var i = 0; i < dist; i++) {
                    var x = this.lastPoint.x + (Math.sin(angle) * i) - 25;
                    var y = this.lastPoint.y + (Math.cos(angle) * i) - 25;
                    this._canvasContext.drawImage(this.img, x, y);
                }
                this.lastPoint = currentPoint;
            }
        };
        Pencil3.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return Pencil3;
    })();
    Chameleon.Pencil3 = Pencil3;
    var Pencil4 = (function () {
        function Pencil4() {
            this.img = new Image();
            this._canvasContext = null;
            this._pencilSize = Chameleon._brushSize;
        }
        Object.defineProperty(Pencil4.prototype, "radius", {
            get: function () {
                return 10;
            },
            enumerable: true,
            configurable: true
        });
        Pencil4.prototype.distanceBetween = function (point1, point2) {
            return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
        };
        Pencil4.prototype.angleBetween = function (point1, point2) {
            return Math.atan2(point2.x - point1.x, point2.y - point1.y);
        };
        Pencil4.prototype.getRandomInt = function (min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        };
        Pencil4.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.beginPath();
            this._canvasContext.save(); // Assumption: nobody        else will call this until the stroke is finished
            this.img.src = 'image/brush3.png';
            this.img.width = 10;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this.lastPoint = { x: position.x, y: position.y };
        };
        Pencil4.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                //this._canvasContext.lineTo(position.x, position.y);
                var currentPoint = { x: position.x, y: position.y };
                var dist = this.distanceBetween(this.lastPoint, currentPoint);
                var angle = this.angleBetween(this.lastPoint, currentPoint);
                for (var i = 0; i < dist; i++) {
                    var x = this.lastPoint.x + (Math.sin(angle) * i);
                    var y = this.lastPoint.y + (Math.cos(angle) * i);
                    this._canvasContext.save();
                    this._canvasContext.translate(x, y);
                    this._canvasContext.scale(0.5, 0.5);
                    this._canvasContext.rotate(Math.PI * 180 / this.getRandomInt(0, 180));
                    this._canvasContext.drawImage(this.img, 0, 0);
                    this._canvasContext.restore();
                }
                this.lastPoint = currentPoint;
            }
        };
        Pencil4.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return Pencil4;
    })();
    Chameleon.Pencil4 = Pencil4;
    var Pencil5 = (function () {
        function Pencil5() {
            this._canvasContext = null;
            this._pencilSize = 3;
            this._pencilColor = Chameleon._brushColor;
        }
        Object.defineProperty(Pencil5.prototype, "radius", {
            get: function () {
                return 3;
            },
            enumerable: true,
            configurable: true
        });
        Pencil5.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save(); // Assumption: nobody        else will call this until the stroke is finished
            this._canvasContext.lineWidth = this._pencilSize;
            this._canvasContext.strokeStyle = this._pencilColor;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._lastPoint = { x: position.x, y: position.y };
        };
        Pencil5.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._canvasContext.beginPath();
                this._canvasContext.globalAlpha = 1;
                this._canvasContext.moveTo(this._lastPoint.x, this._lastPoint.y);
                this._canvasContext.lineTo(position.x, position.y);
                this._canvasContext.stroke();
                this._canvasContext.moveTo(this._lastPoint.x - 4, this._lastPoint.y - 4);
                this._canvasContext.lineTo(position.x - 4, position.y - 4);
                this._canvasContext.stroke();
                this._canvasContext.moveTo(this._lastPoint.x - 2, this._lastPoint.y - 2);
                this._canvasContext.lineTo(position.x - 2, position.y - 2);
                this._canvasContext.stroke();
                this._canvasContext.moveTo(this._lastPoint.x + 2, this._lastPoint.y + 2);
                this._canvasContext.lineTo(position.x + 2, position.y + 2);
                this._canvasContext.stroke();
                this._canvasContext.moveTo(this._lastPoint.x + 4, this._lastPoint.y + 4);
                this._canvasContext.lineTo(position.x + 4, position.y + 4);
                this._canvasContext.stroke();
                this._lastPoint = { x: position.x, y: position.y };
            }
        };
        Pencil5.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
            }
        };
        return Pencil5;
    })();
    Chameleon.Pencil5 = Pencil5;
    var Pencil6 = (function () {
        function Pencil6() {
            this._canvasContext = null;
            this._points = [];
            this._pencilSize = Chameleon._brushSize;
            this._pencilColor = Chameleon._brushColor;
        }
        Object.defineProperty(Pencil6.prototype, "radius", {
            get: function () {
                return 15;
            },
            enumerable: true,
            configurable: true
        });
        Pencil6.prototype.getRandomInt = function (min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        };
        Pencil6.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save(); // Assumption: nobody        else will call this until the stroke is finished
            this._canvasContext.fillStyle = this._pencilColor;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._points.push({
                x: position.x,
                y: position.y,
                radius: this.getRandomInt(10, 30),
                opacity: Math.random()
            });
        };
        Pencil6.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._points.push({
                    x: position.x,
                    y: position.y,
                    radius: this.getRandomInt(5, 20),
                    opacity: Math.random()
                });
                this._canvasContext.clearRect(0, 0, 1, 1);
                for (var i = 0; i < this._points.length; i++) {
                    this._canvasContext.beginPath();
                    this._canvasContext.globalAlpha = this._points[i].opacity;
                    this._canvasContext.arc(this._points[i].x, this._points[i].y, this._points[i].radius, 30, 270, false);
                    this._canvasContext.fill();
                }
            }
        };
        Pencil6.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
                this._points.length = 0;
            }
        };
        return Pencil6;
    })();
    Chameleon.Pencil6 = Pencil6;
    var Pencil7 = (function () {
        function Pencil7() {
            this._canvasContext = null;
            this._points = [];
            this._pencilSize = Chameleon._brushSize;
            this._pencilColor = Chameleon._brushColor;
        }
        Object.defineProperty(Pencil7.prototype, "radius", {
            get: function () {
                return this._pencilSize;
            },
            enumerable: true,
            configurable: true
        });
        Pencil7.prototype.drawStar = function (x, y, angle) {
            var length = this._pencilSize;
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
        Pencil7.prototype.getRandomInt = function (min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        };
        Pencil7.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save();
            this._canvasContext.strokeStyle = this._pencilColor;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
        };
        Pencil7.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._points.push({ x: position.x, y: position.y, angle: this.getRandomInt(0, 180) });
                this._canvasContext.clearRect(0, 0, 1, 1);
                for (var i = 0; i < this._points.length; i++) {
                    this.drawStar(this._points[i].x, this._points[i].y, this._points[i].angle);
                }
            }
        };
        Pencil7.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._points.length = 0;
                this._canvasContext = null;
            }
        };
        return Pencil7;
    })();
    Chameleon.Pencil7 = Pencil7;
    var Pencil8 = (function () {
        function Pencil8() {
            this._canvasContext = null;
            this._points = [];
            this._pencilSize = Chameleon._brushSize;
            this._pencilColor = Chameleon._brushColor;
        }
        Object.defineProperty(Pencil8.prototype, "radius", {
            get: function () {
                return this._pencilSize;
            },
            enumerable: true,
            configurable: true
        });
        Pencil8.prototype.drawStar = function (options) {
            var length = this._pencilSize;
            this._canvasContext.save();
            this._canvasContext.translate(options.x, options.y);
            this._canvasContext.beginPath();
            this._canvasContext.globalAlpha = options.opacity;
            this._canvasContext.rotate(Math.PI / 180 * options.angle);
            this._canvasContext.scale(options.scale, options.scale);
            this._canvasContext.strokeStyle = options.color;
            this._canvasContext.lineWidth = options.width;
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
        Pencil8.prototype.getRandomInt = function (min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        };
        Pencil8.prototype.addRandomPoint = function (position) {
            this._points.push({
                x: position.x,
                y: position.y,
                angle: this.getRandomInt(0, 180),
                width: this.getRandomInt(1, 10),
                opacity: Math.random(),
                scale: this.getRandomInt(1, 20) / 10,
                color: ('rgb(' + this.getRandomInt(0, 255) + ',' + this.getRandomInt(0, 255) + ',' + this.getRandomInt(0, 255) + ')')
            });
        };
        Pencil8.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save();
        };
        Pencil8.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this.addRandomPoint(position);
                this._canvasContext.clearRect(0, 0, 1, 1);
                for (var i = 0; i < this._points.length; i++) {
                    this.drawStar(this._points[i]);
                }
            }
        };
        Pencil8.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._points.length = 0;
                this._canvasContext = null;
            }
        };
        return Pencil8;
    })();
    Chameleon.Pencil8 = Pencil8;
    var Pencil9 = (function () {
        function Pencil9() {
            this.img = new Image();
            this._canvasContext = null;
            this._points = [];
            this._pencilSize = Chameleon._brushSize;
            this._pencilTexture = Chameleon._brushTexture;
        }
        Object.defineProperty(Pencil9.prototype, "radius", {
            get: function () {
                return Chameleon._brushSize;
            },
            enumerable: true,
            configurable: true
        });
        Pencil9.prototype.midPointBtw = function (p1, p2) {
            return {
                x: p1.x + (p2.x - p1.x) / 2,
                y: p1.y + (p2.y - p1.y) / 2
            };
        };
        Pencil9.prototype.getPattern = function () {
            var patternCanvas = document.createElement('canvas'), dotWidth = 400, dotDistance = 200, patternCtx = patternCanvas.getContext('2d');
            patternCanvas.width = patternCanvas.height = dotWidth + dotDistance;
            if (this._pencilTexture == "grass") {
                this.img.src = 'image/grass_texture.jpg';
            }
            if (this._pencilTexture == "metal") {
                this.img.src = 'image/metal_texture.jpg';
            }
            if (this._pencilTexture == "rock") {
                this.img.src = 'image/rock_texture.jpg';
            }
            if (this._pencilTexture == "blackleather") {
                this.img.src = 'image/blackleather_texture.jpg';
            }
            patternCtx.beginPath();
            patternCtx.arc(dotWidth, dotWidth, dotWidth, 0, Math.PI * 2, false);
            patternCtx.closePath();
            patternCtx.drawImage(this.img, 0, 0);
            return this._canvasContext.createPattern(patternCanvas, 'repeat');
        };
        Pencil9.prototype.startStroke = function (canvas, position) {
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save(); // Assumption: nobody        else will call this until the stroke is finished
            this._canvasContext.lineWidth = this._pencilSize;
            this._canvasContext.lineJoin = this._canvasContext.lineCap = 'round';
            this._canvasContext.strokeStyle = this.getPattern();
            this.lastPoint = { x: position.x, y: position.y };
            //this._canvasContext.moveTo(position.x, position.y);
        };
        Pencil9.prototype.continueStoke = function (position) {
            if (this._canvasContext) {
                this._points.push({ x: position.x, y: position.y });
                this._canvasContext.clearRect(0, 0, 1, 1);
                var p1 = this._points[0];
                var p2 = this._points[1];
                this._canvasContext.beginPath();
                this._canvasContext.moveTo(p1.x, p1.y);
                for (var i = 1, len = this._points.length; i < len; i++) {
                    var midPoint = this.midPointBtw(p1, p2);
                    this._canvasContext.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
                    p1 = this._points[i];
                    p2 = this._points[i + 1];
                }
                this._canvasContext.lineTo(p1.x, p1.y);
                this._canvasContext.stroke();
            }
        };
        Pencil9.prototype.finishStroke = function () {
            if (this._canvasContext) {
                this._canvasContext.restore();
                this._canvasContext = null;
                this._points.length = 0;
            }
        };
        return Pencil9;
    })();
    Chameleon.Pencil9 = Pencil9;
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
            this.brush = new Chameleon.Pencil1();
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
                    var pos = Chameleon.mousePositionInCanvas(event, _this.canvasBox);
                    if (Chameleon._brushType == "brush1") {
                        _this.brush = new Chameleon.Pencil1();
                    }
                    if (Chameleon._brushType == "brush2") {
                        _this.brush = new Chameleon.Pencil2();
                    }
                    if (Chameleon._brushType == "brush3") {
                        _this.brush = new Chameleon.Pencil3();
                    }
                    if (Chameleon._brushType == "brush4") {
                        _this.brush = new Chameleon.Pencil4();
                    }
                    if (Chameleon._brushType == "brush5") {
                        _this.brush = new Chameleon.Pencil5();
                    }
                    if (Chameleon._brushType == "brush6") {
                        _this.brush = new Chameleon.Pencil6();
                    }
                    if (Chameleon._brushType == "brush7") {
                        _this.brush = new Chameleon.Pencil7();
                    }
                    if (Chameleon._brushType == "brush8") {
                        _this.brush = new Chameleon.Pencil8();
                    }
                    if (Chameleon._brushType == "brush9") {
                        _this.brush = new Chameleon.Pencil9();
                    }
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
            if (!canvas) {
                canvas = document.createElement('canvas');
            }
            this.canvas = canvas;
            this.canvas.addEventListener('contextmenu', function (e) { return e.preventDefault(); }, false);
            this.canvas.addEventListener('mousedown', this._mousedown, false);
            this.canvas.addEventListener('mousewheel', this._mousewheel, false);
            this.canvas.addEventListener('DOMMouseScroll', this._mousewheel, false); // firefox
            var viewSize = 1;
            var origin = new THREE.Vector3(0, 0, 0);
            for (var i = 0; i < this._mesh.geometry.vertices.length; i += 1) {
                viewSize = Math.max(viewSize, this._mesh.geometry.vertices[i].distanceTo(origin));
            }
            viewSize *= 2 * 1.25;
            this._camera = new THREE.OrthographicCamera(-viewSize, viewSize, viewSize, -viewSize);
            this._camera.position.z = viewSize * 10;
            this._cameraControls = new Chameleon.OrthographicCameraControls(this._camera, this.canvasBox);
            this._textureManager = new Chameleon.TextureManager(this._geometry, this._renderer, this._camera);
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
        Controls.prototype.handleResize = function () {
            this._renderer.setSize(this.canvas.width, this.canvas.height);
            this.updateCanvasBox();
            this._cameraControls.handleResize();
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
/// <reference path="./chameleon/controls.ts" />
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
    window.onload = function () {
        var _brushGUI = new FizzyText();
        var _gui = new dat.GUI();
        var _brushType = _gui.add(_brushGUI, 'brush', ['brush1', 'brush2', 'brush3', 'brush4', 'brush5', 'brush6', 'brush7', 'brush8', 'brush9']);
        var _f1 = _gui.addFolder("BrushSize");
        var _brushSize = _f1.add(_brushGUI, 'size', 1, 30).min(1).step(0.5);
        var _f2 = _gui.addFolder("Color");
        var _brushColor = _f2.addColor(_brushGUI, 'color0');
        var _f3;
        var _textureType;
        Chameleon.changeBrushType("brush1");
        Chameleon.changeBrushSize(_brushGUI.size);
        Chameleon.changeBrushColor(_brushGUI.color0);
        Chameleon.changeTextureType("grass");
        _f2.open();
        _f1.open();
        _brushType.onFinishChange(function (value) {
            if ((_brushGUI.brush == "brush1" || _brushGUI.brush == "brush2" || _brushGUI.brush == "brush5" || _brushGUI.brush == "brush6" || _brushGUI.brush == "brush7") && !_gui.hasFolder("Color")) {
                _f2 = _gui.addFolder("Color");
                _brushColor = _f2.addColor(_brushGUI, 'color0');
                _f2.open();
                _brushColor.onChange(function (value) {
                    Chameleon.changeBrushColor(_brushGUI.color0);
                });
            }
            if ((_brushGUI.brush == "brush1" || _brushGUI.brush == "brush2" || _brushGUI.brush == "brush7" || _brushGUI.brush == "brush8" || _brushGUI.brush == "brush9") && !_gui.hasFolder("BrushSize")) {
                _f1 = _gui.addFolder("BrushSize");
                _brushSize = _f1.add(_brushGUI, 'size', 1, 30).min(1).step(0.5);
                _f1.open();
                _brushSize.onFinishChange(function (value) {
                    Chameleon.changeBrushSize(_brushGUI.size);
                });
            }
            if (_brushGUI.brush == "brush9") {
                _f3 = _gui.addFolder("Texture");
                _textureType = _f3.add(_brushGUI, 'textureType', ['grass', 'metal', 'rock', 'blackleather']);
                _f3.open();
                _textureType.onFinishChange(function (value) {
                    Chameleon.changeTextureType(_brushGUI.textureType);
                });
            }
            if (_brushGUI.brush == "brush3" || _brushGUI.brush == "brush4" || _brushGUI.brush == "brush8") {
                _gui.removeFolder("Color");
                _gui.removeFolder("BrushSize");
            }
            if (_brushGUI.brush == "brush5" || _brushGUI.brush == "brush6") {
                _gui.removeFolder("BrushSize");
            }
            if (_brushGUI.brush == "brush9") {
                _gui.removeFolder("Color");
            }
            if (_brushGUI.brush != "brush9") {
                _gui.removeFolder("Texture");
            }
            Chameleon.changeBrushType(_brushGUI.brush);
        });
        _brushSize.onFinishChange(function (value) {
            Chameleon.changeBrushSize(_brushGUI.size);
        });
        _brushColor.onChange(function (value) {
            Chameleon.changeBrushColor(_brushGUI.color0);
        });
    };
    // Render loop
    var render = function () {
        chameleon.update();
        requestAnimationFrame(render);
    };
    render();
})();
var FizzyText = function () {
    this.brush = 'brush';
    this.textureType = 'textureType';
    this.size = 15;
    this.color0 = "#9b0000";
};
