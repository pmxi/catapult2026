import { useRef, useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const BASE = import.meta.env.BASE_URL

/** How far vertices fly when dissolving */
const SCATTER_RADIUS = 60
/** Scale applied to the loaded model */
const MODEL_SCALE = 2
/** Lerp speed for dissolve / reassemble */
const LERP_SPEED = 2.0
/** Slow idle rotation speed (radians/s) */
const IDLE_ROTATION = 0.075

// ---------------------------------------------------------------------------
// Inner mesh — lives inside the R3F Canvas
// ---------------------------------------------------------------------------

function FaceMesh({ trackRef }: { trackRef: React.RefObject<HTMLDivElement> }) {
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

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const mesh = meshRef.current
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute

    // Sync position and scale with DOM element
    if (trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect()
      
      const scale = rect.height / state.size.height
      mesh.scale.setScalar(scale)

      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2

      const ndcX = (cx / state.size.width) * 2 - 1
      const ndcY = -(cy / state.size.height) * 2 + 1

      const vec = new THREE.Vector3(ndcX, ndcY, 0.5)
      vec.unproject(state.camera)
      vec.sub(state.camera.position).normalize()
      const dist = -state.camera.position.z / vec.z
      mesh.position.copy(state.camera.position).add(vec.multiplyScalar(dist))
    }

    // Scroll-based progress target (0 to 1 over 800px of scroll)
    const scrollTarget = Math.min(1, Math.max(0, window.scrollY / 800))
    
    // Animate progress toward scroll target
    progressRef.current = THREE.MathUtils.lerp(
      progressRef.current,
      scrollTarget,
      1 - Math.exp(-LERP_SPEED * delta)
    )
    const t = progressRef.current

    // Lerp every vertex between base and scatter position
    const arr = pos.array as Float32Array
    for (let i = 0; i < arr.length; i++) {
      arr[i] = basePositions[i] + (scatterTargets[i] - basePositions[i]) * t
    }
    pos.needsUpdate = true

    // Fade wireframe opacity as it scatters (don't let it vanish entirely)
    if (matRef.current) {
      matRef.current.opacity = 1 - t * 0.7
    }

    // Gentle idle rotation
    mesh.rotation.y += IDLE_ROTATION * delta
  })

  return (
    <mesh ref={meshRef} frustumCulled={false}>
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
  const trackRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Wait for client mount to avoid hydration mismatch with Portals
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <div
        ref={trackRef}
        className="w-full h-full min-h-[320px] relative z-10"
      />
      {mounted && createPortal(
        <div className="fixed inset-0 pointer-events-none z-0">
          <Canvas
            camera={{ position: [0, 0, 3.5], fov: 50 }}
            style={{ background: 'transparent', pointerEvents: 'none' }}
            gl={{ alpha: true, antialias: true }}
          >
            <FaceMesh trackRef={trackRef} />
          </Canvas>
        </div>,
        document.body
      )}
    </>
  )
}
