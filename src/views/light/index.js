import './index.scss'
import * as THREE from 'three'
import { useCallback, useEffect,useRef} from 'react'
import { LightShadow } from 'three'
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

    // 初始化
    const init = useCallback(()=>{
        // 渲染视图长宽
        Render.setSize(Body.current.offsetWidth, Body.current.offsetHeight)
        // 相机长宽比
        Camera.aspect=Body.current.offsetWidth/Body.current.offsetHeight
        // 相机角度
        Camera.fov = 45
        // 相机近端面
        Camera.near = 1
        // 相机远端面
        Camera.far = 1000
        // 相机位置
        Camera.position.set(0,10,20)
        // 相机注视点
        Camera.lookAt(0,0,0)
        // 任何参数发生改变都要被调用
        Camera.updateProjectionMatrix()
        // 设置场景背景为白色
        // Render.setClearColor(0xffffff)
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
        // const dirLight = new THREE.DirectionalLight('#ffffff',0.5)
        // // 从右上角斜的方向照下来
        // dirLight.position.set(100,100,100)

        // 点光源 8是说灯光照到距离8
        const point = new THREE.PointLight('#ffffff',2,8)
        point.position.set(0,5,0)

        // 环境光 是四面八方 所以不需要设置位置
        const ambLight = new THREE.AmbientLight('#ffffff',0.3)

        Scene.add(point, ambLight)
        Lights.push(point, ambLight)
    },[])

    // 新建一个立方体
    const createRect = useCallback(()=>{
        // 一个立方体
        const rect = new THREE.BoxBufferGeometry(2,2,2)
        const meshBasicMaterial = new THREE.MeshBasicMaterial({color:'red'})
        const mesh = new THREE.Mesh(rect, meshBasicMaterial)
        mesh.position.set(0,0,0)
        // 将模型添加到场景,静态的
        Scene.add(mesh)
        // 方便取到把每一帧安排动画
        Meshs.push(mesh)
    },[])

    
    // 创建线条
    const createLine = useCallback(()=>{
        // 创建基础线条材质vertexColors是每个顶点指定一种颜色
        const lineMater = new THREE.LineBasicMaterial({vertexColors: true})
        // 创建几何体
        const geometry = new THREE.BufferGeometry()
        // 新建一个数组当(x,y,z)三元组
        const positions=[]
        // 新建一个数组当color三元组随机生成
        const colors =[]
        // 定义正方体半径
        const r=2
        for (let i=0;i<5000;i++){
            // 在canvas里中心点在左上角，x轴向右，y轴向下
            // 在threejs里因为立方体的中心点实际上在立方块中心，所以这里是-1~1范围内
            const x = Math.random()*r - r/2
            const y = Math.random()*r - r/2
            const z = Math.random()*r - r/2
            positions.push(x,y,z)
            colors.push( ( x / r ) + 0.5 );
			colors.push( ( y / r ) + 0.5 );
			colors.push( ( z / r ) + 0.5 );
        }
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
        // 第一个对象为网格格点对象
        const mesh = new THREE.Line(geometry,lineMater)
        mesh.position.set(4,0,0)
        Scene.add(mesh)
        Meshs.push(mesh)
    },[])

    // 创建lambert材质立方体
    const createLambert =useCallback(()=>{
        const lambert = new THREE.MeshLambertMaterial({color:'red'})
        const rect = new THREE.BoxBufferGeometry(2,2,2)
        const mesh = new THREE.Mesh(rect, lambert)
        mesh.position.set(-4,0,0)
        Scene.add(mesh)
        Meshs.push(mesh)
    },[])

    // 创建phong材质立方体 网格材质 具有镜面高光
    const createPhong =useCallback(()=>{
        const phong = new THREE.MeshPhongMaterial({color:'red'})
        const rect = new THREE.BoxBufferGeometry(2,2,2)
        const mesh = new THREE.Mesh(rect, phong)
        mesh.position.set(-8,0,0)
        Scene.add(mesh)
        Meshs.push(mesh)
    },[])

    useEffect(()=>{
        stats.setMode(0); // 0: fps, 1: ms
        // 将性能监控屏区显示在左上角
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.bottom = '0px';
        stats.domElement.style.zIndex = 100;
        Body.current.append(stats.domElement);
        // 把渲染器加到Body的DOM节点里
        Body.current.append(Render.domElement)
        init()
        createLight()
        createRect()
        createLine()
        createLambert()
        createPhong()
        renderScene()
        console.log(1)
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
        <div className="page" ref={Body}>

        </div>
    )
}

export default Page