import './index.scss'
import * as THREE from 'three'
import { useCallback, useEffect,useRef} from 'react'
import Stats from '../../utils/stats'
const Page =() =>{
    const Body = useRef()
    // 如果这样写的话每次都会实例化一次场景，所以要用Ref，这样只会在初始时实例化一次
    // const Scene = new THREE.Scene()
    const Scene = useRef(new THREE.Scene()).current //场景
    const Camera = useRef(new THREE.PerspectiveCamera()).current //透视相机
    const Render = useRef(new THREE.WebGL1Renderer({ antialias: true})).current  // 渲染器
    const Meshs = useRef([]).current
    const Lights = useRef([]).current
    const id = useRef(null)
    // 加入性能监控
    let stats = new Stats();
    const IsDown = useRef(false)
    const PI = useRef(30)
    const R = useRef(90) //角度

    // 初始化
    const init = useCallback(()=>{
        // 渲染视图长宽
        Render.setSize(Body.current.offsetWidth, Body.current.offsetHeight)
        // 开启地板阴影 会消耗一定的性能
        Render.shadowMap.enabled=true
        // 相机长宽比
        Camera.aspect=Body.current.offsetWidth/Body.current.offsetHeight
        // 相机角度
        Camera.fov = 45
        // 相机近端面
        Camera.near = 1
        // 相机远端面
        Camera.far = 1000
        // 相机位置
        Camera.position.set(0,3,PI.current)
        // 相机注视点
        Camera.lookAt(0,0,0)
        // 任何参数发生改变都要被调用
        Camera.updateProjectionMatrix()
        // 设置场景背景为白色
        // Render.setClearColor(0xffffff)
        stats.setMode(0); // 0: fps, 1: ms
        // 将性能监控屏区显示在左上角
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.bottom = '0px';
        stats.domElement.style.zIndex = 100;
        Body.current.append(stats.domElement);
    },[Render, Body])

    // 渲染画面
    const renderScene = useCallback(()=>{
        // 每次渲染时更新stats
        stats.update();
        Render.render(Scene, Camera)
        Meshs.forEach(item=>{
            item.rotation.x += 0.5/180*Math.PI
            item.rotation.y += 0.5/180*Math.PI
        })
        id.current=window.requestAnimationFrame(()=>renderScene())
    },[Render])

    // 新建灯光
    const createLight = useCallback(()=>{
        // // 太阳光
        const dirLight = new THREE.DirectionalLight('#ffffff',1.2)
        // 光照从哪里照过来
        dirLight.position.set(0,0,3000)
        // 配置灯光阴影
        dirLight.castShadow = true
        // 修改光的范围
        dirLight.shadow.camera.top = -10
        dirLight.shadow.camera.bottom = 10
        dirLight.shadow.camera.right = -10
        dirLight.shadow.camera.left = 10
        dirLight.shadow.mapSize.width = 2000
        dirLight.shadow.mapSize.height = 2000


        // 点光源 8是说灯光照到距离8
        // const point = new THREE.PointLight('#ffffff',2,8)
        // point.position.set(0,5,0)

        // 环境光 是四面八方 所以不需要设置位置
        const ambLight = new THREE.AmbientLight('#ffffff',0.6)

        Scene.add(dirLight, ambLight)
        Lights.push(dirLight, ambLight)
    },[])
    
    // 创建线条
    const createLine = useCallback((x,y,z,color,num)=>{
        // 创建基础线条材质vertexColors是每个顶点指定一种颜色
        const lineMater = new THREE.LineBasicMaterial({color})
        // 创建几何体
        const geometry = new THREE.BufferGeometry()
        // 新建一个数组当(x,y,z)三元组
        const positions=[]
        // 定义正方体半径
        const r=Math.random() * 5
        for (let i=0;i<num;i++){
            // 在canvas里中心点在左上角，x轴向右，y轴向下
            // 在threejs里因为立方体的中心点实际上在立方块中心，所以这里是-1~1范围内
            const x = Math.random()*r - r/2
            const y = Math.random()*r - r/2
            const z = Math.random()*r - r/2
            positions.push(x,y,z)
        }
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
		// geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
        // 第一个对象为网格格点对象
        const mesh = new THREE.Line(geometry,lineMater)
        mesh.castShadow = true
        mesh.position.set(x,y,z)
        Scene.add(mesh)
        Meshs.push(mesh)
    },[])

    // 创建lambert材质立方体
    const createLambert =useCallback((x,y,z,color)=>{
        const r=Math.random() * 5
        const lambert = new THREE.MeshLambertMaterial({color})
        const rect = new THREE.BoxBufferGeometry(r,r,r)
        const mesh = new THREE.Mesh(rect, lambert)
        mesh.position.set(x,y,z)
        // 下面两行设置阴影
        mesh.castShadow = true
        mesh.receiveShadow = true
        Scene.add(mesh)
        Meshs.push(mesh)
    },[])

    // 创建phong材质立方体 网格材质 具有镜面高光
    const createPhong =useCallback((x,y,z,color)=>{
        const r=Math.random() * 5
        const phong = new THREE.MeshPhongMaterial({color})
        const rect = new THREE.BoxBufferGeometry(r,r,r)
        const mesh = new THREE.Mesh(rect, phong)
        mesh.position.set(x,y,z)
        mesh.castShadow = true
        mesh.receiveShadow = true
        Scene.add(mesh)
        Meshs.push(mesh)
    },[])

    // 加入属性IsDown对鼠标按下与否进行判断
    const down = useCallback(() => {IsDown.current = true;console.log('anxiaqule')},[])
    const up = useCallback(() => IsDown.current = false,[])
    const move = useCallback((event)=>{
        if(IsDown.current == false) return;
        // 查看有哪些event
        // console.log(event)
        R.current -= event.movementX*0.5
        const x = PI.current * Math.cos(R.current / 180 * Math.PI)
        const y = Camera.position.y + event.movementY * 0.1
        const z = PI.current*Math.sin(R.current/180*Math.PI)

        Camera.position.set(x,y,z)
        Camera.lookAt(0,0,0)
    },[])

    //鼠标滑轮 
    const wheel = useCallback((event)=>{
        if(event.deltaY>0) PI.current += 1
        else PI.current -= 1
        
        const x = PI.current*Math.cos(R.current/180*Math.PI)
        const y = Camera.position.y+event.movementY*0.1
        const z = PI.current*Math.sin(R.current/180*Math.PI)

        Camera.position.set(x,y,z)
        Camera.lookAt(0,0,0)
    },[])

    // 点击事件
    const click = useCallback(()=>{
        const arr = [createLine,createPhong,createLambert]
        const index = Math.floor(Math.random()*3)
        const x = 30-Math.random() * 60
        const y = 5-Math.random() * 10
        const z = 30-Math.random() * 60
        const color = new THREE.Color(Math.random(),Math.random(),Math.random())
        // 线性材质里的线条数
        // const num = index === 0 ? Math.ceil(Math.random()*10000):0
        // 用于动态生成不同材质不同大小的box
        // arr[index](x,y,z,color) 
        createStart(x,y,z,color)
    },[])

    // 创建星球的函数
    const createStart = useCallback((x,y,z,color)=>{
        const r = Math.random() * 2
        // 星球
        const geometry = new THREE.SphereBufferGeometry(r,64,64)
        const phong = new THREE.MeshPhongMaterial({color})
        const sphere = new THREE.Mesh(geometry, phong)
        sphere.position.set(x,y,z)
        // 星云
        const geometry2 = new THREE.RingGeometry(r+0.3, r+0.3+r*0.3, 64)
        // 材质属性THREE.DoubleSide让两面都显示
        const lambert = new THREE.MeshLambertMaterial({color:'#fff', side:THREE.DoubleSide})
        const ring = new THREE.Mesh(geometry2, lambert)
        ring.position.set(x,y,z)
        ring.rotation.x =  -90*180 /Math.PI
        const group = new THREE.Group()
        group.add(sphere,ring)
        Scene.add(group)
    },[])

    useEffect(()=>{
        
        // 把渲染器加到Body的DOM节点里
        Body.current.append(Render.domElement)
        init()
        createLight()
        renderScene()
        // 销毁钩子
        return ()=>{
            cancelAnimationFrame(id.current)
            // 物体把自己从场景中删除
            Meshs.forEach(item=>{
                Scene.remove(item)
                item.geometry.dispose()
                item.material.dispose()
            })
            // 移除光线
            Lights.forEach(item=>{
                Scene.remove(item)
            })
            // 移除渲染器
            Render.dispose()
            Scene.dispose()
        }
    },[])

    return(
        <div className="page" ref={Body} onMouseDown={down} onMouseUp={up} onMouseMove={move} onWheel={wheel} onClick={click}>

        </div>
    )
}

export default Page