## shearjs的原理和jQuery的不同

### 前言

`shear.js` 内部已经封装好了jQuery API，完全当成 jQuery 使用就行；

后续我们将 shear.js 封装的组件称为 `shear组件`，shear.js 定义的元素称为 `shear元素`；

### shearjs的原理

最主要的部分，shearjs是将html模板化，将定义好的 shear元素 填充为shear模板的内容；

```html
<style>
        t-tag {
            display: block;
        }
        
        t-tag .t-tag-inner {
            width: 200px;
            text-align: center;
            line-height: 50px;
            background-color: #eee;
        }
        
        t-tag [sv-content] {
            color: red;
        }
    </style>
<script>
    shear.register({
        // 注册一个 t-tag shear元素
        template: `
            <div sv-register="t-tag">
                <div class="t-tag-inner">
                    I am t-tag
                    <div sv-content></div>
                </div>
            </div>
        `
    });
</script>
<body>
    <t-tag sv-ele id="tar">ye ye content</t-tag>
</body>
```

![](../img/04_shearbase.png)

shearjs 本质上是参考 web components 而设计的框架，但弥补了 web components 不足（例如元素间的依赖问题和兼容问题），并添加了好用的语法糖（糅合 jQuery API 和 MVVM 的部分好用的特性），并且兼容 web components ；

下面就来一个 web components 和 shearjs 结合的案例；

`test_components.html`

```html
<style>
    t-tag {
        display: block;
    }
    
    t-tag .t-tag-inner {
        width: 200px;
        text-align: center;
        line-height: 40px;
        background-color: #eee;
    }
    
    t-tag [sv-content] {
        color: red;
    }
</style>


<div sv-register="t-tag">
    <div class="t-tag-inner" style="color:red;">
        {{m}}
        <div sv-content style="color:green;"></div>
        <div sv-tar="tips" style="color:blue;">I am tips</div>
    </div>
</div>

<script>
    shear.register({
        template: document.currentScript.ownerDocument.querySelector('[sv-register="t-tag"]').outerHTML,
        render: function($ele) {
            $ele.css("color", "red");
        },
        data: {
            m: "I am message"
        }
    });
</script>
```

`main.html`

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>web components 和 shearjs 结合测试</title>
    <script src="shear.js"></script>
    <!-- 引用 test_components -->
    <link rel="import" href="test_components.html">
</head>

<body>
    <t-tag sv-ele> test components </t-tag>
</body>

</html>
```

预览效果

![main.html](../img/04_webcomponents_shear.png)

### 关于 shear元素 依赖处理

当 shear元素依赖另一个shear元素时，框架会自动识别依赖的元素，待依赖的元素注册完成后才会开始渲染当前的shear元素；

```html
<style>
    t-tag1,
    t-tag2 {
        display: block;
    }
</style>

<div sv-register="t-tag1" style="display:none;">
    <div sv-content></div>
    <t-tag2 sv-ele data-ha="ha_in">
        t-ta2 test content
    </t-tag2>
</div>

<div sv-register="t-tag2" style="display:none;">
    <div sv-content></div>
</div>

<t-tag1 sv-ele data-ha="ha1">
    this is t-tag1
</t-tag1>

<t-tag2 sv-ele data-ha="ha2">
    <div style="color:blue;">this is t-tag2</div>
</t-tag2>

</body>
<script>
    shear.register({
        name: "t-tag1",
        render: function(tar) {
            tar.css('color', "red");

            console.log('t-tag1 ok' + tar.data('ha'));
        }
    });

    setTimeout(function() {
        shear.register({
            name: "t-tag2",
            render: function(tar) {
                tar.css('color', "green");

                console.log('t-tag2 ok ' + tar.data('ha'));
            }
        });
    }, 1000);
</script>
```

如上案例，`t-tag1` 内需要 `t-tag2`（可以说成`t-tag1`依赖`t-tag2`），所以当`t-tag2`注册完成后，会先开始渲染 `t-tag1` **内**依赖的 `t-tag2` 元素，继而触发 `t-tag1` 的渲染，最后到外面的 `t-tag2`的渲染；

![rely_example](../img/04_rely_example.png)

所以切记，不能依赖里出现死循环（比如 a 依赖 b ， b 依赖 c ， c 又依赖 a 等类似的情况），否则相关的 `shear元素`将会一直处于等待的状态；