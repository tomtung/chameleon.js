/// <reference path="./three.d.ts" />
/// <reference path="./dat.gui.d.ts" />
/// <reference path="./chameleon.ts" />

(() => {

    function createMesh(): THREE.Mesh {
        // TODO replace with a more interesting object
        // TODO Note that it mush be a Mesh object
        var geometry = new THREE.CylinderGeometry(1, 1, 2);
        var material = new THREE.MeshLambertMaterial();
        material.side = THREE.DoubleSide;
        material.vertexColors = THREE.FaceColors;
        return new THREE.Mesh(geometry, material);
    }

    function createScene(): THREE.Scene {
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

    function createCamera(): THREE.PerspectiveCamera {
        var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        camera.position.z = 5;
        return camera;
    }

    function createRenderer(): THREE.Renderer {
        var renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xAAAAAA, 1.0);
        return renderer;
    }

    function setUpDatGui(): any {
        var param = {
            color: "#439814",
            headLightBrightness: 0.4
        };
        var gui = new dat.GUI();
        gui.addColor(param, "color").name('Color');
        gui.add(param, 'headLightBrightness', 0, 1).step(0.1).name('Brightness');

        return param;
    }

    function prepareToRender(): ()=>void {
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
        var doRender = () => {
            controls.updateCamera();

            headLight.position.copy(camera.position);
            headLight.intensity = controlParam.headLightBrightness;

            renderer.render(scene, camera);
            requestAnimationFrame(doRender);
        };

        window.addEventListener('resize', ()=> {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            controls.handleResize();
        }, false);

        return doRender;
    }

    prepareToRender()();
})();