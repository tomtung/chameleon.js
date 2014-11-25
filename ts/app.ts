/// <reference path="./three.d.ts" />
/// <reference path="./dat.gui.d.ts" />
/// <reference path="./chameleon.ts" />

(() => {
    function getGeometry() {
        return new THREE.CylinderGeometry(1, 1, 2);
    }

    var chameleon = Chameleon.create(getGeometry());
    document.body.appendChild(chameleon.canvas);

    var onresize = () => {
        chameleon.canvas.height = window.innerHeight;
        chameleon.canvas.width = window.innerWidth;
        chameleon.handleResize();
    };
    onresize();
    window.addEventListener('resize', onresize, false);

    // Render loop
    var render = () => {
        chameleon.update();
        requestAnimationFrame(render);
    };

    render();
})();

