import * as THREE from "three";
import { OrbitControls } from "three/examples/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/loaders/GLTFLoader.js";
import { VRButton } from "three/examples/webxr/VRButton.js"; // Import VRButton

// Import nilImage resource
const nilImage = new URL("../image/png/nil.png", import.meta.url);

// Start window function
function createStartWindow() {
  const startWindow = document.createElement('div');
  startWindow.id = 'startWindow';
  startWindow.style.position = 'fixed';
  startWindow.style.top = '0';
  startWindow.style.left = '0';
  startWindow.style.width = '100%';
  startWindow.style.height = '100%';
  startWindow.style.backgroundColor = '#F4F7FC';
  startWindow.style.display = 'flex';
  startWindow.style.flexDirection = 'column';
  startWindow.style.justifyContent = 'center';
  startWindow.style.alignItems = 'center';
  startWindow.style.zIndex = '9999';
  
  // Prevent clicks on the overlay from propagating
  startWindow.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  
  // Create an image element for the logo
  const logoImage = document.createElement('img');
  logoImage.id = 'logoImage';
  logoImage.src = nilImage;
  logoImage.style.marginBottom = '20px';
  logoImage.style.width = '15%';
  
  const playButton = document.createElement('button');
  playButton.id = 'playButton';
  playButton.innerText = 'Play';
  playButton.style.fontSize = '24px';
  playButton.style.padding = '10px 20px';
  playButton.style.cursor = 'pointer';
  
  playButton.addEventListener('click', () => {
    // Hide the starting window overlay
    startWindow.style.display = 'none';
  });
  
  startWindow.appendChild(logoImage);
  startWindow.appendChild(playButton);
  document.body.appendChild(startWindow);
}

// Create the starting window overlay
createStartWindow();

// Import nilImage resource
const switchModel = new URL("../gltf/Switch.glb", import.meta.url);
const switchButton01 = new URL("../gltf/SwitchButton01.glb", import.meta.url);
const switchButton02 = new URL("../gltf/SwitchButton02.glb", import.meta.url);
const switchButton03 = new URL("../gltf/SwitchButton03.glb", import.meta.url);
let switchObject; // Global variable for the switch model
let originalSwitchPosition, originalSwitchRotation, originalSwitchScale; // Store original position, rotation, and scale

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, 
  window.innerWidth / window.innerHeight,
  0.1, 
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; // Enable XR on the Renderer
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer)); // Add the VR Button to the DOM

// Add ambient light to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Load main Switch model with default color dddddd
const loader = new GLTFLoader();
loader.load(switchModel.href, function (gltf) {
  gltf.scene.traverse(function(child) {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    }
  });
  scene.add(gltf.scene);
  switchObject = gltf.scene;
  
  // Store original position, rotation, and scale
  originalSwitchPosition = switchObject.position.clone();
  originalSwitchRotation = switchObject.rotation.clone();
  originalSwitchScale = switchObject.scale.clone();
  
  loadButtons(); // Load buttons only after switch is ready
}, undefined, function (error) {
  console.error('An error happened while loading the Switch model:', error);
});

// Define the loadButtons function
function loadButtons() {
  loader.load(switchButton01.href, function (gltf) {
    gltf.scene.traverse(function(child) {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      }
    });
    gltf.scene.userData.isButton = true;
    switchObject.add(gltf.scene);
    gltf.scene.userData.toggled = false;
    gltf.scene.userData.buttonColor = 0xff0000;
    clickableButtons.push(gltf.scene);
  });

  loader.load(switchButton02.href, function (gltf) {
    gltf.scene.traverse(function(child) {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      }
    });
    gltf.scene.userData.isButton = true;
    switchObject.add(gltf.scene);
    gltf.scene.userData.toggled = false;
    gltf.scene.userData.buttonColor = 0x00ff00;
    clickableButtons.push(gltf.scene);
  });

  loader.load(switchButton03.href, function (gltf) {
    gltf.scene.traverse(function(child) {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
      }
    });
    gltf.scene.userData.isButton = true;
    switchObject.add(gltf.scene);
    gltf.scene.userData.toggled = false;
    gltf.scene.userData.buttonColor = 0x0000ff;
    clickableButtons.push(gltf.scene);
  });
}

function setSwitchColor(hexColor) {
  if (!switchObject) return;
  switchObject.traverse(function(child) {
    if (child.isMesh && !child.parent.userData.isButton && !child.userData.isButton) {
      child.material.color.setHex(hexColor);
    }
  });
}

// Set up OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);

// Make sure to define these near your scene setup
const clickableButtons = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Variables for VR object manipulation
const controllers = [];
let grabbedObject = null;
let initialGrabDistance = 0;
let initialScale = new THREE.Vector3();

// Add click event listener
window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableButtons, true);
  if (intersects.length > 0) {
    // Assuming the button's root is in clickableButtons
    let button = intersects[0].object;
    while (button && !clickableButtons.includes(button)) {
      button = button.parent;
    }
    if (button) {
      toggleButtonPosition(button);
    }
  }
});

// Add touch event listener for mobile devices
window.addEventListener('touchstart', (event) => {
  // Use the first touch point
  const touch = event.touches[0];
  mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (touch.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableButtons, true);
  if (intersects.length > 0) {
    let button = intersects[0].object;
    while (button && !clickableButtons.includes(button)) {
      button = button.parent;
    }
    if (button) {
      toggleButtonPosition(button);
    }
  }
});

// Set up VR controllers for object manipulation and button interaction
function buildControllerRay(controller) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1)
  ]);
  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const line = new THREE.Line(geometry, material);
  line.name = 'ray';
  line.scale.z = 5; // length of the ray
  controller.add(line);
}

const controller1 = renderer.xr.getController(0);
buildControllerRay(controller1);
scene.add(controller1);

const controller2 = renderer.xr.getController(1);
buildControllerRay(controller2);
scene.add(controller2);

controllers.push(controller1, controller2);

function onSelectStart(event) {
  const controller = event.target;
  // Prepare a raycaster from the controller
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  
  // First, check if a clickable button was hit
  let intersects = raycaster.intersectObjects(clickableButtons, true);
  if (intersects.length > 0) {
    let button = intersects[0].object;
    while (button && !clickableButtons.includes(button)) {
      button = button.parent;
    }
    if (button) {
      toggleButtonPosition(button);
      return; // Do not grab the object if a button was pressed
    }
  }
  
  // Next, check if the main object (switchObject) was hit
  intersects = raycaster.intersectObject(switchObject, true);
  if (intersects.length > 0) {
    grabbedObject = switchObject;
    controller.userData.isGrabbing = true;
    // If two controllers are grabbing, compute the initial distance and scale
    const activeControllers = controllers.filter(c => c.userData.isGrabbing);
    if (activeControllers.length === 2) {
      initialGrabDistance = activeControllers[0].position.distanceTo(activeControllers[1].position);
      initialScale.copy(grabbedObject.scale);
    }
  }
}

function onSelectEnd(event) {
  const controller = event.target;
  controller.userData.isGrabbing = false;
  // If no controllers are grabbing, release the object
  if (controllers.filter(c => c.userData.isGrabbing).length === 0) {
    grabbedObject = null;
  }
}

controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);
controller2.addEventListener('selectstart', onSelectStart);
controller2.addEventListener('selectend', onSelectEnd);

// Enable multi-touch manipulation in VR mode (for devices without VR controllers)
let isTouchGrabbing = false;
let initialTouchDistance = 0;
let initialTouchAngle = 0;
let initialSwitchRotation = 0;
let initialSwitchScale = new THREE.Vector3();

window.addEventListener('touchstart', (event) => {
  // If in VR mode and exactly two touches are detected
  if (renderer.xr.isPresenting && event.touches.length === 2) {
    event.preventDefault();
    isTouchGrabbing = true;
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    initialTouchDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    initialTouchAngle = Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX);
    initialSwitchRotation = switchObject.rotation.y;
    initialSwitchScale.copy(switchObject.scale);
  }
});

window.addEventListener('touchmove', (event) => {
  if (renderer.xr.isPresenting && isTouchGrabbing && event.touches.length === 2) {
    event.preventDefault();
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    const currentAngle = Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX);
    const scaleRatio = currentDistance / initialTouchDistance;
    switchObject.scale.set(initialSwitchScale.x * scaleRatio, initialSwitchScale.y * scaleRatio, initialSwitchScale.z * scaleRatio);
    // Compute rotation delta and update object's y-axis rotation
    const deltaAngle = currentAngle - initialTouchAngle;
    switchObject.rotation.y = initialSwitchRotation + deltaAngle;
  }
});

window.addEventListener('touchend', (event) => {
  if (renderer.xr.isPresenting && event.touches.length < 2) {
    isTouchGrabbing = false;
  }
});

// Animation loop
function animate() {
  // If an object is grabbed via VR controllers, update its transform
  const activeControllers = controllers.filter(c => c.userData.isGrabbing);
  if (grabbedObject) {
    if (activeControllers.length === 1) {
      // Single controller: move the object to follow the controller
      const controller = activeControllers[0];
      const newPos = new THREE.Vector3();
      controller.getWorldPosition(newPos);
      grabbedObject.position.copy(newPos);
    } else if (activeControllers.length === 2) {
      // Two controllers: update scale, rotation, and position
      const [c1, c2] = activeControllers;
      // Scaling
      const currentDistance = c1.position.distanceTo(c2.position);
      const scaleRatio = currentDistance / initialGrabDistance;
      grabbedObject.scale.set(initialScale.x * scaleRatio, initialScale.y * scaleRatio, initialScale.z * scaleRatio);
      
      // Position: set object to midpoint between controllers
      const midpoint = new THREE.Vector3().addVectors(c1.position, c2.position).multiplyScalar(0.5);
      grabbedObject.position.copy(midpoint);
      
      // Rotation: compute horizontal angle between controllers and apply it to the object's y-axis rotation
      const angle = Math.atan2(c2.position.z - c1.position.z, c2.position.x - c1.position.x);
      grabbedObject.rotation.y = angle;
    }
  }
  
  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

// Adjust on window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Function to toggle the button's x-axis position
function toggleButtonPosition(object) {
  if (!object.userData.toggled) {
    object.userData.originalX = object.position.x;
    object.position.z += 0.2; // move right by 1 unit along the x-axis
    object.userData.toggled = true;
  } else {
    object.position.z = object.userData.originalX; // return to original x position
    object.userData.toggled = false;
  }
  updateSwitchColor();
}

// Function to update the switch color based on toggled buttons
function updateSwitchColor() {
  // Array to collect colors from toggled buttons
  let toggledColors = [];
  for (let btn of clickableButtons) {
    if (btn.userData.toggled && btn.userData.buttonColor) {
      toggledColors.push(btn.userData.buttonColor);
    }
  }
  // If no buttons are toggled, use default color dddddd
  if (toggledColors.length === 0) {
    setSwitchColor(0xdddddd);
  } else {
    let totalR = 0, totalG = 0, totalB = 0;
    toggledColors.forEach(col => {
      let r = (col >> 16) & 0xff;
      let g = (col >> 8) & 0xff;
      let b = col & 0xff;
      totalR += r;
      totalG += g;
      totalB += b;
    });
    // Clamp each channel to a maximum of 255
    totalR = Math.min(totalR, 255);
    totalG = Math.min(totalG, 255);
    totalB = Math.min(totalB, 255);
    let newColor = (totalR << 16) | (totalG << 8) | totalB;
    setSwitchColor(newColor);
  }
}

// Reset switch object on VR session end
renderer.xr.addEventListener('sessionend', () => {
  if (switchObject && originalSwitchPosition && originalSwitchRotation && originalSwitchScale) {
    switchObject.position.copy(originalSwitchPosition);
    switchObject.rotation.copy(originalSwitchRotation);
    switchObject.scale.copy(originalSwitchScale);
  }
});
