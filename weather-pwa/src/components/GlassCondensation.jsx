// src/components/GlassCondensation.jsx
import { useEffect, useRef } from 'react'

export default function GlassCondensation({ isDark = true }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return 
        const ctx = canvas.getContext('2d')

        let animationFrameId
        let width = 0
        let height = 0

        // ── 1. CẤU TRÚC DỮ LIỆU VẬT LÝ ──
        let trails = []
        let staticDrops = []
        let microBeads = []
        let tricklingDrops = []
        let daughterDrops = [] // Các giọt nước nhỏ bị văng lại khi giọt lớn chảy qua

        const handleResize = () => { 
            if (!canvas) return
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            width = window.innerWidth
            height = window.innerHeight
            canvas.width = Math.round(width * dpr)
            canvas.height = Math.round(height * dpr)
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            initScene()
        }

        window.addEventListener('resize', handleResize)

        function initScene() {
            // A. Dải nước mờ loang (Vertical Rivulets)
            const trailCount = Math.max(5, Math.floor(width / 200))
            trails = []
            for (let i = 0; i < trailCount; i++) {
                const startX = (i + 0.5) * (width / trailCount) + (Math.random() - 0.5) * 50
                const points = []
                let currX = startX
                const segments = 22
                for (let j = 0; j <= segments; j++) { 
                    const currY = (j / segments) * height
                    currX += (Math.random() - 0.5) * 12
                    points.push({ x: currX, y: currY })
                }
                trails.push({
                    points,
                    width: 7 + Math.random() * 9,
                    opacity: 0.08 + Math.random() * 0.12
                })
            }

            // B. Hạt nước tĩnh nổi khối 3D quang học (Static Drops)
            const dropCount = Math.max(110, Math.floor((width * height) / 8500))
            staticDrops = []
            for (let i = 0; i < dropCount; i++) { 
                staticDrops.push({ 
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: 1.6 + Math.random() * 4.2, // Kích thước hạt từ nhỏ đến vừa
                    elongation: 1.05 + Math.random() * 0.22, 
                    slantAngle: (Math.random() - 0.5) * 0.15
                })
            }

            // C. Bụi sương mịn ngưng tụ li ti (Micro-beads Spray)
            const microCount = Math.max(260, Math.floor((width * height) / 3800))
            microBeads = []
            for (let i = 0; i < microCount; i++) {
                microBeads.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: 0.5 + Math.random() * 1.1,
                    opacity: 0.25 + Math.random() * 0.45
                })
            }

            // D. Giọt nước chảy động theo vật lý Stick-Slip (Dính - Trượt giật)
            const activeCount = Math.max(5, Math.floor(width / 220))
            tricklingDrops = []
            for (let i = 0; i < activeCount; i++) {
                tricklingDrops.push(createTricklingDrop(i, true))
            }
            daughterDrops = []
        }

        // Tạo một giọt trượt với vật lý sức căng bề mặt
        function createTricklingDrop(index, initialRandom = false) {
            const laneWidth = width / Math.max(5, Math.floor(width / 220))
            const x = (index + 0.5) * laneWidth + (Math.random() - 0.5) * (laneWidth * 0.7)
            const y = initialRandom ? Math.random() * height * 0.7 : -20 - Math.random() * 80

            return {
                x,
                y,
                baseX: x,
                r: 3.5 + Math.random() * 3.2,
                vy: 0,
                state: 'stick', // 'stick' (đang dính) hoặc 'slip' (đang trượt vọt)
                stickTimer: Math.floor(15 + Math.random() * 45), // Số frame bám dính trước khi trượt
                slipDistance: 0,
                trailHistory: [], // Lưu vết đường trượt
                elongation: 1.15
            }
        }

        handleResize()

        // ── 2. QUANG HỌC VẼ GIỌT NƯỚC 3D SIÊU THỰC ──
        function drawWaterDroplet(x, y, r, elongation = 1.15, angle = 0, isFalling = false) {
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(angle)

            const rx = r
            const ry = r * elongation

            // Tạo hình giọt nước (Nếu đang trượt nhanh -> vuốt nhọn đuôi giọt lệ hữu cơ)
            ctx.beginPath()
            if (elongation > 1.35) {
                const tailY = -ry * 1.1
                ctx.moveTo(0, tailY)
                ctx.bezierCurveTo(rx * 0.85, -ry * 0.25, rx * 1.08, ry * 0.55, 0, ry)
                ctx.bezierCurveTo(-rx * 1.08, ry * 0.55, -rx * 0.85, -ry * 0.25, 0, tailY)
            } else {
                ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
            }

            // 1. Meniscus Dark Shadow (Bóng đổ khúc xạ sườn và đáy tạo khối nổi)
            ctx.save()
            ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.55)'
            ctx.shadowBlur = Math.max(2, r * 0.65)
            ctx.shadowOffsetY = Math.max(1, ry * 0.22)
            ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(30, 41, 59, 0.35)'
            ctx.fill()
            ctx.restore()

            // 2. Thân giọt nước thủy tinh thấu kính khúc xạ (Lens Refraction Body)
            const bodyGrad = ctx.createRadialGradient(-rx * 0.28, -ry * 0.32, r * 0.08, 0, 0, ry)
           
            bodyGrad.addColorStop(0, 'rgba(241, 245, 249, 0.85)')
            bodyGrad.addColorStop(0.2, 'rgba(203, 213, 225, 0.45)')
            bodyGrad.addColorStop(0.55, 'rgba(148, 163, 184, 0.35)')
            bodyGrad.addColorStop(0.85, 'rgba(71, 85, 105, 0.65)')
            bodyGrad.addColorStop(1, 'rgba(15, 23, 42, 0.88)')
            
            ctx.fillStyle = bodyGrad
            ctx.fill()

            // 3. Viền tối quang học khúc xạ mặt kính (Meniscus Perimeter Edge)
            ctx.lineWidth = Math.min(1.2, Math.max(0.65, r * 0.14))
            ctx.strokeStyle = 'rgba(226, 232, 240, 0.48)'
            ctx.stroke()

            // 4. Ánh sáng hội tụ ở đáy (Caustic Glow - khúc xạ qua lưng giọt nước)
            ctx.beginPath()
            ctx.ellipse(0, ry * 0.52, rx * 0.68, ry * 0.28, 0, 0, Math.PI)
            ctx.fillStyle = 'rgba(226, 232, 240, 0.48)'
            ctx.fill()

            // 5. Đốm sáng đỉnh sắc nét có hào quang tỏa lóa (Glint with Bloom)
            ctx.beginPath()
            const glintRx = rx * 0.26
            const glintRy = Math.min(ry * 0.18, r * 0.25)
            ctx.ellipse(-rx * 0.3, -ry * 0.36, glintRx, glintRy, -Math.PI / 5, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
            ctx.shadowColor = 'rgba(255, 255, 255, 0.95)'
            ctx.fill()

            // 6. Đốm phản xạ phụ li ti ở góc đối diện
            if (r > 3) {
                ctx.beginPath()
                ctx.arc(rx * 0.28, ry * 0.34, Math.max(0.55, r * 0.09), 0, Math.PI * 2)
                ctx.fillStyle = 'rgba(226, 232, 240, 0.5)'
                ctx.fill()
            }

            ctx.restore()
        }

        // ── 3. VÒNG LẶP RENDER & CẬP NHẬT VẬT LÝ 60 FPS ──
        function render() {
            ctx.clearRect(0, 0, width, height)

            // A. Vẽ các dải nước chảy mờ nền (Rivulets)
            trails.forEach(trail => {
                ctx.save()
                ctx.filter = 'blur(4.5px)'
                ctx.beginPath()
                ctx.moveTo(trail.points[0].x, trail.points[0].y)
                for (let i = 1; i < trail.points.length; i++) {
                    ctx.lineTo(trail.points[i].x, trail.points[i].y)
                }
                ctx.lineWidth = trail.width
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
                ctx.strokeStyle = `rgba(148, 163, 184, ${trail.opacity * 0.55})`                        
                ctx.stroke()
                ctx.filter = 'none'
                ctx.restore()
            })

            // B. Vẽ bụi sương mịn ngưng tụ li ti
            microBeads.forEach(bead => {
                ctx.beginPath()
                ctx.arc(bead.x, bead.y, bead.r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(203, 213, 225, ${bead.opacity * 0.75})`
                ctx.fill()
            })

            // C. Vẽ các giọt nước con bị văng lại phía sau khi giọt lớn chảy qua
            daughterDrops.forEach(drop => {
                drawWaterDroplet(drop.x, drop.y, drop.r, 1.1, 0)
            })

            // D. Vẽ các giọt nước 3D đọng tĩnh
            staticDrops.forEach(drop => {
                drawWaterDroplet(drop.x, drop.y, drop.r, drop.elongation, drop.slantAngle)
            })

            // E. Cập nhật và vẽ các giọt nước chảy theo vật lý Stick-Slip chân thật
            tricklingDrops.forEach((td, idx) => {
                if (td.state === 'stick') {
                    // Trạng thái DÍNH: Giọt nước bám yên hoặc rung nhẹ dưới sức căng bề mặt
                    td.elongation = 1.18
                    td.stickTimer--
                    if (td.stickTimer <= 0) {
                        // Phá vỡ sức căng bề mặt -> BẮT ĐẦU TRƯỢT VỌT (SLIP)
                        td.state = 'slip'
                        td.slipDistance = 50 + Math.random() * 110 // Đoạn đường trượt vọt
                        td.vy = 2.4 + Math.random() * 3.2 // Tốc độ trượt dứt khoát
                    }
                } else if (td.state === 'slip') {
                    // Trạng thái TRƯỢT VỌT: Giọt nước dãn dài và lao xuống nhanh
                    td.y += td.vy
                    td.x = td.baseX + Math.sin(td.y * 0.04) * 5 // Lượn sóng nhẹ tự nhiên
                    td.slipDistance -= td.vy
                    td.elongation = Math.min(2.1, 1.3 + td.vy * 0.18) // Dãn dài hình giọt lệ

                    // Lưu vết nước ẩm (Wet Trail) kéo theo sau giọt nước
                    td.trailHistory.push({ x: td.x, y: td.y, alpha: 0.55 })
                    if (td.trailHistory.length > 18) td.trailHistory.shift()

                    // Thỉnh thoảng văng lại một hạt nước con trên kính
                    if (Math.random() < 0.04 && daughterDrops.length < 35) {
                        daughterDrops.push({
                            x: td.x + (Math.random() - 0.5) * 2,
                            y: td.y - td.r * 1.5,
                            r: 1.2 + Math.random() * 1.2
                        })
                    }

                    // Khi hết đoạn trượt vọt -> Ma sát giữ lại, quay về trạng thái Dính
                    if (td.slipDistance <= 0) {
                        td.state = 'stick'
                        td.stickTimer = Math.floor(18 + Math.random() * 40) // Nghỉ thoáng chốc
                        td.vy = 0
                    }
                }

                // Vẽ vệt nước ẩm (Trailing Wake) sau đuôi giọt nước
                if (td.trailHistory.length > 2) {
                    ctx.save()
                    ctx.filter = 'blur(2.5px)'
                    ctx.beginPath()
                    ctx.moveTo(td.trailHistory[0].x, td.trailHistory[0].y)
                    for (let i = 1; i < td.trailHistory.length; i++) {
                        ctx.lineTo(td.trailHistory[i].x, td.trailHistory[i].y)
                    }
                    ctx.lineWidth = Math.max(1.8, td.r * 0.6)
                    ctx.lineCap = 'round'
                    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
                    ctx.stroke()
                    ctx.filter = 'none'
                    ctx.restore()
                }

                // Vẽ giọt nước trượt chính
                drawWaterDroplet(td.x, td.y, td.r, td.elongation, 0, true)

                // Khi rơi khỏi đáy màn hình -> Tái sinh ở đỉnh màn hình
                if (td.y > height + 40) {
                    tricklingDrops[idx] = createTricklingDrop(idx, false)
                }
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
            className="fixed inset-0 pointer-events-none z-[1] w-full h-full opacity-80"
        />
    )
}