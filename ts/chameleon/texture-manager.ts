/// <reference path="./common.ts" />

module Chameleon {

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

        forEach(f: (int) => any) {
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
    export class TextureManager {
        private _viewingTextureUvs: THREE.Vector2[][];
        private _viewingMaterial: THREE.MeshFaceMaterial;
        private _drawingTextureUvs: THREE.Vector2[][];
        private _drawingCanvas: HTMLCanvasElement;
        private _drawingMaterial: THREE.MeshLambertMaterial;
        private _drawingTextureMesh: THREE.Mesh;
        private _drawingTextureScene: THREE.Scene;
        private _drawingVertexUvs: THREE.Vector2[];
        private _affectedFaces: AffectedFacesRecorder;
        private _isFloodFillEmpty: Uint8Array;
        private _isFloodFill: Uint8Array;
        private _nAdjacentFaces: Uint8Array;
        private _AdjacentFacesList: Uint32Array[];
        private _backgroundSinglePixelCanvas = <HTMLCanvasElement>document.createElement('canvas');
        backgroundColor: string = '#FFFFFF';

        get drawingContext() {
            return this._drawingCanvas.getContext('2d');
        }

        get drawingCanvas() {
            return this._drawingCanvas;
        }

        backgroundReset() {
            var context = this._backgroundSinglePixelCanvas.getContext('2d');
            context.beginPath();
            context.fillStyle = this.backgroundColor;
            context.fillRect(0, 0, 1, 1);

            for (var i = 0; i < this.geometry.faces.length; i += 1) {
                var faceMaterial = <THREE.MeshLambertMaterial>this._viewingMaterial.materials[i];
                faceMaterial.map.image = this._backgroundSinglePixelCanvas;
                faceMaterial.map.needsUpdate = true;
                for (var j = 0; j < this._viewingTextureUvs[i].length; j += 1) {
                    this._viewingTextureUvs[i][j].set(0.5, 0.5);
                }
            }
        }

        initializeViewingTexture(): TextureManager {
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
                map: new THREE.Texture(this._drawingCanvas),
                transparent: true
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

            this.renderer.setClearColor(originalClearColor, originalClearAlpha);
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
                -10000
            ).unproject(this.camera);

            var direction = new THREE.Vector3(0, 0, -1).transformDirection(this.camera.matrixWorld);

            return new THREE.Raycaster(
                mouse3d,
                direction
            ).intersectObject(this._drawingTextureMesh);
        }

        private _pointCircleCollide(point, circle, r) {
            if (r === 0) return false;
            var dx = circle.x - point.x;
            var dy = circle.y - point.y;
            return dx * dx + dy * dy <= r * r;
        }

        private _lineCircleCollide(a, b, circle, radius) {
            //check to see if start or end points lie within circle
            if (this._pointCircleCollide(a, circle, radius)) {
                return true;
            }

            if (this._pointCircleCollide(b, circle, radius)) {
                return true;
            }

            var x1 = a.x, y1 = a.y,
                x2 = b.x, y2 = b.y,
                cx = circle.x, cy = circle.y;

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
            return this._pointCircleCollide(nearest, circle, radius)
                && pLen2 <= dLen2 && (px * dx + py * dy) >= 0;
        }

        private _pointInTriangle(point, t0, t1, t2) {
            //compute vectors & dot products
            var cx = point.x, cy = point.y,
                v0x = t2.x - t0.x, v0y = t2.y - t0.y,
                v1x = t1.x - t0.x, v1y = t1.y - t0.y,
                v2x = cx - t0.x, v2y = cy - t0.y,
                dot00 = v0x * v0x + v0y * v0y,
                dot01 = v0x * v1x + v0y * v1y,
                dot02 = v0x * v2x + v0y * v2y,
                dot11 = v1x * v1x + v1y * v1y,
                dot12 = v1x * v2x + v1y * v2y;

            // Compute barycentric coordinates
            var b = (dot00 * dot11 - dot01 * dot01),
                inv = b === 0 ? 0 : (1 / b),
                u = (dot11 * dot02 - dot01 * dot12) * inv,
                v = (dot00 * dot12 - dot01 * dot02) * inv;
            return u >= 0 && v >= 0 && (u + v <= 1);
        }

        private _add_recursive(faceIndex: number, center: THREE.Vector2, radius: number) {
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
        }

        public onStrokePainted(canvasPos: THREE.Vector2, radius: number): TextureManager {
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
        }

        // Assumption on geometry: material indices are same to face indices.
        // This special treatment is implemented in the constructor of Controls
        constructor(public geometry: THREE.Geometry,
                    public renderer: THREE.WebGLRenderer,
                    public camera: THREE.OrthographicCamera) {

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
                            if (this.geometry.vertices[vi[k]].x == this.geometry.vertices[vj[l]].x &&
                                this.geometry.vertices[vi[k]].y == this.geometry.vertices[vj[l]].y &&
                                this.geometry.vertices[vi[k]].z == this.geometry.vertices[vj[l]].z &&
                                this.geometry.faces[i].normal.dot(this.geometry.faces[j].normal) > 0)
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
    }

}