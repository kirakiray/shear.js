!(function() {
    // base
    // shear组件 放置对象
    var shearData = {};
    $('head').append('<style>[sv-register]{display:none;}</style>');

    // function 
    // 获取一个shearData对象
    var getShearData = function(keyname) {
        // 获取目标对象
        return shearData[keyname] || (shearData[keyname] = {
            script: [],
            css: []
        });
    };

    // init
    var main = {
        // 保留主要记录对象
        shearData: shearData,
        // 初始化的方法
        refresh: function() {
            // 获取各种 shear组件 注册数据
            $('[shear-build-style]').each(function(i, e) {
                // 判断有没有录取过，有的话就不跑了
                if ($(e).data('shearBuild')) {
                    return;
                }

                // 获取对应 shear组件名
                var shearname = $(e).attr('shear-build-style');

                // 获取容器对象
                var obj = getShearData(shearname);

                if (!e.tagName) {
                    console.warn('no tagname', e);
                    return;
                }

                // 判断当前是 style 还是 link
                switch (e.tagName.toLowerCase()) {
                    case "style":
                        obj.css.push({
                            type: "style",
                            content: e.innerHTML
                        });
                        break;
                    case "link":
                        obj.css.push({
                            type: "link",
                            href: e.href
                        });
                        break;
                }

                // 确定录取了
                $(e).data('shearBuild', 1);
            });

            $('[shear-build-script]').each(function(i, e) {
                // 判断有没有录取过，有的话就不跑了
                if ($(e).data('shearBuild')) {
                    return;
                }

                // 获取对应 shear组件名
                var shearname = $(e).attr('shear-build-script');

                // 获取容器对象
                var obj = getShearData(shearname);

                if (!e.tagName) {
                    console.warn('no tagname', e);
                    return;
                }

                // 判断是外部资源还是内部资源
                if ($(e).attr('src')) {
                    obj.script.push({
                        src: e.src
                    });
                } else {
                    obj.script.push({
                        content: e.innerHTML
                    });
                }

                // 确定录取了
                $(e).data('shearBuild', 1);
            });
        },
        // 生成输出script文本
        output: function(options) {
            var defaults = {
                // 默认js，可选components
                type: "js",
                name: ""
            };
            if (!options) {
                return;
            } else if ($.type(options) === "string") {
                defaults.name = options;
            } else {
                $.extend(defaults, options);
            }

            // 获取目标数据
            var obj = shearData[defaults.name];

            switch (defaults.type) {
                case "js":
                    return new Promise(function(res, rej) {
                        // 文本记载
                        var scriptCode = "";

                        Promise.resolve()
                            .then(function() {
                                return new Promise(function(resolve) {
                                    var len = obj.script.length;
                                    // 添加脚本
                                    obj.script.forEach(function(e) {
                                        if (!e.src && e.content) {
                                            var content = getHookContent(defaults, e.content, { type: "js" });
                                            scriptCode += content + "\n";
                                            if (!--len) {
                                                resolve();
                                            }
                                        } else if (e.src) {
                                            fetch(e.src)
                                                .then(function(f) {
                                                    return f.text();
                                                })
                                                .then(function(content) {
                                                    content = getHookContent(defaults, content, { type: "js" });
                                                    scriptCode += content + "\n";
                                                    if (!--len) {
                                                        resolve();
                                                    }
                                                })
                                        }
                                    });
                                });
                            })
                            .then(function() {
                                return new Promise(function(resolve) {
                                    var len = obj.css.length;
                                    // 添加样式
                                    obj.css.forEach(function(e) {
                                        if (e.type === "style") {
                                            scriptCode += '$("head").append("<style>' + e.content.replace(/\n/g, '').replace(/ +/g, " ") + '</style>")';
                                            if (!--len) {
                                                resolve();
                                            }
                                        } else if (e.type == "link") {
                                            fetch(e.href)
                                                .then(function(f) {
                                                    return f.text();
                                                })
                                                .then(function(content) {
                                                    scriptCode += '$("head").append("<style>' + content.replace(/\n/g, '').replace(/ +/g, " ") + '</style>")';
                                                    if (!--len) {
                                                        resolve();
                                                    }
                                                })
                                        }
                                    });
                                });
                            })
                            .then(function() {
                                res(scriptCode);
                            });
                    });
                    break;
                case "components":
                    return new Promise(function(res, rej) {
                        var c_content = "";
                        Promise.resolve()
                            .then(function() {
                                return new Promise(function(resolve) {
                                    var len = obj.css.length;
                                    // 添加style
                                    obj.css.forEach(function(e) {
                                        if (e.type === "style") {
                                            c_content += '<style>\n' + e.content + '\n</style>")\n';
                                            if (!--len) {
                                                resolve();
                                            }
                                        } else if (e.type == "link") {
                                            fetch(e.href)
                                                .then(function(f) {
                                                    return f.text();
                                                })
                                                .then(function(content) {
                                                    c_content += '<style>\n' + content + '\n</style>\n';
                                                    if (!--len) {
                                                        resolve();
                                                    }
                                                })
                                        }
                                    });
                                });
                            })
                            .then(function() {
                                // 添加注册元素
                                var beforedata = beforeRenderEle[defaults.name];
                                c_content += "\n" + beforedata.code + "\n";

                                // 添加script
                                return new Promise(function(resolve) {
                                    var len = obj.script.length;
                                    obj.script.forEach(function(e) {
                                        if (!e.src && e.content) {
                                            var content = e.content;
                                            content = getHookContent(defaults, content, { type: "components" });
                                            c_content += "\n" + content
                                            if (!--len) {
                                                resolve();
                                            }
                                        } else if (e.src) {
                                            fetch(e.src)
                                                .then(function(f) {
                                                    return f.text();
                                                })
                                                .then(function(content) {
                                                    content = "<script>\n" + content + "\n</script>";
                                                    content = getHookContent(defaults, content, { type: "components" });
                                                    c_content += "\n" + content
                                                    if (!--len) {
                                                        resolve();
                                                    }
                                                })
                                        }
                                    });
                                });
                            })
                            .then(function() {
                                res(c_content);
                            });
                    });
                    break;
            }
        },
        // 构建File的函数
        build: function(options) {
            var defaults = {
                // 默认type是可以发布的包，debug是返回带link的
                type: "js",
                name: ""
            };
            if (!options) {
                return;
            } else if ($.type(options) === "string") {
                defaults.name = options;
            } else {
                $.extend(defaults, options);
            }

            // 获取目标数据
            var obj = shearData[defaults.name];

            // 先获取output文本
            main.output(defaults)
                .then(function(scripttext) {
                    var aFile;
                    switch (defaults.type) {
                        case "js":
                            // 生成File
                            aFile = new File([scripttext], defaults.name + "-shear.js", {
                                type: 'application/x-javascript'
                            });
                            break;
                        case "components":
                            aFile = new File([scripttext], defaults.name + "-shear-components.html", {
                                type: 'text/html'
                            });
                            break;
                    }

                    // 下载File
                    var alink = $('<a href="' + URL.createObjectURL(aFile) + '" download="' + aFile.name + '"></a>');
                    alink.click();
                });
        }
    };
    window.shearBuilder = main;

    // 挂载钩子的方法
    var getHookContent = function(defaults, content, options) {
        // 获取之前的数据
        var beforedata = beforeRenderEle[defaults.name];

        // 判断是否通过name的方式添加的，是的话进行钩子绑定
        if (beforedata.type === "name") {
            var gou = content.match(/\/\/ ?@{builder}@/g);
            if (!gou) {
                // 使用name但没有钩子就别build了
                throw 'no shear builder hooks'
            } else {
                gou = gou[0];
                // 替换内容
                switch (options.type) {
                    case "js":
                        content = content.replace(gou, "template:\'" + beforedata.code.replace(/\n/g, " ").replace(/  /g, " ") + "\',");
                        break;
                    case "components":
                        content = content.replace(gou, 'template:document.currentScript.ownerDocument.querySelector(\'[sv-register="' + defaults.name + '"]\').outerHTML,');
                        break;
                }
            }
        }

        return content;
    };

    // 注册前的元素信息
    var beforeRenderEle = {};
    window.beforeRenderEle = beforeRenderEle;

    // 中转shear注册方法
    if (window.shear && shear.register) {
        var oldRegister = shear.register;
        shear.register = function(options) {
            // 带有name的
            if (options.name) {
                beforeRenderEle[options.name] = {
                    type: "name",
                    code: $('[sv-register="' + options.name + '"]')[0].outerHTML
                };
            } else if (options.template) {
                beforeRenderEle[options.name] = {
                    type: "template",
                    code: options.template
                };
            } else {
                return;
            }
            return oldRegister.apply(this, arguments);
        };
    }
})();