function myObject(){
    let s,camera,renderer,loader,cubeTexture,mapTexture
    let mixer
    let clock = new THREE.Clock
    let obGroup,obGeo,obScene,obMtr
    let crystalMesh
    let composer,renderPass,vignetteEffect,glitchEffect,copyPass,halfToneEffect,RGBShift,filmEffect,bloomPass

    let gui = new dat.GUI();
    let add2Gui = (name,obj,min,max) =>{
        let folder = gui.addFolder(name)
        for(let keys in obj){
            if(gui) folder.add(obj,keys,min,max)
        }
        // if(update) update.set(...Object.values(obj))
    }

    s = new THREE.Scene()
    // let bgc = new THREE.Color(0xffffff)
    let bgc = new THREE.Color(0x5B5AEC)
    s.background = bgc
    s.fog = new THREE.Fog(bgc,0.1,300)
    clock = new THREE.Clock()

    camera = new THREE.PerspectiveCamera(15,window.innerWidth / window.innerHeight,0.1,1000)

    // s.add(camera)

    var light = new THREE.DirectionalLight( 0xfff000, 1, 100 );
    // light.castShadow = false
    s.add( light );

    let div = document.getElementById('threeScene')
    document.body.appendChild(div)

    renderer = new THREE.WebGLRenderer()
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(div.offsetWidth,div.offsetHeight)
    // renderer.setClearColor(new THREE.Color(0x5B5AEC))
    // renderer.shadowMap.enabled = true;
    // renderer.autoClear = false;
    div.appendChild( renderer.domElement )

    let camPos = {
        cameraX:100,
        cameraY:11,
        cameraZ:15
    }
    let lightPos = {
        lightX:3,
        lightY:10,
        lightZ:10
    }
    let camTarget = {
        x:-65,
        y:-36,
        z:500
    }

    let fogVisibility = {
        value:1000
    }

    // let effectControl = {
    //     'halfTone': 5,
    //     'RGBShift':0.01
    // }

    // add2Gui('camera',camPos,-300,300)
    add2Gui('light',lightPos,-100,100)
    add2Gui('lookAt',camTarget,-500,500)
    // add2Gui('fog',fogVisibility,0.1,1000)
    // add2Gui('effectControl',effectControl,0,10)




    cubeTexture = new THREE.CubeTextureLoader()
        .setPath('images/')
        .load([
        'right.jpg','left.jpg',
        'top.jpg','bottom.jpg',
        'front.jpg','back.jpg'
    ])

    mapTexture = new THREE.TextureLoader()
        .load(
            'images/flower.jpg',
            function(texture){
                obMtr.map.wrapS = THREE.RepeatWrapping
                obMtr.map.wrapT = THREE.RepeatWrapping
            }
        )//


    obGroup = new THREE.Object3D()
    s.add(obGroup)

    obMtr = new THREE.MeshPhongMaterial({
        envMap:cubeTexture,
        // morphTargets:true
        flatShading: true,
    })

    function moreCrystal(count,mesh){
        const distance = 4
        const rotationCoef = 0.05
        mesh.castShadow = true
        mesh.receiveShadow = true
        for(let i=0;i<count;i++){
            for(let v=0;v<count;v++){
                let cpCrystal = mesh.clone()
                let cpObMtr = obMtr.clone()
                let scaleY = [Math.pow(count/2,2)-Math.abs(count/2-i)*Math.abs(count/2-v)]/count + 0.1
                let rotation = (x)=>{return Math.random()*x}

                cpCrystal.weightValue = [Math.pow(count/2,2)-Math.abs(count/2-i)*Math.abs(count/2-v)]/count/10
                cpCrystal.scale.set(1,1,1)
                cpCrystal.material = cpObMtr
                cpCrystal.material.reflectivity = Math.random()*0.3

                cpCrystal.material.color = new THREE.Color(v*i*0xfffeee)
                cpCrystal.material.emissive = new THREE.Color(v*i*0xffffff)
                if(v*i/count/10 > 1){
                    cpCrystal.material.emissiveIntensity = 0.8
                }else{
                    cpCrystal.material.emissiveIntensity = v*i/count/10
                }

                cpCrystal.scale.y += scaleY * 0.2
                cpCrystal.position.x = i*distance
                cpCrystal.position.z = v*distance
                cpCrystal.position.y = rotation(10)
                cpCrystal.position.x += Math.random()*5
                cpCrystal.position.z += Math.random()*5
                obGroup.add(cpCrystal)
            }
        }

        for(let i=0;i<obGroup.children.length;i++){
            ranMap.push(Math.floor(Math.random()*10)+0.1)
        }
    }

    let crystalLoader = new THREE.GLTFLoader()
        .load(
            'js/crystal.glb',
            function (gltf) {
                crystalMesh = gltf.scene.children[0]
                moreCrystal(50,crystalMesh)

            }
        )

    let control = new THREE.OrbitControls(camera,renderer.domElement)
    let ranMap = []

// +++ EFFECT +++

    composer = new THREE.EffectComposer( renderer );
    composer.addPass( new THREE.RenderPass(s, camera ) );

    bloomPass = new THREE.BloomPass()
    // composer.addPass(bloomPass)

    glitchEffect = new THREE.GlitchPass()
    composer.addPass(glitchEffect)

    filmEffect = new THREE.FilmPass(0.5,0.015,56,false)
    composer.addPass(filmEffect)


    halfToneEffect = new THREE.ShaderPass( THREE.DotScreenShader );
    halfToneEffect.uniforms[ 'scale' ].value = 5;
    composer.addPass( halfToneEffect );


    RGBeffect = new THREE.ShaderPass( THREE.RGBShiftShader );
    RGBeffect.uniforms[ 'amount' ].value = 0.01;
    RGBeffect.renderToScreen = true;
    composer.addPass( RGBeffect );
    composer.passes[1].enabled = false
    composer.passes[3].enabled = false
    // console.log(composer);


// +++ EFFECT +++

    function openClitch(){
        composer.passes[1].enabled = true
        if(Math.random()>0.5) {composer.passes[3].enabled = !composer.passes[3].enabled}
        s.fog.far = Math.floor(Math.random()*1000-500)+Math.random()*5
        light.position.set(ranABS(300),ranABS(300),ranABS(300))
        s.fog.color = s.background = light.color = new THREE.Color(Math.random()*0xffffff)
        setTimeout(()=>{
            if(Math.random()>0.7) composer.passes[1].enabled = false
            composer.passes[3].enabled = false
        },1000)
    }

    setInterval(openClitch,10000)

    let nowTime = 0
    let clitchToggleTime
    camera.lookAt(...Object.values(camTarget))
    camera.position.set(...Object.values(camPos))
    function animate(time) {

        requestAnimationFrame(animate)
        // obGroup.rotation.y += 1/1000/2
        // if(mixer) mixer.update(clock.getDelta())
        let delta = clock.getDelta()
        nowTime++


        // camera.position.set(...Object.values(camPos))
        light.position.set(...Object.values(lightPos))
        camera.lookAt(...Object.values(camTarget))
        // s.fog.far = fogVisibility['value']
        // halfToneEffect.uniforms[ 'scale' ].value = effectControl['halfTone']
        // RGBeffect.uniforms[ 'amount' ].value = effectControl['RGBShift']
        RGBeffect.uniforms[ 'amount' ].value = Math.sin(time/5000)*0.005

        obGroup.children.forEach((obj,i)=>{
            obj.rotation.y = Math.sin(time/15000*obj.weightValue)*obj.weightValue*ranMap[i]
            obj.position.y = Math.sin(time/5000*obj.weightValue)*ranMap[i]
        })

        composer.render(delta)
        // renderer.render(s,camera)

    }

    animate()


    window.onresize =()=>{
        setTimeout(()=>{
            renderer.setSize(div.offsetWidth,div.offsetHeight)
            composer.setSize(div.offsetWidth,div.offsetHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

        },300)
    }


}

// +++ tool +++

let ranABS = (x) =>{
    if(Math.random()>0.5){
        return Math.random()*x
    }else{
        return Math.random()*x*-1
    }
}