/**
 * A simple huiman body visualizer.
 * 
 */
import * as THREE from '/three/build/three.module.js';
import { OrbitControls } from '/three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from '/three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from '/three/examples/jsm/loaders/GLTFLoader.js';
import { FontLoader } from '/three/examples/jsm/loaders/FontLoader.js';
import { RectAreaLightHelper } from '/three/examples/jsm/helpers/RectAreaLightHelper.js';
import { TextGeometry } from '/three/examples/jsm/geometries/TextGeometry.js';
//import Stats from '/three/examples/jsm/libs/stats.module.js'

const scene = new THREE.Scene()
//scene.add(new THREE.AxesHelper(5))
//scene.fog = new THREE.Fog( 0xaaaaaa, 30, 100 );

const rectLight1 = new THREE.RectAreaLight( 0xffffff, 2.5, 40, 40 );
rectLight1.position.set( 10, 10, 2 );
rectLight1.lookAt( 0, 0, 0 );
scene.add( rectLight1 )
//const rectLightHelper1 = new RectAreaLightHelper( rectLight1 );
//rectLight1.add( rectLightHelper1 );

const rectLight2 = new THREE.RectAreaLight( 0xff8855, 3, 4, 4 );
rectLight2.position.set( -10, 17, 2 );
rectLight2.lookAt( 0, 0, 0 );
scene.add( rectLight2 )
//const rectLightHelper2 = new RectAreaLightHelper( rectLight2 );
//rectLight2.add( rectLightHelper2 );

// For the ground
const mesh = new THREE.Mesh( 
    new THREE.CylinderGeometry( 5, 5, 0.2, 1000 ), 
    new THREE.MeshMatcapMaterial( { color: 0x202020} ) );
mesh.onclick = () => {console.log('click');};
mesh.material.transparent = true;
mesh.material.opacity = 0.3;
mesh.receiveShadow = true;
scene.add( mesh );

const grid = new THREE.GridHelper( 20, 10, 0x555555, 0x555555 );
grid.material.transparent = true;
grid.material.opacity = 0.5;
//scene.add( grid );

const ambientLight = new THREE.AmbientLight()
scene.add(ambientLight)

let modelReady = false;

const camera = new THREE.PerspectiveCamera(2.5, window.innerWidth / window.innerHeight, 1.0, 1000)
const boom = new THREE.Group();
boom.add(camera);
scene.add(boom);
camera.position.set( 0, 40, 250 ); // this sets the boom's length 
//camera.lookAt( 3000, 500, 300 ); // camera looks at the boom's zero

const renderer = new THREE.WebGLRenderer({'antialias':true, 'alpha':true})
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.mouseButtons = {
	LEFT: THREE.MOUSE.ROTATE,
	MIDDLE: THREE.MOUSE.DOLLY,
	RIGHT: THREE.MOUSE.PAN
}
controls.enableDamping = true;
controls.target.set(0, 4, 0);

const loader = new FontLoader();
loader.load( './three/examples/fonts/helvetiker_bold.typeface.json', function ( font ) {
  const THB = "The Human Body";
	const t1 = new TextGeometry( THB, {
		font: font,
		size: 0.5,
		height: 0.1,
		depth: 0.4,
		curveSegments: 120,
	} );
  const mesh = new THREE.Mesh( t1, new THREE.MeshPhysicalMaterial( { 
    color: 0xfa8e41,
    metalness: 0.5,
    reflectivity: 0.9,
    clearcoat: 0.1,
    clearcoatRoughness: 0.9,
    sheen: 0.5,
    sheenRoughness: 0.8

    } ) );
  mesh.material.transparent = true;
  mesh.material.opacity = 0.8;
  mesh.receiveShadow = true;
  mesh.position.set(1, 7, 0);
  scene.add( mesh );
  t1.position = (0, 3, 0);
} );

let mixer = undefined;

let humanBody = undefined;

const gltfLoader = new GLTFLoader()
gltfLoader.load(
    'body.glb',
    (object) => {
        mixer = new THREE.AnimationMixer(object.scene);
        //for (var i in object.animations) {
        //  console.log(i);
        //  console.log(object.animations[i].name);
        //}
        //let idle = mixer.clipAction(object.animations[0]);
        //idle.play();
        //let idle2 = mixer.clipAction(object.animations[2]);
        //idle2.play();
        modelReady = true;
        object.scene.translateY(0.5);
        object.scene.scale.set(5,5,5);
        scene.add(object.scene);
        humanBody = object.scene;
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
        console.log(error)
    }
)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

//const stats = Stats()
//document.body.appendChild(stats.dom)

const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  if (modelReady) mixer.update(clock.getDelta());
  controls.update()
  //stats.update()
  //boom.rotation.y -= 0.001;
  //if (humanBody) {
  //  humanBody.rotation.y += -0.001;
  //}
  render()
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
var mouseDown = 0;
var stillDown = 0;

var px = 0;

function render() {

    var minT = new THREE.Vector3( -0.5, 2, -0.5 );
    var maxT = new THREE.Vector3( 1, 4, 1 );
    var minC = new THREE.Vector3( -20, 20, 220 );
    var maxC = new THREE.Vector3( 20, 80, 280 );

    px += 0.003;
    let npx = 55 * Math.sin(px);
    let npy = 55 * Math.sin(px) * Math.cos(px);
    
    raycaster.setFromCamera( pointer, camera );
    const intersects = raycaster.intersectObjects( scene.children );
    for ( let i = 0; i < intersects.length; i ++ ) {
      //intersects[ i ].object.material.color.set( 0xff0000 );
      if (mouseDown && stillDown == 0 || stillDown == 1) {
        if (intersects[i].object.onclick != undefined ) {
          intersects[i].object.onclick();
        }
        stillDown = 1;
      }
    }
    if (stillDown == 1) {
      stillDown = 2; 
    }
    renderer.render(scene, camera);
    //controls.object.position.set(5 + pointer.x*20, 20 + pointer.y*20, 250);
    if (!freeMove) {
      controls.object.position.set(npx, 20 + npy, 250);
    }
    //controls.target.clamp( minT, maxT );
    //controls.object.position.clamp( minC, maxC );
}

animate()

function onPointerMove( event ) {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

window.addEventListener( 'pointermove', onPointerMove );
window.requestAnimationFrame(render);

document.body.onmousedown = function() {
  ++mouseDown;
}

document.body.onmouseup = function() {
  --mouseDown;
  stillDown = 0;
}

