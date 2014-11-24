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
            var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, Chameleon.CAMERA_NEAR, 10000);
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
        this.canvasBox = { left: 0, top: 0, width: 0, height: 0 };
        this.target = new THREE.Vector3();
        this._eye = new THREE.Vector3();
        this._rotateStart = new THREE.Vector3();
        this._rotateEnd = new THREE.Vector3();
        this._zoomStart = 0;
        this._zoomEnd = 0;
        this._panStart = new THREE.Vector2();
        this._panEnd = new THREE.Vector2();
        this._drawingCanvas = document.createElement('canvas');
        this._drawingCanvasContext = this._drawingCanvas.getContext('2d');
        this._drawingMaterial = new THREE.MeshLambertMaterial({
            map: new THREE.Texture(this._drawingCanvas)
        });
        this._drawingTextureMesh = new THREE.Mesh();
        this._drawingTextureScene = (function () {
            var scene = new THREE.Scene();
            scene.add(new THREE.AmbientLight(0xFFFFFF));
            scene.add(_this._drawingTextureMesh);
            return scene;
        })();
        this._nAffectedFaces = 0;
        this._getMousePositionInCanvas = (function () {
            var vector = new THREE.Vector2();
            return function (event, normalize) {
                if (normalize === void 0) { normalize = false; }
                vector.set(event.pageX - _this.canvasBox.left, event.pageY - _this.canvasBox.top);
                if (normalize) {
                    vector.x /= _this.canvas.width;
                    vector.y /= _this.canvas.height;
                }
                return vector;
            };
        })();
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
        this._computeMousePositionInDrawingCanvas = (function () {
            var barycoord = new THREE.Vector3();
            var baryCoordXYZ = new Float32Array(3);
            var uv = new THREE.Vector2();
            return function (event) {
                var intersections = _this._castRayFromMouse(event);
                if (intersections.length == 0) {
                    return { pos: _this._getMousePositionInCanvas(event), face: -1 };
                }
                var face = intersections[0].face;
                var faceIndex = face.index;
                THREE.Triangle.barycoordFromPoint(intersections[0].point, _this._geometry.vertices[face.a], _this._geometry.vertices[face.b], _this._geometry.vertices[face.c], barycoord);
                barycoord.toArray(baryCoordXYZ);
                var drawingCanvasPos = new THREE.Vector2();
                for (var i = 0; i < 3; i += 1) {
                    uv.copy(_this._drawingTextureUvs[faceIndex][i]).multiplyScalar(baryCoordXYZ[i]);
                    drawingCanvasPos.add(uv);
                }
                drawingCanvasPos.x *= _this._drawingCanvas.width;
                drawingCanvasPos.y = (1 - drawingCanvasPos.y) * _this._drawingCanvas.height; // why 1-??
                drawingCanvasPos.round();
                return { pos: drawingCanvasPos, face: faceIndex };
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
                        _this._rotateStart.copy(_this._getMouseProjectionOnBall(event));
                        _this._rotateEnd.copy(_this._rotateStart);
                        break;
                    case 2:
                        _this._state = 2 /* Pan */;
                        _this._panStart.copy(_this._getMousePositionInCanvas(event, true));
                        _this._panEnd.copy(_this._panStart);
                        break;
                    default:
                        console.log(event);
                }
            }
            else {
                _this._state = 1 /* Draw */;
                _this._useDrawingTexture();
                var pos_face = _this._computeMousePositionInDrawingCanvas(event);
                _this._drawingCanvasContext.moveTo(pos_face.pos.x, pos_face.pos.y);
                _this._drawingCanvasContext.strokeStyle = '#ff0000';
                _this._drawingCanvasContext.stroke();
                _this._drawingMaterial.map.needsUpdate = true;
                _this._recordAffectedFace(pos_face.face);
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
                    _this._rotateEnd.copy(_this._getMouseProjectionOnBall(event));
                    break;
                case 2 /* Pan */:
                    _this._panEnd.copy(_this._getMousePositionInCanvas(event, true));
                    break;
                case 1 /* Draw */:
                    var pos_face = _this._computeMousePositionInDrawingCanvas(event);
                    _this._drawingCanvasContext.lineTo(pos_face.pos.x, pos_face.pos.y);
                    _this._drawingCanvasContext.stroke();
                    _this._drawingMaterial.map.needsUpdate = true;
                    _this._recordAffectedFace(pos_face.face);
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
        for (var i = 0; i < this._geometry.faces.length; i += 1) {
            var face = this._geometry.faces[i];
            face.index = i;
        }
        if (!canvas) {
            canvas = document.createElement('canvas');
        }
        this.canvas = canvas;
        this.canvas.addEventListener('contextmenu', function (e) { return e.preventDefault(); }, false);
        this.canvas.addEventListener('mousedown', this._mousedown, false);
        this.canvas.addEventListener('mousewheel', this._mousewheel, false);
        this.canvas.addEventListener('DOMMouseScroll', this._mousewheel, false); // firefox
        this._drawingVertexUvs = [];
        for (var i = 0; i < this._geometry.vertices.length; i += 1) {
            this._drawingVertexUvs.push(new THREE.Vector3());
        }
        this._nAffectedFaces = 0;
        this._affectedFaces = new Uint32Array(this._geometry.faces.length);
        this._isFaceAffected = new Uint8Array(this._geometry.faces.length);
        this._affectedFacesEmpty = new Uint8Array(this._geometry.faces.length);
        var initializeViewingTexture = function () {
            var singlePixelCanvas = document.createElement('canvas');
            singlePixelCanvas.width = singlePixelCanvas.height = 1;
            var context = singlePixelCanvas.getContext('2d');
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, 1, 1);
            _this._viewingTextureUvs = [];
            var faces = _this._geometry.faces;
            _this._viewingMaterial = new THREE.MeshFaceMaterial();
            for (var i = 0; i < faces.length; i += 1) {
                faces[i].materialIndex = i;
                _this._viewingTextureUvs.push([
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.5, 0.5)
                ]);
                var lambertMaterial = new THREE.MeshLambertMaterial({ map: new THREE.Texture(singlePixelCanvas) });
                lambertMaterial.map.needsUpdate = true;
                _this._viewingMaterial.materials.push(lambertMaterial);
            }
        };
        initializeViewingTexture();
        var initializeDrawingTexture = function () {
            _this._drawingTextureUvs = [];
            var faces = _this._geometry.faces;
            for (var i = 0; i < faces.length; i += 1) {
                _this._drawingTextureUvs.push([
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.5, 0.5)
                ]);
            }
        };
        initializeDrawingTexture();
        this._mesh.geometry = this._geometry;
        this._mesh.material = this._viewingMaterial;
        this._geometry.faceVertexUvs[0] = this._viewingTextureUvs;
        this._geometry.uvsNeedUpdate = true;
        this._usingViewingTexture = true;
        this._drawingTextureMesh.geometry = this._geometry;
        this._drawingTextureMesh.material = this._viewingMaterial;
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
        var canvasRect = this.canvas.getBoundingClientRect();
        var docElement = this.canvas.ownerDocument.documentElement;
        this.canvasBox.left = canvasRect.left + window.pageXOffset - docElement.clientLeft;
        this.canvasBox.top = canvasRect.top + window.pageYOffset - docElement.clientTop;
        this.canvasBox.width = canvasRect.width;
        this.canvasBox.height = canvasRect.height;
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
        var xMax = this._drawingTextureUvs[this._affectedFaces[0]][0].x;
        var xMin = xMax;
        var yMax = Math.abs(this._drawingTextureUvs[this._affectedFaces[0]][0].y - 1);
        var yMin = yMax;
        for (var i = 0; i < this._nAffectedFaces; i += 1) {
            xMax = Math.max(xMax, this._drawingTextureUvs[this._affectedFaces[i]][0].x, this._drawingTextureUvs[this._affectedFaces[i]][1].x, this._drawingTextureUvs[this._affectedFaces[i]][2].x);
            yMax = Math.max(yMax, Math.abs(this._drawingTextureUvs[this._affectedFaces[i]][0].y - 1), Math.abs(this._drawingTextureUvs[this._affectedFaces[i]][1].y - 1), Math.abs(this._drawingTextureUvs[this._affectedFaces[i]][2].y - 1));
            xMin = Math.min(xMin, this._drawingTextureUvs[this._affectedFaces[i]][0].x, this._drawingTextureUvs[this._affectedFaces[i]][1].x, this._drawingTextureUvs[this._affectedFaces[i]][2].x);
            yMin = Math.min(yMin, Math.abs(this._drawingTextureUvs[this._affectedFaces[i]][0].y - 1), Math.abs(this._drawingTextureUvs[this._affectedFaces[i]][1].y - 1), Math.abs(this._drawingTextureUvs[this._affectedFaces[i]][2].y - 1));
        }
        var txmax = xMax * this._drawingCanvas.width;
        var txmin = xMin * this._drawingCanvas.width;
        var tymax = yMax * this._drawingCanvas.height;
        var tymin = yMin * this._drawingCanvas.height;
        this._drawingCanvasContext.rect(xMin * this._drawingCanvas.width, yMin * this._drawingCanvas.height, xMax * this._drawingCanvas.width, yMax * this._drawingCanvas.height);
        this._drawingCanvasContext.clip();
        var localCanvas = document.createElement('canvas');
        localCanvas.width = txmax - txmin;
        localCanvas.height = tymax - tymin;
        localCanvas.getContext('2d').drawImage(this._drawingCanvas, txmin, tymin, txmax - txmin, tymax - tymin, 0, 0, txmax - txmin, tymax - tymin);
        for (var i = 0; i < this._nAffectedFaces; i++) {
            var faceIndex = this._affectedFaces[i];
            var faceMaterial = this._viewingMaterial.materials[faceIndex];
            faceMaterial.map.image = localCanvas;
            faceMaterial.map.needsUpdate = true;
            for (var j = 0; j < 3; j += 1) {
                var drawingUV = this._drawingTextureUvs[faceIndex][j];
                this._viewingTextureUvs[faceIndex][j].setX((drawingUV.x - xMin) * (this._drawingCanvas.width) / (txmax - txmin)).setY((drawingUV.y - 1 + yMax) * (this._drawingCanvas.height) / (tymax - tymin));
            }
        }
        this._nAffectedFaces = 0;
        this._isFaceAffected.set(this._affectedFacesEmpty);
        this._mesh.material = this._viewingMaterial;
        this._geometry.faceVertexUvs[0] = this._viewingTextureUvs;
        this._geometry.uvsNeedUpdate = true;
        this._usingViewingTexture = true;
    };
    Chameleon.prototype._useDrawingTexture = function () {
        // If already using the drawing texture, do nothing
        if (!this._usingViewingTexture) {
            return;
        }
        this._renderer.render(this._drawingTextureScene, this._camera);
        this._drawingCanvas.width = this._renderer.domElement.width;
        this._drawingCanvas.height = this._renderer.domElement.height;
        this._drawingCanvasContext.drawImage(this._renderer.domElement, 0, 0);
        this._drawingMaterial.map.needsUpdate = true;
        for (var i = 0; i < this._geometry.vertices.length; i += 1) {
            this._drawingVertexUvs[i].copy(this._geometry.vertices[i]).project(this._camera);
            this._drawingVertexUvs[i].x = (this._drawingVertexUvs[i].x + 1) / 2;
            this._drawingVertexUvs[i].y = (this._drawingVertexUvs[i].y + 1) / 2;
        }
        for (var i = 0; i < this._geometry.faces.length; i += 1) {
            this._drawingTextureUvs[i][0].copy(this._drawingVertexUvs[this._geometry.faces[i].a]);
            this._drawingTextureUvs[i][1].copy(this._drawingVertexUvs[this._geometry.faces[i].b]);
            this._drawingTextureUvs[i][2].copy(this._drawingVertexUvs[this._geometry.faces[i].c]);
        }
        this._mesh.material = this._drawingMaterial;
        this._geometry.faceVertexUvs[0] = this._drawingTextureUvs;
        this._geometry.uvsNeedUpdate = true;
        this._usingViewingTexture = false;
    };
    Chameleon.prototype._castRayFromMouse = function (event) {
        var canvasPos = this._getMousePositionInCanvas(event, true);
        var mouse3d = new THREE.Vector3(canvasPos.x * 2 - 1, -canvasPos.y * 2 + 1, Chameleon.CAMERA_NEAR).unproject(this._camera).sub(this._camera.position).normalize();
        return new THREE.Raycaster(this._camera.position, mouse3d, Chameleon.CAMERA_NEAR).intersectObject(this._mesh);
    };
    Chameleon.prototype._recordAffectedFace = function (faceIndex) {
        if (faceIndex >= 0 && !this._isFaceAffected[faceIndex]) {
            this._affectedFaces[this._nAffectedFaces] = faceIndex;
            this._isFaceAffected[faceIndex] = 1;
            this._nAffectedFaces += 1;
        }
    };
    Chameleon.CAMERA_NEAR = 0.5;
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
