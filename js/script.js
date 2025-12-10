/* ==========================================================================
   Main JavaScript for Luxe Supreme
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /**
     * @file This script handles the interactive elements of the Luxe Supreme page,
     * including the 3D hero scene, loading animations, and scroll-based effects.
     */

    // --- 1. Loading Bar Simulation ---
    /**
     * Animates a loading bar at the top of the page on initial load.
     */
    const loadingBar = document.querySelector('.loading-bar');
    if (loadingBar) {
        // A slight delay to ensure the transition is visible on fast connections.
        setTimeout(() => {
            loadingBar.style.transform = 'scaleX(1)';
        }, 100);

        loadingBar.addEventListener('transitionend', () => {
            // Fade out after completion.
            loadingBar.style.opacity = '0';
            setTimeout(() => {
                loadingBar.style.display = 'none';
            }, 500);
        });
    }

    // --- 2. 3D Hero Scene with Three.js ---
    /**
     * Manages the entire Three.js background scene, including the diamond,
     * particles, lighting, and interactive camera movements.
     */
    class DiamondHero {
        constructor() {
            this.canvas = document.querySelector('canvas.webgl');
            if (!this.canvas) {
                console.error("WebGL canvas not found.");
                return;
            }
            this.init();
        }

        /**
         * Sets up a scroll event listener to track the page's scroll position.
         */
        setupScrollEvent() {
            this.scrollY = 0;
            window.addEventListener('scroll', () => {
                this.scrollY = window.scrollY;
            });
        }

        /**
         * Initializes the entire 3D scene.
         */
        init() {
            this.setupScene();
            this.setupLights();
            this.createCrystalShell(); // The main diamond object
            this.setupParticles();
            this.setupMouseEvent();
            this.setupScrollEvent();

            this.clock = new THREE.Clock();
            this.render(); // Starts the animation loop

            window.addEventListener('resize', this.resize.bind(this));
        }

        /**
         * Configures the basic Three.js scene, camera, and renderer.
         */
        setupScene() {
            this.scene = new THREE.Scene();
            this.sizes = { width: window.innerWidth, height: window.innerHeight };
            this.camera = new THREE.PerspectiveCamera(35, this.sizes.width / this.sizes.height, 0.1, 100);
            this.camera.position.z = 6;
            this.scene.add(this.camera);

            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                alpha: true, // Transparent background
                antialias: true
            });
            this.renderer.setSize(this.sizes.width, this.sizes.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            this.composer = new THREE.EffectComposer(this.renderer);
            this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
            const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.5, 0.4, 0.85
            );
            this.composer.addPass(bloomPass);
        }

        /**
         * Adds lighting to the scene for realism.
         */
        setupLights() {
            this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
            const pointLight = new THREE.PointLight(0xadd8e6, 0.8); // Light blue light
            pointLight.position.set(-5, -5, -5);
            this.scene.add(pointLight);
            const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
            pointLight2.position.set(5, 5, 5);
            this.scene.add(pointLight2);
        }

        /**
         * Creates the central diamond object with a crystal shell and a glowing core.
         */
        createCrystalShell() {
            this.diamondGroup = new THREE.Group();

            const r = 1.5;
            const points = [
                new THREE.Vector2(0, -1.1 * r),    // Culet (Tip)
                new THREE.Vector2(1 * r, 0),       // Girdle (Widest point)
                new THREE.Vector2(0.6 * r, 0.35 * r),  // Table Edge
                new THREE.Vector2(0.0, 0.35 * r)   // Table Center
            ];

            const diamondGeometry = new THREE.LatheGeometry(points, 16);
            diamondGeometry.computeVertexNormals();
            diamondGeometry.center();

            const outerMaterial = new THREE.MeshPhysicalMaterial({
                metalness: 0,
                roughness: 0,
                transmission: 0.97,
                ior: 2.418, // Refractive index of a diamond
                thickness: 0.8,
                color: 0xffffff,
                envMapIntensity: 1,
                flatShading: true
            });
            const outerShell = new THREE.Mesh(diamondGeometry, outerMaterial);

            const innerGeometry = diamondGeometry.clone().scale(0.5, 0.5, 0.5);
            const innerMaterial = new THREE.MeshBasicMaterial({
                color: 0x535DA8,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.BackSide,
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });
            const innerCore = new THREE.Mesh(innerGeometry, innerMaterial);

            this.diamondGroup.add(outerShell, innerCore);
            this.scene.add(this.diamondGroup);
        }

        /**
         * Creates the starfield particle effect.
         */
        setupParticles() {
            const particlesCount = 5000;
            const positions = new Float32Array(particlesCount * 3);
            for (let i = 0; i < particlesCount * 3; i++) {
                positions[i] = (Math.random() - 0.5) * 15;
            }
            const particlesGeometry = new THREE.BufferGeometry();
            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const particlesMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, sizeAttenuation: true });
            this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
            this.scene.add(this.particles);
        }

        /**
         * Sets up a mouse move listener to track cursor position for parallax effects.
         */
        setupMouseEvent() {
            this.cursor = { x: 0, y: 0 };
            window.addEventListener('mousemove', (e) => {
                this.cursor.x = e.clientX / this.sizes.width - 0.5;
                this.cursor.y = e.clientY / this.sizes.height - 0.5;
            });
        }

        /**
         * The main animation loop, called on every frame.
         */
        render() {
            const elapsedTime = this.clock.getElapsedTime();
            const deltaTime = this.clock.getDelta();

            if (this.diamondGroup) {
                // Animate diamond rotation based on time and scroll position.
                this.diamondGroup.rotation.y = (elapsedTime * 0.1) + (this.scrollY * 0.0015);
                this.diamondGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.1;
                if (this.diamondGroup.children[1]) {
                    const innerCore = this.diamondGroup.children[1];
                    innerCore.rotation.y = elapsedTime * 0.2;
                    innerCore.rotation.x = elapsedTime * 0.1;
                    const scale = 1 + Math.sin(elapsedTime * 2) * 0.05;
                    innerCore.scale.set(scale, scale, scale);
                }
            }

            // Apply parallax effect to the camera based on cursor position.
            const parallaxX = this.cursor.x * 0.5;
            const parallaxY = -this.cursor.y * 0.5;
            this.camera.position.x += (parallaxX - this.camera.position.x) * 3 * deltaTime;
            this.camera.position.y += (parallaxY - this.camera.position.y) * 3 * deltaTime;

            if (this.particles) {
                this.particles.rotation.y = -elapsedTime * 0.05;
                this.particles.position.y = -this.scrollY * 0.0005;
                this.particles.position.z = this.scrollY * 0.01;
            }

            this.composer.render();
            window.requestAnimationFrame(this.render.bind(this));
        }

        /**
         * Handles window resize events to keep the scene proportional.
         */
        resize() {
            this.sizes.width = window.innerWidth;
            this.sizes.height = window.innerHeight;
            this.camera.aspect = this.sizes.width / this.sizes.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.sizes.width, this.sizes.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
    }

    // --- 3. UX Enhancement Modules ---

    /**
     * Adds a mouse-tracking glow effect to all elements with the .glass-card class.
     */
    function setupCardHoverEffect() {
        const cards = document.querySelectorAll('.glass-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    }

    /**
     * Handles the fade-out effect for the hero section on scroll.
     */
    function setupLayerParallax() {
        const hero = document.querySelector('.hero-section');
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const viewportHeight = window.innerHeight;
            const heroOpacity = 1 - Math.min(1, scrollY / (viewportHeight * 0.8));
            if (hero) hero.style.opacity = heroOpacity;
        });
    }

    /**
     * Sets up IntersectionObserver to trigger fade-in animations for sections as they enter the viewport.
     */
    function setupEntranceAnimations() {
        const sectionsToReveal = document.querySelectorAll('.story-chapter, .product-section, .trust-signals, .materials-section');
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.2 };
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        sectionsToReveal.forEach(section => observer.observe(section));

        const productCards = document.querySelectorAll('.product-card');
        const cardObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 150);
                    observer.unobserve(entry.target);
                }
            });
        }, { root: null, rootMargin: '0px', threshold: 0.1 });

        productCards.forEach(card => cardObserver.observe(card));
    }

    /**
     * Applies a parallax effect to section titles on scroll.
     */
    function setupTitleParallax() {
        const titles = document.querySelectorAll('.section-title');
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            titles.forEach(title => {
                const titleTop = title.parentElement.offsetTop;
                const parallaxOffset = (scrollY - titleTop) * 0.1;
                if (scrollY > titleTop - window.innerHeight && scrollY < titleTop + title.parentElement.offsetHeight) {
                    title.style.transform = `translateY(${parallaxOffset}px)`;
                }
            });
        });
    }

    /**
     * Adds a smooth scroll to top for all CTA buttons.
     */
    function setupSmoothScroll() {
        const ctaButtons = document.querySelectorAll('.cta-button');
        ctaButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        });
    }

    // --- Initialize all modules ---
    new DiamondHero();
    setupCardHoverEffect();
    setupLayerParallax();
    setupEntranceAnimations();
    setupTitleParallax();
    setupSmoothScroll();
});
