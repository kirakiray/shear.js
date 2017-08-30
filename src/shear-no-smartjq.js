(function(glo, $) {
    "use strict";
    // base
    // 主体映射tag数据
    var tagDatabase = {};
    window.tagDatabase = tagDatabase;
    var afterFuncs = {};

    // function
    var makearray = $.makearray;
    var getType = $.type;
    var each = $.each;
    var merge = $.merge;
    var hasAttr = function(e, attrName) {
        if (!e.getAttribute) {
            return false;
        }
        var attr = e.getAttribute(attrName);
        if (attr !== null && attr !== undefined) {
            return true;
        }
    };
    var isSvShadow = function(e) {
        return hasAttr(e, "sv-shadow");
    };

    //判断元素是否符合条件
    var judgeEle = function(ele, expr) {
        var fadeParent = document.createElement('div');
        if (ele === document) {
            return false;
        }
        fadeParent.appendChild(ele.cloneNode(false));
        return 0 in $$(expr, fadeParent) ? true : false;
    };

    // 获取注册元素名
    var getRenderTagName = function(ele) {
        return ele.getAttribute('sv-is') || ele.tagName.toLowerCase()
    }

    //获取tagdata
    var getTagData = function(tagname) {
        return tagDatabase[tagname] || (tagDatabase[tagname] = $({}));
    };

    // class
    var $_fn = $.fn;
    var bInit = $_fn.init;
    //还原一个无影响的smartJQ
    var smartJQ = function(selector, context) {
        var obj = this.init(selector, context);

        // 判断是否sv-render元素，是的话返回一个 svRender 对象
        if (obj.length === 1 && obj[0].svRender) {
            var svdata = obj[0]._svData;
            if (svdata) {
                return svdata.init(obj[0]);
            }
        }

        return obj;
    };
    var bfn = Object.create($_fn);
    bfn.init = bInit;
    bfn.realFind = function(expr) {
        return $$(expr, this[0]);
    };
    smartJQ.prototype = bfn;
    var $$ = function(s, e) {
        return new smartJQ(s, e);
    };

    // SmartView 的原型链对象
    var SmartViewFn = Object.create($_fn);
    $.extend(SmartViewFn, {
        // 生成实例函数
        init: function(ele) {
            // 添加元素
            var tar = Object.create(this);
            tar.push(ele);
            return tar;
        },
        // 检测数值变动
        watch: function(keyname, callback, times) {
            if (times === 0) {
                // 注册0次的请打死他
                return;
            }

            if (getType(keyname) === "object") {
                var _this = this;
                each(keyname, function(k, c) {
                    _this.watch(k, c);
                });
                _this = null;
            } else if (keyname && callback) {
                var tars = this._watchs[keyname] || (this._watchs[keyname] = []);
                tars.push({
                    t: times || Infinity,
                    c: callback
                });
            }
        },
        // 取消检测变动函数
        unwatch: function(keyname, callback) {
            if (keyname) {
                if (callback) {
                    var tars = this._watchs[keyname];
                    var id = tars.indexOf(callback);
                    tars.splice(id, 1);
                } else {
                    this._watchs[keyname] = [];
                }
            }
        },
        // 真实查找
        realFind: function(expr) {
            return $$(expr, this[0]);
        },
        svRender: 2
    });

    // smartView的set方法
    var smartView_set = function(k, value) {
        //判断是否存在，不存在才设定
        // if (k in this) {
        //     console.warn('the value has been setted');
        //     this[k] = value;
        // } else {
        this._data[k] = value;
        Object.defineProperty(this, k, {
            get: function() {
                return this._data[k];
            },
            set: function(val) {
                // 分为私有和公用的
                var data = {
                    // before
                    b: this._data[k],
                    // after
                    a: val
                };
                var _this = this;

                // 触发修改数据事件
                _this.triggerHandler("_sv_c_" + k, data);

                // 触发 watch 绑定事件
                var tars = _this._watchs[k];
                var new_tars = [];
                if (tars) {
                    tars.forEach(function(e) {
                        if (e.t > 0) {
                            e.t--;
                        }
                        e.c.call(_this, val, _this._data[k]);
                        if (e.t > 0) {
                            new_tars.push(e);
                        }
                    });
                }
                _this._watchs[k] = new_tars;

                // 设置真实值
                _this._data[k] = val;

                // _this = null;
            }
        });
        // }
    };

    // 生成专用smartview Class
    var createSmartViewClass = function(proto) {
        // SmartView 的原型链对象
        var SmartView = function() {
            //绑定设定数据方法
            this.set = smartView_set.bind(this);
            this._watchs = [];
            this._data = {};
        };

        // 继承方法
        var nFn = Object.create(SmartViewFn);
        $.extend(nFn, proto || {});

        SmartView.prototype = nFn;

        return SmartView;
    };

    // main
    //渲染元素
    var renderEle = function(ele) {
        //判断是否渲染
        var isRender = ele.svRender;
        var tagName = getRenderTagName(ele);

        //获取注册信息
        var tagdata = getTagData(tagName);

        // 判断父层没有sv-register
        var par = ele,
            hasReg;
        do {
            par = par.parentNode;
            hasReg = par && hasAttr(par, 'sv-register');
        }
        while (!hasReg && par && par !== document.body)
        if (hasReg) {
            return;
        }

        // 确认没有渲染
        // 确认依赖加载完成
        if (!isRender) {
            // 渲染的函数
            var renderFunc = function() {
                // 获取childNode
                var childNodes = makearray(ele.childNodes);

                // 填充元素
                ele.innerHTML = tagdata.code;

                // 渲染数据对象
                var svFnData = new tagdata.sv();
                ele._svData = svFnData;

                // 初始化$content
                var $content = ele.querySelector('[sv-content]');
                if ($content) {
                    svFnData.$content = $$($content);
                }

                // 渲染依赖的子定义对象
                if (tagdata.relys.length) {
                    each(tagdata.relys, function(i, e) {
                        // 渲染内部元素
                        $(e + '[sv-ele]', ele);
                    });
                }

                // 还原元素
                childNodes && childNodes.forEach(function(element) {
                    $content.appendChild(element);
                });

                // 初始化 sv-span 元素
                var svspans = svFnData._svspan = {};
                each(ele.querySelectorAll('sv-span'), function(i, e) {
                    // 替换sv-span
                    var textnode = document.createTextNode("");
                    e.parentNode.insertBefore(textnode, e);
                    e.parentNode.removeChild(e);
                    textnode.tagcode = e.outerHTML;

                    // 注册文本节点
                    var svkey = e.getAttribute('svkey');
                    var arr = svspans[svkey] || (svspans[svkey] = []);
                    arr.push(textnode);
                });

                // 初始设定空值
                // 绑定text节点
                var svEle = svFnData.init(ele);
                each(tagdata.data, function(k, v) {
                    // 设定需要监听的key
                    svEle.set(k);

                    // 绑定值修改文本事件 和 绑定watch事件
                    svEle.on('_sv_c_' + k, function(e, data) {
                        // 修正textEle
                        var textEles = svspans[k];
                        textEles && textEles.forEach(function(e) {
                            (e.textContent = data.a)
                        });
                    });
                });

                // 绑定sv-module
                svEle.realFind('[sv-module]').each(function() {
                    var $this = $$(this);
                    var k = this.getAttribute('sv-module');

                    //判断是否存在，不存在就set
                    if (!(k in svEle)) {
                        svEle.set(k, "");
                    }

                    $this.on('input', function() {
                        svEle[k] = this.value;
                    });

                    //绑定相对定义值
                    svEle.on('_sv_c_' + k, function(e, data) {
                        $this.val(data.a);
                    });

                    // 替换sv-module标识为sv-render-module
                    this.removeAttribute('sv-module');
                    this.setAttribute('sv-render-module', k)
                });

                // 获取sv-tar值
                svEle.realFind('[sv-tar]').each(function() {
                    var $ele = $$(this);
                    var sv_tar = $ele.attr('sv-tar');
                    sv_tar && (svFnData['$' + sv_tar] = $ele);
                });

                // 绑定value
                if (tagdata.val) {
                    var eleVal = "";
                    Object.defineProperty(ele, "value", {
                        set: function(val) {
                            svEle[tagdata.val] = val;
                            eleVal = val;
                        },
                        get: function() {
                            return eleVal;
                        }
                    });
                    svEle.on('_sv_c_' + tagdata.val, function(e, data) {
                        eleVal = data.a;
                    });
                }

                // 绑定watch对象
                tagdata.watch && svEle.watch(tagdata.watch);

                // 绑定attrs数据
                tagdata.attrs && tagdata.attrs.forEach(function(k) {
                    // 属性绑定
                    svEle.on('_sv_c_' + k, function(e, data) {
                        // 绑定属性
                        ele.setAttribute(k, data.a);
                    });

                    // 先判断有没有data注册
                    if (tagdata.data[k] === undefined) {
                        svEle.set(k);
                    }

                    var attrValue = ele.getAttribute(k);

                    // 判断是否自定义属性，具有优先级别
                    if (attrValue) {
                        svEle[k] = attrValue;
                    } else if (tagdata.data[k] !== undefined) {
                        // 代替data设置
                        svEle[k] = tagdata.data[k];
                    }
                });

                // 设置props数据
                tagdata.props && tagdata.props.forEach(function(e) {
                    var attrValue = ele.getAttribute(e);
                    if (attrValue) {
                        // 先判断有没有data注册
                        if (tagdata.data[e] === undefined) {
                            svEle.set(e);
                        }
                        //设置值
                        svEle[e] = attrValue;
                    }
                });

                // 设定值
                each(tagdata.data, function(k, v) {
                    if (typeof v === "object") {
                        v = JSON.parse(JSON.stringify(v));
                    }
                    // 如果不在 attrs 或 props 上在设定
                    if (tagdata.attrs.indexOf(k) == -1 && tagdata.props.indexOf(k) == -1) {
                        svEle[k] = v;
                    }
                });

                // 设置已渲染信息
                ele.setAttribute('sv-render', 1);
                ele.svRender = 1;

                // 去除渲染前标识
                ele.removeAttribute('sv-ele');

                // 执行render函数
                tagdata.render(svEle);

                // 判断是否extend扩展函数
                var extendTagData = afterFuncs[tagName];
                if (extendTagData) {
                    extendTagData.forEach(function(e) {
                        e.render(svEle);
                    });
                }
            }

            // 设置别渲染了哈
            ele.svRender = 9;

            if (tagdata.relyOk) {
                renderFunc();
                renderFunc = null;
            } else {
                tagdata.one('canRender', function() {
                    renderFunc();
                    renderFunc = null;
                });
            }
        }
    };

    //注册元素的方法
    var register = function(options) {
        var defaults = {
            // 模板元素
            // ele: "",
            name: "",
            template: "",
            // 需要动态更新监听的属性
            attrs: [],
            // 需要挂载数据的属性
            props: [],
            // 绑定元素value值的属性名
            val: "",
            //自带默认数据
            data: {},
            // 原型链对象，不会被监听
            proto: "",
            // 直接绑定属性变化函数，在设置data的时候就会开始触发
            // watch:{},
            //每次初始化都会执行的函数
            render: function() {},
            // 是否渲染模板元素
            // 默认否，设置 true 模板元素也会被渲染
            renderEle: 0
        };
        // 合并选项
        $.extend(defaults, options);

        //获取tag
        var tagname, code, ele;
        if (defaults.name) {
            ele = $('[sv-register="' + defaults.name + '"]')[0];
        } else if (defaults.template) {
            ele = $(defaults.template)[0];
        } else {
            console.error('register data error');
            return;
        }

        // 需要注册的tag名
        tagname = ele.getAttribute('sv-register') || getRenderTagName(ele);

        // 把子元素有内容的textNode转换成spanNode
        var childnodes = ele.childNodes;
        each(childnodes, function(i, e) {
            if (e instanceof Text && e.textContent.trim()) {
                var spanNode = document.createElement('span');
                spanNode.textContent = e.textContent;
                ele.insertBefore(spanNode, e);
                ele.removeChild(e);
            }
        });

        // 所有内元素添加sv-shadow
        each(ele.querySelectorAll("*"), function(i, e) {
            e.setAttribute('sv-shadow', "");
        });

        code = ele.innerHTML;

        // 去除无用的代码（注释代码）
        code = code.replace(/<!--.+?-->/g, "");

        //准换自定义字符串数据
        var darr = code.match(/{{.+?}}/g);
        darr && darr.forEach(function(e) {
            var key = /{{(.+?)}}/.exec(e);
            if (key) {
                code = code.replace(e, '<sv-span sv-shadow svkey="' + key[1].trim() + '"></sv-span>');
            }
        });

        // 获取依赖tag
        var relys = [];
        var relyEles = ele.querySelectorAll('[sv-ele]');
        each(relyEles, function(i, e) {
            var tagname = e.tagName.toLowerCase();
            if (relys.indexOf(tagname) == -1) {
                relys.push(tagname);
            }
        });

        //注册数据
        var tagdata = getTagData(tagname);
        $.extend(tagdata, {
            tagname: tagname,
            code: code,
            attrs: defaults.attrs,
            props: defaults.props,
            data: defaults.data,
            render: defaults.render,
            val: defaults.val,
            watch: defaults.watch,
            sv: createSmartViewClass(defaults.proto),
            // 所有依赖的自定义tag
            relys: relys,
            // 依赖的tag是否完成
            // relyOk: 1
        });

        if (0 in relys) {
            // 设置依赖还没完成
            tagdata.relyOk = 0;

            // 根据依赖tag绑定依赖事件
            var c = relys.length;
            each(relys, function(i, e) {
                var tdata = getTagData(e);
                if (tdata.relyOk) {
                    c--;
                    if (c === 0) {
                        tagdata.relyOk = 1;
                        tagdata.trigger('canRender');
                    }
                } else {
                    tdata.one('canRender', function() {
                        c--;
                        if (c === 0) {
                            tagdata.relyOk = 1;
                            tagdata.trigger('canRender');
                        }
                    });
                }
            });
        } else {
            tagdata.relyOk = 1;
            // 触发可以渲染的事件
            tagdata.trigger('canRender');
        }

        if (defaults.renderEle) {
            // 清空示例元素的内部元素，并渲染示例元素
            ele.innerHTML = "";
            renderEle(ele);
        }

        //获取需要渲染的元素进行渲染
        $$(tagname + '[sv-ele]').each(function(i, e) {
            // 不在sv-register内就可以渲染
            renderEle(e);
        });
    };

    // 修正原jquery方法
    // 监听初始化jQuery函数，修正返回的实例对象
    // 在判断是只有一个 sv元素的时候，返回sv实例对象
    $_fn.init = function(selector, context) {
        // 继承先前的方法
        var obj = bInit.call(this, selector, context);

        // 主动渲染 sv-ele 元素
        // 并判断是否拥有sv-shadow元素，做好重新初始化工作
        var has_shadow = 0;
        var notShadowEle = [];
        obj.each(function(i, e) {
            //判断当前是否拥有 sv-shadow 元素
            if (isSvShadow(e)) {
                has_shadow = 1;
            } else {
                notShadowEle.push(e);
            }

            if (e.getAttribute && e.getAttribute('sv-ele') === "") {
                renderEle(e);
            }

            //判断是否有子未渲染元素
            var subEle = e.querySelectorAll && e.querySelectorAll('[sv-ele]');
            subEle && each(subEle, function(i, e) {
                renderEle(e);
            });
        });

        // 过滤 sv-shadow 元素
        if (has_shadow) {
            obj = $$(notShadowEle);
        }
        notShadowEle = null;

        // 判断是否sv-render元素，是的话返回一个 svRender 对象
        if (obj.length === 1 && obj[0].svRender) {
            var svdata = obj[0]._svData;
            if (svdata) {
                return svdata.init(obj[0]);
            }
        }

        return obj;
    };

    // 修改attr方法，设置属性前判断是否有绑定属性变量
    var o_attr = $.fn.attr;
    $.fn.attr = function(name, value) {
        if (value !== undefined) {
            each(this, function(i, e) {
                if (e.svRender) {
                    var tagname = getRenderTagName(e);
                    var tagdata = getTagData(tagname);
                    if (tagdata.attrs.indexOf(name) > -1) {
                        $(e)[name] = value;
                    }
                } else {
                    o_attr.call($$(e), name, value);
                }
            });
            return this;
        } else {
            return o_attr.call(this, name, value);
        }
    };

    // 扩展其他方法
    // 关键的 clone 方法
    var o_clone = $.fn.clone;
    $.fn.clone = function(isDeep) {
        var reObj = [];

        this.each(function(i, e) {
            // 判断是否渲染元素
            if (e.svRender) {
                var nEle = e.cloneNode();
                nEle.innerHTML = $$(e).html();

                // 渲染并设置新值
                renderEle(nEle);

                var $nEle = $(nEle);
                each(e._svData._data, function(k, v) {
                    $nEle[k] = v;
                });

                // 先获取组团的元素
                var cEles = $$('[sv-render]', e);

                // 渲染内部元素，并设置相同的data
                $$('[sv-render]', nEle).each(function(i, e) {
                    renderEle(e);

                    var mapTar = cEles[i];

                    var $e = $(e);

                    // 接替数据
                    each(mapTar._svData._data, function(k, v) {
                        (v !== undefined) && ($e[k] = v);
                    });
                });

                // 加入队列
                reObj.push(nEle);

                // 不要你们了
                nEle = $nEle = cEles = null;
            } else {
                // 不是的话就直接旧式拷贝
                reObj.push(o_clone.call($$(e), isDeep)[0]);
            }
        });

        return $(reObj);
    };

    // 关键 parent 方法
    // unwrap
    // var o_parent = $.fn.parent;
    $.fn.parent = function(expr) {
        var arr = [];
        this.each(function(i, e) {
            var par;
            if (isSvShadow(e)) {
                par = e.parentNode;
            } else {
                do {
                    par = e.parentNode;
                    e = par;
                }
                while (isSvShadow(par))
            }

            // expr
            if ((!expr || (expr && judgeEle(par, expr))) && arr.indexOf(par) == -1) {
                arr.push(par);
            }

        });
        return $$(arr);
    };

    // children
    var o_children = $.fn.children;
    $.fn.children = function(expr) {
        var arr = [];
        this.each(function(i, e) {
            var rearr;
            if (e.svRender && e._svData.$content) {
                rearr = o_children.call(e._svData.$content, expr);
            } else {
                rearr = o_children.call($$(e), expr);
            }
            merge(arr, rearr);
        });
        return $(arr);
    };

    var n_ec = function(tar, func) {
        // 重新过滤元素
        var lastId = this.length - 1;

        var isfunction;
        if (getType(tar) === "function") {
            isfunction = 1;
        } else {
            // 转换元素
            tar = $(tar);
        }

        this.each(function(i, e) {
            if (isfunction) {
                var redata, $e = $(e);
                if (e.svRender) {
                    redata = tar(i, $e.html());
                } else {
                    redata = tar(i, $e.html());
                }
                if (redata) {
                    $e.append(redata);
                }
            } else {
                var ele = tar;
                if (lastId !== i && tar instanceof $) {
                    ele = tar.clone();
                }

                func(e, ele);
            }
        });
    };

    // append prepend appendTo prependTo wrapInner
    ['append', 'prepend', 'wrapInner'].forEach(function(e) {
        var o_func = $.fn[e];
        $.fn[e] = function(tar) {
            n_ec.call(this, tar, function(e, tar) {
                // if ((isSvShadow(e) && !hasAttr(e, 'sv-content')) || hasAttr(e, "sv-render")) {
                if ((isSvShadow(e) && !hasAttr(e, 'sv-content'))) {
                    tar[0] && tar[0].setAttribute('sv-shadow', "");
                }
                if (e.svRender && e._svData.$content) {
                    o_func.call(e._svData.$content, tar);
                } else {
                    o_func.call($$(e), tar);
                }
            });
            return this;
        };
    });

    // wrap
    var o_wrap = $.fn.wrap;
    $.fn.wrap = function(tar) {
        n_ec.call(this, tar, function(e, tar) {
            if (isSvShadow(e)) {
                tar[0] && tar[0].setAttribute('sv-shadow', "");
            }
            if (tar.svRender) {
                e.parentNode.insertBefore(tar[0], e);
                tar.append(e);
            } else {
                o_wrap.call($$(e), tar);
            }
        });
        return this;
    };

    // after before replaceWith replaceAll
    ['after', 'before'].forEach(function(e) {
        var o_func = $.fn[e];
        $.fn[e] = function(tar) {
            n_ec.call(this, tar, function(e, tar) {
                if (isSvShadow(e)) {
                    tar[0] && tar[0].setAttribute('sv-shadow', "");
                }
                o_func.call($$(e), tar);
            });
            return this;
        };
    });

    // html text
    ['html', 'text'].forEach(function(e) {
        var o_func = $.fn[e];
        $.fn[e] = function(ele) {
            if (ele) {
                this.each(function(i, e) {
                    // 运行独立函数
                    if (e.svRender && e._svData.$content) {
                        o_func.call(e._svData.$content, ele);
                    } else {
                        o_func.call($$(e), ele);
                    }
                });

                // 渲染需要渲染的节点
                $('[sv-ele]');

                return this;
            } else {
                // 目标元素
                var tar = this[0];

                if (tar && tar.svRender) {
                    // 复制 $content 内的元素
                    tar = tar._svData.$content;

                    if (!tar) {
                        return "";
                    }

                    tar = tar[0].cloneNode(true);

                    // 查找所有元素
                    $$('[sv-shadow]', tar).each(function(i, e) {
                        // 一开始本来就是sv-content的暂时保留
                        if (hasAttr(e, "sv-content")) {
                            return;
                        }

                        // 判断当前的元素父层没有
                        // 遍历这个元素的父层，如果先判断到出现sv-render就删除，判断到sv-content就保留
                        var canout = 0,
                            par = e;
                        do {
                            par = par.parentNode;
                            if (!par) {
                                // 到顶层的跳出循环
                                canout = 1;
                            } else if (hasAttr(par, "sv-render")) {
                                // sv-render内的可以删掉
                                $$(e).remove();
                                canout = 1;
                            } else if (hasAttr(par, "sv-content")) {
                                // sv-content内的可以保留
                                canout = 1;
                            }
                        }
                        while (!canout)
                    });

                    // 替换掉sv-content的内容到外面
                    $$('[sv-content]', tar).each(function(i, e) {
                        if (0 in e.childNodes) {
                            var childs = makearray(e.childNodes);
                            var par = e.parentNode;

                            // 置换内容
                            each(childs, function(i, e2) {
                                par.insertBefore(e2, e);
                            });
                            par.removeChild(e);
                        }
                    });

                    // 替换sv-render为sv-ele
                    $$(tar, '[sv-render]').each(function(i, e) {
                        e.removeAttribute('sv-render');
                        e.setAttribute('sv-ele', "");
                    });
                }

                return o_func.call($$(tar));
            }
        }
    });

    // empty
    $.fn.empty = function() {
        each(this, function(i, e) {
            if (e.svRender && e._svData.$content) {
                e._svData.$content[0].innerHTML = "";
            } else {
                e.innerHTML = "";
            }
        });
        return this;
    };

    // init
    var sv = {
        // 暴露注册插件的方法
        register: register,
        // 简单的后续扩展插件的方法
        after: function(options) {
            var defaults = {
                // 注册的tag
                tag: "",
                // 每次初始化都会执行的函数
                render: ""
            };
            // 合并选项
            $.extend(defaults, options);

            // 判断并加入数据对象
            var extendTagData = afterFuncs[defaults.tag] || (afterFuncs[defaults.tag] = []);

            extendTagData.push(defaults);
        },
        init: function(ele) {
            var svdata = ele._svData;
            if (svdata) {
                return svdata.init(ele);
            }
        },
        // 扩展方法
        extend: function(func) {
            func(tagDatabase);
        },
        // 是否 shear元素
        is: function() {}
    };

    glo.shear = sv;

    // 程序加载完成后，执行以下初始化
    $(function() {
        $('[sv-ele]');
    });
})(window, window.$);