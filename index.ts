import * as THREE from "three";
import { TextGeometry, FontLoader } from "three/examples/jsm/Addons";
import font from "./helvetiker_bold.typeface.json?url";
import logoImg from "./1000px.png?url";
import vid from "./out.webm?url";

const params = new URLSearchParams(window.location.search);
const text = params.get("text");

const element = document.createElement("video");
element.src = vid;
element.autoplay = true;
element.loop = true;
element.play();
const vidTexture = new THREE.VideoTexture(element);

window.addEventListener("click", () => {
	element.play();
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	40,
	window.innerWidth / window.innerHeight,
	0.1,
	1000,
);

camera.position.z = 200;

const fontLoader = new FontLoader();
const texLoader = new THREE.TextureLoader();

const renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	renderer.setSize(window.innerWidth, window.innerHeight);
});

const containingGroup = new THREE.Group();
containingGroup.position.set(0, 0, -20);

const group = new THREE.Group();
group.position.set(0, 10, 20);

containingGroup.add(group);
scene.add(containingGroup);

fontLoader.load(font, (fontData) => {
	texLoader.load(logoImg, (texData) => {
		const mat = new THREE.MeshStandardMaterial({
			color: 0x5891dc,
			metalness: 0.2,
			roughness: 0.5,
		});

		const geoms = (text ?? "For Legal Reasons,\nThat Was a Joke")
			.split("\\n")
			.join("\n")
			.split("\n")
			.map((line) => {
				const textGeom = new TextGeometry(line, {
					font: fontData,
					size: 20,
					depth: 3,
					curveSegments: 12,
					bevelEnabled: true,
					bevelThickness: 1,
					bevelSize: 0.5,
					bevelSegments: 2,
				});
				const res = new THREE.Mesh(textGeom, mat);
				group.add(res);
				return res;
			});

		geoms.forEach((geom, idx, arr) => {
			geom.scale.setX(0.5);

			geom.geometry.computeBoundingBox();
			const bounding = geom.geometry.boundingBox;
			const offX = ((bounding?.max.x ?? 0) - (bounding?.min.x ?? 0)) / 4;
			const offY = (idx - arr.length / 4) * -28;

			geom.position.set(-offX, offY, 0);
		});

		const plane = new THREE.PlaneGeometry(30, 30);
		const imageMat = new THREE.MeshBasicMaterial({
			map: texData,
			transparent: true,
		});
		const logo = new THREE.Mesh(plane, imageMat);
		logo.position.set(30, geoms.length * -18, 0);

		const rainbowPlane = new THREE.PlaneGeometry(120, 30);
		const vidMat = new THREE.MeshBasicMaterial({
			map: vidTexture,
			transparent: true,
		});
		const rainbow = new THREE.Mesh(rainbowPlane, vidMat);
		rainbow.scale.set(1, 0.8, 1);
		rainbow.position.set(-30, geoms.length * -18, -1);

		group.add(logo);
		group.add(rainbow);

		const light = new THREE.PointLight(0xffffff, 40000);
		light.position.set(0, 30, 120);
		scene.add(light);

		const ambient = new THREE.AmbientLight(0xffffff, 0.2);
		scene.add(ambient);

		setTimeout(() => {
			renderer.setAnimationLoop(renderLoop);
		}, 1000);
	});
});

renderer.domElement.style.transition = "opacity 2s";
renderer.domElement.style.opacity = "0";

const startPos = [-250, -30, 0];
const startRot = [0.5, -1, 0.5];

let key = 0;

function easeOutCubic(a: number, b: number, x: number): number {
	const t = 1 - Math.pow(1 - x, 3);
	return a + (b - a) * t;
}

function renderLoop() {
	if (element.paused) element.play();

	key++;
	const pos = startPos.map((coord) =>
		easeOutCubic(coord, 0, Math.min(key / 120, 1)),
	) as [number, number, number];
	const rot = startRot.map((coord) =>
		easeOutCubic(coord, 0, Math.min(key / 120, 1)),
	) as [number, number, number];

	containingGroup.position.set(...pos);
	containingGroup.rotation.set(...rot);

	renderer.domElement.style.opacity = "1";
	renderer.render(scene, camera);
}
