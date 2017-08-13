## 如何使用shear.js插件？

首先引入shear.js这个库；

`<script src="shear.js"></script>`

接下来，加载相应使用`shear.js` 编写的插件；

*后面将 使用`shear.js`编写的插件 写成 shear插件；*

比如，下面使用 swiper修正的shear插件（在example里有案例）；

```html      
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>swiper-shear test</title>
    <link rel="stylesheet" href="swiper.min.css">
    <script src="shear.js"></script>
    <script src="swiper.shear.js"></script>
</head>

<body>
    <swiper id="a" sv-ele style="width:320px;height:240px;" autoplay="1000">
        <div class="swiper-slide" style="background-color:#0a0;">slider1</div>
        <div class="swiper-slide" style="background-color:#0ff;">slider2</div>
        <div class="swiper-slide" style="background-color:#f0f;">slider3</div>
    </swiper>
</body>

</html>
````

如果想要获取实例化的对象，可以直接获取定义的属性；

```javascript
var mySwiper = $('#a').swiper;
```


在案例中使用swiper没有再写一次js初始化操作，这是 web components 的一个优势；

下面是以往我们使用swiper的操作：

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>normal test</title>
    <link rel="stylesheet" href="swiper.min.css">
    <script src="jquery-2.1.3.js"></script>
    <script src="swiper.jquery.js"></script>
</head>

<body>
    <div class="swiper-container" style="width:320px;height:240px;">
        <div class="swiper-wrapper">
            <div class="swiper-slide" style="background-color:#0a0;">slider1</div>
            <div class="swiper-slide" style="background-color:#0ff;">slider2</div>
            <div class="swiper-slide" style="background-color:#f0f;">slider3</div>
        </div>
    </div>
    <script>
        var mySwiper = new Swiper('.swiper-container', {
            autoplay: 2000, //可选选项，自动滑动
        })
    </script>
</body>

</html>
```

对比可以看出，shear的版本的结构更加清晰，而且更方便使用；

因为 web components 的概念是，让你使用插件更像是在使用原生的html对象。

## shear.js 是什么？

`shear.js` 包含了一套 jQuery API 的实现逻辑，基于 [smartyJQ](https://github.com/kirakiray/smartJQ) 的 `smartjq-recommend` 版本开发，相当于你不用加载`jQuery`，就能使用几乎全功能的 jQuery（除了 `Deferred API` 和 `Ajax API` 相应的请使用 `Promise` 和 `Fetch API` 代替，在不能使用的浏览器上使用Profill）；

## 如何编写shear.js插件？

首先，你得会开发普通的jQuery插件；