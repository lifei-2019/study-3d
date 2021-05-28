import './index.scss'
import * as THREE from 'three'
import { useCallback, useEffect,useRef,useState} from 'react'
import Stats from '../../utils/stats'
import{ FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import{ GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const Page =() =>{
    const [loaded, setLoaded] = useState(0)
    const Body = useRef()
    // 如果这样写的话每次都会实例化一次场景，所以要用Ref，这样只会在初始时实例化一次
    // const Scene = new THREE.Scene()
    const Scene = useRef(new THREE.Scene()).current //场景
    const Camera = useRef(new THREE.PerspectiveCamera()).current //透视相机
    const Render = useRef(new THREE.WebGL1Renderer({ antialias: true})).current  // 渲染器
    const Floor = useRef() //地板
    const Meshs = useRef([]).current
    const Lights = useRef([]).current
    const id = useRef(null)
    // 加入性能监控
    let stats = new Stats();
    const IsDown = useRef(false)
    // 相机距离
    const PI = useRef(20)
    const R = useRef(90) //角度
    const clock = useRef(new THREE.Clock())
    const mixer = useRef()

    const loaderFbx = useCallback(()=>{
        const manager = new THREE.LoadingManager()
        // 此处可以配合antd实现加载过程
        manager.onLoad =() =>{}
        manager.onStart = (_, loaded, total) => setLoaded(loaded/total)
        manager.onProgress = (_, loaded, total) => setLoaded(loaded/total)
        const loader = new FBXLoader()
        loader.setPath('/static/obj/')
        loader.load('gtx2.fbx',(obj)=>{
            console.log(obj)
            obj.position.set(0,0,0)
            // 模型太大缩放,此处还需要修改相机距离PI为100把相机距离调远一些
            obj.scale.set(0.1,0.1,0.1)
            mixer.current = new THREE.AnimationMixer(obj)
            const animated = mixer.current.clipAction(obj.animations[0])
            animated.setLoop(true)
            animated.play()
            Scene.add(obj)
        })
    })

    const loaderGltf = useCallback(()=>{
        const manager = new THREE.LoadingManager()
        // 此处可以配合antd实现加载过程
        manager.onLoad =() =>{}
        manager.onStart = (_, loaded, total) => setLoaded(loaded/total)
        manager.onProgress = (_, loaded, total) => setLoaded(loaded/total)
        const loader = new GLTFLoader()
        loader.setPath('/static/obj/')
        loader.load('i10.gltf',(obj)=>{
            console.log(obj)
            // obj.position.set(0,0,0)
            // // 模型太大缩放
            // obj.scale.set(0.1,0.1,0.1)
            mixer.current = new THREE.AnimationMixer(obj.scene)
            const animated = mixer.current.clipAction(obj.animations[0])
            animated.setLoop(true)
            animated.play()
            Scene.add(obj.scene)
        })
    })

    // 初始化
    const init = useCallback(()=>{
        // 渲染视图长宽
        Render.setSize(Body.current.offsetWidth, Body.current.offsetHeight)
        // 开启地板阴影 会消耗一定的性能
        Render.shadowMap.enabled=true
        // 分辨和屏幕一致
        Render.setPixelRatio(window.devicePixelRatio)
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
        // Meshs.forEach(item=>{
        //     item.rotation.x += 0.5/180*Math.PI
        //     item.rotation.y += 0.5/180*Math.PI
        // })
        const time = clock.current.getDelta()
        if(mixer.current) mixer.current.update(time)
        id.current=window.requestAnimationFrame(()=>renderScene())

    },[Render])

    // 新建灯光
    const createLight = useCallback(()=>{
        // // 太阳光
        const dirLight = new THREE.DirectionalLight('#ffffff',1.2)
        // 光照从哪里照过来
        dirLight.position.set(0,200,0)
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

    // 创建lambert材质立方体
    const createLambert =useCallback(()=>{
        const lambert = new THREE.MeshLambertMaterial({color:'red'})
        const rect = new THREE.BoxBufferGeometry(2,2,2)
        const mesh = new THREE.Mesh(rect, lambert)
        mesh.position.set(-4,0,0)
        // 下面两行设置阴影
        mesh.castShadow = true
        mesh.receiveShadow = true
        Scene.add(mesh)
        Meshs.push(mesh)
    },[])

    // 创建phong材质立方体 网格材质 具有镜面高光
    const createPhong =useCallback(()=>{
        const phong = new THREE.MeshPhongMaterial({color:'red'})
        const rect = new THREE.BoxBufferGeometry(2,2,2)
        const mesh = new THREE.Mesh(rect, phong)
        mesh.position.set(-8,0,0)
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
        let y = Camera.position.y + event.movementY * 0.1
        const z = PI.current*Math.sin(R.current/180*Math.PI)
        if(y<3) y=3
        Camera.position.set(x,y,z)
        Camera.lookAt(0,0,0)
    },[])

    const wheel = useCallback((event)=>{
        if(event.deltaY>0) PI.current += 1
        else PI.current -= 1
        
        const x = PI.current*Math.cos(R.current/180*Math.PI)
        const y = Camera.position.y+event.movementY*0.1
        const z = PI.current*Math.sin(R.current/180*Math.PI)

        Camera.position.set(x,y,z)
        Camera.lookAt(0,0,0)
    },[])

    //创建地板给阴影投射
    const createFloor = useCallback(()=>{
        const lambert = new THREE.MeshLambertMaterial({color:'#ffffff',side:THREE.DoubleSide})
        const plane = new THREE.PlaneGeometry(60,60)
        // plane顶点组合，lambert材质
        const mesh = new THREE.Mesh(plane, lambert)
        mesh.receiveShadow = true
        mesh.position.set(0, 0, 0)
        mesh.rotation.x = -90/180 *Math.PI
        Scene.add(mesh)
        Floor.current = mesh
    })

    const setView = ()=>{
        Render.setSize(document.clientWidth,document.clientHeight)
        Camera.aspect = Body.current.offsetWidth / Body.current.offsetHeight
        Camera.updateProjectionMatrix()
    }

    useEffect(()=>{
        // 把渲染器加到Body的DOM节点里
        Body.current.append(Render.domElement)
        init()
        createLight()
        loaderGltf()
        createFloor()
        renderScene()
        // 监听浏览器缩放事件
        document.addEventListener('resize',setView)
        // 销毁钩子
        return ()=>{
            document.removeEventListener('resize',setView)
            cancelAnimationFrame(id.current)
            // 物体把自己从场景中删除
            Meshs.forEach(item=>{
                Scene.remove(item)
                item.geometry.dispose()
                item.material.dispose()
            })
            // 移除地板
            Floor.current && Scene.remove(Floor.current)
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
        <div className="page" ref={Body} onMouseDown={down} onMouseUp={up} onMouseMove={move} onWheel={wheel}>

        </div>
    )
}

export default Page