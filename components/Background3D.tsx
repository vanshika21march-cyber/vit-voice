"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "next-themes";

// A random point generating function
function generateParticles(count: number) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        // Spread particles in a sphere or cube
        const r = 20 * Math.cbrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
    }
    return positions;
}

function StarField({ count, color, size, speed }: { count: number; color: string; size: number; speed: number }) {
    const ref = useRef<THREE.Points>(null!);
    const pointer = useRef({ x: 0, y: 0 });
    const positions = useMemo(() => generateParticles(count), [count]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Normalize mouse coordinates from -1 to 1
            pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useFrame((state, delta) => {
        if (ref.current) {
            // Slow constant drift
            ref.current.rotation.x -= delta * speed;
            ref.current.rotation.y -= delta * speed;

            // Interactive rotation based on mouse
            ref.current.rotation.x += (pointer.current.y * 0.4 - ref.current.rotation.x) * 0.05;
            ref.current.rotation.y += (pointer.current.x * 0.4 - ref.current.rotation.y) * 0.05;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color={color}
                    size={size}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        </group>
    );
}

export default function Background3D() {
    const { theme } = useTheme();

    // In light mode, use very dark gray particles. In dark mode, use white/light particles.
    const primaryColor = theme === 'light' ? '#333333' : '#ffffff';
    const secondaryColor = theme === 'light' ? '#6366f1' : '#a5b4fc';

    return (
        <div className="absolute inset-0 -z-30 w-full h-full pointer-events-none transition-colors duration-500">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                {/* Minimal elegant stars */}
                <StarField count={800} color={primaryColor} size={0.05} speed={0.01} />
                <StarField count={400} color={secondaryColor} size={0.08} speed={0.02} />
            </Canvas>
        </div>
    );
}
