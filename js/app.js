/// <reference path="./three.d.ts" />
/// <reference path="./three-trackballcontrols.d.ts" />
/// <reference path="./dat.gui.d.ts" />
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
    function setUpDrawingEvents(canvas, camera, mesh, param) {
        // TODO this is where we put drawing logic
        canvas.addEventListener('mousedown', function (e) {
            if (event.shiftKey) {
                return;
            }
            var mouse3D = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
            mouse3D.unproject(camera).sub(camera.position).normalize();
            var raycaster = new THREE.Raycaster(camera.position, mouse3D);
            var intersects = raycaster.intersectObject(mesh);
            if (intersects.length > 0) {
                // For the moment simply change color of the entire face
                // TODO change this to drawing logic
                intersects[0].face.color.set(param.color);
                mesh.geometry.colorsNeedUpdate = true;
            }
        });
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
        var controls = new THREE.TrackballControls(camera);
        controls.staticMoving = true;
        controls.rotateSpeed = 1.5;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        var renderer = createRenderer();
        var canvas = renderer.domElement;
        setUpDrawingEvents(canvas, camera, mesh, controlParam);
        document.body.appendChild(canvas);
        // Render loop
        var doRender = function () {
            controls.update();
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
