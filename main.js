import * as THREE from 'three';

// --- 기본 설정 ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // 그림자 활성화
document.getElementById('game-container').appendChild(renderer.domElement);

// --- 배경 및 조명 ---
const textureLoader = new THREE.TextureLoader();
const spaceTexture = textureLoader.load(
    'https://cors-anywhere.herokuapp.com/https://png.pngtree.com/thumb_back/fh260/background/20230416/pngtree-game-universe-planet-image_2408908.jpg',
    () => {
        const rt = new THREE.WebGLCubeRenderTarget(spaceTexture.image.height);
        rt.fromEquirectangularTexture(renderer, spaceTexture);
        scene.background = rt.texture;
    },
    undefined,
    (err) => {
        console.error('An error happened while loading the background texture.', err);
        scene.background = new THREE.Color(0x101020);
    }
);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(10, 20, 15);
directionalLight.castShadow = true; // 그림자 생성
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// --- 게임 요소 ---
const groundGeometry = new THREE.PlaneGeometry(20, 40);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.2, roughness: 0.8 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
ground.receiveShadow = true; // 그림자 받기
scene.add(ground);

const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.1 });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.castShadow = true; // 그림자 생성
scene.add(sphere);

const goalGeometry = new THREE.BoxGeometry(3, 1, 1);
const goalMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x22ff22 });
const goal = new THREE.Mesh(goalGeometry, goalMaterial);
goal.position.set(0, 0, -18);
goal.receiveShadow = true;
scene.add(goal);

let obstacles = [];
const obstacleGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.5, roughness: 0.5 });

// --- 게임 상태 및 UI ---
const MAX_LEVEL = 44;
let currentLevel = 1;
let gameActive = true;
let isFalling = false;
let isTeleporting = false;
const keys = {};
const speed = 0.12;

const levelInfo = document.getElementById('info');
const clearMessage = document.getElementById('clear-message');
const clearMessageHeader = clearMessage.querySelector('h1');
const clearMessageParagraph = clearMessage.querySelector('p');
const outMessage = document.getElementById('out-message'); // OUT 메시지 요소 추가

// --- 게임 로직 함수 ---
function handleOut() {
    gameActive = false;
    isFalling = true;
    setTimeout(() => {
        sphere.visible = false; // 공을 잠시 숨김
        outMessage.style.display = 'block';
        setTimeout(restartCurrentLevel, 30000); // 30초 후 재시작
    }, 1500); // 1.5초 후 OUT 메시지 표시
}

function restartCurrentLevel() {
    outMessage.style.display = 'none';
    loadLevel(currentLevel);
}

function generateLevel(level) {
    // 기존 장애물 제거
    obstacles.forEach(obs => scene.remove(obs));
    obstacles = [];
    
    let obstacleCount;
    if (level < 36) {
        obstacleCount = 5 + level * 2; // 35레벨까지는 2개씩 증가
    } else {
        obstacleCount = 5 + 35 * 2 + (level - 35); // 36레벨부터는 1개씩 증가
    }

    for (let i = 0; i < obstacleCount; i++) {
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        obstacle.position.set(
            (Math.random() - 0.5) * 18,
            0.1,
            (Math.random() * 30) - 15
        );
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        obstacles.push(obstacle);
        scene.add(obstacle);
    }
}

function resetPlayer() {
    sphere.position.set(0, 0.5, 18);
    sphere.scale.set(1, 1, 1); // 크기 초기화
    sphere.visible = true;
    isFalling = false;
    isTeleporting = false;
}

function loadLevel(level) {
    if (level > MAX_LEVEL) {
        gameActive = false;
        clearMessageHeader.textContent = 'ALL CLEAR!';
        clearMessageParagraph.textContent = '모든 레벨을 클리어했습니다!';
        clearMessage.style.display = 'block';
        outMessage.style.display = 'none'; // OUT 메시지 숨김
        return;
    }

    currentLevel = Math.max(1, level);
    levelInfo.textContent = `Level: ${currentLevel}`;
    gameActive = true;
    clearMessage.style.display = 'none';
    outMessage.style.display = 'none'; // OUT 메시지 숨김
    resetPlayer();
    generateLevel(currentLevel);
}

// --- 카메라 로직 ---
const cameraOffset = new THREE.Vector3(0, 5, 7);
function updateCamera() {
    const targetPosition = new THREE.Vector3().copy(sphere.position).add(cameraOffset);
    camera.position.lerp(targetPosition, 0.05); // 부드럽게 이동
    camera.lookAt(sphere.position);
}

// --- 이벤트 리스너 ---
document.addEventListener('keydown', (event) => {
    if (event.code.startsWith('Arrow')) keys[event.code] = true;
    if (event.code === 'KeyN') loadLevel(currentLevel + 1);
    if (event.code === 'KeyP') loadLevel(currentLevel - 1);
});
document.addEventListener('keyup', (event) => {
    if (event.code.startsWith('Arrow')) keys[event.code] = false;
});

// --- 게임 루프 ---
function animate() {
    requestAnimationFrame(animate);

    if (gameActive) {
        if (keys['ArrowUp']) sphere.position.z -= speed;
        if (keys['ArrowDown']) sphere.position.z += speed;
        if (keys['ArrowLeft']) sphere.position.x -= speed;
        if (keys['ArrowRight']) sphere.position.x += speed;

        for (const obstacle of obstacles) {
            if (sphere.position.distanceTo(obstacle.position) < 1.1) {
                handleOut();
                return;
            }
        }

        if (sphere.position.x > 10 || sphere.position.x < -10 || sphere.position.z > 20 || sphere.position.z < -20) {
            handleOut();
            return;
        }

        if (sphere.position.distanceTo(goal.position) < 1.5) {
            gameActive = false;
            isTeleporting = true;
            clearMessageHeader.textContent = 'CLEAR!';
            clearMessageParagraph.textContent = '다음 레벨로 이동합니다...';
            clearMessage.style.display = 'block';
            setTimeout(() => loadLevel(currentLevel + 1), 2000);
        }
    }

    // 애니메이션 처리
    if (isFalling) {
        sphere.position.y -= 0.2; // 아래로 떨어지는 효과
    }
    if (isTeleporting) {
        sphere.scale.lerp(new THREE.Vector3(0.01, 0.01, 0.01), 0.1); // 작아지는 효과
    }

    updateCamera();
    renderer.render(scene, camera);
}

// --- 창 크기 조절 ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// --- 게임 시작 ---
loadLevel(1);
animate();
