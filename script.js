// --- 1. ENGINE INITIALIZATION ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Classic Sky Blue
scene.fog = new THREE.FogExp2(0x87CEEB, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 25, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- 2. CAMERA CONTROLS ---
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.01; // Prevents camera from going under the floor

// --- 3. LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(30, 50, 20);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 150;
const d = 40;
directionalLight.shadow.camera.left = -d;
directionalLight.shadow.camera.right = d;
directionalLight.shadow.camera.top = d;
directionalLight.shadow.camera.bottom = -d;
scene.add(directionalLight);

// --- 4. THE BASEPLATE & GRID ---
const baseplateSize = 60;

// Visual Grid lines
const gridHelper = new THREE.GridHelper(baseplateSize, baseplateSize, 0x222222, 0x444444);
gridHelper.position.y = 0.01; 
scene.add(gridHelper);

// Solid Green Baseplate Object
const baseplateGeo = new THREE.BoxGeometry(baseplateSize, 2, baseplateSize);
const baseplateMat = new THREE.MeshStandardMaterial({ color: 0x3a9d23, roughness: 0.8 }); 
const baseplate = new THREE.Mesh(baseplateGeo, baseplateMat);
baseplate.position.y = -1; // Top surface sits exactly at y=0
baseplate.receiveShadow = true;
scene.add(baseplate);

// --- 5. VOXEL / BLOCK BUILDING MECHANICS ---
const blockGeo = new THREE.BoxGeometry(2, 2, 2); 
const blockMat = new THREE.MeshStandardMaterial({ color: 0xa0a0a0, roughness: 0.6, metalness: 0.1 });

const interactableObjects = [baseplate]; 
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('dblclick', onSceneInteract, false);

function onSceneInteract(event) {
    event.preventDefault();

    // Map mouse coordinates to 3D space
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(interactableObjects);

    if (intersects.length > 0) {
        const intersect = intersects[0];

        // Deletion Mode (Ctrl + Double Click)
        if (event.ctrlKey) {
            if (intersect.object !== baseplate) {
                scene.remove(intersect.object);
                interactableObjects.splice(interactableObjects.indexOf(intersect.object), 1);
            }
        } 
        // Build Mode (Standard Double Click)
        else {
            const block = new THREE.Mesh(blockGeo, blockMat);
            
            // Calculate snapping position based on the face normal intersected
            block.position.copy(intersect.point).add(intersect.face.normal);
            
            // Snap coordinates to the 2-unit block grid system
            block.position.x = Math.floor((block.position.x + 1) / 2) * 2;
            block.position.z = Math.floor((block.position.z + 1) / 2) * 2;
            block.position.y = Math.floor((block.position.y + 1) / 2) * 2;
            
            // Prevent blocks from spawning below the baseplate surface
            if(block.position.y < 1) block.position.y = 1;

            block.castShadow = true;
            block.receiveShadow = true;

            // Generate random block colors
            block.material = new THREE.MeshStandardMaterial({
                color: Math.random() * 0xffffff,
                roughness: 0.5
            });

            scene.add(block);
            interactableObjects.push(block);
        }
    }
}

// --- 6. WINDOW RESIZING ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 7. ANIMATION LOOP ---
function update() {
    requestAnimationFrame(update);
    controls.update(); 
    renderer.render(scene, camera);
}

update();
