import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Glowing emissive ring helper ─── */
function EmissiveRing({ radius, color, thickness = 0.03, segments = 64 }: {
  radius: number; color: string; thickness?: number; segments?: number;
}) {
  const geo = useMemo(() => new THREE.TorusGeometry(radius, thickness, 12, segments), [radius, thickness, segments]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
    </mesh>
  );
}

/* ─── Animated glow sphere ─── */
function GlowSphere({ color, size, position }: { color: string; size: number; position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={6} transparent opacity={0.9} toneMapped={false} />
    </mesh>
  );
}

/* ─── OLED Eye (blinks) ─── */
function Eye({ position, blink }: { position: [number, number, number]; blink: boolean }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const pulse = Math.sin(clock.getElapsedTime() * 3) * 0.3 + 0.7;
    matRef.current.emissiveIntensity = blink ? 0 : pulse * 4;
  });
  return (
    <mesh position={position} scale={blink ? [1, 0.05, 1] : [1, 1, 1]}>
      <boxGeometry args={[0.14, 0.07, 0.01]} />
      <meshStandardMaterial ref={matRef} color="#00ffff" emissive="#00ffff" emissiveIntensity={4} toneMapped={false} />
    </mesh>
  );
}

/* ─── Scanning mouth bar ─── */
function MouthBar() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (Math.sin(clock.getElapsedTime() * 1.5) + 1) / 2;
    ref.current.scale.x = 0.4 + t * 0.6;
  });
  return (
    <mesh ref={ref} position={[0, -0.12, 0.31]}>
      <boxGeometry args={[0.28, 0.025, 0.01]} />
      <meshStandardMaterial color="#e8ff5a" emissive="#e8ff5a" emissiveIntensity={5} toneMapped={false} />
    </mesh>
  );
}

/* ─── RGB emissive border ring (cycles hue) ─── */
function RGBBorder({ radius }: { radius: number }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const color = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }) => {
    if (!matRef.current) return;
    color.setHSL((clock.getElapsedTime() * 0.15) % 1, 1, 0.5);
    matRef.current.color = color;
    matRef.current.emissive = color;
    matRef.current.emissiveIntensity = 3;
  });
  const geo = useMemo(() => new THREE.TorusGeometry(radius, 0.025, 12, 64), [radius]);
  return (
    <mesh geometry={geo} rotation={[Math.PI / 2, 0, 0]}>
      <meshStandardMaterial ref={matRef} toneMapped={false} />
    </mesh>
  );
}

/* ─── Antenna ─── */
function Antenna() {
  const ballRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!ballRef.current) return;
    const p = (Math.sin(clock.getElapsedTime() * 4) + 1) / 2;
    ballRef.current.emissiveIntensity = 1 + p * 5;
  });
  return (
    <group>
      {/* stick */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.22, 8]} />
        <meshStandardMaterial color="#d0d8e4" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* ball */}
      <mesh position={[0, 0.64, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial ref={ballRef} color="#e8ff5a" emissive="#e8ff5a" emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ─── Robot Head ─── */
function Head({ mouseX, mouseY, blink }: { mouseX: number; mouseY: number; blink: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouseX * 0.5, 0.08);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -mouseY * 0.3, 0.08);
  });

  return (
    <group ref={groupRef} position={[0, 0.28, 0]}>
      {/* Glossy white head body */}
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.62, 0.6]} />
        <meshPhysicalMaterial
          color="#f0f4ff"
          metalness={0.1}
          roughness={0.05}
          reflectivity={1}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* OLED face panel (dark) */}
      <mesh position={[0, 0, 0.31]}>
        <boxGeometry args={[0.56, 0.48, 0.01]} />
        <meshStandardMaterial color="#050810" roughness={0.1} metalness={0.5} />
      </mesh>

      {/* Eyes */}
      <Eye position={[-0.1, 0.06, 0.31]} blink={blink} />
      <Eye position={[0.1, 0.06, 0.31]} blink={blink} />

      {/* Mouth */}
      <MouthBar />

      {/* RGB emissive edge border along head perimeter */}
      <EmissiveRing radius={0.42} color="#a0c4ff" thickness={0.018} />
      <group rotation={[Math.PI / 2, 0, 0]}>
        <EmissiveRing radius={0.36} color="#ff80f0" thickness={0.015} />
      </group>

      {/* Antenna */}
      <Antenna />

      {/* Ear studs */}
      <mesh position={[-0.36, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.08, 12]} />
        <meshPhysicalMaterial color="#e0e8ff" metalness={0.8} roughness={0.1} clearcoat={1} />
      </mesh>
      <mesh position={[0.36, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.08, 12]} />
        <meshPhysicalMaterial color="#e0e8ff" metalness={0.8} roughness={0.1} clearcoat={1} />
      </mesh>
      <GlowSphere color="#00c8ff" size={0.025} position={[-0.36, 0, 0.05]} />
      <GlowSphere color="#ff00e0" size={0.025} position={[0.36, 0, 0.05]} />
    </group>
  );
}

/* ─── Robot Neck ─── */
function Neck() {
  return (
    <mesh position={[0, -0.04, 0]}>
      <cylinderGeometry args={[0.1, 0.13, 0.18, 16]} />
      <meshPhysicalMaterial color="#d8e0f0" metalness={0.6} roughness={0.15} clearcoat={0.8} />
    </mesh>
  );
}

/* ─── Robot Body ─── */
function Body() {
  const chestRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!chestRef.current) return;
    const t = (Math.sin(clock.getElapsedTime() * 2.5) + 1) / 2;
    chestRef.current.emissiveIntensity = 0.5 + t * 1.5;
  });
  return (
    <group position={[0, -0.52, 0]}>
      {/* Torso */}
      <mesh castShadow>
        <boxGeometry args={[0.82, 0.75, 0.55]} />
        <meshPhysicalMaterial color="#eef2ff" metalness={0.15} roughness={0.08} clearcoat={1} clearcoatRoughness={0.05} />
      </mesh>

      {/* Chest glowing panel */}
      <mesh position={[0, 0.05, 0.285]}>
        <boxGeometry args={[0.46, 0.35, 0.01]} />
        <meshStandardMaterial ref={chestRef} color="#080808" emissive="#4488ff" emissiveIntensity={1} roughness={0.1} />
      </mesh>

      {/* Chest arc detail */}
      <mesh position={[0, 0.05, 0.29]}>
        <torusGeometry args={[0.12, 0.02, 8, 32, Math.PI]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={4} toneMapped={false} />
      </mesh>

      {/* RGB orbit ring around torso */}
      <RGBBorder radius={0.5} />

      {/* Belly button / vent */}
      {[-0.12, 0, 0.12].map((x, i) => (
        <mesh key={i} position={[x, -0.22, 0.285]}>
          <boxGeometry args={[0.06, 0.025, 0.01]} />
          <meshStandardMaterial color="#334466" emissive="#6699ff" emissiveIntensity={1.5} />
        </mesh>
      ))}

      {/* Shoulder joints */}
      <mesh position={[-0.49, 0.25, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshPhysicalMaterial color="#d8e0f4" metalness={0.7} roughness={0.1} clearcoat={1} />
      </mesh>
      <mesh position={[0.49, 0.25, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshPhysicalMaterial color="#d8e0f4" metalness={0.7} roughness={0.1} clearcoat={1} />
      </mesh>
    </group>
  );
}

/* ─── Arm component ─── */
function Arm({ side, mouseX }: { side: 'left' | 'right'; mouseX: number }) {
  const ref = useRef<THREE.Group>(null);
  const x = side === 'left' ? -0.58 : 0.58;
  const sign = side === 'left' ? 1 : -1;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const idle = Math.sin(clock.getElapsedTime() * 1.2 + (side === 'left' ? 0 : Math.PI)) * 0.06;
    const target = idle + mouseX * sign * 0.1;
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, target, 0.07);
  });

  return (
    <group ref={ref} position={[x, -0.52, 0]}>
      {/* Upper arm */}
      <mesh position={[0, -0.2, 0]}>
        <capsuleGeometry args={[0.09, 0.28, 8, 16]} />
        <meshPhysicalMaterial color="#e8eeff" metalness={0.2} roughness={0.1} clearcoat={0.8} />
      </mesh>
      {/* Elbow joint */}
      <mesh position={[0, -0.42, 0]}>
        <sphereGeometry args={[0.085, 12, 12]} />
        <meshPhysicalMaterial color="#ccd4e8" metalness={0.5} roughness={0.15} clearcoat={1} />
      </mesh>
      {/* Lower arm */}
      <mesh position={[0, -0.62, 0]}>
        <capsuleGeometry args={[0.075, 0.24, 8, 16]} />
        <meshPhysicalMaterial color="#eef2ff" metalness={0.2} roughness={0.1} clearcoat={0.8} />
      </mesh>
      {/* Hand */}
      <mesh position={[0, -0.82, 0]}>
        <boxGeometry args={[0.16, 0.13, 0.1]} />
        <meshPhysicalMaterial color="#f0f4ff" metalness={0.1} roughness={0.1} clearcoat={1} />
      </mesh>
    </group>
  );
}

/* ─── Floating data orbs around robot ─── */
function DataOrb({ angle, radius, color, speed, yOffset }: {
  angle: number; radius: number; color: string; speed: number; yOffset: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed + angle;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = yOffset + Math.sin(t * 2) * 0.06;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.045, 12, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} toneMapped={false} />
    </mesh>
  );
}

/* ─── Ground glow disc ─── */
function GroundGlow() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (Math.sin(clock.getElapsedTime() * 1.5) + 1) / 2;
    (ref.current.material as THREE.MeshStandardMaterial).opacity = 0.15 + t * 0.1;
  });
  return (
    <mesh ref={ref} position={[0, -1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.1, 64]} />
      <meshStandardMaterial color="#4488ff" emissive="#4488ff" emissiveIntensity={1} transparent opacity={0.2} toneMapped={false} />
    </mesh>
  );
}

/* ─── Full Robot assembly ─── */
function Robot({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [blink, setBlink] = useState(false);

  // Random blink
  useEffect(() => {
    const doBlink = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
      setTimeout(doBlink, 2000 + Math.random() * 4000);
    };
    const t = setTimeout(doBlink, 1500);
    return () => clearTimeout(t);
  }, []);

  // Subtle idle sway
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.04;
  });

  return (
    <group ref={groupRef}>
      <Head mouseX={mouseX} mouseY={mouseY} blink={blink} />
      <Neck />
      <Body />
      <Arm side="left" mouseX={mouseX} />
      <Arm side="right" mouseX={mouseX} />
      <GroundGlow />

      {/* Orbiting data orbs */}
      <DataOrb angle={0}     radius={0.85} color="#e8ff5a" speed={0.6}  yOffset={-0.2} />
      <DataOrb angle={2.09}  radius={0.9}  color="#00d4ff" speed={0.5}  yOffset={0.1}  />
      <DataOrb angle={4.18}  radius={0.8}  color="#ff60f0" speed={0.7}  yOffset={-0.5} />
      <DataOrb angle={1.05}  radius={0.95} color="#aaffaa" speed={0.45} yOffset={0.3}  />
      <DataOrb angle={3.14}  radius={0.88} color="#ff9944" speed={0.55} yOffset={-0.1} />
    </group>
  );
}

/* ─── Scene setup ─── */
function Scene({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 6, 4]} intensity={1.8} castShadow />
      <pointLight position={[-2, 2, 2]} color="#4488ff" intensity={2} />
      <pointLight position={[2, -1, 2]} color="#ff40c0" intensity={1.5} />
      <pointLight position={[0, 1, -2]} color="#44ffaa" intensity={1} />

      <Environment preset="city" />

      <Sparkles
        count={60}
        scale={4}
        size={1.5}
        speed={0.4}
        color="#88aaff"
        opacity={0.5}
      />

      <Float
        speed={1.8}
        rotationIntensity={0.05}
        floatIntensity={0.6}
        floatingRange={[-0.08, 0.08]}
      >
        <Robot mouseX={mouseX} mouseY={mouseY} />
      </Float>

      {/* Ground reflection disc */}
      <mesh position={[0, -1.42, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2, 64]} />
        <MeshDistortMaterial
          color="#050810"
          metalness={0.9}
          roughness={0.1}
          distort={0.1}
          speed={1}
          transparent
          opacity={0.6}
        />
      </mesh>
    </>
  );
}

/* ─── Public export: drop-in canvas component ─── */
export function AIRobotCanvas({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouse({ x: 0, y: 0 })}
      className={className}
      style={{ width: '100%', height: '100%', cursor: 'none', ...style }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 0.1, 3.2], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene mouseX={mouse.x} mouseY={mouse.y} />
      </Canvas>
    </div>
  );
}
