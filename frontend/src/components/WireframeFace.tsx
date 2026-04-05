import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const BASE = import.meta.env.BASE_URL

/** How far vertices fly when dissolving */
const SCATTER_RADIUS = 25
/** Scale applied to the loaded model */
const MODEL_SCALE = 2
/** Lerp speed for dissolve / reassemble */
const LERP_SPEED = 2.5
/** Slow idle rotation speed (radians/s) */
const IDLE_ROTATION = 0.075

// ---------------------------------------------------------------------------
// Inner mesh — lives inside the R3F Canvas
// ---------------------------------------------------------------------------

function FaceMesh({ dissolve }: { dissolve: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const gltf = useGLTF(`${BASE}models/low_poly_face.glb`)

  // Extract geometry from the loaded GLTF and compute scatter targets
  const { geometry, basePositions, scatterTargets } = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !geo) {
        geo = (child as THREE.Mesh).geometry.clone()
      }
    })
    if (!geo) {
      geo = new THREE.IcosahedronGeometry(1, 4)
    }

    const pos = (geo as THREE.BufferGeometry).attributes.position as THREE.BufferAttribute
    // Scale up the model
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) * MODEL_SCALE)
      pos.setY(i, pos.getY(i) * MODEL_SCALE)
      pos.setZ(i, pos.getZ(i) * MODEL_SCALE)
    }
    pos.needsUpdate = true
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

    return { geometry: geo as THREE.BufferGeometry, basePositions: base, scatterTargets: scatter }
  }, [gltf])

  // Attach geometry to mesh and face forward
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.geometry = geometry
      meshRef.current.rotation.y = Math.PI
    }
  }, [geometry])

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
      <meshBasicMaterial
        ref={matRef}
        wireframe
        color="#ffffff"
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
      className="w-full h-full min-h-[320px] relative"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
        style={{ width: '400%', height: '400%' }}
      >
        <Canvas
          camera={{ position: [0, 0, 3.5 * 4], fov: 50 }}
          style={{ background: 'transparent', overflow: 'visible' }}
          gl={{ alpha: true, antialias: true }}
        >
          <FaceMesh dissolve={hovered} />
        </Canvas>
      </div>
    </div>
  )
}
