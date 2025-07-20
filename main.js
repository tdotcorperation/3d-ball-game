import * as THREE from 'three';

// 기본 설정
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

// 조명
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// 바닥
const groundGeometry = new THREE.PlaneGeometry(20, 40);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
scene.add(ground);

// 공
const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // 공 색상을 흰색으로 변경
    metalness: 0.8,  // 금속성 재질로 변경
    roughness: 0.2   // 표면을 매끄럽게
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0, 0.5, 18); // 공의 시작 높이를 0.5로 조정
scene.add(sphere);

// 장애물 (큐브)
const obstacles = [];
const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });

const obstaclePositions = [
    new THREE.Vector3(0, 0, 10),
    new THREE.Vector3(5, 0, 5),
    new THREE.Vector3(-5, 0, 0),
    new THREE.Vector3(0, 0, -5),
    new THREE.Vector3(5, 0, -10),
];

obstaclePositions.forEach(pos => {
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.copy(pos);
    obstacles.push(obstacle);
    scene.add(obstacle);
});

// 골대
const goalGeometry = new THREE.BoxGeometry(3, 1, 1);
const goalMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const goal = new THREE.Mesh(goalGeometry, goalMaterial);
goal.position.set(0, 0, -18);
scene.add(goal);

// 카메라 위치
camera.position.set(0, 15, 22);
camera.lookAt(0, 0, 0);

// 키보드 입력 처리
const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});
document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

const speed = 0.1;
let gameCleared = false;

function animate() {
    if (gameCleared) return;

    requestAnimationFrame(animate);

    // 공 움직임
    const originalPosition = sphere.position.clone();

    if (keys['ArrowUp']) sphere.position.z -= speed;
    if (keys['ArrowDown']) sphere.position.z += speed;
    if (keys['ArrowLeft']) sphere.position.x -= speed;
    if (keys['ArrowRight']) sphere.position.x += speed;

    // 충돌 감지 (장애물)
    for (const obstacle of obstacles) {
        if (sphere.position.distanceTo(obstacle.position) < 1) {
            sphere.position.copy(originalPosition); // 충돌 시 위치 복원
            break;
        }
    }
    
    // 경계 체크
    if (sphere.position.x > 9.5 || sphere.position.x < -9.5 || sphere.position.z > 19.5 || sphere.position.z < -19.5) {
        sphere.position.copy(originalPosition);
    }


    // 골인 판정
    if (sphere.position.distanceTo(goal.position) < 1.5) {
        gameCleared = true;
        document.getElementById('clear-message').style.display = 'block';
    }

    renderer.render(scene, camera);
}

animate();

// 창 크기 조절 대응
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});