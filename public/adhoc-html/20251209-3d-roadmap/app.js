// ============================================
// AWS Learning Roadmap 3D - Main Application
// ============================================

let sprintsData = [];
let scene, camera, renderer, controls, labelRenderer;
let sprintMeshes = [];
let categoryGroups = [];
let lessonGroups = [];
let connectionLines = [];
let particles;
let architectureImages = [];

// Label collections for visibility control
let lessonLabelElements = [];
let categoryLabelElements = [];
let architectureLabelElements = [];

// State
let currentSprintIndex = 0;
let currentCategoryIndex = 0;
let viewMode = 'sprints'; // 'sprints', 'categories', 'overview'
let selectedSprint = null;

// ============================================
// INITIALIZATION
// ============================================
async function init() {
    await loadRoadmapData();

    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.012);

    // Camera
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 15, 50);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a0f, 1);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // CSS2D Renderer for labels
    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById('canvas-container').appendChild(labelRenderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 120;
    controls.enablePan = true;

    // Lighting
    setupLighting();

    // Create scene elements
    createStarField();
    createSprints();
    createSprintConnections();
    createNavigationDots();

    // Initial view
    showSprintsView();

    // Event listeners
    setupEventListeners();

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
    }, 1500);

    // Start animation
    animate();
}

// ============================================
// LOAD DATA
// ============================================
async function loadRoadmapData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        sprintsData = data.sprints;
    } catch (error) {
        console.error('Failed to load roadmap data:', error);
        sprintsData = [];
    }
}

// ============================================
// LIGHTING SETUP
// ============================================
function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 2, 200);
    pointLight1.position.set(50, 50, 50);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x7b2fff, 2, 200);
    pointLight2.position.set(-50, -30, 50);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xff2d92, 1.5, 150);
    pointLight3.position.set(0, 60, -50);
    scene.add(pointLight3);
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);

    document.getElementById('touch-prev').addEventListener('click', () => navigate(-1));
    document.getElementById('touch-next').addEventListener('click', () => navigate(1));

    document.getElementById('btn-overview').addEventListener('click', toggleOverview);
    document.getElementById('btn-focus').addEventListener('click', handleFocusClick);
    document.getElementById('btn-back').addEventListener('click', goBack);
}

// ============================================
// STAR FIELD
// ============================================
function createStarField() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];

    for (let i = 0; i < 4000; i++) {
        vertices.push(
            (Math.random() - 0.5) * 400,
            (Math.random() - 0.5) * 400,
            (Math.random() - 0.5) * 400
        );

        const colorChoice = Math.random();
        if (colorChoice < 0.3) {
            colors.push(0, 0.83, 1);
        } else if (colorChoice < 0.6) {
            colors.push(0.48, 0.18, 1);
        } else {
            colors.push(1, 1, 1);
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

// ============================================
// CREATE SPRINTS (Large nodes)
// ============================================
function createSprints() {
    sprintsData.forEach((sprint, index) => {
        const group = new THREE.Group();
        group.position.set(sprint.position.x, sprint.position.y, sprint.position.z);

        // Large sphere for sprint
        const geometry = new THREE.SphereGeometry(4, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: sprint.color,
            emissive: sprint.color,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.9,
            shininess: 100
        });
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);

        // Outer ring
        const ringGeometry = new THREE.RingGeometry(5, 5.5, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: sprint.color,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        // Sprint label
        const labelDiv = document.createElement('div');
        labelDiv.className = 'sprint-label-3d';
        labelDiv.innerHTML = `
            <span class="sprint-icon">${sprint.icon}</span>
            <span class="sprint-title">${sprint.title}</span>
            <span class="sprint-subtitle">${sprint.subtitle}</span>
        `;
        labelDiv.style.color = sprint.color;
        const label = new THREE.CSS2DObject(labelDiv);
        label.position.set(0, 6, 0);
        group.add(label);

        group.userData = { sprintIndex: index, type: 'sprint' };
        sprintMeshes.push(group);
        scene.add(group);

        // Create categories for this sprint (initially hidden)
        createCategoriesForSprint(sprint, index);
    });
}

// ============================================
// CREATE CATEGORIES FOR A SPRINT
// ============================================
function createCategoriesForSprint(sprint, sprintIndex) {
    const categoryGroup = new THREE.Group();
    categoryGroup.position.set(sprint.position.x, sprint.position.y, sprint.position.z);
    categoryGroup.visible = false;

    const categoryCount = sprint.categories.length;
    const spacing = 12;
    const startX = -((categoryCount - 1) * spacing) / 2;

    sprint.categories.forEach((category, catIndex) => {
        const catGroup = new THREE.Group();
        catGroup.position.set(startX + catIndex * spacing, 0, 0);

        // Category sphere
        const geometry = new THREE.SphereGeometry(2, 24, 24);
        const material = new THREE.MeshPhongMaterial({
            color: category.color,
            emissive: category.color,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        catGroup.add(mesh);

        // Category label
        const labelDiv = document.createElement('div');
        labelDiv.className = 'category-label-3d';
        labelDiv.innerHTML = `${category.icon} ${category.title}<span class="subtitle">${category.subtitle}</span>`;
        labelDiv.style.color = category.color;
        const label = new THREE.CSS2DObject(labelDiv);
        label.position.set(0, 3.5, 0);
        catGroup.add(label);
        
        // Store label element for visibility control
        categoryLabelElements.push({ element: labelDiv, sprintIndex });

        catGroup.userData = { categoryIndex: catIndex, sprintIndex: sprintIndex, type: 'category' };
        categoryGroup.add(catGroup);

        // Create lesson tree for this category
        createLessonTree(category, catGroup, sprintIndex, catIndex);
    });

    // Create architecture image if exists
    if (sprint.architectureImage) {
        createArchitectureImage(sprint, categoryGroup, categoryCount, spacing, sprintIndex);
    }

    // Create connections between categories
    createCategoryConnections(categoryGroup, categoryCount, spacing, sprint.color);

    categoryGroups.push(categoryGroup);
    scene.add(categoryGroup);
}

// ============================================
// CREATE LESSON TREE (Directory structure)
// ============================================
function createLessonTree(category, parentGroup, sprintIndex, catIndex) {
    const lessonGroup = new THREE.Group();
    lessonGroup.position.set(0, -3, 0);

    const lessons = category.lessons;
    const verticalSpacing = 1.8;

    // Vertical line from category to lessons
    const linePoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -lessons.length * verticalSpacing - 1, 0)
    ];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMaterial = new THREE.LineBasicMaterial({
        color: category.color,
        transparent: true,
        opacity: 0.4
    });
    const verticalLine = new THREE.Line(lineGeometry, lineMaterial);
    lessonGroup.add(verticalLine);

    lessons.forEach((lesson, i) => {
        const y = -(i + 1) * verticalSpacing;

        // Small node
        const nodeGeometry = new THREE.SphereGeometry(0.2, 12, 12);
        const nodeMaterial = new THREE.MeshBasicMaterial({
            color: category.color,
            transparent: true,
            opacity: 0.8
        });
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(0, y, 0);
        lessonGroup.add(node);

        // Horizontal branch line
        const branchPoints = [
            new THREE.Vector3(0, y, 0),
            new THREE.Vector3(0.8, y, 0)
        ];
        const branchGeometry = new THREE.BufferGeometry().setFromPoints(branchPoints);
        const branch = new THREE.Line(branchGeometry, lineMaterial);
        lessonGroup.add(branch);

        // Lesson label
        const labelDiv = document.createElement('div');
        labelDiv.className = 'lesson-label-3d';
        const isCompleted = Math.random() > 0.6;
        if (isCompleted) labelDiv.classList.add('completed');
        labelDiv.innerHTML = `
            <span class="lesson-number" style="background: ${category.color};">${i + 1}</span>
            <span>${lesson}</span>
        `;
        const label = new THREE.CSS2DObject(labelDiv);
        label.position.set(1.2, y, 0);
        lessonGroup.add(label);
        
        // Store label element for visibility control
        lessonLabelElements.push({ element: labelDiv, sprintIndex });
    });

    lessonGroup.userData = { type: 'lessons', sprintIndex, catIndex };
    parentGroup.add(lessonGroup);
    lessonGroups.push(lessonGroup);
}

// ============================================
// CREATE ARCHITECTURE IMAGE
// ============================================
function createArchitectureImage(sprint, categoryGroup, categoryCount, spacing, sprintIndex) {
    const loader = new THREE.TextureLoader();
    loader.load(sprint.architectureImage, (texture) => {
        const aspectRatio = texture.image.width / texture.image.height;
        const height = 10;
        const width = height * aspectRatio;

        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(geometry, material);

        // Position at the end of categories
        const xPos = ((categoryCount - 1) * spacing) / 2 + spacing + width / 2;
        plane.position.set(xPos, -5, 0);

        // Frame around image
        const frameGeometry = new THREE.EdgesGeometry(geometry);
        const frameMaterial = new THREE.LineBasicMaterial({
            color: sprint.color,
            transparent: true,
            opacity: 0.6
        });
        const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
        plane.add(frame);

        // Label for architecture image
        const labelDiv = document.createElement('div');
        labelDiv.className = 'architecture-label';
        labelDiv.innerHTML = `🏗️ 構成図: ${sprint.title}で作れる構成`;
        labelDiv.style.color = sprint.color;
        const label = new THREE.CSS2DObject(labelDiv);
        label.position.set(0, height / 2 + 1, 0);
        plane.add(label);
        
        // Store label element for visibility control
        architectureLabelElements.push({ element: labelDiv, sprintIndex });

        categoryGroup.add(plane);
        architectureImages.push(plane);
    });
}

// ============================================
// CREATE SPRINT CONNECTIONS
// ============================================
function createSprintConnections() {
    for (let i = 0; i < sprintsData.length - 1; i++) {
        const start = new THREE.Vector3(
            sprintsData[i].position.x,
            sprintsData[i].position.y,
            sprintsData[i].position.z
        );
        const end = new THREE.Vector3(
            sprintsData[i + 1].position.x,
            sprintsData[i + 1].position.y,
            sprintsData[i + 1].position.z
        );

        const points = [start, end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const colors = [];
        const startColor = new THREE.Color(sprintsData[i].color);
        const endColor = new THREE.Color(sprintsData[i + 1].color);
        colors.push(startColor.r, startColor.g, startColor.b);
        colors.push(endColor.r, endColor.g, endColor.b);
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.5
        });

        const line = new THREE.Line(geometry, material);
        connectionLines.push(line);
        scene.add(line);
    }
}

// ============================================
// CREATE CATEGORY CONNECTIONS
// ============================================
function createCategoryConnections(group, count, spacing, color) {
    const startX = -((count - 1) * spacing) / 2;

    for (let i = 0; i < count - 1; i++) {
        const start = new THREE.Vector3(startX + i * spacing + 2.5, 0, 0);
        const end = new THREE.Vector3(startX + (i + 1) * spacing - 2.5, 0, 0);

        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.4
        });
        const line = new THREE.Line(geometry, material);
        group.add(line);
    }
}

// ============================================
// NAVIGATION DOTS
// ============================================
function createNavigationDots() {
    updateNavigationDots();
}

function updateNavigationDots() {
    const navContainer = document.getElementById('category-nav');
    navContainer.innerHTML = '';

    if (viewMode === 'sprints' || viewMode === 'overview') {
        sprintsData.forEach((sprint, index) => {
            const dot = document.createElement('div');
            dot.className = 'nav-dot' + (index === currentSprintIndex ? ' active' : '');
            dot.setAttribute('data-label', sprint.title);
            dot.style.borderColor = sprint.color;
            if (index === currentSprintIndex) {
                dot.style.background = sprint.color;
            }
            dot.addEventListener('click', () => {
                currentSprintIndex = index;
                if (viewMode === 'sprints') {
                    focusOnSprint(index);
                }
                updateNavigationDots();
            });
            navContainer.appendChild(dot);
        });
    } else if (viewMode === 'categories' && selectedSprint !== null) {
        const sprint = sprintsData[selectedSprint];
        sprint.categories.forEach((category, index) => {
            const dot = document.createElement('div');
            dot.className = 'nav-dot' + (index === currentCategoryIndex ? ' active' : '');
            dot.setAttribute('data-label', category.title);
            dot.style.borderColor = category.color;
            if (index === currentCategoryIndex) {
                dot.style.background = category.color;
            }
            dot.addEventListener('click', () => {
                currentCategoryIndex = index;
                focusOnCategory(index);
                updateNavigationDots();
            });
            navContainer.appendChild(dot);
        });
    }
}

// ============================================
// LABEL VISIBILITY CONTROL
// ============================================
function setAllDetailLabelsVisible(visible) {
    const display = visible ? 'block' : 'none';
    
    lessonLabelElements.forEach(item => {
        item.element.style.display = display;
    });
    categoryLabelElements.forEach(item => {
        item.element.style.display = display;
    });
    architectureLabelElements.forEach(item => {
        item.element.style.display = display;
    });
}

function setSprintDetailLabelsVisible(sprintIndex, visible) {
    const display = visible ? 'block' : 'none';
    
    lessonLabelElements.forEach(item => {
        if (item.sprintIndex === sprintIndex) {
            item.element.style.display = display;
        }
    });
    categoryLabelElements.forEach(item => {
        if (item.sprintIndex === sprintIndex) {
            item.element.style.display = display;
        }
    });
    architectureLabelElements.forEach(item => {
        if (item.sprintIndex === sprintIndex) {
            item.element.style.display = display;
        }
    });
}

// ============================================
// VIEW MODES
// ============================================
function showSprintsView() {
    viewMode = 'sprints';
    selectedSprint = null;

    // Show sprints, hide categories
    sprintMeshes.forEach((s, i) => {
        s.visible = true;
        gsap.to(s.position, { y: sprintsData[i].position.y, duration: 1, ease: 'power2.inOut' });
    });
    categoryGroups.forEach(g => g.visible = false);
    connectionLines.forEach(l => l.visible = true);

    // Hide all detail labels
    setAllDetailLabelsVisible(false);

    // Focus camera on sprints
    gsap.to(camera.position, {
        x: 0, y: 15, z: 50,
        duration: 1.5,
        ease: 'power2.inOut'
    });
    gsap.to(controls.target, {
        x: 0, y: 0, z: 0,
        duration: 1.5,
        ease: 'power2.inOut'
    });

    updateUI();
    updateNavigationDots();
    document.getElementById('btn-back').style.display = 'none';
    document.getElementById('btn-overview').textContent = '🌌 全体を見る';
}

function showCategoriesView(sprintIndex) {
    viewMode = 'categories';
    selectedSprint = sprintIndex;
    currentCategoryIndex = 0;

    const sprint = sprintsData[sprintIndex];

    // Hide all detail labels first
    setAllDetailLabelsVisible(false);

    // Hide other sprints, show selected sprint's categories
    sprintMeshes.forEach((s, i) => {
        s.visible = (i === sprintIndex);
        if (i === sprintIndex) {
            gsap.to(s.position, { y: 15, duration: 1, ease: 'power2.inOut' });
        }
    });
    connectionLines.forEach(l => l.visible = false);

    // Show categories for this sprint
    categoryGroups.forEach((g, i) => {
        g.visible = (i === sprintIndex);
    });

    // Show labels for this sprint only
    setSprintDetailLabelsVisible(sprintIndex, true);

    // Focus camera
    gsap.to(camera.position, {
        x: sprint.position.x,
        y: 10,
        z: sprint.position.z + 35,
        duration: 1.5,
        ease: 'power2.inOut'
    });
    gsap.to(controls.target, {
        x: sprint.position.x,
        y: -5,
        z: sprint.position.z,
        duration: 1.5,
        ease: 'power2.inOut'
    });

    updateUI();
    updateNavigationDots();
    document.getElementById('btn-back').style.display = 'block';
}

function toggleOverview() {
    if (viewMode === 'overview') {
        showSprintsView();
    } else {
        viewMode = 'overview';

        // Show only sprints and connections (no detail labels)
        sprintMeshes.forEach((s, i) => {
            s.visible = true;
            gsap.to(s.position, { y: sprintsData[i].position.y, duration: 1, ease: 'power2.inOut' });
        });
        categoryGroups.forEach(g => g.visible = false);
        connectionLines.forEach(l => l.visible = true);

        // Hide all detail labels
        setAllDetailLabelsVisible(false);

        // Far camera
        gsap.to(camera.position, {
            x: 0, y: 50, z: 80,
            duration: 2,
            ease: 'power2.inOut'
        });
        gsap.to(controls.target, {
            x: 0, y: 0, z: 0,
            duration: 2,
            ease: 'power2.inOut'
        });

        document.getElementById('btn-overview').textContent = '🎯 戻る';
        document.getElementById('btn-back').style.display = 'none';
        updateNavigationDots();
    }
}

// ============================================
// CAMERA NAVIGATION
// ============================================
function focusOnSprint(index) {
    currentSprintIndex = index;
    const sprint = sprintsData[index];

    gsap.to(camera.position, {
        x: sprint.position.x,
        y: 15,
        z: sprint.position.z + 30,
        duration: 1.5,
        ease: 'power2.inOut'
    });
    gsap.to(controls.target, {
        x: sprint.position.x,
        y: 0,
        z: sprint.position.z,
        duration: 1.5,
        ease: 'power2.inOut'
    });

    updateUI();
}

function focusOnCategory(index) {
    if (selectedSprint === null) return;

    currentCategoryIndex = index;
    const sprint = sprintsData[selectedSprint];
    const categoryCount = sprint.categories.length;
    const spacing = 12;
    const startX = -((categoryCount - 1) * spacing) / 2;
    const targetX = sprint.position.x + startX + index * spacing;

    gsap.to(camera.position, {
        x: targetX,
        y: 5,
        z: sprint.position.z + 25,
        duration: 1.5,
        ease: 'power2.inOut'
    });
    gsap.to(controls.target, {
        x: targetX,
        y: -8,
        z: sprint.position.z,
        duration: 1.5,
        ease: 'power2.inOut'
    });

    updateUI();
}

// ============================================
// NAVIGATION
// ============================================
function navigate(direction) {
    if (viewMode === 'sprints') {
        let newIndex = currentSprintIndex + direction;
        if (newIndex < 0) newIndex = sprintsData.length - 1;
        if (newIndex >= sprintsData.length) newIndex = 0;
        currentSprintIndex = newIndex;
        focusOnSprint(newIndex);
        updateNavigationDots();
    } else if (viewMode === 'categories' && selectedSprint !== null) {
        const sprint = sprintsData[selectedSprint];
        let newIndex = currentCategoryIndex + direction;
        if (newIndex < 0) newIndex = sprint.categories.length - 1;
        if (newIndex >= sprint.categories.length) newIndex = 0;
        currentCategoryIndex = newIndex;
        focusOnCategory(newIndex);
        updateNavigationDots();
    }
}

function handleFocusClick() {
    if (viewMode === 'sprints') {
        showCategoriesView(currentSprintIndex);
    } else if (viewMode === 'categories') {
        focusOnCategory(currentCategoryIndex);
    } else if (viewMode === 'overview') {
        showSprintsView();
    }
}

function goBack() {
    if (viewMode === 'categories') {
        showSprintsView();
    }
}

// ============================================
// UPDATE UI
// ============================================
function updateUI() {
    if (viewMode === 'sprints' || viewMode === 'overview') {
        const sprint = sprintsData[currentSprintIndex];
        document.getElementById('category-icon').textContent = sprint.icon;
        document.getElementById('category-icon').style.background =
            `linear-gradient(135deg, ${sprint.color}33, ${sprint.color}66)`;
        document.getElementById('category-title').textContent = sprint.title;
        document.getElementById('category-title').style.color = sprint.color;

        const totalLessons = sprint.categories.reduce((sum, c) => sum + c.lessons.length, 0);
        document.getElementById('category-subtitle').textContent =
            `${sprint.subtitle} • ${sprint.categories.length}カテゴリ • ${totalLessons}レッスン`;

        document.getElementById('progress-fill').style.width = '0%';
        document.getElementById('progress-fill').style.background =
            `linear-gradient(90deg, ${sprint.color}, ${sprint.color}99)`;
    } else if (viewMode === 'categories' && selectedSprint !== null) {
        const sprint = sprintsData[selectedSprint];
        const category = sprint.categories[currentCategoryIndex];

        document.getElementById('category-icon').textContent = category.icon;
        document.getElementById('category-icon').style.background =
            `linear-gradient(135deg, ${category.color}33, ${category.color}66)`;
        document.getElementById('category-title').textContent = category.title;
        document.getElementById('category-title').style.color = category.color;
        document.getElementById('category-subtitle').textContent =
            `${category.subtitle} • ${category.lessons.length}レッスン`;

        const progress = Math.floor(Math.random() * 100);
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('progress-fill').style.background =
            `linear-gradient(90deg, ${category.color}, ${category.color}99)`;
    }
}

// ============================================
// EVENT HANDLERS
// ============================================
function onKeyDown(event) {
    switch (event.key) {
        case 'ArrowLeft':
            navigate(-1);
            break;
        case 'ArrowRight':
            navigate(1);
            break;
        case 'Enter':
        case ' ':
            handleFocusClick();
            break;
        case 'Escape':
        case 'Backspace':
            goBack();
            break;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================
// ANIMATION LOOP
// ============================================
function animate() {
    requestAnimationFrame(animate);

    // Slow star rotation
    if (particles) {
        particles.rotation.y += 0.00005;
    }

    const time = Date.now() * 0.001;

    // Gentle sprint animation (minimal)
    sprintMeshes.forEach((group, index) => {
        if (group.visible) {
            // Very subtle pulse
            const ring = group.children[1];
            if (ring) {
                ring.rotation.z += 0.002;
            }

            // Highlight active sprint
            if (index === currentSprintIndex && viewMode === 'sprints') {
                const scale = 1 + Math.sin(time * 2) * 0.03;
                group.children[0].scale.setScalar(scale);
            } else {
                group.children[0].scale.setScalar(1);
            }
        }
    });

    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// ============================================
// START APPLICATION
// ============================================
init();
