/// <reference path="./common.ts" />

module Chameleon {
    var mouseProjectionOnBall = (() => {
        var projGlobal = new THREE.Vector3(),
            projLocal = new THREE.Vector3();
        var upFactor = new THREE.Vector3(),
            eyeFactor = new THREE.Vector3(),
            sideFactor = new THREE.Vector3();

        return (event: MouseEvent,
                canvasBox: Box,
                up: THREE.Vector3,
                eye: THREE.Vector3): THREE.Vector3 => {
            projLocal.set(
                (event.pageX - canvasBox.width * 0.5 - canvasBox.left) / (canvasBox.width * .5),
                (canvasBox.height * 0.5 + canvasBox.top - event.pageY) / (canvasBox.height * .5),
                0.0
            );

            var lengthSq = projLocal.lengthSq();
            if (lengthSq > 1.0) {
                projLocal.normalize();
            } else {
                projLocal.z = Math.sqrt(1.0 - lengthSq);
            }

            sideFactor.copy(up).cross(eye).setLength(projLocal.x);
            upFactor.copy(up).setLength(projLocal.y);
            eyeFactor.copy(eye).setLength(projLocal.z);

            return projGlobal.copy(sideFactor).add(upFactor).add(eyeFactor);
        };
    })();

    export enum CameraControlsState {
        Idle, Pan, Rotate
    }

    export class CameraControlsBase {
        rotateSpeed: number = 1.5;
        panSpeed: number = 0.8;
        zoomSpeed: number = 1.2;

        _state: CameraControlsState = CameraControlsState.Idle;
        _eye: THREE.Vector3 = new THREE.Vector3();
        target: THREE.Vector3 = new THREE.Vector3();
        _rotateStart: THREE.Vector3 = new THREE.Vector3();
        _rotateEnd: THREE.Vector3 = new THREE.Vector3();
        _zoomStart: number = 0;
        _zoomEnd: number = 0;
        _panStart: THREE.Vector2 = new THREE.Vector2();
        _panEnd: THREE.Vector2 = new THREE.Vector2();

        _getMousePositionInCanvas(event: MouseEvent) {
            var pos = mousePositionInCanvas(event, this.canvasBox);
            pos.x /= this.canvasBox.width;
            pos.y /= this.canvasBox.height;
            return pos;
        }

        _getMouseProjectionOnBall(event: MouseEvent) {
            return mouseProjectionOnBall(event, this.canvasBox, this.camera.up, this._eye);
        }

        constructor(public camera: THREE.Camera,
                    public canvasBox: Box) {
        }

        rotateCamera = (() => {
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
            var factor = 1.0 + (this._zoomEnd - this._zoomStart) * this.zoomSpeed;
            if (factor !== 1.0 && factor > 0.0) {
                (<any>this.camera).zoom *= factor;
                this._zoomStart = this._zoomEnd;
                (<any>this.camera).updateProjectionMatrix();
            }
        }

        panCamera = (() => {
            var mouseChange = new THREE.Vector2(),
                cameraUp = new THREE.Vector3(),
                pan = new THREE.Vector3();

            return () => {
                mouseChange.subVectors(this._panEnd, this._panStart);
                if (mouseChange.lengthSq()) {
                    mouseChange.multiplyScalar(this._eye.length() * this.panSpeed);
                    pan.crossVectors(this._eye, this.camera.up).setLength(mouseChange.x).add(
                        cameraUp.copy(this.camera.up).setLength(mouseChange.y)
                    );
                    this.camera.position.add(pan);
                    this.target.add(pan);
                    this._panStart.copy(this._panEnd);
                }
            }
        })();

        updateCamera() {
            this._eye.subVectors(this.camera.position, this.target);

            this.rotateCamera();
            this.zoomCamera();
            this.panCamera();

            this.camera.position.addVectors(this.target, this._eye);
            this.camera.lookAt(this.target);
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
                delta = -event.wheelDelta / 40;
            } else if (event.detail) { // Firefox
                delta = event.detail / 3;
            }
            this._zoomStart += delta * 0.01;
        };
    }

    /**
     * A simplification of THREE.TrackballControls from the three.js examples
     */
    export class PerspectiveCameraControls extends CameraControlsBase {
        handleResize() {
            this.camera.aspect = this.canvasBox.width / this.canvasBox.height;
            this.camera.updateProjectionMatrix();
        }

        constructor(public camera: THREE.PerspectiveCamera,
                    public canvasBox: Box) {
            super(camera, canvasBox);
        }
    }

    /**
     * A simplification of THREE.OrthographicTrackballControls from the three.js examples
     */
    export class OrthographicCameraControls extends CameraControlsBase {
        private _center0: THREE.Vector2;
        private _viewSize: number;

        handleResize() {
            this.camera.top = this._center0.y + this._viewSize / 2;
            this.camera.bottom = this._center0.y - this._viewSize / 2;

            var ratio = this.canvasBox.width / this.canvasBox.height;
            this.camera.left = this._center0.x - this._viewSize / 2 * ratio;
            this.camera.right = this._center0.x + this._viewSize / 2 * ratio;

            this.camera.updateProjectionMatrix();
        }

        constructor(public camera: THREE.OrthographicCamera,
                    public canvasBox: Box) {
            super(camera, canvasBox);
            this._center0 = new THREE.Vector2(
                (camera.left + camera.right) / 2,
                (camera.top + camera.bottom) / 2
            );
            this._viewSize = camera.top - camera.bottom;
            this.handleResize();
        }
    }

}