// src/components/GlassCondensation.jsx
import { useEffect, useRef } from 'react'

export default function GlassCondensation({ isDark = true }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return 
        const ctx = canvas.getContent('2d')

        let animationFrameId
        let width = (canvas.width = window.innerWidth)
        let height = (canvas.height = window.innerHeight)

        const handleResize = () => { 
            if (!canvas) return
            width = canvas.width = window.innerWidth
            height = canvas.height - window.innerHeight
            initStaticLayers()
        }

        window.addEventListener('resize', handleResize)

        // ── 1. KHỞI TẠO DỮ LIỆU VỆT NƯỚC CHẢY & GIỌT NƯỚC ──
        let trails = []
        let staticDrops = []
        let microBeads = []
        let tricklingDrops = []

        function initStaticLayers() {
            const trailCount = Math.max(6, Math.floor(width / 180))
            trails = []
            for (let i = 0; i < trailCount; i++) {
                const startX = (i + 0.5) * (width / trailCount) + (Math.random() - 0.5) * 60
                const points = []
                let currX = startX
                const segments = 18 
                for (let j = 0; j <= segments; j++) { 
                    const currY = (j / segments) * height
                    currX += (Math.random() - 0.5) * 16
                    points.push({ x: currX, y: currY })
                }
                trails.push({
                    points,
                    width: 14 + Math.random() * 20,
                     opacity: 0.12 + Math.random() * 0.14
                })
            }

            const dropCount = Math.max(70, Math.floor((width * height) / 12000))
            staticDrops = []
            for (let i = 0; i < dropCount; i++) { 
                staticDrops.push({ 
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: 3 + Math.random() * 9,
                    elongation: 1.08 + Math.random() * 0.25, 
                    slantAngle: (Math.random() - 0.5) * 0.2
                })
            }

            // C. Bụi sương mịn li ti bám kính (Micro-beads Spray)
            const microCount = Math.max(200, Math.floor((width * height) / 4000))
            microBeads = []
            for (let i = 0; i < microCount; i++) {
                microBeads.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: 0.8 + Math.random() * 1.5,
                    opacity: 0.35 + Math.random() * 0.45
                })
            }
            // D. Giọt nước chuyển động trượt chảy chậm (Active Trickling Drops)
            tricklingDrops = trails.slice(0, 5).map((trail, idx) => ({
                id: idx,
                trailPoints: trail.points,
                progress: Math.random() * 0.8,
                speed: 0.0006 + Math.random() * 0.0009,
                r: 6 + Math.random() * 6,
                pauseCounter: 0
            }))
        }
        initStaticLayers()
        // ── 2. HÀM VẼ GIỌT NƯỚC QUANG HỌC 3D ──
        function drawWaterDroplet(x, y, r, elongation = 1.15, angle = 0) {
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(angle)
            const rx = r
            const ry = r * elongation
            // 1. Bóng khúc xạ viền tối bên dưới (Meniscus Shadow)
            ctx.beginPath()
            ctx.ellipse(0, ry * 0.15, rx * 1.02, ry * 1.02, 0, 0, Math.PI * 2)
            ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(30, 41, 59, 0.38)'
            ctx.fill()
            // 2. Thân giọt nước phản quang kính (Lens Refraction Body)
            ctx.beginPath()
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
            const bodyGrad = ctx.createRadialGradient(-rx * 0.25, -ry * 0.3, 1, 0, 0, ry)
            if (isDark) {
                bodyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)')
                bodyGrad.addColorStop(0.3, 'rgba(186, 230, 253, 0.2)')
                bodyGrad.addColorStop(0.75, 'rgba(30, 41, 59, 0.25)')
                bodyGrad.addColorStop(1, 'rgba(15, 23, 42, 0.65)')
            } else {
                bodyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
                bodyGrad.addColorStop(0.3, 'rgba(224, 242, 254, 0.35)')
                bodyGrad.addColorStop(0.75, 'rgba(100, 116, 139, 0.25)')
                bodyGrad.addColorStop(1, 'rgba(51, 65, 85, 0.55)')
            }
            ctx.fillStyle = bodyGrad
            ctx.fill()
            // 3. Viền phản quang ánh sáng ở đáy (Curved Bottom Highlight)
            ctx.beginPath()
            ctx.ellipse(0, ry * 0.45, rx * 0.65, ry * 0.35, 0, 0, Math.PI)
            ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.55)'
            ctx.fill()
            // 4. Điểm sáng chói trên đỉnh (Glint Specular Highlight)
            ctx.beginPath()
            ctx.ellipse(-rx * 0.32, -ry * 0.35, rx * 0.28, ry * 0.2, -Math.PI / 6, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.98)'
            ctx.fill()
            // 5. Đốm sáng phụ li ti
            if (r > 5) {
                ctx.beginPath()
                ctx.arc(rx * 0.28, ry * 0.32, rx * 0.12, 0, Math.PI * 2)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
                ctx.fill()
            }
            ctx.restore()
        }
        // ── 3. VÒNG LẶP RENDER CHUẨN 60 FPS ──
        function render() {
            ctx.clearRect(0, 0, width, height)
            // A. Vẽ các dải nước chảy (Rivulets)
            trails.forEach(trail => {
                ctx.save()
                ctx.beginPath()
                ctx.moveTo(trail.points[0].x, trail.points[0].y)
                for (let i = 1; i < trail.points.length; i++) {
                    ctx.lineTo(trail.points[i].x, trail.points[i].y)
                }
                ctx.lineWidth = trail.width
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
                ctx.strokeStyle = isDark
                    ? `rgba(255, 255, 255, ${trail.opacity * 0.6})`
                    : `rgba(255, 255, 255, ${trail.opacity * 1.5})`
                ctx.stroke()
                // Viền bóng nước phản quang
                ctx.lineWidth = 1.2
                ctx.strokeStyle = isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(255, 255, 255, 0.4)'
                ctx.stroke()
                ctx.restore()
            })
            // B. Vẽ bụi sương mịn ngưng tụ (Micro-beads)
            microBeads.forEach(bead => {
                ctx.beginPath()
                ctx.arc(bead.x, bead.y, bead.r, 0, Math.PI * 2)
                ctx.fillStyle = isDark
                    ? `rgba(255, 255, 255, ${bead.opacity})`
                    : `rgba(255, 255, 255, ${bead.opacity * 1.2})`
                ctx.fill()
            })
            // C. Vẽ các giọt nước 3D đọng tĩnh
            staticDrops.forEach(drop => {
                drawWaterDroplet(drop.x, drop.y, drop.r, drop.elongation, drop.slantAngle)
            })
            // D. Vẽ và di chuyển giọt nước trượt chảy (Trickling Drops)
            tricklingDrops.forEach(td => {
                if (td.pauseCounter > 0) {
                    td.pauseCounter--
                } else {
                    td.progress += td.speed
                    if (Math.random() < 0.015) {
                        td.pauseCounter = 15 + Math.floor(Math.random() * 30) // Khựng lại tự nhiên
                    }
                }
                if (td.progress >= 1) {
                    td.progress = 0
                    td.speed = 0.0006 + Math.random() * 0.0009
                }
                // Tính tọa độ giọt nước theo đường spline dải nước
                const totalPoints = td.trailPoints.length - 1
                const index = Math.min(totalPoints - 1, Math.floor(td.progress * totalPoints))
                const subT = (td.progress * totalPoints) - index
                const p0 = td.trailPoints[index]
                const p1 = td.trailPoints[index + 1]
                const currX = p0.x + (p1.x - p0.x) * subT
                const currY = p0.y + (p1.y - p0.y) * subT
                // Giọt nước đang trượt có đuôi giọt lệ dài hơn
                drawWaterDroplet(currX, currY, td.r, 1.45, 0)
            })
            animationFrameId = requestAnimationFrame(render)
        }
        render()
        return () => {
            window.removeEventListener('resize', handleResize)
            cancelAnimationFrame(animationFrameId)
        }
    }, [isDark])
    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 pointer-events-none z-[1] w-full h-full opacity-85"
        />
    )
}