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

    export enum TextureInUse {
        Viewing, Drawing, Packed
    }

    /**
     * Manages the drawing, viewing, and packed textures
     */
    export class TextureManager {
        private _textureInUse: TextureInUse;
        private _mesh: THREE.Mesh;
        private _renderer: THREE.WebGLRenderer;
        private _camera: THREE.OrthographicCamera;
        private _viewingTextureUvs: THREE.Vector2[][];
        private _viewingMaterial: THREE.MeshFaceMaterial;
        private _packedTextureUvs: THREE.Vector2[][];
        private _packedTextureCanvas: HTMLCanvasElement;
        private _packedTextureMaterial: THREE.MeshLambertMaterial;
        private _drawingTextureUvs: THREE.Vector2[][];
        private _drawingCanvas: HTMLCanvasElement;
        private _drawingMaterial: THREE.MeshLambertMaterial;
        private _drawingTextureMesh: THREE.Mesh;
        private _drawingTextureScene: THREE.Scene;
        private _drawingVertexUvs: THREE.Vector2[];
        private _affectedFaces: AffectedFacesRecorder;
        private _prePos: THREE.Vector2 = new THREE.Vector2();
        private _preIndex: number = 0;
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

        get geometry() {
            return this._mesh.geometry;
        }

        get packedTexture() {
            return this._packedTextureCanvas;
        }

        useViewingTexture(): TextureManager {
            if (this._textureInUse !== TextureInUse.Viewing) {
                if (this._textureInUse === TextureInUse.Drawing) {
                    this._updateViewingFromDrawingTexture();
                }

                this._applyViewingTexture();
                this._textureInUse = TextureInUse.Viewing;
            }

            return this;
        }

        useDrawingTexture(): TextureManager {
            if (this._textureInUse !== TextureInUse.Drawing) {
                this.useViewingTexture()._generateDrawingFromViewingTexture()._applyDrawingTexture();
                this._textureInUse = TextureInUse.Drawing;
            }

            return this;
        }

        usePackedTexture(): TextureManager {
            if (this._textureInUse !== TextureInUse.Packed) {
                this.useViewingTexture()._generatePackedFromViewingTexture()._applyPackedTexture();
                this._textureInUse = TextureInUse.Packed;
            }

            return this;
        }

        backgroundReset() {
            this.useViewingTexture();

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

        private _initializeViewingTexture(): TextureManager {
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
        private _initializeDrawingTexture(): TextureManager {
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

        private _initializePackedTexture(): TextureManager {
            this._packedTextureUvs = [];
            var faces = this.geometry.faces;
            for (var i = 0; i < faces.length; i += 1) {
                this._packedTextureUvs.push([
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.5, 0.5)
                ]);
            }

            this._packedTextureCanvas = document.createElement('canvas');
            this._packedTextureMaterial = new THREE.MeshLambertMaterial({
                map: new THREE.Texture(this._packedTextureCanvas)
            });

            return this;
        }

        private _updateViewingFromDrawingTexture(): TextureManager {
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

        private _applyViewingTexture(): TextureManager {
            this._mesh.material = this._viewingMaterial;
            this._mesh.geometry.faceVertexUvs[0] = this._viewingTextureUvs;
            this._mesh.geometry.uvsNeedUpdate = true;

            return this;
        }

        private _generatePackedFromViewingTexture(): TextureManager {
            var patches: {canvas: HTMLCanvasElement; isRotated: boolean; faceIndices: number[]}[] = [];

            // Collect all unique texture patches to be packed
            for (var faceIndex = 0; faceIndex < this.geometry.faces.length; faceIndex += 1) {
                var faceCanvas = <HTMLCanvasElement>(
                    <THREE.MeshLambertMaterial>this._viewingMaterial.materials[faceIndex]
                ).map.image;

                for (var patchIndex = 0; patchIndex < patches.length; patchIndex += 1) {
                    var patch = patches[patchIndex];
                    if (faceCanvas === patch.canvas) {
                        patch.faceIndices.push(faceIndex);
                        break;
                    }
                }

                if (patchIndex === patches.length) {
                    patches.push({
                        canvas: faceCanvas,
                        isRotated: false, // we will do the rotation after all patches are collected
                        faceIndices: [faceIndex]
                    });
                }
            }

            var patchTotalArea = 0;
            // Rotate patches so that all of them are taller than they are wide
            for (var patchIndex = 0; patchIndex < patches.length; patchIndex += 1) {
                var patch = patches[patchIndex];
                patchTotalArea += patch.canvas.width * patch.canvas.height;

                if (patch.canvas.width > patch.canvas.height) {
                    var rotatedCanvas = <HTMLCanvasElement>document.createElement('canvas');
                    rotatedCanvas.width = patch.canvas.height;
                    rotatedCanvas.height = patch.canvas.width;

                    var rotatedCtx = rotatedCanvas.getContext("2d");
                    rotatedCtx.translate(rotatedCanvas.width, 0);
                    rotatedCtx.rotate(90 * Math.PI / 180);
                    rotatedCtx.drawImage(patch.canvas, 0, 0);

                    patch.canvas = rotatedCanvas;
                    patch.isRotated = true;
                }
            }

            // Sort patches by height
            patches.sort((l, r) => r.canvas.height - l.canvas.height);

            var packedTextureSideLength = Math.max(
                Math.floor(Math.sqrt(patchTotalArea) * 1.5),
                patches[0].canvas.height
            );

            // Prepare the one big canvas to hold all patches
            this._packedTextureCanvas.width = this._packedTextureCanvas.height = packedTextureSideLength;
            var packedTextureCtx = this._packedTextureCanvas.getContext("2d");

            // Finally iterate through each patch and put them on the packed texture, while updating UV values

            // Keep track of the current maximum y value (+1) for each column in the packed texture
            // The is used to implement the 'push upwards' operation described in Igarashi's paper
            var yBuffer = new Int32Array(packedTextureSideLength);

            var currPatchRow = 0,
                patchIndex = 0,
                remainingHeight = packedTextureSideLength;

            while (remainingHeight > 0 && patchIndex < patches.length) {
                remainingHeight -= patches[patchIndex].canvas.height;

                var remainingWidth = packedTextureSideLength;
                var isEvenRow = (currPatchRow % 2 == 0);

                while (remainingWidth > 0 && patchIndex < patches.length && patches[patchIndex].canvas.width <= remainingWidth) {
                    var currentPatch = patches[patchIndex];

                    // Draw the current patch on packed texture canvas

                    // Folding--pack left to right in even rows (starting from 0), right to left in odd rows
                    var x = isEvenRow ? packedTextureSideLength - remainingWidth : remainingWidth - currentPatch.canvas.width;
                    // 'Push each patch upward until it hits another patch to minimize the gap'
                    var y = yBuffer[x];
                    for (var i = x; i < (x + currentPatch.canvas.width); i += 1) {
                        y = Math.max(yBuffer[i], y);
                    }
                    packedTextureCtx.drawImage(currentPatch.canvas, x, y);

                    // Update y buffer accordingly
                    for (var i = x; i < (x + currentPatch.canvas.width); i += 1) {
                        yBuffer[i] = y + currentPatch.canvas.height;
                    }

                    // Enumerate all faces that uses the current patch as their texture, and compute their packed texture UVs
                    for (var i = 0; i < currentPatch.faceIndices.length; i += 1) {
                        var faceIndex = currentPatch.faceIndices[i];
                        var packingUvs = this._packedTextureUvs[faceIndex];
                        var viewingUvs = this._viewingTextureUvs[faceIndex];

                        if (currentPatch.isRotated) {
                            for (var j = 0; j < 3; j += 1) {
                                packingUvs[j].setX(
                                    (viewingUvs[j].y * currentPatch.canvas.width + x) / packedTextureSideLength
                                ).setY(
                                    (packedTextureSideLength - y - viewingUvs[j].x * currentPatch.canvas.height) / packedTextureSideLength
                                );
                            }
                        } else {
                            for (var j = 0; j < 3; j += 1) {
                                packingUvs[j].setX(
                                    (viewingUvs[j].x * currentPatch.canvas.width + x) / packedTextureSideLength
                                ).setY(
                                    (packedTextureSideLength - y - (1 - viewingUvs[j].y) * currentPatch.canvas.height) / packedTextureSideLength
                                );
                            }

                        }
                    }

                    remainingWidth -= currentPatch.canvas.width;
                    patchIndex += 1;
                }

                currPatchRow += 1;
            }

            this._packedTextureMaterial.map.needsUpdate = true;
            this.geometry.uvsNeedUpdate = true;

            return this;
        }

        private _applyPackedTexture(): TextureManager {
            this._mesh.material = this._packedTextureMaterial;
            this._mesh.geometry.faceVertexUvs[0] = this._packedTextureUvs;
            this._mesh.geometry.uvsNeedUpdate = true;

            return this;
        }

        private _generateDrawingFromViewingTexture(): TextureManager {
            console.assert(this._textureInUse === TextureInUse.Viewing);

            // Assumption: when _renderer is created, 'alpha' must be set to true
            var originalClearAlpha = this._renderer.getClearAlpha();
            var originalClearColor = this._renderer.getClearColor().clone();
            this._renderer.setClearColor(0, 0);

            this._renderer.render(this._drawingTextureScene, this._camera);
            this._drawingCanvas.width = this._renderer.domElement.width;
            this._drawingCanvas.height = this._renderer.domElement.height;

            this.drawingContext.drawImage(this._renderer.domElement, -2, 0);
            this.drawingContext.drawImage(this._renderer.domElement, 2, 0);
            this.drawingContext.drawImage(this._renderer.domElement, 0, -2);
            this.drawingContext.drawImage(this._renderer.domElement, 0, 2);
            this.drawingContext.drawImage(this._renderer.domElement, 0, 0);

            this._drawingMaterial.map.needsUpdate = true;

            var projectedPosition = new THREE.Vector3();
            for (var i = 0; i < this.geometry.vertices.length; i += 1) {
                projectedPosition.copy(this.geometry.vertices[i]).project(this._camera);
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

            this._renderer.setClearColor(originalClearColor, originalClearAlpha);
            return this;
        }

        private _applyDrawingTexture(): TextureManager {
            this._mesh.material = this._drawingMaterial;
            this._mesh.geometry.faceVertexUvs[0] = this._drawingTextureUvs;
            this._mesh.geometry.uvsNeedUpdate = true;

            return this;
        }

        private _castRayFromMouse(canvasPos: THREE.Vector2): THREE.Intersection[] {
            var mouse3d = new THREE.Vector3(
                canvasPos.x / this._drawingCanvas.width * 2 - 1,
                -canvasPos.y / this._drawingCanvas.height * 2 + 1,
                -1.0
            );
            var direction = new THREE.Vector3(mouse3d.x, mouse3d.y, 1.0);

            mouse3d.unproject(this._camera);
            direction.unproject(this._camera).sub(mouse3d).normalize();

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

        private _intersect(v1: THREE.Vector2, v2: THREE.Vector2, v3: THREE.Vector2, v4: THREE.Vector2) {
            var a = v1.x, b = v1.y, c = v2.x, d = v2.y,
                p = v3.x, q = v3.y, r = v4.x, s = v4.y;
            var det, gamma, lambda;
            det = (c - a) * (s - q) - (r - p) * (d - b);
            if (det === 0) {
                return false;
            } else {
                lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
                gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
                return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
            }
        }

        private _add_recursive(faceIndex: number, center: THREE.Vector2, radius: number, start: boolean, prePos: THREE.Vector2) {
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

                var insidepre = false;
                var diff = new THREE.Vector2();
                diff.set(center.y - prePos.y, -(center.x - prePos.x));
                diff.normalize().multiplyScalar(radius);
                var v5 = new THREE.Vector2();
                var v6 = new THREE.Vector2();
                var v7 = new THREE.Vector2();
                var v8 = new THREE.Vector2();
                v5.copy(prePos).add(diff);
                v6.copy(prePos).sub(diff);
                v7.copy(center).add(diff);
                v8.copy(center).sub(diff);
                if (this._pointInTriangle(v5, v1, v2, v3))
                    insidepre = true;
                if (this._pointInTriangle(v6, v1, v2, v3))
                    insidepre = true;
                if (this._pointInTriangle(v7, v1, v2, v3))
                    insidepre = true;
                if (this._pointInTriangle(v8, v1, v2, v3))
                    insidepre = true;
                if (this._pointInTriangle(v1, v5, v6, v7) || this._pointInTriangle(v1, v6, v7, v8))
                    insidepre = true;
                if (this._pointInTriangle(v2, v5, v6, v7) || this._pointInTriangle(v2, v6, v7, v8))
                    insidepre = true;
                if (this._pointInTriangle(v3, v5, v6, v7) || this._pointInTriangle(v3, v6, v7, v8))
                    insidepre = true;
                if (this._intersect(v5, v6, v1, v2) || this._intersect(v5, v6, v2, v3) || this._intersect(v5, v6, v3, v1))
                    insidepre = true;
                if (this._intersect(v5, v7, v1, v2) || this._intersect(v5, v7, v2, v3) || this._intersect(v5, v7, v3, v1))
                    insidepre = true;
                if (this._intersect(v6, v8, v1, v2) || this._intersect(v6, v8, v2, v3) || this._intersect(v6, v8, v3, v1))
                    insidepre = true;
                if (this._intersect(v7, v8, v1, v2) || this._intersect(v7, v8, v2, v3) || this._intersect(v7, v8, v3, v1))
                    insidepre = true;

                if (inside || collide1 || collide2 || collide3 || insidepre) {
                    this._isFloodFill[faceIndex] = 1;
                    this._affectedFaces.add(faceIndex);
                    for (var i = 0; i < this._nAdjacentFaces[faceIndex]; i += 1) {
                        var newfaceIndex = this._AdjacentFacesList[faceIndex][i];
                        var cameradirection = new THREE.Vector3();
                        cameradirection.copy(this._camera.position);
                        cameradirection.normalize();
                        if (this.geometry.faces[newfaceIndex].normal.dot(cameradirection) > 0) {
                            this._add_recursive(newfaceIndex, center, radius, start, prePos);
                        }
                    }
                }
            }
        }

        public onStrokePainted(canvasPos: THREE.Vector2, radius: number, start: boolean): TextureManager {
            var intersections = this._castRayFromMouse(canvasPos);
            if (intersections.length > 0) {
                this._drawingMaterial.map.needsUpdate = true;
                var faceIndex = intersections[0].face.materialIndex;
                this._isFloodFill.set(this._isFloodFillEmpty);
                this._add_recursive(faceIndex, canvasPos, radius, start, this._prePos);
                if (start == false)
                    this._add_recursive(this._preIndex, canvasPos, radius, start, this._prePos);
                this._prePos = canvasPos;
                this._preIndex = faceIndex;
            }

            return this;
        }

        // Assumption on geometry: material indices are same to face indices.
        // This special treatment is implemented in the constructor of Controls
        constructor(mesh: THREE.Mesh,
                    renderer: THREE.WebGLRenderer,
                    camera: THREE.OrthographicCamera) {
            this._mesh = mesh;
            this._renderer = renderer;
            this._camera = camera;

            this._affectedFaces = new AffectedFacesRecorder(this.geometry.faces.length);

            this._initializeViewingTexture().
                _initializePackedTexture().
                _initializeDrawingTexture().
                _applyViewingTexture();
            this._textureInUse = TextureInUse.Viewing;

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
                            if (this.geometry.vertices[vi[k]].x - this.geometry.vertices[vj[l]].x < EPSILON &&
                                this.geometry.vertices[vi[k]].x - this.geometry.vertices[vj[l]].x > -EPSILON &&
                                this.geometry.vertices[vi[k]].y - this.geometry.vertices[vj[l]].y < EPSILON &&
                                this.geometry.vertices[vi[k]].y - this.geometry.vertices[vj[l]].y > -EPSILON &&
                                this.geometry.vertices[vi[k]].z - this.geometry.vertices[vj[l]].z < EPSILON &&
                                this.geometry.vertices[vi[k]].z - this.geometry.vertices[vj[l]].z > -EPSILON &&
                                this.geometry.faces[i].normal.dot(this.geometry.faces[j].normal) > EPSILON)
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
    }

}