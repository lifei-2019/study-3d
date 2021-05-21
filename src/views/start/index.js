import './index.scss'
import * as THREE from 'three'
import { useCallback, useEffect,useRef} from 'react'

const Page =() =>{
    const Body = useRef()
    // 如果这样写的话每次都会实例化一次场景，所以要用Ref，这样只会在初始时实例化一次
    // const Scene = new THREE.Scene()
    const Scene = useRef(new THREE.Scene()).current //场景
    const Camera = useRef(new THREE.PerspectiveCamera()).current //透视相机
    const Render = useRef(new THREE.WebGL1Renderer({ antialias: true})).current  // 渲染器
    const Meshs = useRef([]).current

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
        console.log(1)
    },[Render, Body])

    // 新建一个立方体
    const createRect = useCallback(()=>{
        // 一个立方体
        const rect = new THREE.BoxBufferGeometry(2,2,2)
        const meshBasicMaterial = new THREE.MeshBasicMaterial({color:'red'})
        const mesh = new THREE.Mesh(rect, meshBasicMaterial)
        mesh.position.set(0,0,0)
        Scene.add(mesh)
        Meshs.push(mesh)
    },[])

    // 每一帧渲染画面的方法
    const renderScene = useCallback(()=>{
        Render.render(Scene, Camera)
        Meshs.forEach(item=>{
            // item.rotation.x += 0.5/180*Math.PI
            item.rotation.y += 0.5/180*Math.PI
        })
        window.requestAnimationFrame(()=>renderScene())
    },[Render])

    // 
    useEffect(()=>{
        console.log(1)
        // 把渲染器加到Body的DOM节点里
        Body.current.append(Render.domElement)
        init()
        createRect()
        renderScene()
    },[])

    return(
        <div className="page" ref={Body}>

        </div>
    )
}

export default Page