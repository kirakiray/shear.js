(function(glo, $) {
    "use strict";
    // base
    // 主体映射tag数据
    var tagMapData = {};
    window.tagMapData = tagMapData;
    var extendData = {};

    // function
    var makearray = $.makearray;
    var getType = $.type;
    var each = $.each;
    var merge = $.merge;
    var isSvShadow = function(e) {
        if (!e.getAttribute) {
            return false;
        }
        var svshadow = e.getAttribute("sv-shadow");
        if (svshadow == "" || !!svshadow) {
            return true;
        }
    };

    // class
    var $_fn = $.fn;
    var bInit = $_fn.init;
    //还原一个无影响的smartJQ
    var smartJQ = function(selector, context) {
        return this.init(selector, context);
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
            if (times == 0) {
                // 注册0次的请打死他
                return;
            }
            var tars = this._watchs[keyname] || (this._watchs[keyname] = []);
            tars.push({
                t: times || Infinity,
                c: callback
            });
            // tars.push(callback);
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
        if (k in this) {
            console.warn('the value has been setted');
            this[k] = value;
        } else {
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
                            e.c(_this._data[k], val);
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
        }
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
        $.extend(nFn, proto);

        SmartView.prototype = nFn;

        return SmartView;
    };

    // main
    //渲染元素
    var renderEle = function(ele) {
        //判断是否渲染
        var isRender = ele.svRender;
        var tagName = ele.getAttribute('sv-is') || ele.tagName.toLowerCase();

        //获取注册信息
        var tagdata = tagMapData[tagName];

        // 确认没有渲染
        if (tagdata && !isRender) {
            // 获取childNode
            var childNodes = makearray(ele.childNodes);

            // 填充元素
            ele.innerHTML = tagdata.code;

            // 渲染数据对象
            var svFnData = new tagdata.sv();
            ele._svData = svFnData;

            // 初始化$content
            var $content = ele.querySelector('[sv-content]');
            svFnData.$content = $$($content);

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

            // 设定值
            each(tagdata.data, function(k, v) {
                if (typeof v == "object") {
                    v = JSON.parse(JSON.stringify(v));
                }
                svEle[k] = v;
            });

            // 绑定attrs数据
            tagdata.attrs && tagdata.attrs.forEach(function(k) {
                var attrValue = ele.getAttribute(k);
                // 判断是否自定义属性，具有优先级别
                if (attrValue) {
                    if (!(k in svEle)) {
                        svEle.set(k, attrValue);
                    } else {
                        svEle[k] = attrValue;
                    }
                }

                // 判断是否存在，不存在就set
                if (!(k in svEle)) {
                    svEle.set(k, "");
                    ele.setAttribute(k, "");
                } else {
                    ele.setAttribute(k, svEle[k]);
                }

                svEle.on('_sv_c_' + k, function(e, data) {
                    // 绑定属性
                    ele.setAttribute(k, data.a);
                });
            });

            // 设置已渲染信息
            ele.setAttribute('sv-render', 1);
            ele.svRender = 1;

            // 去除渲染前标识
            ele.removeAttribute('sv-ele');

            // 执行render函数
            tagdata.render(svEle);

            // 判断是否extend扩展函数
            var extendTagData = extendData[tagName];
            if (extendTagData) {
                extendTagData.forEach(function(e) {
                    e.render(svEle);
                });
            }
        }
    };

    //注册元素的方法
    var register = function(options) {
        var defaults = {
            // 模板元素
            ele: "",
            // 需要监听的属性
            attrs: [],
            // 绑定元素value值的属性名
            val: "",
            //自带默认数据
            data: {},
            // 原型链对象，不会被监听
            proto: "",
            //每次初始化都会执行的函数
            render: ""
        };
        // 合并选项
        $.extend(defaults, options);

        //获取tag
        var tagname, code, ele;
        if (defaults.ele) {
            ele = $$(defaults.ele)[0];

            // 查看 sv-is 属性
            var svis = ele.getAttribute('sv-is');

            // 需要注册的tag名
            tagname = svis || ele.tagName.toLowerCase();

            each(ele.querySelectorAll("*"), function(i, e) {
                e.setAttribute('sv-shadow', "");
            });
            code = ele.innerHTML;
        } else {
            return;
        }

        //准换自定义字符串数据
        var darr = code.match(/{{.+?}}/g);
        darr.forEach(function(e) {
            var key = /{{(.+?)}}/.exec(e);
            if (key) {
                code = code.replace(e, '<sv-span sv-shadow svkey="' + key[1] + '"></sv-span>');
            }
        });

        //注册数据
        tagMapData[tagname] = {
            code: code,
            attrs: defaults.attrs,
            data: defaults.data,
            render: defaults.render,
            val: defaults.val,
            sv: createSmartViewClass(defaults.proto)
        };

        // 清空示例元素的内部元素，渲并染示例元素
        ele.innerHTML = "";
        renderEle(ele);

        //获取需要渲染的元素进行渲染
        $(tagname + '[sv-ele]').each(function(i, e) {
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
            if (e.getAttribute && e.getAttribute('sv-ele') == "") {
                renderEle(e);
            }

            //判断是否有子未渲染元素
            var subEle = e.querySelectorAll && e.querySelectorAll('[sv-ele]');
            subEle && each(subEle, function(i, e) {
                renderEle(e);
            });

            //判断当前是否拥有 sv-shadow 元素
            if (isSvShadow(e)) {
                has_shadow = 1;
            } else {
                notShadowEle.push(e);
            }
        });

        // 过滤 sv-shadow 元素
        if (has_shadow) {
            obj = $$(notShadowEle);
        }
        notShadowEle = null;

        // 判断是否sv-render元素，是的话返回一个 svRender 对象
        if (obj.length == 1 && obj[0].svRender) {
            var svdata = obj[0]._svData;
            if (svdata) {
                return svdata.init(obj[0]);
            }
        }

        return obj;
    };

    // 扩展其他方法
    // 关键的 clone 方法
    var o_clone = $.fn.clone;
    $.fn.clone = function(isDeep) {
        var reObj = [];

        this.each(function(i, e) {
            // 判断是否渲染元素
            if (e.svRender) {
                // 深复制元素，并把sv-shadow去除，保留sv-content
                var nEle = e.cloneNode(true);
                $$('[sv-shadow]:not([sv-content])', nEle).remove();

                // 置换出 sv-content 的内容
                $$('[sv-content]', nEle).each(function() {
                    var childs = makearray(this.childNodes);
                    $$(this).before($$(childs)).remove();
                });

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
                        $e[k] = v;
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
    $.fn.parent = function(filter) {
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
                while (par.getAttribute('sv-shadow') == '')
            }
            arr.push(par);
        });
        return $$(arr);
    };

    // append prepend appendTo prependTo wrapInner
    ['append', 'prepend', 'wrapInner'].forEach(function(e) {
        var o_func = $.fn[e];
        $.fn[e] = function(tar) {
            // 重新过滤元素
            var lastId = this.length - 1;
            // var tarType = getType(tar);

            // 判断是否属性element
            var isElement = tar instanceof Element;

            if (isElement) {
                // 确定非字符类型，则给元素渲染
                tar = $(tar);
            }
            this.each(function(i, e) {
                var ele = tar;
                if (lastId !== i && tar instanceof $) {
                    ele = tar.clone();
                }

                // 运行独立函数
                if (e.svRender) {
                    o_func.call(e._svData.$content, ele);
                } else {
                    o_func.call($$(e), ele);
                }
            });

            // 渲染需要渲染的节点
            $('[sv-ele]');

            return this;
        };
    });

    // wrap wrapAll after before replaceWith replaceAll
    ['wrap', 'after', 'before'].forEach(function(e) {
        var o_func = $.fn[e];
        $.fn[e] = function(tar) {
            var reobj = o_func.call(this, tar);
            $('[sv-ele]');
            return reobj;
        };
    });

    // html text
    ['html', 'text'].forEach(function(e) {
        var o_func = $.fn[e];
        $.fn[e] = function(tar) {
            if (tar) {
                this.each(function(i, e) {
                    // 运行独立函数
                    if (e.svRender) {
                        o_func.call(e._svData.$content, tar);
                    } else {
                        o_func.call($$(e), tar);
                    }
                });

                // 渲染需要渲染的节点
                $('[sv-ele]');

                return this;
            } else {
                var tar = this[0];
                tar = tar.cloneNode(true);

                // 先删除所有 sv-shadow
                $$('[sv-shadow]:not([sv-content])', tar).remove();

                // 替换所有的 sv-content
                $$('[sv-content]', tar).each(function(i, e) {
                    var childs = makearray(e.childNodes);
                    $$(e).before(childs);
                }).remove();

                return o_func.call($$(tar));
            }
        }
    });

    // empty
    $.fn.empty = function() {
        this.forEach(function(e) {
            if (e.svRender) {
                e._svData.$content[0].innerHTML = "";
            } else {
                e.innerHTML = "";
            }
        });
        return this;
    };

    // children
    var o_children = $.fn.children;
    $.fn.children = function(expr) {
        var arr = [];
        this.each(function(i, e) {
            var rearr;
            if (e.svRender) {
                rearr = o_children.call(e._svData.$content, expr);
            } else {
                rearr = o_children.call($$(e), expr);
            }
            merge(arr, rearr);
        });
        return $(arr);
    };

    // 渲染内元素添加新元素时，添加 sv-shadow 标识
    ['append', 'prepend', 'wrap', 'after', 'before', 'wrapInner'].forEach(function(e) {
        var o_func = $.fn[e];
        $.fn[e] = function(ele) {
            // 判断当前是否单个的 sv-shadow 元素
            if (this.length == 1 && isSvShadow(this[0])) {
                ele = $(ele);

                // 有的话全部转化为影子元素
                ele.attr('sv-shadow', "").find("*").attr('sv-shadow', "");
            }
            return o_func.call(this, ele);
        };
    });

    // init
    var sv = {
        // 暴露注册插件的方法
        register: register,
        //扩展插件的方法
        extend: function(options) {
            var defaults = {
                // 注册的tag
                tag: "",
                // 每次初始化都会执行的函数
                render: ""
            };
            // 合并选项
            $.extend(defaults, options);

            // 判断并加入数据对象
            var extendTagData = extendData[defaults.tag] || (extendData[defaults.tag] = []);

            extendTagData.push(defaults);
        }
    };

    glo.sv = sv;
})(window, window.$);