# shear.js

## shear.js 是什么？

shear.js 是一套 使用 jQuery API 的库来编写 web组件 的库（不是基于jQuery，而是使用类似的库开发的）;

`shear.js` 包含了一套完整的 jQuery API 的实现逻辑，基于 [smartyJQ](https://github.com/kirakiray/smartJQ) 的 `smartjq-recommend` 版本开发，相当于你不用加载`jQuery`，就能使用几乎全功能的 jQuery（除了 `Deferred API` 和 `Ajax API` 相应的请使用 `Promise` 和 `Fetch API` 代替，在不能使用的浏览器上使用Profill）；

## 什么是web组件？

先说一下我们怎样使用html作开发的；

假如想要给我们的html里加入一个选项框，我们会这么做；

```html
<select>
    <option value="1">one</option>
    <option value="2">two</option>
    <option value="3">three</option>
</select>
```

上面的html结构，就是一个很普通的选项框，包含3个选项 one、two和three，而且它们提交的真实值分别是 1、2和3；

但你知不知道，这个简单的选项框里，浏览器其实帮你封装了一整套的逻辑，才能使得你用起来这么方便；

现在来拆分一下，浏览器到底帮你少干了什么活；

* 实现了选项框的UI；
* 点击选项框后，弹出选项菜单的逻辑；
* 点击菜单后，切换值的；
* 动态改变value;

如果你能看懂上面的拆分，就会明白，这是一个用js封装选项框插件的基本逻辑；

那回到正题，什么是web组件？

web组件就是 *让你只使用html就能构建插件*，用起来更方便的插件；

这么说你可能还不懂，那我们举个常用的例子；

比如常用的 图片画廊 插件（就是那种可以左右滑动图片的插件，门户网站首页基本定会有的东西），用个有名的画廊插件做案例，[swiper](http://www.swiper.com.cn)；

我们是如何使用swiper这个插件的？

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>normal swiper test</title>
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

讲解一下使用官方 `swiper` 的最基础步骤；

* 引入依赖文件（`jQuery`、`swiper.jquery.js` 和 `swiper.min.css`）;
* 创建 swiper-container 父容器;
* 创建滑动容器 swiper-wrapper;
* 设置内部主体元素；
* 写一段js初始化;

如果我们要改变当前swiper的一些状态，必须暴露 js 中的实例化对象，通过修改指定属性或方法来修正；

如果我们利用 `shear.js` 改造一下swiper插件，让它变成 web组件 ，那么使用起来会是怎样的？

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

解析一下使用步骤：

* 引入依赖文件（`shear.js`、`swiper.shear.js` 和 `swiper.min.css`）;
* 创建父容器 `swiper`;
* 设置内部主体元素;

三个步骤就能使用了；

如果想要操作实例化的对象，可以直接获取定义的属性；

```javascript
var mySwiper = $('#a').swiper;
```

对比原来的 swiper 插件，web组件化后使用起来多了以下优势；

* 不需要定义特定的html结构；（相对使用者而言，特定的html结构是无用的，没有任何意义，只会影响理解和使用）;
* 不需要js初始化元素；（少了初始化步骤更方便使用）;

看完你会发现，web组件化 之后，我们使用 swiper 更像是在使用 **选项框** 一样，没有多余的操作，数据结构清晰，一眼明了；

为什么要这么做？降低那么一点使用成本有意义吗？

初期不考虑好使用成本，后期随着项目需求增加和团队扩张，带来的会需要更多的维护成本和学习成本，开发难度会有倍数级的增长；

## 如何使用 `shear.js插件`？

首先引入shear.js这个库；

```html
<script src="shear.js"></script>
````

接下来，加载相应使用`shear.js` 编写的组件；

**后面将 使用 `shear.js` 编写的插件 写成 shear插件**

详见 `example` 目录有讲解案例;

## 如何编写shear.js插件？

首先，你必须会使用jQuery；

如果你成功的开发过jQuery插件，那你也能开发shear插件；

先讲解一下怎样注册 `shear元素`；

```html
<div sv-register="t-tag">
    <div>
        I am t-tag
    <div>
</div>
<script>
    shear.register({
        name:"t-tag"
    });
</script>
```

使用 `shear.register` 方法注册，以上案例注册一个名为 `t-tag` 的 `shear元素`；

注册的方法是，通过页面的 模板元素 中添加 `sv-register`属性，并指定 shear元素 的名称，再使用 `shear-register` 指定 `name` 为当要注册的 shear元素的名称；

使用时只需用注册好的shear元素为tag，并设置 `sv-ele` 属性即可；

```html
<t-tag sv-ele></t-tag>
```

当然也能通过 `template` 属性直接注册 `shear元素`；

```html
<script>
    shear.register({
        template:`
            <div sv-register="t-tag">
                <div>
                    I am t-tag
                <div>
            </div>
        `
    });
</script>
```

上面案例和上上案例实现的效果是一模一样的；


接下进入开发教程；

Next => [shear模板](02_模板.md)