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
}, undefined, function (error) {
  console.error('An error happened while loading the Switch model:', error);
});

// Set up OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);

// Animation loop
function animate() {
  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate); // Update the Animation Loop

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

// Function to set the switch model's material color
function setSwitchColor(hexColor) {
  if (!switchObject) return;
  switchObject.traverse(function(child) {
    if (child.isMesh) {
      child.material.color.setHex(hexColor);
    }
  });
}

// Load SwitchButton01 with red material
loader.load(switchButton01.href, function (gltf) {
  gltf.scene.traverse(function(child) {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    }
  });
  scene.add(gltf.scene);
  gltf.scene.userData.toggled = false;
  gltf.scene.userData.buttonColor = 0xff0000;
  clickableButtons.push(gltf.scene);
}, undefined, function (error) {
  console.error('An error happened while loading SwitchButton01:', error);
});

// Load SwitchButton02 with green material
loader.load(switchButton02.href, function (gltf) {
  gltf.scene.traverse(function(child) {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    }
  });
  scene.add(gltf.scene);
  gltf.scene.userData.toggled = false;
  gltf.scene.userData.buttonColor = 0x00ff00;
  clickableButtons.push(gltf.scene);
}, undefined, function (error) {
  console.error('An error happened while loading SwitchButton02:', error);
});

// Load SwitchButton03 with blue material
loader.load(switchButton03.href, function (gltf) {
  gltf.scene.traverse(function(child) {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    }
  });
  scene.add(gltf.scene);
  gltf.scene.userData.toggled = false;
  gltf.scene.userData.buttonColor = 0x0000ff;
  clickableButtons.push(gltf.scene);
}, undefined, function (error) {
  console.error('An error happened while loading SwitchButton03:', error);
});

// Make sure to define these near your scene setup
const clickableButtons = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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
