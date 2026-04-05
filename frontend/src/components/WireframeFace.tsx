import { useRef, useMemo, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** How far vertices fly when dissolving */
const SCATTER_RADIUS = 2.5
/** Lerp speed for dissolve / reassemble */
const LERP_SPEED = 2.5
/** Slow idle rotation speed (radians/s) */
const IDLE_ROTATION = 0.15

// ---------------------------------------------------------------------------
// Inner mesh — lives inside the R3F Canvas
// ---------------------------------------------------------------------------

function FaceMesh({ dissolve }: { dissolve: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)

  // Build an icosphere scaled to an oval "face" shape, plus random scatter targets
  const { basePositions, scatterTargets } = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 4) // ~2500 verts at detail 4
    // Scale to face-like oval: slightly narrower on x, taller on y
    const pos = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) * 0.78)
      pos.setY(i, pos.getY(i) * 1.1)
      pos.setZ(i, pos.getZ(i) * 0.85)
    }
    pos.needsUpdate = true

    // Save a copy as base positions
    const base = new Float32Array(pos.array)

    // Pre-compute random scatter directions per vertex
    const scatter = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = SCATTER_RADIUS * (0.6 + Math.random() * 0.4)
      scatter[i * 3] = base[i * 3] + r * Math.sin(phi) * Math.cos(theta)
      scatter[i * 3 + 1] = base[i * 3 + 1] + r * Math.sin(phi) * Math.sin(theta)
      scatter[i * 3 + 2] = base[i * 3 + 2] + r * Math.cos(phi)
    }

    return { basePositions: base, scatterTargets: scatter }
  }, [])

  // Track current animation progress (0 = assembled, 1 = scattered)
  const progressRef = useRef(0)

  useFrame((_state, delta) => {
    if (!meshRef.current) return
    const mesh = meshRef.current
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute

    // Animate progress toward target
    const target = dissolve ? 1 : 0
    progressRef.current = THREE.MathUtils.lerp(
      progressRef.current,
      target,
      1 - Math.exp(-LERP_SPEED * delta)
    )
    const t = progressRef.current

    // Lerp every vertex between base and scatter position
    const arr = pos.array as Float32Array
    for (let i = 0; i < arr.length; i++) {
      arr[i] = basePositions[i] + (scatterTargets[i] - basePositions[i]) * t
    }
    pos.needsUpdate = true

    // Fade wireframe opacity as it scatters
    if (matRef.current) {
      matRef.current.opacity = 1 - t * 0.65
    }

    // Gentle idle rotation
    mesh.rotation.y += IDLE_ROTATION * delta
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 4]} />
      <meshBasicMaterial
        ref={matRef}
        wireframe
        color="#00685f"
        transparent
        opacity={1}
      />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export default function WireframeFace() {
  const [hovered, setHovered] = useState(false)

  const onEnter = useCallback(() => setHovered(true), [])
  const onLeave = useCallback(() => setHovered(false), [])

  return (
    <div
      className="w-full h-full min-h-[320px]"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <FaceMesh dissolve={hovered} />
      </Canvas>
    </div>
  )
}
