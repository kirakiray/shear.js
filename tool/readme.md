# shear_builder

shear_builder是辅助生成 `shear组件` 的插件，不需要依赖node，浏览器就可以打包；

## 如何使用？

首先，把 `shear_builder.js` 紧跟 `shear.js` 后面引入，在你展示用的html上，把组件功能实现；

然后：

* 跟组件有关的js `<script>` 加上这个 `shear-build-script` 属性，值是组件名；
* 跟组件有关的样式 `<link>` 或 `<style>` 加上这个 ` shear-build-style` 属性，值是组件名；
* 执行一次 `shearBuilder.refresh()` 初始化组件记录状态，记得这个方法不要放到带有 `shear-build-script` 的script 里；
* 运行 `shearBuilder.build('xxxx')` 方法，xxxx 就是你要封装的组件名，就会自动生成js并下载到电脑；